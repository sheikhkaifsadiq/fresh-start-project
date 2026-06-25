/**
 * @file src/routes/_authenticated/dashboard.tsx
 * @description Operator dashboard landing — first authenticated page in
 * the migrated console. Live telemetry surface using the same motion
 * grammar as the public site.
 */

import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { Mask } from "@/lib/motion";
import { useAuthStore } from "@/lib/stores/auth-store";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — AegisRoute" }],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const greeting = greetingFor(new Date().getHours());
  const name = user?.fullName?.split(" ")[0] ?? "operator";

  return (
    <AppShell title={`${greeting}, ${name}.`} kicker={`REQ · ${new Date().toISOString().slice(0, 19)}Z · session live`}>
      <div className="dash-grid">
        {METRICS.map((m, i) => (
          <Mask key={m.label} delay={120 + i * 80}>
            <article className="dash-card">
              <div className="dash-card-label">{m.label}</div>
              <div className="dash-card-value">{m.value}</div>
              <div className="dash-card-foot">{m.foot}</div>
            </article>
          </Mask>
        ))}
      </div>

      <Mask delay={520}>
        <section className="dash-panel">
          <div className="kicker">Next steps</div>
          <ul className="dash-todo">
            <li>Create your first short link in <em>Links</em>.</li>
            <li>Open <em>Rules</em> to tune routing and threat thresholds.</li>
            <li>Watch <em>Analytics</em> to see verdicts roll in live.</li>
          </ul>
        </section>
      </Mask>
    </AppShell>
  );
}

function greetingFor(h: number) {
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const METRICS = [
  { label: "Links routed · 24h", value: "—", foot: "Awaiting first link" },
  { label: "Threats intercepted", value: "—", foot: "ML engine idle" },
  { label: "Avg edge latency", value: "—", foot: "POPs warming" },
  { label: "Active rules", value: "—", foot: "Default policy" },
];
