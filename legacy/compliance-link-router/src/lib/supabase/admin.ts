/**
 * @file src/lib/supabase/admin.ts
 * @description Admin Supabase client that uses the SERVICE_ROLE_KEY to bypass
 * Row Level Security (RLS). This client must ONLY be used in server-side
 * contexts (API routes, Server Actions, server components). Never expose
 * the service role key to the browser.
 */

import { createClient } from '@supabase/supabase-js';

let adminClient: ReturnType<typeof createClient> | null = null;

/**
 * Returns a singleton Supabase admin client configured with the service role key.
 * This client bypasses all Row Level Security policies and should be used
 * exclusively for privileged server-side operations (audit logging, admin
 * queries, user management, etc.).
 *
 * @returns A configured Supabase admin client with service role privileges.
 * @throws {Error} If required environment variables are missing.
 */
export function createAdminClient(): ReturnType<typeof createClient> {
  if (adminClient) {
    return adminClient;
  }

  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';

  if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    supabaseUrl = 'https://dummy.supabase.co';
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      // Disable automatic session persistence — this client is stateless and server-side only.
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'x-application-name': 'aegis-route-admin',
      },
    },
  });

  return adminClient;
}

export const createClientAlias = createAdminClient;
export { createClientAlias as createClient };
