/**
 * @file src/routes/_authenticated/dashboard.tsx
 * @description Operator dashboard — first authenticated surface.
 * Editorial layout, no decorative motion. Hero metric ▸ supporting
 * ledger ▸ system status ▸ next moves. Real data wires later; numbers
 * here are intentionally typographic placeholders until live telemetry
 * is connected. Functionality and API contracts are unchanged.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — AegisRoute" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const first = user?.fullName?.split(" ")[0] ?? "operator";
  const [now, setNow] = useState(() => stamp());

  useEffect(() => {
    const t = setInterval(() => setNow(stamp()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/v1/dashboard-stats");
      if (!res.ok) throw new Error("Failed to load stats");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const stats = data?.data?.stats;
  const totalRequests = stats?.totalRequests ?? 0;
  const botsBlocked = stats?.botsBlocked ?? 0;
  const activeRoutes = stats?.activeRoutes ?? 0;
  const avgMlScore = stats?.avgMlScore ?? 0;

  const LEDGER_LIVE = [
    { label: "Links routed",    value: isLoading ? "—" : String(totalRequests), foot: totalRequests === 0 ? "Awaiting first issue" : "Total requests processed" },
    { label: "Threats blocked", value: isLoading ? "—" : String(botsBlocked),   foot: botsBlocked === 0 ? "ML idle" : "Bot requests stopped" },
    { label: "Active links",    value: isLoading ? "—" : String(activeRoutes),  foot: activeRoutes === 0 ? "Warming POPs" : "Currently live" },
    { label: "Avg bot score",   value: isLoading ? "—" : `${avgMlScore}%`,      foot: "ML confidence" },
  ];

  const SIDE_LIVE = [
    { k: "Median decision", v: "< 35ms" },
    { k: "Threats stopped", v: isLoading ? "—" : String(botsBlocked) },
    { k: "Active regions", v: "38 / 38" },
    { k: "Policy version",  v: "v0 · default" },
  ];

  return (
    <AppShell
      title={`${greetingFor(new Date().getHours())}, ${first}.`}
      kicker={`SESSION · ${now} · OPERATOR CONSOLE`}
    >
      {/* ─────────────────────────── hero metric */}
      <section className="ds-hero">
        <div className="ds-hero-l">
          <div className="ds-kicker">Last 24 hours</div>
          <div className="ds-hero-figure">
            <span className="ds-hero-num">{isLoading ? "—" : totalRequests}</span>
            <span className="ds-hero-unit">requests routed</span>
          </div>
          <p className="ds-hero-note">
            {totalRequests === 0 
              ? "Your edge mesh is online and idle. The first short link you create will start the verdict stream." 
              : "Your edge mesh is actively evaluating and routing traffic across the global network."}
          </p>
        </div>
        <dl className="ds-hero-side">
          {SIDE_LIVE.map((s) => (
            <div className="ds-side-row" key={s.k}>
              <dt>{s.k}</dt>
              <dd>{s.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <hr className="ds-rule" />

      {/* ─────────────────────────── ledger */}
      <section className="ds-ledger">
        <header className="ds-section-head">
          <div className="ds-kicker">Today · Ledger</div>
          <h2 className="ds-section-title">
            {totalRequests === 0 ? "Nothing inspected yet." : "Live telemetry feed active."}
          </h2>
        </header>
        <div className="ds-ledger-grid">
          {LEDGER_LIVE.map((m) => (
            <article className="ds-ledger-cell" key={m.label}>
              <div className="ds-cell-label">{m.label}</div>
              <div className="ds-cell-value">{m.value}</div>
              <div className="ds-cell-foot">{m.foot}</div>
            </article>
          ))}
        </div>
      </section>

      <hr className="ds-rule" />

      {/* ─────────────────────────── status + next moves */}
      <section className="ds-split">
        <div>
          <div className="ds-kicker">System</div>
          <h2 className="ds-section-title">All edge regions reporting.</h2>
          <ul className="ds-status">
            {STATUS.map((s) => (
              <li key={s.k}>
                <span className={`ds-dot ds-dot-${s.tone}`} aria-hidden />
                <span className="ds-status-k">{s.k}</span>
                <span className="ds-status-v">{s.v}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="ds-kicker">Next moves</div>
          <h2 className="ds-section-title">Three steps to first verdict.</h2>
          <ol className="ds-steps">
            <li><span className="ds-step-n">01</span><div><strong>Create a short link.</strong><span>Issue a routed URL from the Links console.</span></div></li>
            <li><span className="ds-step-n">02</span><div><strong>Tune routing.</strong><span>Open Rules to set thresholds, geo, and device policy.</span></div></li>
            <li><span className="ds-step-n">03</span><div><strong>Watch verdicts roll in.</strong><span>Analytics streams every decision the moment it lands.</span></div></li>
          </ol>
        </div>
      </section>
    </AppShell>
  );
}

function greetingFor(h: number) {
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function stamp() {
  return new Date().toISOString().slice(11, 19) + "Z";
}

const STATUS: { k: string; v: string; tone: "ok" | "warn" | "off" }[] = [
  { k: "Edge mesh",     v: "38 regions · healthy", tone: "ok" },
  { k: "ML engine",     v: "online · idle",        tone: "ok" },
  { k: "Reputation DB", v: "synced 12s ago",       tone: "ok" },
  { k: "Outbound DNS",  v: "operational",          tone: "ok" },
];
