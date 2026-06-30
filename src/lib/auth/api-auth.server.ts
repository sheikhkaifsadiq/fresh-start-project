/**
 * @file src/lib/auth/api-auth.server.ts
 * @description Centralized bearer-token auth for all /api/v1/* server handlers.
 *
 * Usage:
 *   const { userId, error } = await requireAuth(request);
 *   if (error) return error;
 *
 * The token is a Supabase JWT from the browser session. We verify it server-side
 * using the anon client (which validates the JWT signature against Supabase's
 * public JWKS), then return the user ID for use in queries.
 *
 * Internal routes (WAF evaluate) additionally check a shared secret header
 * that only the Cloudflare Worker can supply.
 */

import { createClient } from "@supabase/supabase-js";

let _anonClient: ReturnType<typeof createClient> | null = null;

function getAnonClient() {
  if (_anonClient) return _anonClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "";
  if (!url || !anon) throw new Error("Supabase URL/anon key env vars are not configured");
  _anonClient = createClient(url, anon, { auth: { persistSession: false } });
  return _anonClient;
}

export interface AuthResult {
  userId: string | null;
  error: Response | null;
}

/**
 * Validates the Bearer JWT from the Authorization header.
 * Returns { userId, error: null } on success.
 * Returns { userId: null, error: Response } on failure — just return the error directly.
 */
export async function requireAuth(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (!token) {
    return {
      userId: null,
      error: Response.json(
        { success: false, message: "Authentication required" },
        { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
      ),
    };
  }

  try {
    const client = getAnonClient();
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) {
      return {
        userId: null,
        error: Response.json(
          { success: false, message: "Invalid or expired token" },
          { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
        ),
      };
    }
    return { userId: data.user.id, error: null };
  } catch {
    return {
      userId: null,
      error: Response.json(
        { success: false, message: "Authentication service error" },
        { status: 503 }
      ),
    };
  }
}

/**
 * Validates the internal shared secret for machine-to-machine routes.
 * The Cloudflare Worker must set X-Aegis-Internal-Secret on every call.
 * Route handlers exposed only to the Worker (e.g. /api/waf/evaluate) use this.
 */
export function requireInternalSecret(request: Request): Response | null {
  const secret = process.env.AEGIS_INTERNAL_SECRET;
  if (!secret) {
    // Fail closed: if the secret is not configured, block all access.
    console.error("[AegisAuth] AEGIS_INTERNAL_SECRET is not set — blocking internal route");
    return Response.json({ success: false, message: "Internal route not configured" }, { status: 503 });
  }
  const provided = request.headers.get("x-aegis-internal-secret");
  if (!provided || provided !== secret) {
    return Response.json({ success: false, message: "Forbidden" }, { status: 403 });
  }
  return null;
}
