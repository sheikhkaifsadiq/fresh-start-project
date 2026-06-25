/**
 * @file src/routes/api/v1/links/check-slug.ts
 * @description GET /api/v1/links/check-slug?slug=... — 1:1 port of the
 * legacy Next.js route. Returns `{ available: boolean }`.
 */

import { createFileRoute } from "@tanstack/react-router";
import { createAdminClient } from "@/lib/supabase/admin.server";

export const Route = createFileRoute("/api/v1/links/check-slug")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const slug = url.searchParams.get("slug");
          if (!slug) {
            return Response.json({ available: false }, { status: 400 });
          }

          const admin = createAdminClient();
          const { data, error } = await (admin as any)
            .from("links")
            .select("id")
            .eq("slug", slug)
            .single();

          if (error && (error as { code?: string }).code !== "PGRST116") {
            console.error("Error checking slug:", error);
            return Response.json({ available: false }, { status: 500 });
          }

          return Response.json({ available: !data });
        } catch (error) {
          console.error("Error in GET /api/v1/links/check-slug:", error);
          return Response.json({ available: false }, { status: 500 });
        }
      },
    },
  },
});
