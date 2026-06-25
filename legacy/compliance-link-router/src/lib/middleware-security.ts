/**
 * @file src/lib/middleware-security.ts
 * @description Security helpers for use inside Next.js middleware.
 * Intentionally a SEPARATE module — src/middleware.ts is not modified.
 *
 * Exports:
 *  - isPathProtected(pathname)  → true for /dashboard/* and /api/v1/* paths
 *  - extractBearerToken(request) → Bearer token string or null
 */

import type { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Protected path prefixes
// ---------------------------------------------------------------------------

/** Paths that require a valid authenticated session. */
const PROTECTED_PREFIXES = ["/dashboard", "/api/v1"] as const;

/**
 * Determines whether a given Next.js pathname requires authentication.
 *
 * Protected patterns:
 * - `/dashboard` and any sub-path (`/dashboard/*`)
 * - `/api/v1` and any sub-path (`/api/v1/*`)
 *
 * The check is intentionally prefix-based, not regex-based, for performance
 * at the edge (runs on every request, must be <1ms).
 *
 * @param pathname - The request pathname, e.g. `/dashboard/links` or `/login`.
 * @returns `true` if the path requires auth; `false` otherwise.
 *
 * @example
 * isPathProtected('/dashboard/links')   // true
 * isPathProtected('/api/v1/auth/login') // true
 * isPathProtected('/login')             // false
 * isPathProtected('/')                  // false
 */
export function isPathProtected(pathname: string): boolean {
  if (typeof pathname !== "string" || pathname.trim() === "") return false;

  for (const prefix of PROTECTED_PREFIXES) {
    if (
      pathname === prefix ||
      pathname.startsWith(`${prefix}/`)
    ) {
      return true;
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// Bearer token extraction
// ---------------------------------------------------------------------------

/** The expected Authorization header prefix (case-sensitive per RFC 6750). */
const BEARER_PREFIX = "Bearer ";

/**
 * Safely extracts the Bearer token from the `Authorization` request header.
 *
 * Follows RFC 6750 §2.1. Performs strict format validation:
 * - Header must start with exactly `"Bearer "` (capital B, single space).
 * - Token must be a non-empty string of printable ASCII characters.
 * - Surrounding whitespace is trimmed from the token value.
 *
 * @param request - The incoming Next.js edge request.
 * @returns The raw token string if present and structurally valid; `null` otherwise.
 *
 * @example
 * // Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * extractBearerToken(request) // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *
 * // Authorization: Basic dXNlcjpwYXNz
 * extractBearerToken(request) // null
 *
 * // No Authorization header
 * extractBearerToken(request) // null
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) return null;

  // Case-sensitive check per RFC 6750
  if (!authHeader.startsWith(BEARER_PREFIX)) return null;

  const token = authHeader.slice(BEARER_PREFIX.length).trim();

  // A valid token must be non-empty and contain only printable ASCII (0x21–0x7E)
  // excluding whitespace. This rejects null bytes, control chars, and pure whitespace.
  if (token.length === 0) return null;

  // RFC 6750 token68: ALPHA / DIGIT / "-" / "." / "_" / "~" / "+" / "/" / *"="
  // We use a slightly more permissive check for JWTs (which include dots and hyphens)
  // but still reject any whitespace or control characters embedded in the token.
  const VALID_TOKEN_REGEX = /^[\x21-\x7E]+$/;
  if (!VALID_TOKEN_REGEX.test(token)) return null;

  return token;
}
