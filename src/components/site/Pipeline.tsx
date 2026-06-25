import { useEffect, useRef, useState } from "react";
import { SectionHead } from "./SectionHead";
import { Reveal } from "./Reveal";

const STAGES = [
  { idx: "01", ttl: "Ingest", desc: "Request lands on the nearest edge POP. TLS + headers parsed in ~0.4ms." },
  { idx: "02", ttl: "Inspect", desc: "User-agent, ASN, fingerprint, and JA4 hashed against the live reputation graph." },
  { idx: "03", ttl: "Score", desc: "On-edge ML model returns a calibrated risk in [0,1] with feature attribution." },
  { idx: "04", ttl: "Decide", desc: "Policy engine resolves: allow, challenge, reroute, sink, or deny." },
  { idx: "05", ttl: "Route", desc: "302 issued, or transparent reroute to a clean destination. Decision logged." },
];

export function Pipeline() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [t, setT] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(true)),
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let start = performance.now();
    const loop = (now: number) => {
      const elapsed = (now - start) / 2200;
      const v = elapsed % 1;
      setT(v);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <section id="routing" className="section">
      <div className="container-x">
        <SectionHead
          num="02 / Intelligent Routing"
          kicker="The decision pipeline"
          title={<>Five stages between the click and the <em>destination.</em></>}
          body="Every redirect walks the same path — ingest, inspect, score, decide, route. Everything is observable. Nothing is opaque."
        />
        <Reveal>
          <div className="pipeline" ref={ref}>
            <div className="pipeline-grid">
              {STAGES.map((s, i) => (
                <div className="pipeline-stage" key={i}>
                  <div>
                    <div className="idx">STAGE / {s.idx}</div>
                    <div className="ttl">{s.ttl}</div>
                  </div>
                  <div className="desc">{s.desc}</div>
                </div>
              ))}
              <div
                className="pipeline-token"
                style={{
                  left: `${t * 100}%`,
                  transform: "translateX(-50%)",
                  transition: "opacity .3s",
                }}
              />
            </div>
            <div style={{
              marginTop: 24,
              display: "flex", justifyContent: "space-between",
              fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.18em",
              color: "#6b6f76", textTransform: "uppercase",
            }}>
              <span>T+0.00ms · Request</span>
              <span>P50 · 11.4ms</span>
              <span>T+11.40ms · Resolved</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
