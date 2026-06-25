/**
 * @file src/routes/api/v1/auth/me.ts
 * @description GET /api/v1/auth/me — returns the authenticated user's profile.
 * Auth is asserted via the bearer Authorization header (the browser auth
 * store sends the Supabase access token).
 */

import { createFileRoute } from "@tanstack/react-router";
import { createAdminClient } from "@/lib/supabase/admin.server";

export const Route = createFileRoute("/api/v1/auth/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        const token = authHeader?.toLowerCase().startsWith("bearer ")
          ? authHeader.slice(7)
          : null;

        if (!token) {
          return Response.json(
            { success: false, error: "Unauthorized", message: "Missing bearer token." },
            { status: 401 },
          );
        }

        try {
          const admin = createAdminClient();
          const { data, error } = await admin.auth.getUser(token);
          if (error || !data.user) {
            return Response.json(
              { success: false, error: "Unauthorized", message: "Invalid or expired session." },
              { status: 401 },
            );
          }

          const fullUser = data.user;
          return Response.json(
            {
              success: true,
              data: {
                user: {
                  id: fullUser.id,
                  email: fullUser.email,
                  name: fullUser.user_metadata?.name ?? null,
                  role: fullUser.app_metadata?.role ?? "user",
                  phone: fullUser.phone ?? null,
                  emailConfirmedAt: fullUser.email_confirmed_at ?? null,
                  lastSignInAt: fullUser.last_sign_in_at ?? null,
                  createdAt: fullUser.created_at,
                  updatedAt: fullUser.updated_at,
                  userMetadata: fullUser.user_metadata ?? {},
                  appMetadata: {
                    role: fullUser.app_metadata?.role ?? "user",
                    provider: fullUser.app_metadata?.provider ?? "email",
                  },
                },
              },
            },
            { status: 200 },
          );
        } catch (err) {
          console.error("[GET /api/v1/auth/me] Unexpected error:", err);
          return Response.json(
            { success: false, error: "Internal Server Error", message: "An unexpected error occurred." },
            { status: 500 },
          );
        }
      },
    },
  },
});
