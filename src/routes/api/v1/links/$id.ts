/**
 * @file src/routes/api/v1/links/$id.ts
 * @description DELETE and PUT /api/v1/links/:id
 *
 * Security fixes applied:
 *  - Requires valid Supabase session JWT (requireAuth).
 *  - Scopes DELETE and PUT to the authenticated user's own links only
 *    (adds .eq("user_id", userId) to every mutation).
 */

import { createFileRoute } from "@tanstack/react-router";
import { createAdminClient } from "@/lib/supabase/admin.server";
import { createSecureHandler } from "@/lib/security/global-middleware.server";

export const Route = createFileRoute("/api/v1/links/$id")(({
  server: {
    handlers: {
      DELETE: createSecureHandler(async ({ params, userId }) => {
        const { id } = params;
        if (!id) {
          return Response.json(
            { success: false, message: "Link ID is required" },
            { status: 400 },
          );
        }
        const admin = createAdminClient();
        // 🔒 Scope to authenticated user's own link — prevents deleting other users' links
        const { error } = await (admin as any)
          .from("links")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);

        if (error) {
          console.error("Error deleting link:", error);
          return Response.json(
            { success: false, message: "Failed to delete link" },
            { status: 500 },
          );
        }
        return Response.json({ success: true });
      }),

      PUT: createSecureHandler(async ({ params, request, userId }) => {
        const { id } = params;
        if (!id) {
          return Response.json(
            { success: false, message: "Link ID is required" },
            { status: 400 },
          );
        }
        const body = await request.json(); // Safe wrapper
        const { active } = body ?? {};
        const admin = createAdminClient();
        
        // 🔒 Scope to authenticated user's own link
        const { data, error } = await (admin as any)
          .from("links")
          .update({ active })
          .eq("id", id)
          .eq("user_id", userId)
          .select()
          .single();

        if (error) {
          console.error("Error updating link:", error);
          return Response.json(
            { success: false, message: "Failed to update link" },
            { status: 500 },
          );
        }
        return Response.json({ success: true, data });
      }),
    },
  },
} as any));
