import { SectionHead } from "./SectionHead";
import { Reveal } from "./Reveal";

const LOGOS = ["Northwind", "Helix", "Foundry", "Atlas Press", "Meridian", "Kinetic"];

const METRICS = [
  { v: "99.997%", l: "Uptime · trailing 12 months" },
  { v: "11.4ms",  l: "Median decision latency" },
  { v: "8.6%",    l: "Of traffic intercepted as abuse" },
  { v: "2.1B",    l: "Routing decisions per month" },
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
        <Reveal>
          <div className="logos">
            {LOGOS.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </Reveal>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0,
          borderBottom: "1px solid var(--rule)",
        }}>
          {METRICS.map((m, i) => (
            <Reveal key={i} delay={i * 80}>
              <div style={{
                padding: "44px 28px",
                borderRight: i < METRICS.length - 1 ? "1px solid var(--rule)" : "none",
              }}>
                <div className="font-display" style={{ fontSize: 48, letterSpacing: "-0.025em" }}>{m.v}</div>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 10,
                  letterSpacing: "0.18em", textTransform: "uppercase",
                  color: "var(--muted)", marginTop: 12,
                }}>{m.l}</div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <blockquote style={{
            margin: "80px auto 0", maxWidth: 920, textAlign: "center",
            fontFamily: "var(--font-display)", fontWeight: 300,
            fontSize: "clamp(24px, 3vw, 36px)", lineHeight: 1.3,
            letterSpacing: "-0.015em", color: "var(--ink)",
          }}>
            “We moved 1.4&nbsp;billion redirects to AegisRoute and our abuse
            costs fell by 71% in the first quarter. The audit trail alone was
            worth the switch.”
            <footer style={{
              marginTop: 24,
              fontFamily: "var(--font-mono)", fontSize: 11,
              letterSpacing: "0.18em", textTransform: "uppercase",
              color: "var(--muted)",
            }}>
              — Eliza Tran, VP Infrastructure · Northwind
            </footer>
          </blockquote>
        </Reveal>
      </div>
    </section>
  );
}
