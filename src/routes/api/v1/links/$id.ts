/**
 * @file src/routes/api/v1/links/$id.ts
 * @description DELETE and PUT /api/v1/links/:id — 1:1 port of the legacy
 * Next.js dynamic route. Same admin-client mutations, same payload shape.
 */

import { createFileRoute } from "@tanstack/react-router";
import { createAdminClient } from "@/lib/supabase/admin.server";

export const Route = createFileRoute("/api/v1/links/$id")({
  server: {
    handlers: {
      DELETE: async ({ params }) => {
        try {
          const { id } = params;
          if (!id) {
            return Response.json(
              { success: false, message: "Link ID is required" },
              { status: 400 },
            );
          }
          const admin = createAdminClient();
          const { error } = await (admin as any).from("links").delete().eq("id", id);
          if (error) {
            console.error("Error deleting link:", error);
            return Response.json(
              { success: false, message: "Failed to delete link" },
              { status: 500 },
            );
          }
          return Response.json({ success: true });
        } catch (error) {
          console.error("Error in DELETE /api/v1/links/[id]:", error);
          return Response.json(
            { success: false, message: "Internal server error" },
            { status: 500 },
          );
        }
      },

      PUT: async ({ params, request }) => {
        try {
          const { id } = params;
          if (!id) {
            return Response.json(
              { success: false, message: "Link ID is required" },
              { status: 400 },
            );
          }
          const body = await request.json();
          const { active } = body ?? {};
          const admin = createAdminClient();
          const { data, error } = await (admin as any)
            .from("links")
            .update({ active })
            .eq("id", id)
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
        } catch (error) {
          console.error("Error in PUT /api/v1/links/[id]:", error);
          return Response.json(
            { success: false, message: "Internal server error" },
            { status: 500 },
          );
        }
      },
    },
  },
});
