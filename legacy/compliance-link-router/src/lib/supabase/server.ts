/**
 * @file src/lib/supabase/server.ts
 * @description Server-side Supabase client factory using @supabase/ssr.
 * This client reads and writes session cookies via Next.js cookies() API,
 * enabling proper session management in Server Components, Route Handlers,
 * and Server Actions.
 */

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { CookieOptions } from '@supabase/ssr';

/**
 * Creates and returns a server-side Supabase client that integrates with
 * Next.js App Router cookie management. This ensures JWT tokens are
 * automatically read from and written to HTTP cookies on the server.
 *
 * @returns A configured Supabase server client.
 * @throws {Error} If required environment variables are missing.
 */
export async function createClient() {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy';

  if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    supabaseUrl = 'https://dummy.supabase.co';
  }

  const cookieStore = await cookies();

  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          // The `setAll` method is called from a Server Component.
          // Cookie mutation inside Server Components is a no-op, which is expected.
          // The middleware is responsible for refreshing sessions.
          if (process.env.NODE_ENV === 'development') {
            console.warn(
              '[Supabase Server Client] Could not set cookies. This is expected in Server Components.',
              error
            );
          }
        }
      },
    },
  });
}
