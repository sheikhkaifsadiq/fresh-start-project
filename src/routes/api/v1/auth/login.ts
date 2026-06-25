/**
 * @file src/routes/api/v1/auth/login.ts
 * @description POST /api/v1/auth/login — ported 1:1 from the legacy Next.js
 * route. Same request/response contract, same audit logging, same Supabase
 * admin sign-in flow.
 */

import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";
import { LoginSchema } from "@/lib/schemas";
import { createAdminClient } from "@/lib/supabase/admin.server";
import {
  logEvent,
  extractIpAddress,
  USER_LOGIN_SUCCESS,
  USER_LOGIN_FAILED,
} from "@/lib/audit-logger.server";

export const Route = createFileRoute("/api/v1/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ipAddress = extractIpAddress(request);

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json(
            { success: false, error: "Bad Request", message: "Request body must be valid JSON." },
            { status: 400 },
          );
        }

        let validatedInput: { email: string; password: string };
        try {
          validatedInput = LoginSchema.parse(body);
        } catch (err) {
          if (err instanceof ZodError) {
            return Response.json(
              {
                success: false,
                error: "Validation Error",
                message: "Invalid login credentials format.",
                details: err.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
              },
              { status: 400 },
            );
          }
          throw err;
        }

        const { email, password } = validatedInput;

        try {
          const admin = createAdminClient();
          const { data, error } = await admin.auth.signInWithPassword({ email, password });

          if (error || !data.session || !data.user) {
            await logEvent(
              null,
              USER_LOGIN_FAILED,
              { email, reason: error?.message ?? "Sign in returned no session.", errorCode: error?.code ?? "unknown" },
              ipAddress,
            );
            return Response.json(
              { success: false, error: "Unauthorized", message: "Invalid email or password." },
              { status: 401 },
            );
          }

          await logEvent(
            data.user.id,
            USER_LOGIN_SUCCESS,
            { email: data.user.email, userId: data.user.id },
            ipAddress,
          );

          return Response.json(
            {
              success: true,
              data: {
                user: {
                  id: data.user.id,
                  email: data.user.email,
                  name: data.user.user_metadata?.name ?? null,
                  role: data.user.app_metadata?.role ?? "user",
                  emailConfirmedAt: data.user.email_confirmed_at,
                  createdAt: data.user.created_at,
                },
                session: {
                  accessToken: data.session.access_token,
                  refreshToken: data.session.refresh_token,
                  expiresAt: data.session.expires_at,
                  tokenType: data.session.token_type,
                },
              },
            },
            { status: 200 },
          );
        } catch (err) {
          console.error("[POST /api/v1/auth/login] Unexpected error:", err);
          await logEvent(
            null,
            USER_LOGIN_FAILED,
            { email, reason: "Internal server error during sign in.", error: err instanceof Error ? err.message : String(err) },
            ipAddress,
          );
          return Response.json(
            { success: false, error: "Internal Server Error", message: "An unexpected error occurred. Please try again later." },
            { status: 500 },
          );
        }
      },
    },
  },
});
