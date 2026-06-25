/**
 * @file model-sync.ts
 * @description ML Model Synchronisation Service for Aegis Route.
 *
 *              Responsibilities:
 *                1. Fetch the active ML model metadata from Supabase `ml_models` table.
 *                2. Store that metadata in Upstash Redis for fast Edge access.
 *                3. Expose a version-check helper used by the middleware to
 *                   detect model staleness without incurring a Supabase round-trip
 *                   on every request.
 *
 *              Design decisions:
 *                - The Edge Runtime cannot run the full Supabase JS client (it
 *                  uses Node.js streams internally), so we use the Supabase
 *                  REST API via fetch() directly in syncActiveModelToKV().
 *                - Upstash Redis is accessed via the @upstash/redis package,
 *                  which uses fetch() internally and is Edge-compatible.
 *                - Model binary blobs are NOT stored in Redis (too large for
 *                  the 1 MB value limit); only metadata + serialised weights
 *                  JSON is cached.  The actual binary lives in Supabase Storage.
 *
 *              This file is intended to be called from:
 *                - A server-side cron route (/api/v1/ml/sync) that runs every
 *                  30 minutes to refresh the Redis cache.
 *                - An admin API endpoint after a new model is deployed.
 *
 *              Edge-safe: No Node.js built-ins (fs, path, crypto, etc.) are used.
 */

import { Redis } from '@upstash/redis';
import type { MLModelWeights } from './types';
import { DEFAULT_WEIGHTS } from './neural-network';

// ===========================================================================
// Constants
// ===========================================================================

/** Redis key under which the active model metadata JSON is stored. */
export const MODEL_CACHE_KEY = 'aegis:ml_model:active';

/** Redis key for the active model version string. */
export const MODEL_VERSION_KEY = 'aegis:ml_model:version';

/**
 * TTL for the Redis model cache entry in seconds.
 * Set to 2 hours so a model update propagates Edge-globally within 2 hours
 * even if the cron sync fails.
 */
const MODEL_CACHE_TTL_SECONDS = 60 * 60 * 2; // 2 hours

// ===========================================================================
// Redis Client
// ===========================================================================

/**
 * Upstash Redis client instance.
 *
 * URL and token are read from environment variables:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * The client is created lazily (inside each function) to avoid top-level
 * throws when environment variables are missing in test environments.
 */
function getRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      '[Aegis/ModelSync] Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN. ' +
      'Set these environment variables to enable model synchronisation.'
    );
  }

  return new Redis({ url, token });
}

// ===========================================================================
// Supabase REST helpers
// ===========================================================================

/**
 * Shape of a row in the Supabase `ml_models` table.
 * Adjust field names to match your actual schema.
 */
interface SupabaseMLModelRow {
  id: string;
  version: string;
  is_active: boolean;
  weights_json: string | null;   // JSON-serialised MLModelWeights
  storage_path: string | null;   // Supabase Storage path for the binary blob
  created_at: string;
  description: string | null;
}

/**
 * Fetches the currently active ML model row from the Supabase `ml_models`
 * table using the Supabase PostgREST REST API.
 *
 * Requires environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL   — your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY  — service-role key (not the anon key)
 *
 * @returns The active model row, or null if none found.
 * @throws  On HTTP errors or missing environment variables.
 */
async function fetchActiveModelFromSupabase(): Promise<SupabaseMLModelRow | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      '[Aegis/ModelSync] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
      'Set these environment variables to enable Supabase model fetching.'
    );
  }

  const endpoint = `${supabaseUrl}/rest/v1/ml_models?is_active=eq.true&limit=1&order=created_at.desc`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'return=representation',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `[Aegis/ModelSync] Supabase REST error ${response.status}: ${body}`
    );
  }

  const rows: SupabaseMLModelRow[] = await response.json();
  return rows.length > 0 ? rows[0] : null;
}

// ===========================================================================
// Payload stored in Redis
// ===========================================================================

/**
 * The metadata payload stored in Redis under MODEL_CACHE_KEY.
 * Consumers (middleware) can read this to determine if a model update is
 * available and to retrieve the weights for the forward pass.
 */
export interface CachedModelPayload {
  version: string;
  weights: MLModelWeights;
  storagePath: string | null;
  cachedAt: string;   // ISO-8601 timestamp of when the cache was written
  description: string;
}

// ===========================================================================
// Public API
// ===========================================================================

