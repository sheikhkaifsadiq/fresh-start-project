/**
 * @file src/components/site/tablet/TabletLanding.tsx
 * @description Tablet composition (721–1024px). NOT the desktop cinematic
 * with smaller padding, and NOT the mobile vertical stack stretched wide.
 * Its own layout: split hero (wordmark + live pipeline card side-by-side),
 * horizontal pipeline rail you can swipe, two-column threat/network row,
 * sticky bottom CTA bar.
 *
 * Why no WebGL: tablets often run on iPad-class GPUs and the cinematic
 * RoutingField + globe cost more than they're worth on a one-page visit.
 * Motion is restrained: data movement only, no parallax framing.
 */

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuthStore } from "@/lib/stores/auth-store";

/* ─────────────────────────────────────────── top bar */
function TBar() {
  return (
    <header className="t-bar">
      <div className="t-bar-brand">AegisRoute</div>
      <nav className="t-bar-nav">
        <a href="#pipeline">Pipeline</a>
        <a href="#threat">Threat</a>
        <a href="#network">Network</a>
        <Link to="/auth" className="t-bar-cta">Sign in →</Link>
      </nav>
    </header>
  );
}

/* ─────────────────────────────────────────── hero */
const STAGES = [
  { name: "Incoming", meta: "aegis.to/q4-launch" },
  { name: "Inspect",  meta: "fingerprint · ASN" },
  { name: "Score",    meta: "0.04 · safe" },
  { name: "Decide",   meta: "ALLOW" },
  { name: "Route",    meta: "→ SFO-04 · 11.4ms" },
];

function THero() {
  const isAuthed = useAuthStore((s) => s.isAuthenticated);
  const cta = isAuthed
    ? { href: "/dashboard", label: "Open dashboard" }
    : { href: "/auth", label: "Route securely" };

  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive((s) => (s + 1) % STAGES.length), 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="t-hero">
      <div className="t-hero-l">
        <div className="t-kicker">AEGISROUTE · v3 · LIVE</div>
        <h1 className="t-wordmark">
          <span>AEGIS</span>
          <span className="is-italic">ROUTE</span>
        </h1>
        <p className="t-lede">
          Edge-routed URL shortening with AI threat detection and real-time
          analytics. Every redirect inspected and decided in under 12ms.
        </p>
        <div className="t-cta-row">
          <Link to={cta.href} className="t-cta-primary">{cta.label} →</Link>
          <a href="#pipeline" className="t-cta-quiet">See the pipeline</a>
        </div>
        <div className="t-status">
          <span className="t-status-dot" /> all 38 regions healthy · 11.4ms median
        </div>
      </div>

      <aside className="t-hero-r" aria-label="Live routing pipeline">
        <div className="t-card">
          <div className="t-card-head">
            <span>LIVE PIPELINE</span>
            <span>aegis.to/q4-launch</span>
          </div>
          <ol className="t-card-list">
            {STAGES.map((s, i) => {
              const state = i < active ? "done" : i === active ? "live" : "idle";
              return (
                <li key={s.name} className={`t-card-step is-${state}`}>
                  <span className="t-card-bullet" />
                  <span className="t-card-name">
                    <span className="t-card-num">0{i + 1}</span> {s.name}
                  </span>
                  <span className="t-card-meta">{s.meta}</span>
                </li>
              );
            })}
          </ol>
          <div className="t-card-foot">verdict · ALLOW · 11.4ms · SFO-04</div>
        </div>
      </aside>
    </section>
  );
}

/* ─────────────────────────────────────────── pipeline rail (horizontal) */
const PSTAGES = [
  { n: "01", name: "Ingest",  note: "UA · ASN · geo · fingerprint · intent." },
  { n: "02", name: "Inspect", note: "19 behavioural and reputation models." },
  { n: "03", name: "Score",   note: "Confidence 0 → 1, full attribution." },
  { n: "04", name: "Decide",  note: "Allow · challenge · sink. Your policy." },
  { n: "05", name: "Route",   note: "Acted on at the nearest POP." },
];

