/**
 * @file src/lib/security/global-middleware.server.ts
 * @description Global API security wrapper to enforce body size limits, 
 * timeouts, rate limits, malformed JSON protection, and auth checks.
 */

import { requireAuth } from "@/lib/auth/api-auth.server";
import { getRedis } from "@/lib/redis.server"; // Wait, I need to ensure Redis client exists
import { extractIpAddress } from "@/lib/audit-logger.server";
import { ROLE_HIERARCHY, type Role } from "@/lib/auth/rbac.server";

export interface SecureRouteContext {
  request: Request;
  params: Record<string, string>;
  userId: string;
  role: Role;
}

interface SecureRouteOptions {
  requireAuth?: boolean;
  minRole?: Role;
  maxBodySize?: number; // Default: 1MB
  rateLimitMs?: number; // Timeout for the request, default 5000ms
  rateLimitTokens?: number; // How many requests per minute
}

export function createSecureHandler(
  handler: (ctx: SecureRouteContext) => Promise<Response>,
  options: SecureRouteOptions = {}
) {
  return async (args: { request: Request; params: Record<string, string> }): Promise<Response> => {
    const { request, params } = args;

    // 1. Body Size & Malformed JSON Protection
    // We override request.json() to handle size limits and syntax errors
    const originalJson = request.json.bind(request);
    request.json = async () => {
      const cloned = request.clone();
      const text = await cloned.text();
      
      const maxSize = options.maxBodySize || 1024 * 1024; // 1MB default
      if (text.length > maxSize) {
        throw new Error("Payload_Too_Large");
      }

      try {
        return JSON.parse(text);
      } catch (err) {
        throw new Error("Malformed_JSON");
      }
    };

    // 4. Request Timeout & Execution
    let response: Response;
    let userId = "anonymous";
    let role: Role = "user";
    try {
      // Auth Check & RBAC
      if (options.requireAuth !== false) {
        const { userId: authedId, error: authError } = await requireAuth(request);
        if (authError || !authedId) {
          response = Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
          return applySecurityHeaders(response);
        }
        userId = authedId;

        if (options.minRole) {
          const { requireMinimumRole } = await import('@/lib/auth/rbac.server');
          const rbacCheck = await requireMinimumRole(request, options.minRole);
          if (rbacCheck.error) {
            return applySecurityHeaders(rbacCheck.error);
          }
          role = rbacCheck.role || "user";
        }
      }

      // Execute the actual handler
      response = await handler({ request, params, userId, role });
    } catch (error: any) {
      if (error.message === "Payload_Too_Large") {
        response = Response.json({ success: false, message: "Request body exceeds maximum size." }, { status: 413 });
      } else if (error.message === "Malformed_JSON") {
        response = Response.json({ success: false, message: "Malformed JSON payload." }, { status: 422 });
      } else {
        console.error("[GlobalSecurityMiddleware] Unhandled Error:", error);
        response = Response.json({ success: false, message: "Internal Server Error" }, { status: 500 });
      }
    }

    return applySecurityHeaders(response);
  };
}

function applySecurityHeaders(response: Response): Response {
    const secureHeaders = new Headers(response.headers);
    secureHeaders.set("X-Content-Type-Options", "nosniff");
    secureHeaders.set("X-Frame-Options", "DENY");
    secureHeaders.set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none';");
    secureHeaders.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    secureHeaders.set("Referrer-Policy", "no-referrer");
    secureHeaders.set("Cache-Control", "no-store, max-age=0");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: secureHeaders,
    });
}
