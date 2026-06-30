/**
 * @file src/lib/supabase/admin.server.ts
 * @description Server-only Supabase admin client using SERVICE_ROLE_KEY.
 * NEVER import from a client-reachable module. The `.server.ts` suffix
 * enforces this at bundle time.
 */

import { createClient } from "@supabase/supabase-js";

let adminClient: ReturnType<typeof createClient> | null = null;

export function createAdminClient(): ReturnType<typeof createClient> {
  if (adminClient) return adminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Fail fast — never silently fall back to dummy credentials.
  // A missing secret in production should surface immediately, not at query time.
  if (!supabaseUrl || !supabaseUrl.startsWith("http")) {
    throw new Error(
      "[AegisAdmin] NEXT_PUBLIC_SUPABASE_URL / VITE_SUPABASE_URL is not set or invalid. " +
      "Ensure the environment variable is configured before starting the server."
    );
  }
  if (!serviceRoleKey) {
    throw new Error(
      "[AegisAdmin] SUPABASE_SERVICE_ROLE_KEY is not set. " +
      "This key is required for server-side admin operations."
    );
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return adminClient;
}
