/**
 * @file src/lib/security/xss-sanitizer.ts
 * @description Production-grade XSS sanitization utilities for Aegis Route.
 * All functions are pure, synchronous, and dependency-free.
 */

// ---------------------------------------------------------------------------
// Character entity map for HTML escaping
// ---------------------------------------------------------------------------
const HTML_ENTITY_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

/** Regex that matches all characters requiring HTML escaping. */
const HTML_ENTITY_REGEX = /[&<>"'`=/]/g;

// ---------------------------------------------------------------------------
// DANGEROUS_PROTOCOLS — schemes that can execute code when used in URLs
// ---------------------------------------------------------------------------
const DANGEROUS_PROTOCOLS = new Set([
  "javascript",
  "data",
  "vbscript",
  "file",
  "blob",
]);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Escapes HTML special characters in a string so it is safe to inject into
 * HTML contexts without risk of XSS.
 *
 * Escapes: & < > " ' / ` =
 *
 * @param input - Raw user-supplied string.
 * @returns HTML-entity-encoded string.
 *
 * @example
 * sanitizeString('<script>alert("xss")</script>')
 * // → '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") return "";
  return input.replace(
    HTML_ENTITY_REGEX,
    (char) => HTML_ENTITY_MAP[char] ?? char
  );
}

/**
 * Recursively walks an object and sanitizes every `string` leaf value via
 * `sanitizeString`. Arrays, nested objects, numbers, booleans, and nulls are
 * all handled correctly.
 *
 * @param obj - Any plain object.
 * @returns A deep copy of `obj` with all string values sanitized.
 *
 * @example
 * sanitizeObject({ name: '<b>Alice</b>', age: 30 })
 * // → { name: '&lt;b&gt;Alice&lt;&#x2F;b&gt;', age: 30 }
 */
export function sanitizeObject<T extends object>(obj: T): T {
  if (Array.isArray(obj)) {
    
    return obj.map((item) =>
      typeof item === "string"
        ? sanitizeString(item)
        : item !== null && typeof item === "object"
        ? sanitizeObject(item as object)
        : item
    ) as unknown as T;
  }

  const result: Record<string, unknown> = {};

  for (const key of Object.keys(obj)) {
    const value = (obj as Record<string, unknown>)[key];

    if (typeof value === "string") {
      result[key] = sanitizeString(value);
    } else if (value !== null && typeof value === "object") {
      result[key] = sanitizeObject(value as object);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Validates whether a URL is safe to use — i.e., it:
 *  - Is parseable by the URL constructor.
 *  - Uses http: or https: protocol only.
 *  - Does NOT use javascript:, data:, vbscript:, blob:, or file: schemes.
 *
 * @param url - The URL string to validate.
 * @returns `true` if the URL is valid and safe; `false` otherwise.
 *
 * @example
 * isValidUrl('https://example.com')    // true
 * isValidUrl('javascript:alert(1)')    // false
 * isValidUrl('data:text/html,<h1>xss') // false
 */
export function isValidUrl(url: string): boolean {
  if (typeof url !== "string" || url.trim() === "") return false;

  // Strip leading whitespace / null bytes that could bypass checks
  const trimmed = url.trim().replace(/\u0000/g, "");

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    // Relative URLs are NOT considered valid by this utility (we require absolute)
    return false;
  }

  // Only allow http and https protocols
  const scheme = parsed.protocol.replace(/:$/, "").toLowerCase();
  if (DANGEROUS_PROTOCOLS.has(scheme)) return false;
  if (scheme !== "http" && scheme !== "https") return false;

  return true;
}

/**
 * Sanitizes a URL, returning `null` if the URL is dangerous or unparseable.
 *
 * This is the function you should use before rendering any user-supplied URL
 * in an `href`, `src`, or `action` attribute.
 *
 * @param url - The raw URL string to sanitize.
 * @returns The sanitized, normalized URL string if safe; `null` otherwise.
 *
 * @example
 * sanitizeUrl('https://example.com/path?q=1')  // 'https://example.com/path?q=1'
 * sanitizeUrl('javascript:alert(1)')            // null
 * sanitizeUrl('  https://safe.com  ')           // 'https://safe.com/'
 */
export function sanitizeUrl(url: string): string | null {
  if (!isValidUrl(url)) return null;

  try {
    // Re-parse to normalize the URL (removes excess whitespace, encodes chars)
    const parsed = new URL(url.trim());
    return parsed.toString();
  } catch {
    return null;
  }
}
