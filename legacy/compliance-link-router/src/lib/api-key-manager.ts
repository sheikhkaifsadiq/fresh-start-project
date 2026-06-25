// @ts-nocheck
import { createHash, randomBytes } from 'crypto';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

export type KeyPermission =
  | 'read:links'
  | 'write:links'
  | 'delete:links'
  | 'read:analytics'
  | 'write:analytics'
  | 'read:audit'
  | 'admin';

export type KeyEnvironment = 'live' | 'test';

export interface ApiKeyRecord {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  permissions: KeyPermission[];
  environment: KeyEnvironment;
  expires_at: string | null;
  last_used_at: string | null;
  last_used_ip: string | null;
  revoked: boolean;
  revoked_at: string | null;
  call_count: number;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface GeneratedApiKey {
  rawKey: string;
  keyHash: string;
  keyPrefix: string;
  environment: KeyEnvironment;
}

export interface ValidationResult {
  valid: boolean;
  keyRecord?: ApiKeyRecord;
  error?: string;
  rateLimited?: boolean;
  remainingCalls?: number;
}

export interface RateLimitState {
  calls: number;
  windowStart: number;
  blocked: boolean;
}

export interface ScopeCheckResult {
  allowed: boolean;
  missing: KeyPermission[];
  hasAdmin: boolean;
}

// Per-environment rate limits (calls per minute)
const RATE_LIMITS: Record<KeyEnvironment, number> = {
  live: 1000,
  test: 100,
};

// In-memory rate limit windows — keyed by key_hash prefix
const rateLimitWindows = new Map<string, RateLimitState>();

// Permissions that are implied by `admin`
const ADMIN_IMPLIED_PERMISSIONS: KeyPermission[] = [
  'read:links',
  'write:links',
  'delete:links',
  'read:analytics',
  'write:analytics',
  'read:audit',
];

// ---------------------------------------------------------------------------
// Key Generation
// ---------------------------------------------------------------------------

export function generateApiKey(environment: KeyEnvironment = 'live'): GeneratedApiKey {
  const entropy = randomBytes(32);
  const rawSecret = entropy.toString('hex');
  const envSegment = environment === 'live' ? 'live' : 'test';
  const rawKey = `sk_${envSegment}_${rawSecret}`;
  const keyPrefix = `sk_${envSegment}_${rawSecret.slice(0, 8)}`;
  const keyHash = hashApiKey(rawKey);
  return { rawKey, keyHash, keyPrefix, environment };
}

export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

export function extractKeyPrefix(rawKey: string): string {
  const parts = rawKey.split('_');
  if (parts.length < 3) return rawKey.slice(0, 12);
  const envPart = parts[1];
  const secretPart = parts[2];
  return `sk_${envPart}_${secretPart.slice(0, 8)}`;
}

export function maskApiKey(keyPrefix: string): string {
  return `${keyPrefix}${'•'.repeat(24)}`;
}

// ---------------------------------------------------------------------------
// Key Validation
// ---------------------------------------------------------------------------

export async function validateApiKey(
  rawKey: string,
  requiredPermissions: KeyPermission[] = [],
  requestIp?: string
): Promise<ValidationResult> {
  if (!rawKey || typeof rawKey !== 'string') {
    return { valid: false, error: 'Missing API key' };
  }

  if (!rawKey.startsWith('sk_live_') && !rawKey.startsWith('sk_test_')) {
    return { valid: false, error: 'Malformed API key format' };
  }

  const keyHash = hashApiKey(rawKey);
  const supabase = createAdminClient();

  const { data: keyRecord, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .single();

  if (error || !keyRecord) {
    return { valid: false, error: 'Invalid API key' };
  }

  const record = keyRecord as ApiKeyRecord;

  if (record.revoked) {
    return { valid: false, error: 'API key has been revoked', keyRecord: record };
  }

  if (record.expires_at && new Date(record.expires_at) < new Date()) {
    return { valid: false, error: 'API key has expired', keyRecord: record };
  }

  const rateLimitResult = checkRateLimit(record.key_prefix, record.environment);
  if (rateLimitResult.blocked) {
    return {
      valid: false,
      error: `Rate limit exceeded. Max ${RATE_LIMITS[record.environment]} calls/minute.`,
      rateLimited: true,
      keyRecord: record,
      remainingCalls: 0,
    };
  }

  if (requiredPermissions.length > 0) {
    const scopeResult = checkPermissions(record.permissions, requiredPermissions);
    if (!scopeResult.allowed) {
      return {
        valid: false,
        error: `Insufficient permissions. Missing: ${scopeResult.missing.join(', ')}`,
        keyRecord: record,
      };
    }
  }

  supabase
    .from('api_keys')
    .update({
      last_used_at: new Date().toISOString(),
      last_used_ip: requestIp ?? null,
      call_count: record.call_count + 1,
    })
    .eq('id', record.id)
    .then(() => {});

  return {
    valid: true,
    keyRecord: record,
    remainingCalls: RATE_LIMITS[record.environment] - (rateLimitResult.calls ?? 0),
  };
}

export function extractKeyFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7).trim();
  if (authHeader.startsWith('sk_')) return authHeader.trim();
  return null;
}

// ---------------------------------------------------------------------------
// Rate Limiting
// ---------------------------------------------------------------------------

export function checkRateLimit(
  keyPrefix: string,
  environment: KeyEnvironment
): { blocked: boolean; calls: number } {
  const limit = RATE_LIMITS[environment];
  const now = Date.now();
  const windowMs = 60_000;

  const existing = rateLimitWindows.get(keyPrefix);

  if (!existing || now - existing.windowStart > windowMs) {
    rateLimitWindows.set(keyPrefix, { calls: 1, windowStart: now, blocked: false });
    return { blocked: false, calls: 1 };
  }

  const updatedCalls = existing.calls + 1;
  const blocked = updatedCalls > limit;

  rateLimitWindows.set(keyPrefix, {
    calls: updatedCalls,
    windowStart: existing.windowStart,
    blocked,
  });

  return { blocked, calls: updatedCalls };
}

