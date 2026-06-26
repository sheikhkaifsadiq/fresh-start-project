/**
 * MobileLanding — dedicated phone composition for ≤720px.
 *
 * This is NOT the desktop landing made responsive. It is a second
 * interface designed for one-handed touch, built from the same tokens
 * and business logic. The desktop cinematic experience never renders
 * here: no RoutingField particles, no globe, no SectionGlyph, no
 * HandoffToken, no Scene camera framing.
 *
 * Sections (single narrative, ~half the scroll length of desktop):
 *   1. Hero            — stacked AEGIS / ROUTE wordmark, vertical
 *                        product timeline as the hero itself.
 *   2. Pipeline        — one vertical 5-stage timeline.
 *   3. Threat          — one focused card answering "why?".
 *   4. Network Summary — 38 regions / 12ms / 99.97% + routing strip.
 *   5. CTA + Footer    — primary action, sticky bottom action bar.
 */

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuthStore } from "@/lib/stores/auth-store";

/* ════════════ Hero ════════════ */
function MobileHero() {
  const isAuthed = useAuthStore((s) => s.isAuthenticated);
  const cta = isAuthed ? { href: "/dashboard", label: "Open dashboard" } : { href: "/auth", label: "Route securely" };
  return (
    <section className="m-hero">
      <div className="m-kicker">AEGISROUTE · v3 · LIVE</div>
      <h1 className="m-wordmark">
        <span>AEGIS</span>
        <span className="is-italic">ROUTE</span>
      </h1>
      <p className="m-lede">
        Protect every redirect before it reaches your users. Each link inspected,
        scored, and decided in under twelve milliseconds.
      </p>

      <MobileHeroTimeline />

      <Link to={cta.href} className="m-cta-primary">
        {cta.label} <span aria-hidden>→</span>
      </Link>
      <div className="m-status">
        <span className="m-status-dot" /> all 38 regions healthy · 11.4ms median
      </div>
    </section>
  );
}

/* ════════════ Hero timeline — vertical, self-running ════════════ */
type Stage = { name: string; meta: string };
const STAGES: Stage[] = [
  { name: "Incoming",  meta: "aegis.to/q4-launch" },
  { name: "Inspect",   meta: "fingerprint · ASN" },
  { name: "Score",     meta: "0.04 · safe" },
  { name: "Decide",    meta: "ALLOW" },
  { name: "Route",     meta: "→ SFO-04 · 11.4ms" },
];

