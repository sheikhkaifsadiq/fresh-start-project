import { useEffect, useRef, useState } from "react";
import { SectionHead } from "./SectionHead";
import { Reveal } from "./Reveal";

const ROWS = [
  { step: "01", ttl: "Detection", desc: "Signature, fingerprint, and behavioural anomaly detection on every request.", v: 0.96 },
  { step: "02", ttl: "Verification", desc: "Adaptive challenges for ambiguous traffic — invisible to genuine users.", v: 0.88 },
  { step: "03", ttl: "Mitigation", desc: "Rate shaping, reputation throttling, and policy-driven denial at the edge.", v: 0.92 },
  { step: "04", ttl: "Routing", desc: "Clean traffic forwarded; abusive traffic sunk or rerouted, never to origin.", v: 1.0  },
];

export function Layers() {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setOn(true)),
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
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
        <Reveal>
          <div className="layers" ref={ref}>
            {ROWS.map((r, i) => (
              <div key={i} className="layer-row">
                <div className="step">{r.step}</div>
                <div>
                  <div className="ttl">{r.ttl}</div>
                  <div className="desc" style={{ marginTop: 6 }}>{r.desc}</div>
                </div>
                <div className="meter"><i style={{
                  width: on ? `${r.v * 100}%` : "0%",
                  transition: `width 1s var(--ease-out) ${i * 180}ms`,
                }} /></div>
                <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
                  {(r.v * 100).toFixed(0)}% coverage
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
