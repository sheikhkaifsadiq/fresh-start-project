/**
 * @file src/lib/env.ts
 * @description Compatibility shim. The legacy product uses NEXT_PUBLIC_*
 * variable names; this stack injects them via vite.config.ts define() so the
 * exact same names are readable in the browser. Server code keeps using
 * process.env directly with the legacy names.
 */

function readClientEnv(name: string): string {
  // Vite replaces these at build time via vite.config.ts define().
  const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env;
  return env[name] ?? "";
}

export const PUBLIC_ENV = {
  SUPABASE_URL: readClientEnv("NEXT_PUBLIC_SUPABASE_URL"),
  SUPABASE_ANON_KEY: readClientEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  SITE_URL: readClientEnv("NEXT_PUBLIC_SITE_URL"),
};

/** Safe URL — falls back to a dummy that won't crash @supabase/supabase-js. */
export function resolvePublicSupabaseUrl(): string {
  const url = PUBLIC_ENV.SUPABASE_URL;
  return url && url.startsWith("http") ? url : "https://dummy.supabase.co";
}

export function resolvePublicSupabaseKey(): string {
  return PUBLIC_ENV.SUPABASE_ANON_KEY || "dummy";
}
