import { SectionHead } from "./SectionHead";
import { Mask, CountUp, Kinetic } from "../../lib/motion";
import { Marquee } from "./Marquee";

const LOGOS = ["Northwind", "Helix", "Foundry", "Atlas Press", "Meridian", "Kinetic", "Vector", "Lumen", "Praxis"];

const METRICS = [
  { v: 99.997, suf: "%", l: "Uptime · trailing 12 months", fmt: (n: number) => n.toFixed(3) },
  { v: 11.4,   suf: "ms", l: "Median decision latency", fmt: (n: number) => n.toFixed(1) },
  { v: 8.6,    suf: "%",  l: "Of traffic intercepted as abuse", fmt: (n: number) => n.toFixed(1) },
  { v: 2.1,    suf: "B",  l: "Routing decisions per month", fmt: (n: number) => n.toFixed(1) },
];

export function Confidence() {
  return (
    <section className="section">
      <div className="container-x">
        <SectionHead
          num="07 / Operational Confidence"
          kicker="Proof, not promises"
          title={<>The numbers operators ask for, <em>first.</em></>}
          body="Performance and reliability metrics are public. The status page is the source of truth, not a courtesy."
        />
      </div>

      <Mask delay={80} duration={1100}>
        <div style={{ borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)", background: "#fff" }}>
          <Marquee speed={36}>
            {LOGOS.map((l, i) => (
              <span key={i} style={{
                fontFamily: "var(--font-display)", fontStyle: "italic",
                fontSize: 28, color: "var(--ink-soft)", letterSpacing: "-0.01em",
                padding: "28px 4px",
                display: "inline-flex", alignItems: "center", gap: 64,
              }}>
                {l}
                <span style={{ width: 6, height: 6, background: "var(--ember)", borderRadius: "50%" }} />
              </span>
            ))}
          </Marquee>
        </div>
      </Mask>

      <div className="container-x">
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0,
          borderBottom: "1px solid var(--rule)",
        }}>
          {METRICS.map((m, i) => (
            <Mask key={i} delay={i * 110} duration={900}>
              <div style={{
                padding: "44px 28px",
                borderRight: i < METRICS.length - 1 ? "1px solid var(--rule)" : "none",
              }}>
                <div className="font-display" style={{ fontSize: 48, letterSpacing: "-0.025em" }}>
                  <CountUp to={m.v} duration={1800} format={(n) => m.fmt(n)} />
                  <span style={{ color: "var(--ember)" }}>{m.suf}</span>
                </div>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 10,
                  letterSpacing: "0.18em", textTransform: "uppercase",
                  color: "var(--muted)", marginTop: 12,
                }}>{m.l}</div>
              </div>
            </Mask>
          ))}
        </div>

        <div style={{ margin: "80px auto 0", maxWidth: 920, textAlign: "center" }}>
          <Kinetic
            as="blockquote"
            text="We moved 1.4 billion redirects to AegisRoute and our abuse costs fell by 71% in the first quarter."
            split="word"
            stagger={45}
            duration={1100}
            style={{
              margin: 0,
              fontFamily: "var(--font-display)", fontWeight: 300,
              fontSize: "clamp(24px, 3vw, 36px)", lineHeight: 1.3,
              letterSpacing: "-0.015em", color: "var(--ink)",
            }}
            italicWords={[10]}
          />
          <Mask delay={1200}>
            <footer style={{
              marginTop: 24,
              fontFamily: "var(--font-mono)", fontSize: 11,
              letterSpacing: "0.18em", textTransform: "uppercase",
              color: "var(--muted)",
            }}>
              — Eliza Tran, VP Infrastructure · Northwind
            </footer>
          </Mask>
        </div>
      </div>
    </section>
  );
}
