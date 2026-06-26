/**
 * @file src/routes/_authenticated/security.tsx
 * @description Security / Threat Intelligence console. Composition of
 * shared ds-* primitives. No bespoke per-page styling.
 */

import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";

export const Route = createFileRoute("/_authenticated/security")({
  head: () => ({ meta: [{ title: "Security — AegisRoute" }] }),
  component: SecurityPage,
});

function SecurityPage() {
  return (
    <AppShell title="Security." kicker="POSTURE · RULES · INTELLIGENCE">
      <section className="ds-hero">
        <div className="ds-hero-l">
          <div className="ds-kicker">Posture score</div>
          <div className="ds-hero-figure">
            <span className="ds-hero-num">A</span>
            <span className="ds-hero-unit">excellent</span>
          </div>
          <p className="ds-hero-note">
            All advisory checks pass. ML threat model is online, reputation
            graph synced, edge rules enforced in 38 regions.
          </p>
        </div>
        <dl className="ds-hero-side">
          {[
            { k: "Blocked · 24h", v: "0" },
            { k: "Rate-limited",  v: "0" },
            { k: "Suspicious",    v: "0" },
            { k: "Reputation DB", v: "synced 12s" },
          ].map((s) => (<div className="ds-side-row" key={s.k}><dt>{s.k}</dt><dd>{s.v}</dd></div>))}
        </dl>
      </section>

      <hr className="ds-rule" />

      <section>
        <div className="ds-kicker">Today · Ledger</div>
        <h2 className="ds-section-title">Threat surface.</h2>
        <div className="ds-ledger-grid" style={{ marginTop: 24 }}>
          {[
            { label: "Bot traffic",      value: "0%",    foot: "vs. human" },
            { label: "Reputation hits",  value: "0",     foot: "Known-bad sources" },
            { label: "Geo anomalies",    value: "0",     foot: "Outside expected band" },
            { label: "Rate-limit trips", value: "0",     foot: "Per-IP throttle" },
          ].map((m) => (
            <article key={m.label} className="ds-ledger-cell">
              <div className="ds-cell-label">{m.label}</div>
              <div className="ds-cell-value">{m.value}</div>
              <div className="ds-cell-foot">{m.foot}</div>
            </article>
          ))}
        </div>
      </section>

      <hr className="ds-rule" />

      <section className="ds-grid-2">
        <div>
          <div className="ds-kicker">Active rules</div>
          <h2 className="ds-section-title">Edge enforcement.</h2>
          <ul className="ds-status">
            {[
              { k: "Bot mitigation", v: "ML · v2.3.1", tone: "ok" as const },
              { k: "Geo policy",     v: "default · allow all", tone: "ok" as const },
              { k: "Rate limit",     v: "120 rpm / IP", tone: "ok" as const },
              { k: "TLS minimum",    v: "1.3", tone: "ok" as const },
            ].map((s) => (
              <li key={s.k}><span className={`ds-dot ds-dot-${s.tone}`} aria-hidden />
                <span className="ds-status-k">{s.k}</span>
                <span className="ds-status-v">{s.v}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="ds-kicker">Threat intelligence</div>
          <h2 className="ds-section-title">Recent signals.</h2>
          <div className="ds-empty" style={{ marginTop: 16 }}>
            <div className="ds-empty-title">No active threats observed.</div>
            <div className="ds-empty-note">
              Signals from the reputation graph and ML detector will surface
              here the moment a request triggers a non-allow verdict.
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
