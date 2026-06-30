/**
 * @file src/lib/auth-middleware.ts
 * @description Reusable JWT authentication middleware for Next.js App Router
 * Route Handlers. Validates the Bearer token from the Authorization header
 * using the Supabase admin client, then passes the authenticated user to
 * the wrapped handler.
 *
 * Usage:
 *   export const GET = withAuth(async (req, { user }) => { ... });
 *   export const POST = withAdminAuth(async (req, { user }) => { ... });
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { logEvent, UNAUTHORIZED_ACCESS, extractIpAddress } from '@/lib/audit-logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The context object injected into authenticated route handlers.
 */
export interface AuthContext {
  user: User;
}

/**
 * The context object injected into authenticated route handlers that include
 * dynamic path parameters.
 */
export interface AuthContextWithParams<P = Record<string, string>> {
  user: User;
  params: P;
}

/**
 * A Next.js route handler that receives an AuthContext as its second argument.
 */
export type AuthenticatedHandler<P = Record<string, string>> = (
  request: NextRequest,
  context: AuthContextWithParams<P>
) => Promise<NextResponse> | NextResponse;

// ---------------------------------------------------------------------------
// Internal: Token Extraction & Validation
// ---------------------------------------------------------------------------

/**
 * Extracts the Bearer token from the Authorization header.
 * Returns null if the header is absent or malformed.
 */
function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}

/**
 * Validates a JWT token using the Supabase admin client and returns the
 * corresponding user, or null if the token is invalid/expired.
 */
async function validateToken(token: string): Promise<User | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }
    return data.user;
  } catch (err) {
    console.error('[AuthMiddleware] Unexpected error during token validation:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// withAuth — Standard Authentication Middleware
// ---------------------------------------------------------------------------

/**
 * Wraps a Next.js route handler with JWT authentication.
 * - Extracts and validates the Bearer token from the Authorization header.
 * - Returns HTTP 401 if the token is absent or invalid.
 * - Injects the validated `user` object into the handler context.
 *
 * @param handler - The route handler to protect.
 * @returns A wrapped route handler with authentication enforced.
 */
export function withAuth<P = Record<string, string>>(
  handler: AuthenticatedHandler<P>
): (request: NextRequest, context: { params: P }) => Promise<NextResponse> {
  return async (request: NextRequest, context: { params: P }): Promise<NextResponse> => {
    const ipAddress = extractIpAddress(request);

    const token = extractBearerToken(request);
    if (!token) {
      await logEvent(null, UNAUTHORIZED_ACCESS, {
        reason: 'Missing or malformed Authorization header.',
        path: request.nextUrl.pathname,
        method: request.method,
      }, ipAddress);

      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'A valid Bearer token is required in the Authorization header.',
        },
        { status: 401 }
      );
    }

    const user = await validateToken(token);
    if (!user) {
      await logEvent(null, UNAUTHORIZED_ACCESS, {
        reason: 'Invalid or expired JWT token.',
        path: request.nextUrl.pathname,
        method: request.method,
      }, ipAddress);

      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'The provided token is invalid or has expired.',
        },
        { status: 401 }
      );
    }

    return handler(request, { user, params: context.params });
  };
}

// ---------------------------------------------------------------------------
// withAdminAuth — Admin-Only Authentication Middleware
// ---------------------------------------------------------------------------

/**
 * Wraps a Next.js route handler with JWT authentication AND admin role check.
 * - Performs the same JWT validation as `withAuth`.
 * - Additionally checks that the user's app_metadata.role === 'admin'.
 * - Returns HTTP 403 Forbidden if the authenticated user is not an admin.
 *
 * @param handler - The route handler to protect.
 * @returns A wrapped route handler with admin authentication enforced.
 */
export function withAdminAuth<P = Record<string, string>>(
  handler: AuthenticatedHandler<P>
): (request: NextRequest, context: { params: P }) => Promise<NextResponse> {
  return async (request: NextRequest, context: { params: P }): Promise<NextResponse> => {
    const ipAddress = extractIpAddress(request);

    const token = extractBearerToken(request);
    if (!token) {
      await logEvent(null, UNAUTHORIZED_ACCESS, {
        reason: 'Missing or malformed Authorization header (admin route).',
        path: request.nextUrl.pathname,
        method: request.method,
      }, ipAddress);

      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'A valid Bearer token is required in the Authorization header.',
        },
        { status: 401 }
      );
    }

    const user = await validateToken(token);
    if (!user) {
      await logEvent(null, UNAUTHORIZED_ACCESS, {
        reason: 'Invalid or expired JWT token (admin route).',
        path: request.nextUrl.pathname,
        method: request.method,
      }, ipAddress);

      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'The provided token is invalid or has expired.',
        },
        { status: 401 }
      );
    }

    // Check for admin role in app_metadata (set via Supabase service role).
    const role =
      (user.app_metadata?.role as string | undefined) ||
      (user.user_metadata?.role as string | undefined);

    if (role !== 'admin') {
      await logEvent(user.id, UNAUTHORIZED_ACCESS, {
        reason: 'Non-admin user attempted to access admin-only route.',
        path: request.nextUrl.pathname,
        method: request.method,
        userRole: role ?? 'none',
      }, ipAddress);

      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You do not have the required permissions to access this resource.',
        },
        { status: 403 }
      );
    }

    return handler(request, { user, params: context.params });
  };
}
