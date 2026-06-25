import { useEffect, useRef, useState } from "react";
import { SectionHead } from "./SectionHead";

const ROWS = [
  { step: "01", ttl: "Detection",    desc: "Signature, fingerprint, and behavioural anomaly detection on every request.", v: 0.96 },
  { step: "02", ttl: "Verification", desc: "Adaptive challenges for ambiguous traffic — invisible to genuine users.",       v: 0.88 },
  { step: "03", ttl: "Mitigation",   desc: "Rate shaping, reputation throttling, and policy-driven denial at the edge.",    v: 0.92 },
  { step: "04", ttl: "Routing",      desc: "Clean traffic forwarded; abusive traffic sunk or rerouted, never to origin.",   v: 1.0  },
];

export function Layers() {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const loop = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = 1 - (rect.top + rect.height * 0.2) / vh;
      setT(Math.min(1, Math.max(0, p)));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section id="security" className="section">
      <div className="container-x">
        <SectionHead
          num="06 / Security Layers"
          kicker="Defense, sequenced"
          title={<>Four passes between the request and the <em>response.</em></>}
          body="Each layer is independently configurable, independently observable, and fails closed. No layer trusts the verdict of the one before it."
        />
        <div className="layers" ref={ref}>
          {ROWS.map((r, i) => {
            const local = Math.min(1, Math.max(0, t * ROWS.length - i));
            const on = local > 0.05;
            return (
              <div key={i} className={`layer-row ${on ? "is-on" : ""}`} style={{
                transform: `translateX(${(1 - local) * (i % 2 === 0 ? -40 : 40)}px)`,
                opacity: 0.3 + local * 0.7,
                transition: "transform .6s var(--ease-out), opacity .6s var(--ease-out)",
              }}>
                <div className="step">{r.step}</div>
                <div>
                  <div className="ttl">{r.ttl}</div>
                  <div className="desc" style={{ marginTop: 6 }}>{r.desc}</div>
                </div>
                <div className="meter"><i style={{ width: `${local * r.v * 100}%` }} /></div>
                <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
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
