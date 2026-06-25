export const dynamic = 'force-dynamic';

/**
 * @file src/app/api/v1/links/[id]/rules/[ruleId]/route.ts
 * @description
 *   PUT    /api/v1/links/:id/rules/:ruleId — Update a specific redirect rule.
 *   DELETE /api/v1/links/:id/rules/:ruleId — Delete a specific redirect rule.
 *
 * Ownership of the parent link is verified before all operations.
 * ruleId is verified to belong to the specified link.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthContextWithParams } from '@/lib/auth-middleware';
import { createAdminClient } from '@/lib/supabase/admin';
import { UpdateRedirectRuleSchema } from '@/lib/schemas';
import {
  logEvent,
  extractIpAddress,
  RULE_UPDATED,
  RULE_DELETED,
} from '@/lib/audit-logger';
import { ZodError } from 'zod';

type RuleParams = { id: string; ruleId: string };

// ---------------------------------------------------------------------------
// Ownership + Rule Verification Helper
// ---------------------------------------------------------------------------

/**
 * Verifies that:
 * 1. The parent link exists and belongs to userId.
 * 2. The rule exists and belongs to that link.
 */
async function getOwnedRule(
  linkId: string,
  ruleId: string,
  userId: string
): Promise<{
  rule: Record<string, unknown> | null;
  linkOwned: boolean;
  dbError: boolean;
}> {
  const admin = createAdminClient();

  // Step 1: Verify link ownership
  const { data: link, error: linkError } = await admin
    .from('links')
    .select('id')
    .eq('id', linkId)
    .eq('user_id', userId)
    .single();

  if (linkError && linkError.code !== 'PGRST116') {
    console.error('[getOwnedRule] Link query error:', linkError.message);
    return { rule: null, linkOwned: false, dbError: true };
  }

  if (!link) {
    return { rule: null, linkOwned: false, dbError: false };
  }

  // Step 2: Fetch the specific rule
  const { data: rule, error: ruleError } = await admin
    .from('redirect_rules')
    .select('*')
    .eq('id', ruleId)
    .eq('link_id', linkId)
    .single();

  if (ruleError && ruleError.code !== 'PGRST116') {
    console.error('[getOwnedRule] Rule query error:', ruleError.message);
    return { rule: null, linkOwned: true, dbError: true };
  }

  return {
    rule: rule ?? null,
    linkOwned: true,
    dbError: false,
  };
}

// ---------------------------------------------------------------------------
// PUT Handler
// ---------------------------------------------------------------------------

