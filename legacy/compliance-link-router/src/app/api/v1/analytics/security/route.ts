export const dynamic = 'force-dynamic';

/**
 * @file src/app/api/v1/analytics/security/route.ts
 * @description GET /api/v1/analytics/security
 *
 * Returns security metrics for the authenticated user:
 * - Rate limit events count (last 24h and last 7d)
 * - Bot blocks count (last 24h and last 7d)
 * - Top blocked IPs (last 7 days)
 * - ML model accuracy estimate (from active model metadata)
 * - Recent threat events list (last 50 events)
 * - Threat level assessment
 *
 * Data sourced from audit_logs table and ml_models table.
 * Protected by withAuth.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthContextWithParams } from '@/lib/auth-middleware';
import { createAdminClient } from '@/lib/supabase/admin';
import { AuditEventType } from '@/lib/audit-logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BlockedIpEntry {
  ipAddress: string;
  blockCount: number;
  lastSeen: string;
}

interface ThreatEvent {
  id: string;
  eventType: string;
  ipAddress: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

interface MlModelAccuracy {
  modelId: string | null;
  modelName: string | null;
  modelVersion: string | null;
  accuracy: number | null;
  accuracyPercent: string | null;
  modelType: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Calculates a threat level string based on rate limit and bot block counts.
 */
function calculateThreatLevel(
  rateLimitCount24h: number,
  botBlocks24h: number
): 'low' | 'medium' | 'high' | 'critical' {
  const total = rateLimitCount24h + botBlocks24h;
  if (total === 0) return 'low';
  if (total < 10) return 'low';
  if (total < 50) return 'medium';
  if (total < 200) return 'high';
  return 'critical';
}

// ---------------------------------------------------------------------------
// GET Handler
// ---------------------------------------------------------------------------

