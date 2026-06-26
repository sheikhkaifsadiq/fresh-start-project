/**
 * @file src/routes/_authenticated/analytics.tsx
 * @description Analytics console. Editorial layout — hero verdict total,
 * supporting strip, verdict log table, top links. All numbers placeholder
 * until live telemetry is wired; the chart shape and table structure are
 * the contracts the legacy AnalyticsDashboard already supplied.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — AegisRoute" }] }),
  component: AnalyticsPage,
});

const RANGES = ["1H", "24H", "7D", "30D"] as const;
type Range = (typeof RANGES)[number];

function AnalyticsPage() {
  const [range, setRange] = useState<Range>("24H");

  const bars = useMemo(() => {
    const n = range === "1H" ? 60 : range === "24H" ? 48 : range === "7D" ? 56 : 60;
    return Array.from({ length: n }, (_, i) => 0.15 + Math.abs(Math.sin(i * 0.42 + range.length)) * 0.85);
  }, [range]);

  return (
    <AppShell title="Analytics." kicker="VERDICT · TIMELINE · ATTRIBUTION">
      <section className="ds-toolbar">
        <div className="ds-toolbar-l">
          <span className="ds-field-label">Range</span>
          {RANGES.map((r) => (
            <button
              key={r}
              className={`ds-tab${r === range ? " is-active" : ""}`}
              style={{ padding: "8px 12px", marginBottom: 0 }}
              onClick={() => setRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="ds-toolbar-r">
          <button className="ds-btn ds-btn-quiet ds-btn-sm">Export CSV</button>
          <button className="ds-btn ds-btn-sm">Share view</button>
        </div>
      </section>

      <section className="ds-hero">
        <div className="ds-hero-l">
          <div className="ds-kicker">{range} · Verdicts issued</div>
          <div className="ds-hero-figure">
            <span className="ds-hero-num">0</span>
            <span className="ds-hero-unit">decisions</span>
          </div>
          <p className="ds-hero-note">
            The verdict stream is quiet. The first short link routed will populate
            this chart in real time.
          </p>
        </div>
        <dl className="ds-hero-side">
          {[
            { k: "Median p50", v: "—" },
            { k: "p95", v: "—" },
            { k: "Allow rate", v: "—" },
            { k: "Block rate", v: "—" },
          ].map((s) => (
            <div className="ds-side-row" key={s.k}><dt>{s.k}</dt><dd>{s.v}</dd></div>
          ))}
        </dl>
      </section>

      <section className="ds-panel">
        <div className="ds-panel-head">
          <h2 className="ds-panel-title">Throughput</h2>
          <span className="ds-badge ds-badge-quiet">{range} · UTC</span>
        </div>
        <div className="ds-bars" aria-hidden>
          {bars.map((h, i) => (<span key={i} style={{ height: `${h * 100}%` }} />))}
        </div>
      </section>

      <hr className="ds-rule" />

      <section className="ds-grid-2">
        <div>
          <div className="ds-kicker">Top routed links</div>
          <h2 className="ds-section-title">No links inspected yet.</h2>
          <div className="ds-table-wrap">
            <table className="ds-table ds-table-cards" style={{ marginTop: 18 }}>
              <thead>
                <tr><th>Slug</th><th>Destination</th><th className="num">Clicks</th><th className="num">Block %</th></tr>
              </thead>
              <tbody>
                <tr><td colSpan={4}><div className="ds-empty" style={{ padding: 32 }}>
                  <div className="ds-empty-title">Awaiting first click.</div>
                  <div className="ds-empty-note">Issue a short link, share it, and verdicts will appear here within seconds.</div>
                </div></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="ds-kicker">Verdict ledger</div>
          <h2 className="ds-section-title">Live decisions.</h2>
          <div className="ds-table-wrap">
            <table className="ds-table ds-table-cards" style={{ marginTop: 18 }}>
              <thead>
                <tr><th>Time</th><th>Slug</th><th>Verdict</th><th>Reason</th></tr>
              </thead>
              <tbody>
                <tr><td colSpan={4} className="muted" style={{ padding: 32, textAlign: "center" }}>
                  — no verdicts in the last {range.toLowerCase()} —
                </td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
