/**
 * @file src/lib/supabase/client.ts
 * @description Browser-side Supabase client. Preserves the legacy
 * createClient() factory so existing call sites work unchanged.
 */

import { createBrowserClient } from "@supabase/ssr";
import { resolvePublicSupabaseKey, resolvePublicSupabaseUrl } from "@/lib/env";

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (_client) return _client;
  _client = createBrowserClient(resolvePublicSupabaseUrl(), resolvePublicSupabaseKey());
  return _client;
}
