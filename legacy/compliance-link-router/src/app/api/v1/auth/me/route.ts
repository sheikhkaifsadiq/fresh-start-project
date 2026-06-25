export const dynamic = 'force-dynamic';

/**
 * @file src/app/api/v1/auth/me/route.ts
 * @description GET /api/v1/auth/me
 * Protected endpoint that returns the current authenticated user's profile,
 * role, and metadata. Protected by withAuth middleware.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthContextWithParams } from '@/lib/auth-middleware';
import { createAdminClient } from '@/lib/supabase/admin';

async function getHandler(
  _request: NextRequest,
  { user }: AuthContextWithParams
): Promise<NextResponse> {
  try {
    const admin = createAdminClient();

    // Fetch the full, up-to-date user record from Supabase Auth admin API
    const { data, error } = await admin.auth.admin.getUserById(user.id);

    if (error || !data.user) {
      console.error('[GET /api/v1/auth/me] Failed to fetch user by ID:', error?.message);
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Could not retrieve user information.',
        },
        { status: 404 }
      );
    }

    const fullUser = data.user;

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: fullUser.id,
            email: fullUser.email,
            name: fullUser.user_metadata?.name ?? null,
            role: fullUser.app_metadata?.role ?? 'user',
            phone: fullUser.phone ?? null,
            emailConfirmedAt: fullUser.email_confirmed_at ?? null,
            lastSignInAt: fullUser.last_sign_in_at ?? null,
            createdAt: fullUser.created_at,
            updatedAt: fullUser.updated_at,
            userMetadata: fullUser.user_metadata ?? {},
            appMetadata: {
              role: fullUser.app_metadata?.role ?? 'user',
              provider: fullUser.app_metadata?.provider ?? 'email',
            },
          },
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[GET /api/v1/auth/me] Unexpected error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while fetching your profile.',
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler);