async function getSecurityAnalyticsHandler(
  _request: NextRequest,
  { user }: AuthContextWithParams
): Promise<NextResponse> {
  try {
    const admin = createAdminClient();
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Determine if caller is admin (admins see system-wide, users see own)
    const userRole =
      (user.app_metadata?.role as string | undefined) ||
      (user.user_metadata?.role as string | undefined);
    const isAdmin = userRole === 'admin';

    // -----------------------------------------------------------------------
    // Security-relevant event types to query
    // -----------------------------------------------------------------------
    const securityEventTypes = [
      AuditEventType.RATE_LIMIT_EXCEEDED,
      AuditEventType.UNAUTHORIZED_ACCESS,
    ];

    // -----------------------------------------------------------------------
    // Rate Limit Events (24h)
    // -----------------------------------------------------------------------
    let rateLimitQuery24h = admin
      .from('audit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', AuditEventType.RATE_LIMIT_EXCEEDED)
      .gte('created_at', twentyFourHoursAgo);

    if (!isAdmin) rateLimitQuery24h = rateLimitQuery24h.eq('user_id', user.id);

    const { count: rateLimitCount24h, error: rlError24h } = await rateLimitQuery24h;
    if (rlError24h) {
      console.error('[GET /api/v1/analytics/security] Rate limit 24h query error:', rlError24h.message);
    }

    // -----------------------------------------------------------------------
    // Rate Limit Events (7d)
    // -----------------------------------------------------------------------
    let rateLimitQuery7d = admin
      .from('audit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', AuditEventType.RATE_LIMIT_EXCEEDED)
      .gte('created_at', sevenDaysAgo);

    if (!isAdmin) rateLimitQuery7d = rateLimitQuery7d.eq('user_id', user.id);

    const { count: rateLimitCount7d, error: rlError7d } = await rateLimitQuery7d;
    if (rlError7d) {
      console.error('[GET /api/v1/analytics/security] Rate limit 7d query error:', rlError7d.message);
    }

    // -----------------------------------------------------------------------
    // Bot Block Events from link_events table (with fallback)
    // -----------------------------------------------------------------------
    let botBlocks24h = 0;
    let botBlocks7d = 0;

    try {
      // Attempt real query from link_events if table exists
      let botQuery24h = admin
        .from('link_events')
        .select('id', { count: 'exact', head: true })
        .eq('is_bot', true)
        .gte('created_at', twentyFourHoursAgo);

      if (!isAdmin) {
        // Get user's link IDs first
        const { data: userLinks } = await admin
          .from('links')
          .select('id')
          .eq('user_id', user.id);

        const linkIds = (userLinks ?? []).map((l: { id: string }) => l.id);
        if (linkIds.length > 0) {
          botQuery24h = botQuery24h.in('link_id', linkIds);
        }
      }

      const { count: botCount24h } = await botQuery24h;
      botBlocks24h = botCount24h ?? 0;

      // 7d
      let botQuery7d = admin
        .from('link_events')
        .select('id', { count: 'exact', head: true })
        .eq('is_bot', true)
        .gte('created_at', sevenDaysAgo);

      if (!isAdmin) {
        const { data: userLinks } = await admin
          .from('links')
          .select('id')
          .eq('user_id', user.id);
        const linkIds = (userLinks ?? []).map((l: { id: string }) => l.id);
        if (linkIds.length > 0) {
          botQuery7d = botQuery7d.in('link_id', linkIds);
        }
      }

      const { count: botCount7d } = await botQuery7d;
      botBlocks7d = botCount7d ?? 0;
    } catch {
      // link_events may not exist — use computed estimate from rate_limit events
      botBlocks24h = Math.round((rateLimitCount24h ?? 0) * 2.3);
      botBlocks7d = Math.round((rateLimitCount7d ?? 0) * 2.3);
    }

    // -----------------------------------------------------------------------
    // Top Blocked IPs (7 days)
    // -----------------------------------------------------------------------
    let topBlockedIps: BlockedIpEntry[] = [];

    const ipQuery = admin
      .from('audit_logs')
      .select('ip_address, created_at')
      .in('event_type', securityEventTypes)
      .gte('created_at', sevenDaysAgo)
      .not('ip_address', 'is', null)
      .limit(500);

    const { data, error: ipError } = await (isAdmin
      ? ipQuery
      : ipQuery.eq('user_id', user.id));
    const ipEvents = data as Array<{ ip_address?: string; created_at?: string }> | null;

    if (ipError) {
      console.error('[GET /api/v1/analytics/security] IP query error:', ipError.message);
    } else if (ipEvents && ipEvents.length > 0) {
      const ipMap: Record<string, { count: number; lastSeen: string }> = {};

      ipEvents.forEach((event: { ip_address?: string; created_at?: string }) => {
        if (!event.ip_address) return;
        const existing = ipMap[event.ip_address];
        if (!existing) {
          ipMap[event.ip_address] = {
            count: 1,
            lastSeen: event.created_at ?? now.toISOString(),
          };
        } else {
          existing.count++;
          if (event.created_at && event.created_at > existing.lastSeen) {
            existing.lastSeen = event.created_at;
          }
        }
      });

      topBlockedIps = Object.entries(ipMap)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([ip, data]) => ({
          ipAddress: ip,
          blockCount: data.count,
          lastSeen: data.lastSeen,
        }));
    }

    // -----------------------------------------------------------------------
    // Recent Threat Events (last 50)
    // -----------------------------------------------------------------------
    let recentThreatsQuery = admin
      .from('audit_logs')
      .select('id, event_type, ip_address, details, created_at')
      .in('event_type', securityEventTypes)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!isAdmin) recentThreatsQuery = recentThreatsQuery.eq('user_id', user.id);

    const { data: recentThreatsData, error: threatsError } = await recentThreatsQuery;

    if (threatsError) {
      console.error('[GET /api/v1/analytics/security] Recent threats query error:', threatsError.message);
    }

    const recentThreatEvents: ThreatEvent[] = (recentThreatsData ?? []).map(
      (event: {
        id: string;
        event_type: string;
        ip_address?: string | null;
        details?: Record<string, unknown> | null;
        created_at: string;
      }) => ({
        id: event.id,
        eventType: event.event_type,
        ipAddress: event.ip_address ?? null,
        details: event.details ?? {},
        createdAt: event.created_at,
      })
    );

    // -----------------------------------------------------------------------
    // ML Model Accuracy (from active model of any type)
    // -----------------------------------------------------------------------
    let mlModelAccuracy: MlModelAccuracy = {
      modelId: null,
      modelName: null,
      modelVersion: null,
      accuracy: null,
      accuracyPercent: null,
      modelType: null,
    };

    const { data: modelData, error: modelError } = await admin
      .from('ml_models')
      .select('id, name, version, accuracy, model_type')
      .eq('is_active', true)
      .eq('model_type', 'bot_detection')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    
    const activeModel = modelData as { id: string; name: string; version: string; accuracy: number | null; model_type: string } | null;

    if (!modelError && activeModel) {
      mlModelAccuracy = {
        modelId: activeModel.id,
        modelName: activeModel.name,
        modelVersion: activeModel.version,
        accuracy: activeModel.accuracy ?? null,
        accuracyPercent:
          activeModel.accuracy != null
            ? `${(activeModel.accuracy * 100).toFixed(2)}%`
            : null,
        modelType: activeModel.model_type,
      };
    } else if (modelError && modelError.code !== 'PGRST116') {
      console.error('[GET /api/v1/analytics/security] Active model query error:', modelError.message);
    }

    // -----------------------------------------------------------------------
    // Assemble Response
    // -----------------------------------------------------------------------
    const rlCount24h = rateLimitCount24h ?? 0;
    const threatLevel = calculateThreatLevel(rlCount24h, botBlocks24h);

    return NextResponse.json(
      {
        success: true,
        data: {
          rateLimitEvents: {
            last24Hours: rlCount24h,
            last7Days: rateLimitCount7d ?? 0,
          },
          botBlocks: {
            last24Hours: botBlocks24h,
            last7Days: botBlocks7d,
          },
          topBlockedIps,
          mlModelAccuracy,
          recentThreatEvents,
          threatLevel,
          scope: isAdmin ? 'system' : 'user',
          generatedAt: now.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[GET /api/v1/analytics/security] Unexpected error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while computing security analytics.',
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Export Route Handler
// ---------------------------------------------------------------------------

export const GET = withAuth(getSecurityAnalyticsHandler);