function MobileHeroTimeline() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive((s) => (s + 1) % STAGES.length), 1400);
    return () => clearInterval(id);
  }, []);
  return (
    <ol className="m-timeline" aria-label="Live routing pipeline">
      {STAGES.map((s, i) => {
        const state = i < active ? "done" : i === active ? "live" : "idle";
        return (
          <li key={s.name} className={`m-step is-${state}`}>
            <span className="m-step-bullet" aria-hidden />
            <div className="m-step-body">
              <div className="m-step-name">
                <span className="m-step-num">0{i + 1}</span> {s.name}
              </div>
              <div className="m-step-meta">{s.meta}</div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ════════════ Section: Pipeline (long-form vertical) ════════════ */
function MobilePipeline() {
  const detail = [
    { name: "Ingest",   note: "Edge captures the request — UA, ASN, geo, fingerprint, intent." },
    { name: "Inspect",  note: "Signals fan out across 19 behavioural and reputation models." },
    { name: "Score",    note: "A single confidence number, 0 → 1, with full feature attribution." },
    { name: "Decide",   note: "Allow, challenge, or sink — policy you control, observable in real time." },
    { name: "Route",    note: "The verdict is acted on at the nearest POP. The request never leaves the edge unverified." },
  ];
  return (
    <section className="m-section">
      <div className="m-kicker">02 · The pipeline</div>
      <h2 className="m-h2">
        Five stages. <span className="is-italic">Twelve milliseconds.</span>
      </h2>
      <ol className="m-stages">
        {detail.map((s, i) => (
          <li key={s.name}>
            <div className="m-stage-num">0{i + 1}</div>
            <div>
              <div className="m-stage-name">{s.name}</div>
              <p className="m-stage-note">{s.note}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ════════════ Section: Threat ════════════ */
function MobileThreat() {
  return (
    <section className="m-section">
      <div className="m-kicker">03 · Why it matters</div>
      <h2 className="m-h2">
        Every shortened link is a <span className="is-italic">blind redirect.</span>
      </h2>
      <p className="m-lede">
        Without inspection, you forward attackers as eagerly as customers. Phishing,
        scrapers, credential stuffing — all wrapped in trusted-looking URLs.
      </p>
      <div className="m-stat-card">
        <div className="m-stat-figure">38%</div>
        <div className="m-stat-label">
          of clicks on shortened links in 2025 carried automated or hostile signals.
        </div>
      </div>
    </section>
  );
}

/* ════════════ Section: Network summary ════════════ */
function MobileNetwork() {
  return (
    <section className="m-section">
      <div className="m-kicker">04 · Global network</div>
      <h2 className="m-h2">
        Routed at the edge. <span className="is-italic">Closer to the request.</span>
      </h2>
      <div className="m-net-grid">
        <div>
          <div className="m-net-num">38</div>
          <div className="m-net-lab">edge regions</div>
        </div>
        <div>
          <div className="m-net-num">12<span className="m-net-unit">ms</span></div>
          <div className="m-net-lab">median decision</div>
        </div>
        <div>
          <div className="m-net-num">99.97<span className="m-net-unit">%</span></div>
          <div className="m-net-lab">availability · 12 mo</div>
        </div>
      </div>
      <RoutingStrip />
    </section>
  );
}

function RoutingStrip() {
  return (
    <div className="m-strip" aria-hidden>
      <svg viewBox="0 0 320 60" preserveAspectRatio="none" width="100%" height="60">
        {Array.from({ length: 7 }).map((_, i) => {
          const x1 = (i / 6) * 320;
          const y1 = 30 + Math.sin(i * 1.3) * 14;
          const x2 = ((i + 1) / 6) * 320;
          const y2 = 30 + Math.sin((i + 1) * 1.3) * 14;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="0.6" opacity="0.4" />;
        })}
        {Array.from({ length: 7 }).map((_, i) => {
          const x = (i / 6) * 320;
          const y = 30 + Math.sin(i * 1.3) * 14;
          return <circle key={i} cx={x} cy={y} r="2" fill="currentColor" />;
        })}
      </svg>
    </div>
  );
}

/* ════════════ Section: CTA + Footer ════════════ */
function MobileCta() {
  const isAuthed = useAuthStore((s) => s.isAuthenticated);
  const cta = isAuthed ? { href: "/dashboard", label: "Open dashboard" } : { href: "/auth", label: "Route a link" };
  return (
    <section className="m-cta">
      <div className="m-kicker">05 · Start routing</div>
      <h2 className="m-h2">
        Your next redirect, <span className="is-italic">inspected.</span>
      </h2>
      <p className="m-lede">
        Free during open beta. No card required. Live in under two minutes.
      </p>
      <Link to={cta.href} className="m-cta-primary">
        {cta.label} <span aria-hidden>→</span>
      </Link>
      <footer className="m-foot">
        <div>AegisRoute · 2026</div>
        <div>SOC 2 · ISO 27001 · GDPR</div>
        <div>hello@aegisroute.example</div>
      </footer>
    </section>
  );
}

/* ════════════ Top app bar — minimal ════════════ */
function MobileBar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="m-bar">
        <div className="m-bar-brand">AegisRoute</div>
        <button className="m-bar-burger" aria-label="Open menu" onClick={() => setOpen(true)}>
          <span /><span />
        </button>
      </div>
      <div className={`m-drawer ${open ? "is-open" : ""}`} onClick={() => setOpen(false)}>
        <aside className="m-drawer-panel" onClick={(e) => e.stopPropagation()}>
          <div className="m-drawer-head">
            <div className="m-bar-brand">AegisRoute</div>
            <button className="m-drawer-close" aria-label="Close menu" onClick={() => setOpen(false)}>×</button>
          </div>
          <nav>
            <a href="#pipeline" onClick={() => setOpen(false)}>Pipeline</a>
            <a href="#threat" onClick={() => setOpen(false)}>Threat</a>
            <a href="#network" onClick={() => setOpen(false)}>Network</a>
            <a href="#cta" onClick={() => setOpen(false)}>Start</a>
          </nav>
          <Link to="/auth" className="m-cta-primary" onClick={() => setOpen(false)}>
            Sign in <span aria-hidden>→</span>
          </Link>
        </aside>
      </div>
    </>
  );
}

/* ════════════ Root ════════════ */
export function MobileLanding() {
  return (
    <div className="m-root">
      <MobileBar />
      <main>
        <MobileHero />
        <div id="pipeline"><MobilePipeline /></div>
        <div id="threat"><MobileThreat /></div>
        <div id="network"><MobileNetwork /></div>
        <div id="cta"><MobileCta /></div>
      </main>
    </div>
  );
}
