import { createFileRoute } from "@tanstack/react-router";
import { createAdminClient } from "@/lib/supabase/admin.server";
import { AuditLogQuerySchema } from "@/lib/schemas";
import { ZodError } from "zod";

export const Route = createFileRoute("/api/v1/audit-logs")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Simplified auth for TanStack port.
        // In a real scenario, this would use a standard Web API auth middleware.
        const authHeader = request.headers.get("authorization");
        let token = "";
        if (authHeader && authHeader.startsWith("Bearer ")) {
          token = authHeader.slice(7).trim();
        }

        if (!token) {
          return Response.json(
            { success: false, error: "Unauthorized", message: "A valid Bearer token is required." },
            { status: 401 }
          );
        }

        const admin = createAdminClient();
        const { data: userData, error: userError } = await admin.auth.getUser(token);
        
        if (userError || !userData?.user) {
          return Response.json(
            { success: false, error: "Unauthorized", message: "Invalid token." },
            { status: 401 }
          );
        }

        const user = userData.user;
        const userRole = (user.app_metadata?.role as string | undefined) || (user.user_metadata?.role as string | undefined);
        const isAdmin = userRole === "admin";

        const url = new URL(request.url);
        const searchParams = url.searchParams;

        let query;
        try {
          query = AuditLogQuerySchema.parse({
            page: searchParams.get("page") ?? undefined,
            limit: searchParams.get("limit") ?? undefined,
            event_type: searchParams.get("event_type") ?? undefined,
            date_from: searchParams.get("date_from") ?? undefined,
            date_to: searchParams.get("date_to") ?? undefined,
            ip_address: searchParams.get("ip_address") ?? undefined,
          });
        } catch (err) {
          if (err instanceof ZodError) {
            return Response.json(
              {
                success: false,
                error: "Validation Error",
                message: "Invalid query parameters.",
                details: err.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
              },
              { status: 400 }
            );
          }
          return Response.json({ success: false, error: "Internal Error" }, { status: 500 });
        }

        try {
          const { page, limit } = query;
          const offset = (page - 1) * limit;

          let dbQuery = admin
            .from("audit_logs")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

          if (!isAdmin) {
            dbQuery = dbQuery.eq("user_id", user.id);
          }

          if (query.event_type) dbQuery = dbQuery.eq("event_type", query.event_type);
          if (query.ip_address) dbQuery = dbQuery.eq("ip_address", query.ip_address);
          if (query.date_from) dbQuery = dbQuery.gte("created_at", query.date_from);
          if (query.date_to) dbQuery = dbQuery.lte("created_at", query.date_to);

          const { data: logs, error, count } = await dbQuery;

          if (error) {
            console.error("[GET /api/v1/audit-logs] DB error:", error.message);
            return Response.json(
              { success: false, error: "Database Error", message: "Failed to retrieve logs." },
              { status: 500 }
            );
          }

          const total = count ?? 0;
          const totalPages = Math.ceil(total / limit);

          return Response.json({
            success: true,
            data: {
              logs: logs ?? [],
              filters: {
                event_type: query.event_type ?? null,
                date_from: query.date_from ?? null,
                date_to: query.date_to ?? null,
                ip_address: query.ip_address ?? null,
                scope: isAdmin ? "all" : "user",
              },
              pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
              },
            },
          });
        } catch (err) {
          console.error("[GET /api/v1/audit-logs] Error:", err);
          return Response.json(
            { success: false, error: "Internal Server Error", message: "Unexpected error." },
            { status: 500 }
          );
        }
      },
    },
  },
});
