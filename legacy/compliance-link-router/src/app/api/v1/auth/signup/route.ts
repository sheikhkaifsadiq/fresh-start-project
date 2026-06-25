export const dynamic = 'force-dynamic';

/**
 * @file src/app/api/v1/auth/signup/route.ts
 * @description POST /api/v1/auth/signup
 * Registers a new user via Supabase Auth with email, password, and name.
 * Returns the newly created user object.
 * Validates email format and enforces password minimum 8 characters.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SignupSchema } from '@/lib/schemas';
import { logEvent, extractIpAddress, USER_SIGNUP } from '@/lib/audit-logger';
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
  let validatedInput: { email: string; password: string; name: string };
  try {
    validatedInput = SignupSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error',
          message: 'Request data is invalid.',
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

  const { email, password, name } = validatedInput;

  try {
    const admin = createAdminClient();

    // Attempt to create the user via the admin API to avoid email confirmation delays
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      app_metadata: { role: 'user' },
      email_confirm: false, // Sends confirmation email via Supabase settings
    });

    if (error) {
      // Handle duplicate email conflict
      if (
        error.message.toLowerCase().includes('already registered') ||
        error.message.toLowerCase().includes('already exists') ||
        error.code === 'email_exists'
      ) {
        return NextResponse.json(
          {
            success: false,
            error: 'Conflict',
            message: 'A user with this email address already exists.',
          },
          { status: 409 }
        );
      }

      console.error('[POST /api/v1/auth/signup] Supabase error:', error.message);
      return NextResponse.json(
        {
          success: false,
          error: 'Registration Failed',
          message: error.message,
        },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Registration Failed',
          message: 'User creation returned an unexpected empty response.',
        },
        { status: 500 }
      );
    }

    // Log successful signup
    await logEvent(
      data.user.id,
      USER_SIGNUP,
      {
        email: data.user.email,
        name,
        userId: data.user.id,
      },
      ipAddress
    );

    return NextResponse.json(
      {
        success: true,
        message:
          'Registration successful. Please check your email to confirm your account.',
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name ?? name,
            role: data.user.app_metadata?.role ?? 'user',
            createdAt: data.user.created_at,
          },
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/v1/auth/signup] Unexpected error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during registration. Please try again later.',
      },
      { status: 500 }
    );
  }
}
