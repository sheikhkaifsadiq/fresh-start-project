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

  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dummy";

  if (!supabaseUrl || !supabaseUrl.startsWith("http")) {
    supabaseUrl = "https://dummy.supabase.co";
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return adminClient;
}
