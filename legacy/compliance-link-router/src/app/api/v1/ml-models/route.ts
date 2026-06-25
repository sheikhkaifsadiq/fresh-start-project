export const dynamic = 'force-dynamic';

/**
 * @file src/app/api/v1/ml-models/route.ts
 * @description
 *   GET  /api/v1/ml-models — List all ML models with metadata (admin only).
 *   POST /api/v1/ml-models — Register/deploy a new ML model (admin only).
 *
 * Protected by withAdminAuth. Binary model files are NOT returned by this endpoint.
 * Model binaries are assumed to be uploaded to storage separately; this endpoint
 * stores and manages the model metadata and lifecycle.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, type AuthContextWithParams } from '@/lib/auth-middleware';
import { createAdminClient } from '@/lib/supabase/admin';
import { MlModelSchema } from '@/lib/schemas';
import {
  logEvent,
  extractIpAddress,
  ML_MODEL_DEPLOYED,
} from '@/lib/audit-logger';
import { ZodError } from 'zod';

// ---------------------------------------------------------------------------
// GET Handler
// ---------------------------------------------------------------------------

async function getMlModelsHandler(
  request: NextRequest,
  { user }: AuthContextWithParams
): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20));
    const modelType = searchParams.get('model_type') ?? null;
    const isActive = searchParams.get('is_active');

    const admin = createAdminClient();
    const offset = (page - 1) * limit;

    let query = admin
      .from('ml_models')
      .select(
        'id, name, version, description, model_type, storage_path, accuracy, is_active, created_at, updated_at, created_by',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (modelType) {
      query = query.eq('model_type', modelType);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: models, error, count } = await query;

    if (error) {
      console.error('[GET /api/v1/ml-models] Database error:', error.message);
      return NextResponse.json(
        { success: false, error: 'Database Error', message: 'Failed to retrieve ML models.' },
        { status: 500 }
      );
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,
        data: {
          models: models ?? [],
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
    console.error('[GET /api/v1/ml-models] Unexpected error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while fetching ML models.',
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST Handler
// ---------------------------------------------------------------------------

async function createMlModelHandler(
  request: NextRequest,
  { user }: AuthContextWithParams
): Promise<NextResponse> {
  const ipAddress = extractIpAddress(request);

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
    name: string;
    version: string;
    description?: string | null;
    modelType: string;
    storagePath: string;
    accuracy?: number | null;
    isActive: boolean;
  };

  try {
    validatedInput = MlModelSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error',
          message: 'Invalid ML model metadata.',
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

    // Check for duplicate name + version combination
    const { data: existingModel } = await admin
      .from('ml_models')
      .select('id')
      .eq('name', validatedInput.name)
      .eq('version', validatedInput.version)
      .single();

    if (existingModel) {
      return NextResponse.json(
        {
          success: false,
          error: 'Conflict',
          message: `An ML model named "${validatedInput.name}" with version "${validatedInput.version}" already exists.`,
        },
        { status: 409 }
      );
    }

    const { data, error: insertError } = await admin
      .from('ml_models')
      .insert({
        name: validatedInput.name,
        version: validatedInput.version,
        description: validatedInput.description ?? null,
        model_type: validatedInput.modelType,
        storage_path: validatedInput.storagePath,
        accuracy: validatedInput.accuracy ?? null,
        is_active: validatedInput.isActive,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .select(
        'id, name, version, description, model_type, storage_path, accuracy, is_active, created_at, updated_at, created_by'
      )
      .single();

    const newModel = data as Record<string, any> | null;

    if (insertError || !newModel) {
      console.error('[POST /api/v1/ml-models] Insert error:', insertError?.message);
      return NextResponse.json(
        { success: false, error: 'Database Error', message: 'Failed to register ML model.' },
        { status: 500 }
      );
    }

    await logEvent(
      user.id,
      ML_MODEL_DEPLOYED,
      {
        modelId: newModel.id,
        name: newModel.name,
        version: newModel.version,
        modelType: newModel.model_type,
        storagePath: newModel.storage_path,
        isActive: newModel.is_active,
      },
      ipAddress
    );

    return NextResponse.json(
      {
        success: true,
        message: 'ML model registered successfully.',
        data: { model: newModel },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/v1/ml-models] Unexpected error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while registering the ML model.',
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Export Route Handlers
// ---------------------------------------------------------------------------

export const GET = withAdminAuth(getMlModelsHandler);
export const POST = withAdminAuth(createMlModelHandler);