async function updateRuleHandler(
  request: NextRequest,
  { user, params }: AuthContextWithParams<RuleParams>
): Promise<NextResponse> {
  const ipAddress = extractIpAddress(request);
  const { id: linkId, ruleId } = params;

  if (!linkId || !ruleId) {
    return NextResponse.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Both link ID and rule ID are required.',
      },
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
    priority?: number;
    ruleType?: string;
    ruleValue?: string;
    targetUrl?: string;
    isActive?: boolean;
    description?: string | null;
  };

  try {
    validatedInput = UpdateRedirectRuleSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error',
          message: 'Invalid rule update data.',
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

  if (Object.keys(validatedInput).length === 0) {
    return NextResponse.json(
      { success: false, error: 'Bad Request', message: 'No fields provided for update.' },
      { status: 400 }
    );
  }

  try {
    const { rule: existingRule, linkOwned, dbError } = await getOwnedRule(
      linkId,
      ruleId,
      user.id
    );

    if (dbError) {
      return NextResponse.json(
        { success: false, error: 'Database Error', message: 'Failed to verify ownership.' },
        { status: 500 }
      );
    }

    if (!linkOwned) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Link not found or you do not have permission to modify it.',
        },
        { status: 404 }
      );
    }

    if (!existingRule) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Redirect rule not found.',
        },
        { status: 404 }
      );
    }

    // Check priority conflict if priority is being changed
    if (
      validatedInput.priority !== undefined &&
      validatedInput.priority !== existingRule.priority
    ) {
      const admin = createAdminClient();
      const { data: priorityConflict } = await admin
        .from('redirect_rules')
        .select('id')
        .eq('link_id', linkId)
        .eq('priority', validatedInput.priority)
        .neq('id', ruleId)
        .single();

      if (priorityConflict) {
        return NextResponse.json(
          {
            success: false,
            error: 'Conflict',
            message: `A rule with priority ${validatedInput.priority} already exists for this link.`,
          },
          { status: 409 }
        );
      }
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (validatedInput.priority !== undefined) updatePayload.priority = validatedInput.priority;
    if (validatedInput.ruleType !== undefined) updatePayload.rule_type = validatedInput.ruleType;
    if (validatedInput.ruleValue !== undefined) updatePayload.rule_value = validatedInput.ruleValue;
    if (validatedInput.targetUrl !== undefined) updatePayload.target_url = validatedInput.targetUrl;
    if (validatedInput.isActive !== undefined) updatePayload.is_active = validatedInput.isActive;
    if (validatedInput.description !== undefined) updatePayload.description = validatedInput.description;

    const admin = createAdminClient();
    const { data: updatedRule, error: updateError } = await admin
      .from('redirect_rules')
      // @ts-ignore
      .update(updatePayload as any)
      .eq('id', ruleId)
      .eq('link_id', linkId)
      .select()
      .single();

    if (updateError || !updatedRule) {
      console.error('[PUT /api/v1/links/:id/rules/:ruleId] Update error:', updateError?.message);
      return NextResponse.json(
        { success: false, error: 'Database Error', message: 'Failed to update redirect rule.' },
        { status: 500 }
      );
    }

    await logEvent(
      user.id,
      RULE_UPDATED,
      {
        ruleId,
        linkId,
        changes: validatedInput,
      },
      ipAddress
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Redirect rule updated successfully.',
        data: { rule: updatedRule },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[PUT /api/v1/links/:id/rules/:ruleId] Unexpected error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while updating the redirect rule.',
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE Handler
// ---------------------------------------------------------------------------

async function deleteRuleHandler(
  request: NextRequest,
  { user, params }: AuthContextWithParams<RuleParams>
): Promise<NextResponse> {
  const ipAddress = extractIpAddress(request);
  const { id: linkId, ruleId } = params;

  if (!linkId || !ruleId) {
    return NextResponse.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Both link ID and rule ID are required.',
      },
      { status: 400 }
    );
  }

  try {
    const { rule: existingRule, linkOwned, dbError } = await getOwnedRule(
      linkId,
      ruleId,
      user.id
    );

    if (dbError) {
      return NextResponse.json(
        { success: false, error: 'Database Error', message: 'Failed to verify ownership.' },
        { status: 500 }
      );
    }

    if (!linkOwned) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Link not found or you do not have permission to modify it.',
        },
        { status: 404 }
      );
    }

    if (!existingRule) {
      return NextResponse.json(
        { success: false, error: 'Not Found', message: 'Redirect rule not found.' },
        { status: 404 }
      );
    }

    const admin = createAdminClient();
    const { error: deleteError } = await admin
      .from('redirect_rules')
      .delete()
      .eq('id', ruleId)
      .eq('link_id', linkId);

    if (deleteError) {
      console.error('[DELETE /api/v1/links/:id/rules/:ruleId] Delete error:', deleteError.message);
      return NextResponse.json(
        { success: false, error: 'Database Error', message: 'Failed to delete redirect rule.' },
        { status: 500 }
      );
    }

    await logEvent(
      user.id,
      RULE_DELETED,
      {
        ruleId,
        linkId,
        ruleType: existingRule.rule_type,
        priority: existingRule.priority,
      },
      ipAddress
    );

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('[DELETE /api/v1/links/:id/rules/:ruleId] Unexpected error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while deleting the redirect rule.',
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Export Route Handlers
// ---------------------------------------------------------------------------

export const PUT = withAuth<RuleParams>(updateRuleHandler);
export const DELETE = withAuth<RuleParams>(deleteRuleHandler);
