/**
 * @file src/routes/api/v1/auth/signup.ts
 * @description POST /api/v1/auth/signup — ported 1:1 from the legacy
 * Next.js route. Same Supabase admin createUser flow, same audit logging.
 */

import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";
import { SignupSchema } from "@/lib/schemas";
import { createAdminClient } from "@/lib/supabase/admin.server";
import {
  logEvent,
  extractIpAddress,
  USER_SIGNUP,
} from "@/lib/audit-logger.server";
import { createSecureHandler } from "@/lib/security/global-middleware.server";

export const Route = createFileRoute("/api/v1/auth/signup")({
  server: {
    handlers: {
      POST: createSecureHandler(
        async ({ request }) => {
          const ipAddress = extractIpAddress(request);
          const body = await request.json();

          let validatedInput: { email: string; password: string; name: string };
          try {
            validatedInput = SignupSchema.parse(body);
          } catch (err) {
            if (err instanceof ZodError) {
              return Response.json(
                {
                  success: false,
                  error: "Validation Error",
                  message: "Invalid signup data format.",
                  details: err.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
                },
                { status: 400 },
              );
            }
            throw err;
          }

          const { email, password, name } = validatedInput;

          try {
            const admin = createAdminClient();
            const { data, error } = await admin.auth.admin.createUser({
              email,
              password,
              user_metadata: { name },
              app_metadata: { role: "user" },
              email_confirm: false,
            });

            if (error) {
              const msg = error.message.toLowerCase();
              if (msg.includes("already registered") || msg.includes("already exists") || error.code === "email_exists") {
                return Response.json(
                  { success: false, error: "Conflict", message: "A user with this email address already exists." },
                  { status: 409 },
                );
              }
              console.error("[POST /api/v1/auth/signup] Supabase error:", error.message);
              return Response.json(
                { success: false, error: "Registration Failed", message: error.message },
                { status: 400 },
              );
            }

            if (!data.user) {
              return Response.json(
                { success: false, error: "Registration Failed", message: "User creation returned an unexpected empty response." },
                { status: 500 },
              );
            }

            await logEvent(
              data.user.id,
              USER_SIGNUP,
              { email: data.user.email, name, userId: data.user.id, status: "SUCCESS" },
              ipAddress,
            );

            return Response.json(
              {
                success: true,
                message: "Registration successful. Please check your email to confirm your account.",
                data: {
                  user: {
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.user_metadata?.name ?? name,
                    role: data.user.app_metadata?.role ?? "user",
                    createdAt: data.user.created_at,
                  },
                },
              },
              { status: 201 },
            );
          } catch (err) {
            console.error("[POST /api/v1/auth/signup] Unexpected error:", err);
            await logEvent(
              null,
              USER_SIGNUP,
              { email, reason: "Internal server error during signup.", error: err instanceof Error ? err.message : String(err), status: "FAILED" },
              ipAddress,
            );
            return Response.json(
              { success: false, error: "Internal Server Error", message: "An unexpected error occurred. Please try again later." },
              { status: 500 },
            );
          }
        },
        { requireAuth: false }
      ),
    },
  },
});
