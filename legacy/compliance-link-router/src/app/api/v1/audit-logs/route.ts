export const dynamic = 'force-dynamic';

/**
 * @file src/app/api/v1/audit-logs/route.ts
 * @description GET /api/v1/audit-logs
 *
 * Returns paginated audit log entries.
 * - Regular users: see only their own logs (filtered by user_id).
 * - Admin users: see all logs across the system.
 *
 * Supports: pagination (page, limit), event_type filter,
 * date_from/date_to range, ip_address filter.
 *
 * Protected by withAuth.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthContextWithParams } from '@/lib/auth-middleware';
import { createAdminClient } from '@/lib/supabase/admin';
import { AuditLogQuerySchema } from '@/lib/schemas';
import { ZodError } from 'zod';

// ---------------------------------------------------------------------------
// GET Handler
// ---------------------------------------------------------------------------

async function getAuditLogsHandler(
  request: NextRequest,
  { user }: AuthContextWithParams
): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;

  // Determine if caller is admin
  const userRole =
    (user.app_metadata?.role as string | undefined) ||
    (user.user_metadata?.role as string | undefined);
  const isAdmin = userRole === 'admin';

  // Parse and validate query parameters
  let query: {
    page: number;
    limit: number;
    event_type?: string;
    date_from?: string;
    date_to?: string;
    ip_address?: string;
  };

  try {
    query = AuditLogQuerySchema.parse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      event_type: searchParams.get('event_type') ?? undefined,
      date_from: searchParams.get('date_from') ?? undefined,
      date_to: searchParams.get('date_to') ?? undefined,
      ip_address: searchParams.get('ip_address') ?? undefined,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error',
          message: 'Invalid query parameters.',
          details: err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }
    throw err;
  }

  try {
    const admin = createAdminClient();
    const { page, limit } = query;
    const offset = (page - 1) * limit;

    let dbQuery = admin
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Scope: admins see all, regular users see only their own
    if (!isAdmin) {
      dbQuery = dbQuery.eq('user_id', user.id);
    }

    // Apply filters
    if (query.event_type) {
      dbQuery = dbQuery.eq('event_type', query.event_type);
    }

    if (query.ip_address) {
      dbQuery = dbQuery.eq('ip_address', query.ip_address);
    }

    if (query.date_from) {
      dbQuery = dbQuery.gte('created_at', query.date_from);
    }

    if (query.date_to) {
      dbQuery = dbQuery.lte('created_at', query.date_to);
    }

    const { data: logs, error, count } = await dbQuery;

    if (error) {
      console.error('[GET /api/v1/audit-logs] Database error:', error.message);
      return NextResponse.json(
        { success: false, error: 'Database Error', message: 'Failed to retrieve audit logs.' },
        { status: 500 }
      );
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,
        data: {
          logs: logs ?? [],
          filters: {
            event_type: query.event_type ?? null,
            date_from: query.date_from ?? null,
            date_to: query.date_to ?? null,
            ip_address: query.ip_address ?? null,
            scope: isAdmin ? 'all' : 'user',
          },
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
          },
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[GET /api/v1/audit-logs] Unexpected error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while fetching audit logs.',
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Export Route Handler
// ---------------------------------------------------------------------------

export const GET = withAuth(getAuditLogsHandler);
