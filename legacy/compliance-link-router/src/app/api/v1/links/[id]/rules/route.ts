export const dynamic = 'force-dynamic';

/**
 * @file src/app/api/v1/links/[id]/rules/route.ts
 * @description
 *   GET  /api/v1/links/:id/rules — List all redirect rules for a link owned by user.
 *   POST /api/v1/links/:id/rules — Create a new redirect rule for a link.
 *
 * Ownership of the parent link is verified before all operations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthContextWithParams } from '@/lib/auth-middleware';
import { createAdminClient } from '@/lib/supabase/admin';
import { RedirectRuleSchema } from '@/lib/schemas';
import {
  logEvent,
  extractIpAddress,
  RULE_CREATED,
} from '@/lib/audit-logger';
import { ZodError } from 'zod';

type RulesParams = { id: string };

// ---------------------------------------------------------------------------
// Ownership Verification Helper
// ---------------------------------------------------------------------------

/**
 * Checks that a link exists and belongs to the given userId.
 */
async function verifyLinkOwnership(
  linkId: string,
  userId: string
): Promise<{ owned: boolean; dbError: boolean }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('links')
    .select('id')
    .eq('id', linkId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[verifyLinkOwnership] Database error:', error.message);
    return { owned: false, dbError: true };
  }

  return { owned: !!data, dbError: false };
}

// ---------------------------------------------------------------------------
// GET Handler
// ---------------------------------------------------------------------------

async function getRulesHandler(
  _request: NextRequest,
  { user, params }: AuthContextWithParams<RulesParams>
): Promise<NextResponse> {
  const { id: linkId } = params;

  if (!linkId) {
    return NextResponse.json(
      { success: false, error: 'Bad Request', message: 'Link ID is required.' },
      { status: 400 }
    );
  }

  try {
    const { owned, dbError } = await verifyLinkOwnership(linkId, user.id);

    if (dbError) {
      return NextResponse.json(
        { success: false, error: 'Database Error', message: 'Failed to verify link ownership.' },
        { status: 500 }
      );
    }

    if (!owned) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Link not found or you do not have permission to access it.',
        },
        { status: 404 }
      );
    }

    const admin = createAdminClient();
    const { data: rules, error: rulesError } = await admin
      .from('redirect_rules')
      .select('*')
      .eq('link_id', linkId)
      .order('priority', { ascending: true });

    if (rulesError) {
      console.error('[GET /api/v1/links/:id/rules] Database error:', rulesError.message);
      return NextResponse.json(
        { success: false, error: 'Database Error', message: 'Failed to retrieve redirect rules.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          rules: rules ?? [],
          total: rules?.length ?? 0,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[GET /api/v1/links/:id/rules] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST Handler
// ---------------------------------------------------------------------------

async function createRuleHandler(
  request: NextRequest,
  { user, params }: AuthContextWithParams<RulesParams>
): Promise<NextResponse> {
  const ipAddress = extractIpAddress(request);
  const { id: linkId } = params;

  if (!linkId) {
    return NextResponse.json(
      { success: false, error: 'Bad Request', message: 'Link ID is required.' },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Bad Request', message: 'Request body must be valid JSON.' },
      { status: 400 }
    );
  }

  let validatedInput: {
    priority: number;
    ruleType: string;
    ruleValue: string;
    targetUrl: string;
    isActive: boolean;
    description?: string | null;
  };

  try {
    validatedInput = RedirectRuleSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error',
          message: 'Invalid redirect rule data.',
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
    // Verify link ownership
    const { owned, dbError } = await verifyLinkOwnership(linkId, user.id);

    if (dbError) {
      return NextResponse.json(
        { success: false, error: 'Database Error', message: 'Failed to verify link ownership.' },
        { status: 500 }
      );
    }

    if (!owned) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Link not found or you do not have permission to modify it.',
        },
        { status: 404 }
      );
    }

    const admin = createAdminClient();

    // Check for priority conflicts within this link
    const { data: priorityConflict } = await admin
      .from('redirect_rules')
      .select('id')
      .eq('link_id', linkId)
      .eq('priority', validatedInput.priority)
      .single();

    if (priorityConflict) {
      return NextResponse.json(
        {
          success: false,
          error: 'Conflict',
          message: `A rule with priority ${validatedInput.priority} already exists for this link. Use a unique priority value.`,
        },
        { status: 409 }
      );
    }

    const { data, error: insertError } = await admin
      .from('redirect_rules')
      .insert({
        link_id: linkId,
        priority: validatedInput.priority,
        rule_type: validatedInput.ruleType,
        rule_value: validatedInput.ruleValue,
        target_url: validatedInput.targetUrl,
        is_active: validatedInput.isActive,
        description: validatedInput.description ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .select()
      .single();

    const newRule = data as Record<string, any> | null;

    if (insertError || !newRule) {
      console.error('[POST /api/v1/links/:id/rules] Insert error:', insertError?.message);
      return NextResponse.json(
        { success: false, error: 'Database Error', message: 'Failed to create redirect rule.' },
        { status: 500 }
      );
    }

    await logEvent(
      user.id,
      RULE_CREATED,
      {
        ruleId: newRule.id,
        linkId,
        ruleType: newRule.rule_type,
        priority: newRule.priority,
        targetUrl: newRule.target_url,
      },
      ipAddress
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Redirect rule created successfully.',
        data: { rule: newRule },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/v1/links/:id/rules] Unexpected error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while creating the redirect rule.',
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Export Route Handlers
// ---------------------------------------------------------------------------

export const GET = withAuth<RulesParams>(getRulesHandler);
export const POST = withAuth<RulesParams>(createRuleHandler);
