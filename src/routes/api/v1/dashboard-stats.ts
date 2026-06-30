import { createFileRoute } from "@tanstack/react-router";
import { createAdminClient } from "@/lib/supabase/admin.server";
import { createSecureHandler } from "@/lib/security/global-middleware.server";

export const Route = createFileRoute("/api/v1/dashboard-stats")({
  server: {
    handlers: {
      GET: createSecureHandler(async ({ userId, role }) => {
        const admin = createAdminClient();
        const isAdmin = role === "admin" || role === "security_admin";

        // Helper to conditionally apply user_id filter
        const scopeQuery = (query: any) => isAdmin ? query : query.eq("user_id", userId);

        const [
          totalRes,
          blockedRes,
          activeRoutesRes,
          recentLogsRes,
          hourlyRes,
        ] = await Promise.all([
          // Total requests
          scopeQuery(admin.from("audit_logs").select("*", { count: "exact", head: true })),

          // Blocked bots
          scopeQuery(
            admin
              .from("audit_logs")
              .select("*", { count: "exact", head: true })
              .eq("action", "BLOCKED")
          ),

          // Active routes
          scopeQuery(
            admin
              .from("links")
              .select("*", { count: "exact", head: true })
              .eq("active", true)
          ),

          // Recent 10 logs
          scopeQuery(
            admin
              .from("audit_logs")
              .select("id, ip_address, user_agent, bot_probability_score, action, created_at, user_id")
              .order("created_at", { ascending: false })
              .limit(10)
          ),

          // Last 24h hourly breakdown
          scopeQuery(
            admin
              .from("audit_logs")
              .select("created_at, action, bot_probability_score")
              .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
              .order("created_at", { ascending: true })
          ),
        ]);

        const totalRequests = totalRes.count ?? 0;
        const botsBlocked = blockedRes.count ?? 0;
        const activeRoutes = activeRoutesRes.count ?? 0;
        const recentLogs = recentLogsRes.data ?? [];

        // Build hourly chart data (24 buckets, 0–23)
        const hourlyLogs = hourlyRes.data ?? [];
        const humanBuckets = new Array(24).fill(0);
        const botBuckets = new Array(24).fill(0);

        hourlyLogs.forEach((log) => {
          const hour = new Date(log.created_at).getHours();
          if (log.action === "BLOCKED") {
            botBuckets[hour]++;
          } else {
            humanBuckets[hour]++;
          }
        });

        // Avg ML score from recent 100 logs
        const avgMlScore =
          recentLogs.length > 0
            ? recentLogs.reduce((sum: number, l: any) => sum + (l.bot_probability_score ?? 0), 0) /
              recentLogs.length
            : 0;

        // Previous hour comparison for percentage change (rough estimate)
        const now = new Date();
        const currentHour = now.getHours();
        const prevHour = (currentHour - 1 + 24) % 24;
        const currTotal = humanBuckets[currentHour] + botBuckets[currentHour];
        const prevTotal = humanBuckets[prevHour] + botBuckets[prevHour];
        const trafficChange =
          prevTotal > 0 ? Math.round(((currTotal - prevTotal) / prevTotal) * 100 * 10) / 10 : 0;

        return Response.json({
          success: true,
          data: {
            stats: {
              totalRequests,
              botsBlocked,
              activeRoutes,
              avgMlScore: Math.round(avgMlScore * 100),
              trafficChange,
            },
            recentLogs,
            chart: {
              human: humanBuckets,
              bot: botBuckets,
            },
          },
        });
      }),
    },
  },
});
