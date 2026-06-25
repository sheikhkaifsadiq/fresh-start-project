import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import StatsGrid from "@/components/dashboard/StatsGrid";
import TrafficChart from "@/components/dashboard/TrafficChart";
import SecurityPosture from "@/components/dashboard/SecurityPosture";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { MLScoreGauge } from "@/components/dashboard/MLScoreGauge";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Dashboard",
};

export interface DashboardStats {
  totalRequests: number;
  botsBlocked: number;
  activeRoutes: number;
  avgMlScore: number;
  trafficChange: number;
  humanBuckets: number[];
  botBuckets: number[];
  recentLogs: RecentLog[];
}

export interface RecentLog {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  bot_probability_score: number | null;
  action: string | null;
  created_at: string;
  user_id: string | null;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const admin = createAdminClient();

    const [totalRes, blockedRes, activeRoutesRes, recentLogsRes, hourlyRes] =
      await Promise.all([
        admin.from("audit_logs").select("*", { count: "exact", head: true }),
        admin
          .from("audit_logs")
          .select("*", { count: "exact", head: true })
          .eq("action", "BLOCKED"),
        admin
          .from("links")
          .select("*", { count: "exact", head: true })
          .eq("active", true),
        admin
          .from("audit_logs")
          .select(
            "id, ip_address, user_agent, bot_probability_score, action, created_at, user_id"
          )
          .order("created_at", { ascending: false })
          .limit(10),
        admin
          .from("audit_logs")
          .select("created_at, action, bot_probability_score")
          .gte(
            "created_at",
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          )
          .order("created_at", { ascending: true }),
      ]);

    const totalRequests = totalRes.count ?? 0;
    const botsBlocked = blockedRes.count ?? 0;
    const activeRoutes = activeRoutesRes.count ?? 0;
    const recentLogs = (recentLogsRes.data ?? []) as RecentLog[];

    type HourlyLog = { created_at: string; action: string | null; bot_probability_score: number | null };
    const humanBuckets = new Array(24).fill(0);
    const botBuckets = new Array(24).fill(0);

    (hourlyRes.data as HourlyLog[] ?? []).forEach((log: HourlyLog) => {
      const hour = new Date(log.created_at).getHours();
      if (log.action === "BLOCKED") botBuckets[hour]++;
      else humanBuckets[hour]++;
    });

    const avgMlScore =
      recentLogs.length > 0
        ? recentLogs.reduce(
            (sum, l) => sum + (l.bot_probability_score ?? 0),
            0
          ) / recentLogs.length
        : 0;

    const currentHour = new Date().getHours();
    const prevHour = (currentHour - 1 + 24) % 24;
    const currTotal = humanBuckets[currentHour] + botBuckets[currentHour];
    const prevTotal = humanBuckets[prevHour] + botBuckets[prevHour];
    const trafficChange =
      prevTotal > 0
        ? Math.round(((currTotal - prevTotal) / prevTotal) * 100 * 10) / 10
        : 0;

    return {
      totalRequests,
      botsBlocked,
      activeRoutes,
      avgMlScore: Math.round(avgMlScore * 100),
      trafficChange,
      humanBuckets,
      botBuckets,
      recentLogs,
    };
  } catch (err) {
    console.error("[DashboardPage] Failed to fetch stats:", err);
    return {
      totalRequests: 0,
      botsBlocked: 0,
      activeRoutes: 0,
      avgMlScore: 0,
      trafficChange: 0,
      humanBuckets: new Array(24).fill(0),
      botBuckets: new Array(24).fill(0),
      recentLogs: [],
    };
  }
}

export default async function DashboardPage() {
  const stats = await fetchDashboardStats();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Mission Control
          </h1>
          <p className="text-sm text-foreground/40 mt-1">
            Compliance-shielded routing engine — live status
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/30 font-mono">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="text-xs text-white/20 font-mono mt-0.5">
            {stats.totalRequests > 0 ? "● Live Data" : "● Awaiting traffic"}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <StatsGrid stats={stats} />

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TrafficChart humanData={stats.humanBuckets} botData={stats.botBuckets} />
        </div>
        <div>
          <MLScoreGauge initialScore={stats.avgMlScore / 100} />
        </div>
      </div>

      {/* Activity + security */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <RecentActivity logs={stats.recentLogs} />
        </div>
        <div className="lg:col-span-2">
          <SecurityPosture />
        </div>
      </div>
    </div>
  );
}
