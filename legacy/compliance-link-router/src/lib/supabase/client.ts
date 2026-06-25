/**
 * @file src/lib/supabase/client.ts
 * @description Browser-side Supabase client factory using @supabase/ssr.
 * This client is safe to use in React Client Components and browser contexts.
 * It automatically manages session tokens via browser cookies.
 */

import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates and returns a browser-side Supabase client instance.
 * Uses environment variables for the Supabase project URL and anon key.
 * This should only be called in client-side (browser) contexts.
 *
 * @returns A configured Supabase browser client.
 */
export function createClient() {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy';

  if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    supabaseUrl = 'https://dummy.supabase.co';
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