function TPipeline() {
  return (
    <section id="pipeline" className="t-section">
      <div className="t-kicker">02 · The pipeline</div>
      <h2 className="t-h2">
        Five stages. <span className="is-italic">Twelve milliseconds.</span>
      </h2>
      <p className="t-lede" style={{ maxWidth: 560 }}>
        One coherent decision path. Swipe to read every stage; the verdict
        leaves the edge before a slow page would render.
      </p>
      <ol className="t-rail" role="list">
        {PSTAGES.map((s) => (
          <li key={s.n} className="t-rail-card">
            <div className="t-rail-n">{s.n}</div>
            <div className="t-rail-name">{s.name}</div>
            <p className="t-rail-note">{s.note}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ─────────────────────────────────────────── threat + network row */
function TThreatNetwork() {
  return (
    <section id="threat" className="t-section">
      <div className="t-two">
        <div>
          <div className="t-kicker">03 · Why it matters</div>
          <h2 className="t-h2">
            A short link is a <span className="is-italic">blind redirect.</span>
          </h2>
          <p className="t-lede">
            Without inspection, you forward attackers as eagerly as customers.
            Phishing, scrapers, credential stuffing — all wrapped in
            trusted-looking URLs.
          </p>
          <div className="t-stat-card">
            <div className="t-stat-figure">38%</div>
            <div className="t-stat-label">
              of shortened-link clicks in 2025 carried automated or hostile signals.
            </div>
          </div>
        </div>

        <div id="network">
          <div className="t-kicker">04 · Global network</div>
          <h2 className="t-h2">
            Routed at the edge. <span className="is-italic">Closer to the request.</span>
          </h2>
          <div className="t-net-grid">
            <div>
              <div className="t-net-num">38</div>
              <div className="t-net-lab">edge regions</div>
            </div>
            <div>
              <div className="t-net-num">12<span className="t-net-unit">ms</span></div>
              <div className="t-net-lab">median decision</div>
            </div>
            <div>
              <div className="t-net-num">99.97<span className="t-net-unit">%</span></div>
              <div className="t-net-lab">availability · 12 mo</div>
            </div>
          </div>
          <div className="t-routes" aria-hidden>
            <svg viewBox="0 0 600 80" preserveAspectRatio="none" width="100%" height="80">
              {Array.from({ length: 10 }).map((_, i) => {
                const x1 = (i / 9) * 600;
                const y1 = 40 + Math.sin(i * 1.2) * 22;
                const x2 = ((i + 1) / 9) * 600;
                const y2 = 40 + Math.sin((i + 1) * 1.2) * 22;
                return (
                  <g key={i}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
                    <circle cx={x1} cy={y1} r="2.5" fill="currentColor" />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────── sticky CTA bar */
function TCta() {
  const isAuthed = useAuthStore((s) => s.isAuthenticated);
  const cta = isAuthed
    ? { href: "/dashboard", label: "Open dashboard" }
    : { href: "/auth", label: "Route a link" };

  return (
    <section className="t-section t-finale">
      <div className="t-kicker">05 · Start routing</div>
      <h2 className="t-h2">
        Your next redirect, <span className="is-italic">inspected.</span>
      </h2>
      <p className="t-lede">
        Free during open beta. No card required. Live in under two minutes.
      </p>
      <Link to={cta.href} className="t-cta-primary">{cta.label} →</Link>
      <footer className="t-foot">
        <div>AegisRoute · 2026</div>
        <div>SOC 2 · ISO 27001 · GDPR</div>
        <div>hello@aegisroute.example</div>
      </footer>
    </section>
  );
}

/* ─────────────────────────────────────────── root */
export function TabletLanding() {
  return (
    <div className="t-root">
      <TBar />
      <main>
        <THero />
        <TPipeline />
        <TThreatNetwork />
        <TCta />
      </main>
    </div>
  );
}
