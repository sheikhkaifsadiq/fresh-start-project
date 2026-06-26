/**
 * @file src/components/site/mobile/Hero.tsx
 * @description Mobile hero — stacked AEGIS / ROUTE wordmark and the
 * vertical product timeline acting as the hero centrepiece.
 */

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuthStore } from "@/lib/stores/auth-store";

type Stage = { name: string; meta: string };
const STAGES: Stage[] = [
  { name: "Incoming", meta: "aegis.to/q4-launch" },
  { name: "Inspect",  meta: "fingerprint · ASN" },
  { name: "Score",    meta: "0.04 · safe" },
  { name: "Decide",   meta: "ALLOW" },
  { name: "Route",    meta: "→ SFO-04 · 11.4ms" },
];

export function MobileHero() {
  const isAuthed = useAuthStore((s) => s.isAuthenticated);
  const cta = isAuthed
    ? { href: "/dashboard", label: "Open dashboard" }
    : { href: "/auth", label: "Route securely" };

  return (
    <section className="m-hero">
      <div className="m-kicker">AEGISROUTE · v3 · LIVE</div>
      <h1 className="m-wordmark">
        <span>AEGIS</span>
        <span className="is-italic">ROUTE</span>
      </h1>
      <p className="m-lede">
        Protect every redirect before it reaches your users. Each link
        inspected, scored, and decided in under twelve milliseconds.
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
