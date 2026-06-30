/**
 * @file src/routes/api/v1/links/index.ts
 * @description POST /api/v1/links — creates a new short link.
 *
 * Security fixes applied:
 *  - Requires valid Supabase session JWT (requireAuth).
 *  - Assigns link to the authenticated user_id, not a placeholder UUID.
 *  - Hashes password with SHA-256 before storing; never stores plaintext.
 */

import { createFileRoute } from "@tanstack/react-router";
import { createAdminClient } from "@/lib/supabase/admin.server";
import { hashPassword } from "@/lib/auth/password.server";
import { validateUrl } from "@/lib/security/url-validator";
import { createSecureHandler } from "@/lib/security/global-middleware.server";

export const Route = createFileRoute("/api/v1/links/")(({
  server: {
    handlers: {
      POST: createSecureHandler(async ({ request, userId }) => {
        const body = await request.json(); // Safely handled by wrapper
        const {
          destination_url,
          slug,
          expires_at,
          password_protected,
          password,
          ml_sensitivity,
        } = body ?? {};

        if (!destination_url) {
          return Response.json(
            { success: false, message: "Destination URL is required" },
            { status: 400 },
          );
        }

        try {
          validateUrl(destination_url);
        } catch (validationErr: any) {
          return Response.json(
            { success: false, message: validationErr.message },
            { status: 400 },
          );
        }

        const admin = createAdminClient();
        const finalSlug =
          slug && String(slug).length > 0
            ? String(slug)
            : Math.random().toString(36).substring(2, 8);

        // 🔒 Hash the password using PBKDF2 — never store plaintext
        const passwordHash =
          password_protected && password
            ? await hashPassword(String(password))
            : null;

        const { data, error } = await (admin as any)
          .from("links")
          .insert({
            destination_url,
            slug: finalSlug,
            user_id: userId,          // 🔒 authenticated owner
            active: true,
            expires_at: expires_at || null,
            password_protected: password_protected || false,
            password: passwordHash,   // 🔒 hashed, never plaintext
            ml_sensitivity: ml_sensitivity ?? 0.5,
          })
          .select()
          .single();

        if (error) {
          if ((error as { code?: string }).code === "23505") {
            return Response.json(
              { success: false, message: "Slug is already taken" },
              { status: 409 },
            );
          }
          console.error("Error creating link:", error);
          return Response.json(
            { success: false, message: "Failed to create link" },
            { status: 500 },
          );
        }

        return Response.json({ success: true, data }, { status: 201 });
      }),
    },
  },
} as any));