/**
 * Fetches the active ML model from Supabase and writes its metadata + weights
 * to Upstash Redis for Edge access.
 *
 * Behaviour:
 *   - Queries Supabase `ml_models` for the single row where `is_active = true`.
 *   - If the row contains a `weights_json` field, that JSON is parsed and
 *     stored as the model weights.
 *   - If `weights_json` is null (binary-only model), the DEFAULT_WEIGHTS are
 *     used as a fallback (binary deserialisation is not supported at the Edge).
 *   - Writes the payload to Redis with a 2-hour TTL.
 *   - Also writes the version string separately under MODEL_VERSION_KEY for
 *     cheap version polling.
 *
 * @returns The version string of the newly cached model.
 * @throws  On Supabase fetch failure or Redis write failure.
 *
 * @example
 * // In /api/v1/ml/sync route handler:
 * const version = await syncActiveModelToKV();
 * return NextResponse.json({ synced: true, version });
 */
export async function syncActiveModelToKV(): Promise<string> {
  const redis = getRedisClient();

  // 1. Fetch from Supabase
  const modelRow = await fetchActiveModelFromSupabase();

  let payload: CachedModelPayload;

  if (!modelRow) {
    // No active model in Supabase — cache the DEFAULT_WEIGHTS with version 'default'
    console.warn('[Aegis/ModelSync] No active model found in Supabase. Caching DEFAULT_WEIGHTS.');
    payload = {
      version: 'default',
      weights: DEFAULT_WEIGHTS,
      storagePath: null,
      cachedAt: new Date().toISOString(),
      description: 'Fallback: DEFAULT_WEIGHTS (no active Supabase model)',
    };
  } else {
    // Parse weights from the row's weights_json field
    let weights: MLModelWeights = DEFAULT_WEIGHTS;
    if (modelRow.weights_json) {
      try {
        weights = JSON.parse(modelRow.weights_json) as MLModelWeights;
      } catch (parseErr) {
        console.error(
          '[Aegis/ModelSync] Failed to parse weights_json from Supabase row. ' +
          'Falling back to DEFAULT_WEIGHTS.',
          parseErr
        );
        weights = DEFAULT_WEIGHTS;
      }
    } else {
      console.warn(
        '[Aegis/ModelSync] Model row has no weights_json. ' +
        'Binary-only models are not Edge-supported. Using DEFAULT_WEIGHTS.'
      );
    }

    payload = {
      version: modelRow.version,
      weights,
      storagePath: modelRow.storage_path,
      cachedAt: new Date().toISOString(),
      description: modelRow.description ?? '',
    };
  }

  // 2. Write payload to Redis (model metadata + weights)
  await redis.set(MODEL_CACHE_KEY, JSON.stringify(payload), {
    ex: MODEL_CACHE_TTL_SECONDS,
  });

  // 3. Write version string separately for cheap polling
  await redis.set(MODEL_VERSION_KEY, payload.version, {
    ex: MODEL_CACHE_TTL_SECONDS,
  });

  console.log(
    `[Aegis/ModelSync] Model v${payload.version} synced to Redis ` +
    `(TTL: ${MODEL_CACHE_TTL_SECONDS}s, cachedAt: ${payload.cachedAt})`
  );

  return payload.version;
}

/**
 * Returns the currently active model version string from Redis.
 *
 * This is a lightweight read that costs one Redis GET — safe to call on every
 * Edge request if needed (though typically called once per cold-start).
 *
 * @returns The version string (e.g., 'v1.2.3', 'default') or null if no model
 *          is cached in Redis.
 *
 * @example
 * const version = await getModelVersion();
 * if (version !== currentVersion) {
 *   // Refresh local weights
 * }
 */
export async function getModelVersion(): Promise<string | null> {
  try {
    const redis = getRedisClient();
    const version = await redis.get<string>(MODEL_VERSION_KEY);
    return version ?? null;
  } catch (err) {
    console.error('[Aegis/ModelSync] Failed to read model version from Redis:', err);
    return null;
  }
}

/**
 * Fetches the full CachedModelPayload from Redis, including the weights.
 *
 * Returns null if:
 *   - The Redis key has expired (cache miss).
 *   - Redis is unreachable.
 *   - The stored JSON is malformed.
 *
 * In all null cases the caller should fall back to DEFAULT_WEIGHTS.
 *
 * @returns CachedModelPayload or null on cache miss / error.
 *
 * @example
 * const cached = await getCachedModelPayload();
 * const weights = cached?.weights ?? DEFAULT_WEIGHTS;
 * const result = await classifyTraffic(request, weights);
 */
export async function getCachedModelPayload(): Promise<CachedModelPayload | null> {
  try {
    const redis = getRedisClient();
    const raw = await redis.get<string>(MODEL_CACHE_KEY);
    if (!raw) return null;

    // redis.get returns a parsed value if it's valid JSON, or a string otherwise.
    // Handle both cases.
    if (typeof raw === 'object') {
      return raw as unknown as CachedModelPayload;
    }

    return JSON.parse(raw) as CachedModelPayload;
  } catch (err) {
    console.error('[Aegis/ModelSync] Failed to read cached model from Redis:', err);
    return null;
  }
}
