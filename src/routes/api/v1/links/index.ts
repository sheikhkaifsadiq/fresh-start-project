/**
 * @file src/routes/api/v1/links/index.ts
 * @description POST /api/v1/links — port of the legacy Next.js route
 * (legacy/compliance-link-router/src/app/api/v1/links/route.ts).
 * Same request body, same response shape, same Supabase admin insert.
 */

import { createFileRoute } from "@tanstack/react-router";
import { createAdminClient } from "@/lib/supabase/admin.server";

export const Route = createFileRoute("/api/v1/links/")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
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

          const admin = createAdminClient();
          const finalSlug =
            slug && String(slug).length > 0
              ? String(slug)
              : Math.random().toString(36).substring(2, 8);

          // Default placeholder user_id — preserved exactly from legacy route.
          const userId = "00000000-0000-0000-0000-000000000000";

          const { data, error } = await (admin as any)
            .from("links")
            .insert({
              destination_url,
              slug: finalSlug,
              user_id: userId,
              active: true,
              expires_at: expires_at || null,
              password_protected: password_protected || false,
              password: password || null,
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
        } catch (error) {
          console.error("Error in POST /api/v1/links:", error);
          return Response.json(
            { success: false, message: "Internal server error" },
            { status: 500 },
          );
        }
      },
    },
  },
});