export function getRateLimitState(keyPrefix: string): RateLimitState | null {
  return rateLimitWindows.get(keyPrefix) ?? null;
}

export function resetRateLimit(keyPrefix: string): void {
  rateLimitWindows.delete(keyPrefix);
}

// ---------------------------------------------------------------------------
// Permission / Scope Checking
// ---------------------------------------------------------------------------

export function checkPermissions(
  grantedPermissions: KeyPermission[],
  requiredPermissions: KeyPermission[]
): ScopeCheckResult {
  const hasAdmin = grantedPermissions.includes('admin');

  if (hasAdmin) {
    return { allowed: true, missing: [], hasAdmin: true };
  }

  const effectivePermissions = new Set(grantedPermissions);
  const missing = requiredPermissions.filter((p) => !effectivePermissions.has(p));

  return {
    allowed: missing.length === 0,
    missing,
    hasAdmin: false,
  };
}

export function expandPermissions(permissions: KeyPermission[]): KeyPermission[] {
  if (permissions.includes('admin')) {
    return Array.from(new Set([...permissions, ...ADMIN_IMPLIED_PERMISSIONS]));
  }
  return permissions;
}

export function permissionLabel(permission: KeyPermission): string {
  const labels: Record<KeyPermission, string> = {
    'read:links': 'Read Links',
    'write:links': 'Write Links',
    'delete:links': 'Delete Links',
    'read:analytics': 'Read Analytics',
    'write:analytics': 'Write Analytics',
    'read:audit': 'Read Audit Logs',
    admin: 'Full Admin Access',
  };
  return labels[permission] ?? permission;
}

export function permissionDescription(permission: KeyPermission): string {
  const descriptions: Record<KeyPermission, string> = {
    'read:links': 'List and retrieve link details',
    'write:links': 'Create and update links',
    'delete:links': 'Permanently delete links',
    'read:analytics': 'Access click and traffic analytics',
    'write:analytics': 'Post analytics events',
    'read:audit': 'View audit log entries',
    admin: 'Unrestricted access to all resources',
  };
  return descriptions[permission] ?? '';
}

// ---------------------------------------------------------------------------
// Key Rotation
// ---------------------------------------------------------------------------

export async function rotateApiKey(
  keyId: string,
  userId: string
): Promise<{ newKey: GeneratedApiKey; record: ApiKeyRecord } | { error: string }> {
  const supabase = createAdminClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('api_keys')
    .select('*')
    .eq('id', keyId)
    .eq('user_id', userId)
    .single();

  if (fetchErr || !existing) {
    return { error: 'Key not found or access denied' };
  }

  const old = existing as ApiKeyRecord;
  const newGenerated = generateApiKey(old.environment);

  const { data: newRecord, error: insertErr } = await supabase
    .from('api_keys')
    .insert({
      user_id: userId,
      name: `${old.name} (rotated)`,
      key_hash: newGenerated.keyHash,
      key_prefix: newGenerated.keyPrefix,
      permissions: old.permissions,
      environment: old.environment,
      expires_at: old.expires_at,
      revoked: false,
      call_count: 0,
      metadata: { rotated_from: keyId, rotated_at: new Date().toISOString() },
    })
    .select()
    .single();

  if (insertErr || !newRecord) {
    return { error: 'Failed to create rotated key' };
  }

  await supabase
    .from('api_keys')
    .update({ revoked: true, revoked_at: new Date().toISOString() })
    .eq('id', keyId);

  return { newKey: newGenerated, record: newRecord as ApiKeyRecord };
}

// ---------------------------------------------------------------------------
// Usage Statistics
// ---------------------------------------------------------------------------

export async function getKeyUsageStats(
  keyId: string,
  days: number = 7
): Promise<{ date: string; calls: number }[]> {
  const supabase = createAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('api_key_calls')
    .select('called_at, call_count')
    .eq('key_id', keyId)
    .gte('called_at', since.toISOString())
    .order('called_at', { ascending: true });

  if (error || !data) {
    return Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      return { date: d.toISOString().split('T')[0], calls: 0 };
    });
  }

  const grouped: Record<string, number> = {};
  for (const row of data) {
    const day = (row.called_at as string).split('T')[0];
    grouped[day] = (grouped[day] ?? 0) + (row.call_count as number);
  }

  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const dateStr = d.toISOString().split('T')[0];
    return { date: dateStr, calls: grouped[dateStr] ?? 0 };
  });
}

// ---------------------------------------------------------------------------
// CRUD Helpers
// ---------------------------------------------------------------------------

export async function listApiKeysForUser(userId: string): Promise<ApiKeyRecord[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ApiKeyRecord[];
}

export async function revokeApiKey(keyId: string, userId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('api_keys')
    .update({ revoked: true, revoked_at: new Date().toISOString() })
    .eq('id', keyId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function createApiKeyRecord(
  userId: string,
  name: string,
  permissions: KeyPermission[],
  environment: KeyEnvironment,
  expiresAt: string | null,
  metadata: Record<string, unknown> = {}
): Promise<{ record: ApiKeyRecord; generated: GeneratedApiKey }> {
  const supabase = createAdminClient();
  const generated = generateApiKey(environment);

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: userId,
      name,
      key_hash: generated.keyHash,
      key_prefix: generated.keyPrefix,
      permissions,
      environment,
      expires_at: expiresAt,
      revoked: false,
      call_count: 0,
      metadata,
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Insert failed');
  return { record: data as ApiKeyRecord, generated };
}

