export const dynamic = 'force-dynamic';

/**
 * @file src/app/api/v1/ml-models/[id]/route.ts
 * @description
 *   GET /api/v1/ml-models/:id — Retrieve single ML model metadata.
 *   PUT /api/v1/ml-models/:id — Update ML model metadata. Setting is_active=true
 *                               atomically deactivates all other models of the same type.
 *
 * Protected by withAdminAuth.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, type AuthContextWithParams } from '@/lib/auth-middleware';
import { createAdminClient } from '@/lib/supabase/admin';
import { UpdateMlModelSchema } from '@/lib/schemas';
import {
  logEvent,
  extractIpAddress,
  ML_MODEL_UPDATED,
} from '@/lib/audit-logger';
import { ZodError } from 'zod';

type MlModelParams = { id: string };

// Metadata-safe column selection (no binary data)
const MODEL_SELECT_COLUMNS =
  'id, name, version, description, model_type, storage_path, accuracy, is_active, created_at, updated_at, created_by';

// ---------------------------------------------------------------------------
// GET Handler
// ---------------------------------------------------------------------------

async function getMlModelHandler(
  _request: NextRequest,
  { params }: AuthContextWithParams<MlModelParams>
): Promise<NextResponse> {
  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Bad Request', message: 'Model ID is required.' },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();

    const { data: model, error } = await admin
      .from('ml_models')
      .select(MODEL_SELECT_COLUMNS)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[GET /api/v1/ml-models/:id] Database error:', error.message);
      return NextResponse.json(
        { success: false, error: 'Database Error', message: 'Failed to retrieve ML model.' },
        { status: 500 }
      );
    }

    if (!model) {
      return NextResponse.json(
        { success: false, error: 'Not Found', message: 'ML model not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: { model } },
      { status: 200 }
    );
  } catch (err) {
    console.error('[GET /api/v1/ml-models/:id] Unexpected error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred.',
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PUT Handler
// ---------------------------------------------------------------------------

async function updateMlModelHandler(
  request: NextRequest,
  { user, params }: AuthContextWithParams<MlModelParams>
): Promise<NextResponse> {
  const ipAddress = extractIpAddress(request);
  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Bad Request', message: 'Model ID is required.' },
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
    name?: string;
    version?: string;
    description?: string | null;
    modelType?: string;
    storagePath?: string;
    accuracy?: number | null;
    isActive?: boolean;
  };

  try {
    validatedInput = UpdateMlModelSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error',
          message: 'Invalid ML model update data.',
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
    const admin = createAdminClient();

    // Fetch existing model
    const { data: rawModel, error: fetchError } = await admin
      .from('ml_models')
      .select(MODEL_SELECT_COLUMNS)
      .eq('id', id)
      .single();

    const existingModel = rawModel as Record<string, any> | null;

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[PUT /api/v1/ml-models/:id] Fetch error:', fetchError.message);
      return NextResponse.json(
        { success: false, error: 'Database Error', message: 'Failed to retrieve ML model.' },
        { status: 500 }
      );
    }

    if (!existingModel) {
      return NextResponse.json(
        { success: false, error: 'Not Found', message: 'ML model not found.' },
        { status: 404 }
      );
    }

    // -----------------------------------------------------------------------
    // Atomic activation: if is_active is being set to true, deactivate all
    // other models of the same model_type first. This prevents split-brain.
    // -----------------------------------------------------------------------
    if (validatedInput.isActive === true) {
      const targetModelType = validatedInput.modelType ?? existingModel.model_type;

      const { error: deactivateError } = await admin
        .from('ml_models')
        // @ts-ignore
        .update({ is_active: false, updated_at: new Date().toISOString() } as any)
        .eq('model_type', targetModelType)
        .neq('id', id);

      if (deactivateError) {
        console.error(
          '[PUT /api/v1/ml-models/:id] Failed to deactivate other models:',
          deactivateError.message
        );
        return NextResponse.json(
          {
            success: false,
            error: 'Database Error',
            message:
              'Failed to deactivate other models of the same type before activating this one. Update aborted.',
          },
          { status: 500 }
        );
      }
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (validatedInput.name !== undefined) updatePayload.name = validatedInput.name;
    if (validatedInput.version !== undefined) updatePayload.version = validatedInput.version;
    if (validatedInput.description !== undefined) updatePayload.description = validatedInput.description;
    if (validatedInput.modelType !== undefined) updatePayload.model_type = validatedInput.modelType;
    if (validatedInput.storagePath !== undefined) updatePayload.storage_path = validatedInput.storagePath;
    if (validatedInput.accuracy !== undefined) updatePayload.accuracy = validatedInput.accuracy;
    if (validatedInput.isActive !== undefined) updatePayload.is_active = validatedInput.isActive;

    const { data: rawUpdatedModel, error: updateError } = await admin
      .from('ml_models')
      // @ts-ignore
      .update(updatePayload as any)
      .eq('id', id)
      .select(MODEL_SELECT_COLUMNS)
      .single();

    const updatedModel = rawUpdatedModel as Record<string, any> | null;

    if (updateError || !updatedModel) {
      console.error('[PUT /api/v1/ml-models/:id] Update error:', updateError?.message);
      return NextResponse.json(
        { success: false, error: 'Database Error', message: 'Failed to update ML model.' },
        { status: 500 }
      );
    }

    await logEvent(
      user.id,
      ML_MODEL_UPDATED,
      {
        modelId: id,
        name: updatedModel.name,
        version: updatedModel.version,
        changes: validatedInput,
        activatedModel: validatedInput.isActive === true,
        deactivatedSiblings: validatedInput.isActive === true,
      },
      ipAddress
    );

    return NextResponse.json(
      {
        success: true,
        message: 'ML model updated successfully.',
        data: { model: updatedModel },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[PUT /api/v1/ml-models/:id] Unexpected error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while updating the ML model.',
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Export Route Handlers
// ---------------------------------------------------------------------------

export const GET = withAdminAuth<MlModelParams>(getMlModelHandler);
export const PUT = withAdminAuth<MlModelParams>(updateMlModelHandler);
