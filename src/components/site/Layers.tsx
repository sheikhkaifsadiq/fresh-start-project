import { useEffect, useRef, useState } from "react";
import { SectionHead } from "./SectionHead";
import { useStage } from "../../lib/stage";

const ROWS = [
  { step: "01", ttl: "Detection",    desc: "Signature, fingerprint, and behavioural anomaly detection on every request.", v: 0.96 },
  { step: "02", ttl: "Verification", desc: "Adaptive challenges for ambiguous traffic — invisible to genuine users.",       v: 0.88 },
  { step: "03", ttl: "Mitigation",   desc: "Rate shaping, reputation throttling, and policy-driven denial at the edge.",    v: 0.92 },
  { step: "04", ttl: "Routing",      desc: "Clean traffic forwarded; abusive traffic sunk or rerouted, never to origin.",   v: 1.0  },
];

/**
 * Layers — each row stacks upward on scroll (z + shadow), coverage meter
 * fills as a *consequence* of the row landing. Defense, sequenced.
 */
export function Layers() {
  const stage = useStage();
  const wrap = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(0);

  useEffect(() => {
    return stage.subscribe(() => {
      const el = wrap.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // Progress from when section enters bottom to when it leaves top
      const raw = (vh - rect.top) / (vh + rect.height);
      setT(Math.min(1, Math.max(0, (raw - 0.18) / 0.64)));
    });
  }, [stage]);

  return (
    <section id="security" className="section">
      <div className="container-x">
        <SectionHead
          num="06 / Security Layers"
          kicker="Defense, sequenced"
          title={<>Four passes between the request and the <em>response.</em></>}
          body="Each layer is independently configurable, independently observable, and fails closed. No layer trusts the verdict of the one before it."
        />
        <div className="layers layers-stack" ref={wrap}>
          {ROWS.map((r, i) => {
            const local = Math.min(1, Math.max(0, t * ROWS.length - i));
            const on = local > 0.06;
            // z-stack: each row arrives from below + rotates flat
            const ty = (1 - local) * 90;
            const rx = (1 - local) * -22;
            const sh = local * 24;
            return (
              <div
                key={i}
                className={`layer-row ${on ? "is-on" : ""}`}
                style={{
                  transform: `translate3d(0, ${ty}px, 0) rotateX(${rx}deg)`,
                  opacity: 0.25 + local * 0.75,
                  boxShadow: `0 ${sh}px ${sh * 2}px -${sh}px rgba(20,22,26,${0.10 + local * 0.10})`,
                  background: on ? "#fff" : "color-mix(in oklab, #fff 60%, var(--paper-2))",
                  zIndex: 10 + i,
                  position: "relative",
                }}
              >
                <div className="step">{r.step}</div>
                <div>
                  <div className="ttl">{r.ttl}</div>
                  <div className="desc" style={{ marginTop: 6 }}>{r.desc}</div>
                </div>
                <div className="meter"><i style={{ width: `${local * r.v * 100}%` }} /></div>
                <div style={{
                  textAlign: "right", fontFamily: "var(--font-mono)",
                  fontSize: 11, color: "var(--muted)", fontVariantNumeric: "tabular-nums",
                }}>
                  {(local * r.v * 100).toFixed(0)}% coverage
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
