export const dynamic = 'force-dynamic';

/**
 * @file src/app/api/v1/auth/login/route.ts
 * @description POST /api/v1/auth/login
 * Authenticates a user with email and password via Supabase Auth.
 * Returns the session JWT and user object on success.
 * Logs USER_LOGIN_SUCCESS or USER_LOGIN_FAILED audit events.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { LoginSchema } from '@/lib/schemas';
import {
  logEvent,
  extractIpAddress,
  USER_LOGIN_SUCCESS,
  USER_LOGIN_FAILED,
} from '@/lib/audit-logger';
import { ZodError } from 'zod';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ipAddress = extractIpAddress(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Request body must be valid JSON.',
      },
      { status: 400 }
    );
  }

  // Validate input
  let validatedInput: { email: string; password: string };
  try {
    validatedInput = LoginSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error',
          message: 'Invalid login credentials format.',
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

  const { email, password } = validatedInput;

  try {
    const admin = createAdminClient();

    const { data, error } = await admin.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      // Log failed login attempt — do not reveal whether email exists
      await logEvent(
        null,
        USER_LOGIN_FAILED,
        {
          email,
          reason: error?.message ?? 'Sign in returned no session.',
          errorCode: error?.code ?? 'unknown',
        },
        ipAddress
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Invalid email or password.',
        },
        { status: 401 }
      );
    }

    // Log successful login
    await logEvent(
      data.user.id,
      USER_LOGIN_SUCCESS,
      {
        email: data.user.email,
        userId: data.user.id,
      },
      ipAddress
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name ?? null,
            role: data.user.app_metadata?.role ?? 'user',
            emailConfirmedAt: data.user.email_confirmed_at,
            createdAt: data.user.created_at,
          },
          session: {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresAt: data.session.expires_at,
            tokenType: data.session.token_type,
          },
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[POST /api/v1/auth/login] Unexpected error:', err);

    await logEvent(
      null,
      USER_LOGIN_FAILED,
      {
        email,
        reason: 'Internal server error during sign in.',
        error: err instanceof Error ? err.message : String(err),
      },
      ipAddress
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred. Please try again later.',
      },
      { status: 500 }
    );
  }
}
