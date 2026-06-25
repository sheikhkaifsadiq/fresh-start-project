/**
 * @file src/lib/audit-logger.ts
 * @description Full audit logging service for Aegis Route.
 * Logs events to the `audit_logs` table in Supabase using the admin client
 * (bypassing RLS). All event type constants are exported as typed string literals.
 */

import { createAdminClient } from '@/lib/supabase/admin';

// ---------------------------------------------------------------------------
// Event Type Constants
// ---------------------------------------------------------------------------

export const AuditEventType = {
  USER_LOGIN_SUCCESS: 'USER_LOGIN_SUCCESS',
  USER_LOGIN_FAILED: 'USER_LOGIN_FAILED',
  USER_SIGNUP: 'USER_SIGNUP',
  USER_LOGOUT: 'USER_LOGOUT',
  LINK_CREATED: 'LINK_CREATED',
  LINK_UPDATED: 'LINK_UPDATED',
  LINK_DELETED: 'LINK_DELETED',
  RULE_CREATED: 'RULE_CREATED',
  RULE_UPDATED: 'RULE_UPDATED',
  RULE_DELETED: 'RULE_DELETED',
  ML_MODEL_DEPLOYED: 'ML_MODEL_DEPLOYED',
  ML_MODEL_UPDATED: 'ML_MODEL_UPDATED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  ASSET_UPLOADED: 'ASSET_UPLOADED',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
} as const;

export type AuditEventTypeValue = (typeof AuditEventType)[keyof typeof AuditEventType];

// Convenience named exports matching the required interface
export const USER_LOGIN_SUCCESS = AuditEventType.USER_LOGIN_SUCCESS;
export const USER_LOGIN_FAILED = AuditEventType.USER_LOGIN_FAILED;
export const USER_SIGNUP = AuditEventType.USER_SIGNUP;
export const USER_LOGOUT = AuditEventType.USER_LOGOUT;
export const LINK_CREATED = AuditEventType.LINK_CREATED;
export const LINK_UPDATED = AuditEventType.LINK_UPDATED;
export const LINK_DELETED = AuditEventType.LINK_DELETED;
export const RULE_CREATED = AuditEventType.RULE_CREATED;
export const RULE_UPDATED = AuditEventType.RULE_UPDATED;
export const RULE_DELETED = AuditEventType.RULE_DELETED;
export const ML_MODEL_DEPLOYED = AuditEventType.ML_MODEL_DEPLOYED;
export const ML_MODEL_UPDATED = AuditEventType.ML_MODEL_UPDATED;
export const RATE_LIMIT_EXCEEDED = AuditEventType.RATE_LIMIT_EXCEEDED;
export const ASSET_UPLOADED = AuditEventType.ASSET_UPLOADED;
export const UNAUTHORIZED_ACCESS = AuditEventType.UNAUTHORIZED_ACCESS;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuditLogDetails {
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Core Logging Function
// ---------------------------------------------------------------------------

/**
 * Inserts an audit log entry into the `audit_logs` table.
 * This function is fire-and-forget: it logs errors to console but never
 * throws, so that a logging failure never disrupts the primary request flow.
 *
 * @param userId     - The UUID of the user performing the action, or null for anonymous events.
 * @param eventType  - One of the AuditEventType constants.
 * @param details    - A JSON-serialisable object with contextual details about the event.
 * @param ipAddress  - The IP address of the request originator, or null if unavailable.
 */
export async function logEvent(
  userId: string | null,
  eventType: AuditEventTypeValue,
  details: AuditLogDetails = {},
  ipAddress: string | null = null
): Promise<void> {
  try {
    const admin = createAdminClient();

    const { error } = await admin.from('audit_logs').insert({
      user_id: userId,
      event_type: eventType,
      details,
      ip_address: ipAddress,
      created_at: new Date().toISOString(),
    } as any);

    if (error) {
      console.error(
        `[AuditLogger] Failed to insert audit log for event "${eventType}":`,
        error.message,
        { userId, details, ipAddress }
      );
    }
  } catch (err) {
    // Never propagate audit logging errors to the caller.
    console.error(
      `[AuditLogger] Unexpected error while logging event "${eventType}":`,
      err,
      { userId, details, ipAddress }
    );
  }
}

/**
 * Extracts the client IP address from a Next.js Request object.
 * Checks X-Forwarded-For first (for proxied environments), then falls back
 * to X-Real-IP, and finally returns null if neither header is present.
 *
 * @param request - The incoming Next.js Request object.
 * @returns The client IP address string, or null.
 */
export function extractIpAddress(request: Request): string | null {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // X-Forwarded-For can be a comma-separated list; the first entry is the client IP.
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp.trim();
  }

  return null;
}
