export const dynamic = 'force-dynamic';

/**
 * @file src/app/api/v1/auth/logout/route.ts
 * @description POST /api/v1/auth/logout
 * Signs the current user out from Supabase and clears session cookies.
 * Accepts the Bearer token in Authorization header to identify which
 * session to invalidate.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logEvent, extractIpAddress, USER_LOGOUT } from '@/lib/audit-logger';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ipAddress = extractIpAddress(request);

  // Extract Bearer token from Authorization header
  const authHeader = request.headers.get('authorization');
  const token =
    authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : null;

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'A valid Bearer token is required to logout.',
      },
      { status: 401 }
    );
  }

  try {
    const admin = createAdminClient();

    // Validate the token to identify the user before logging them out
    const { data: userData, error: userError } = await admin.auth.getUser(token);

    if (userError || !userData.user) {
      // Token is already invalid — treat as successful logout
      return NextResponse.json(
        {
          success: true,
          message: 'Logged out successfully.',
        },
        { status: 200 }
      );
    }

    const userId = userData.user.id;

    // Sign out the user globally — invalidates all their sessions
    const { error: signOutError } = await admin.auth.admin.signOut(token, 'global');

    if (signOutError) {
      console.error('[POST /api/v1/auth/logout] Sign out error:', signOutError.message);
      // Even if signout fails on Supabase side, we clear cookies and return success
    }

    // Log the logout event
    await logEvent(
      userId,
      USER_LOGOUT,
      {
        email: userData.user.email,
        userId,
      },
      ipAddress
    );

    // Build response and clear session cookies
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully.',
      },
      { status: 200 }
    );

    // Clear all Supabase-related cookies
    const cookiesToClear = [
      'sb-access-token',
      'sb-refresh-token',
      `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0].replace('https://', '')}-auth-token`,
    ];

    cookiesToClear.forEach((cookieName) => {
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    });

    return response;
  } catch (err) {
    console.error('[POST /api/v1/auth/logout] Unexpected error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during logout. Please try again later.',
      },
      { status: 500 }
    );
  }
}
