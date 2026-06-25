export const dynamic = 'force-dynamic';

/**
 * @file src/app/api/v1/assets/upload/route.ts
 * @description POST /api/v1/assets/upload
 *
 * NFR-4 Compliant file upload endpoint:
 * - Max file size: 2MB enforced
 * - Allowed MIME types: image/png, image/jpeg, image/webp only
 * - Uploads to 'private-assets' Supabase Storage bucket
 * - Storage path: images/{userId}/{timestamp}-{sanitized-filename}
 * - Returns the storage path and public/signed URL metadata
 *
 * Protected by withAuth middleware.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthContextWithParams } from '@/lib/auth-middleware';
import { createAdminClient } from '@/lib/supabase/admin';
import { logEvent, extractIpAddress, ASSET_UPLOADED } from '@/lib/audit-logger';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
]);

const ALLOWED_EXTENSIONS: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

const STORAGE_BUCKET = 'private-assets';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Sanitises a filename by removing path traversal attempts and special chars.
 * Preserves the extension.
 */
function sanitizeFilename(filename: string): string {
  // Remove path components
  const basename = filename.split(/[/\\]/).pop() ?? 'upload';
  // Replace non-alphanumeric chars (except dot, hyphen, underscore) with underscores
  return basename.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
}

// ---------------------------------------------------------------------------
// POST Handler
// ---------------------------------------------------------------------------

async function uploadAssetHandler(
  request: NextRequest,
  { user }: AuthContextWithParams
): Promise<NextResponse> {
  const ipAddress = extractIpAddress(request);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Request must be multipart/form-data with a file field.',
      },
      { status: 400 }
    );
  }

  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'A file field named "file" is required in the form data.',
      },
      { status: 400 }
    );
  }

  // -------------------------------------------------------------------------
  // NFR-4: MIME type validation
  // -------------------------------------------------------------------------
  const mimeType = file.type;
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unsupported Media Type',
        message: `File type "${mimeType}" is not allowed. Accepted types: image/png, image/jpeg, image/webp.`,
      },
      { status: 415 }
    );
  }

  // -------------------------------------------------------------------------
  // NFR-4: File size enforcement (2MB max)
  // -------------------------------------------------------------------------
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      {
        success: false,
        error: 'Payload Too Large',
        message: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds the 2MB maximum allowed size.`,
      },
      { status: 413 }
    );
  }

  if (file.size === 0) {
    return NextResponse.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Uploaded file is empty.',
      },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();

    // Build deterministic storage path
    const timestamp = Date.now();
    const sanitizedFilename = sanitizeFilename(file.name || `upload${ALLOWED_EXTENSIONS[mimeType]}`);
    const storagePath = `images/${user.id}/${timestamp}-${sanitizedFilename}`;

    // Convert File to ArrayBuffer for Supabase storage upload
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await admin.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: false, // Never overwrite — timestamps ensure uniqueness
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('[POST /api/v1/assets/upload] Storage upload error:', uploadError.message);
      return NextResponse.json(
        {
          success: false,
          error: 'Upload Failed',
          message: 'Failed to upload file to storage. Please try again.',
        },
        { status: 500 }
      );
    }

    // Generate a signed URL valid for 1 hour for immediate use
    const { data: signedUrlData, error: signedUrlError } = await admin.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, 3600);

    const signedUrl = signedUrlError ? null : signedUrlData?.signedUrl;

    if (signedUrlError) {
      console.warn(
        '[POST /api/v1/assets/upload] Could not generate signed URL:',
        signedUrlError.message
      );
    }

    await logEvent(
      user.id,
      ASSET_UPLOADED,
      {
        storagePath: uploadData.path,
        bucket: STORAGE_BUCKET,
        filename: file.name,
        mimeType,
        fileSizeBytes: file.size,
      },
      ipAddress
    );

    return NextResponse.json(
      {
        success: true,
        message: 'File uploaded successfully.',
        data: {
          storagePath: uploadData.path,
          bucket: STORAGE_BUCKET,
          filename: sanitizedFilename,
          mimeType,
          fileSizeBytes: file.size,
          signedUrl: signedUrl ?? null,
          signedUrlExpiresInSeconds: signedUrl ? 3600 : null,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/v1/assets/upload] Unexpected error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during file upload.',
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Export Route Handler
// ---------------------------------------------------------------------------

export const POST = withAuth(uploadAssetHandler);
