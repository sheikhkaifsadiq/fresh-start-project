import { useEffect, useRef, useState } from "react";
import { SectionHead } from "./SectionHead";
import { Mask, CountUp } from "../../lib/motion";
import { useStage } from "../../lib/stage";

const LOGOS = ["Northwind", "Helix", "Foundry", "Atlas Press", "Meridian", "Kinetic", "Vector", "Lumen", "Praxis"];

const METRICS = [
  { v: 99.997, suf: "%", l: "Uptime · trailing 12 months", fmt: (n: number) => n.toFixed(3) },
  { v: 11.4,   suf: "ms", l: "Median decision latency", fmt: (n: number) => n.toFixed(1) },
  { v: 8.6,    suf: "%",  l: "Of traffic intercepted as abuse", fmt: (n: number) => n.toFixed(1) },
  { v: 2.1,    suf: "B",  l: "Routing decisions per month", fmt: (n: number) => n.toFixed(1) },
];

type Card = { quote: React.ReactNode; who: string; org: string };
const CARDS: Card[] = [
  { quote: <>We moved 1.4B redirects to AegisRoute. Abuse costs fell <em>71%</em> in the first quarter.</>, who: "Eliza Tran", org: "Northwind · VP Infra" },
  { quote: <>The decision pipeline gave us an answer for every block. Audit went from <em>weeks</em> to a query.</>, who: "Marcus Vale", org: "Helix · Security Lead" },
  { quote: <>Edge-local scoring means our launches survive their own success. <em>Zero</em> origin saturation events since cutover.</>, who: "Priya Rao", org: "Atlas Press · SRE" },
  { quote: <>Operators here read AegisRoute's panel first thing. It's the only place every redirect lives <em>truthfully</em>.</>, who: "Jonas Birk", org: "Foundry · CTO" },
  { quote: <>The ML scores carry feature attribution. Legal could finally <em>understand</em> what we deny.</>, who: "Sara Holm", org: "Meridian · Trust" },
];

/**
 * Confidence — horizontal testimonial rail driven by vertical scroll.
 * A pinned scene whose internal track translates X with scroll progress.
 * Pure transform; no layout thrash.
 */
export function Confidence() {
  const stage = useStage();
  const pinRef   = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const railLen = Math.max(1, CARDS.length); // total cards
  // pin height = railLen viewports
  const pinHeight = `${railLen * 90}vh`;

  useEffect(() => {
    return stage.subscribe(() => {
      const pin = pinRef.current;
      const track = trackRef.current;
      if (!pin || !track) return;
      const rect = pin.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height - vh;
      const passed = Math.min(total, Math.max(0, -rect.top));
      const p = total > 0 ? passed / total : 0;
      const maxX = track.scrollWidth - window.innerWidth;
      const x = -p * Math.max(0, maxX);
      track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    });
  }, [stage]);

  return (
    <section id="confidence" className="section" style={{ paddingBottom: 0 }}>
      <div className="container-x">
        <SectionHead
          num="07 / Operational Confidence"
          kicker="Proof, not promises"
          title={<>The numbers operators ask for, <em>first.</em></>}
          body="Performance and reliability metrics are public. The status page is the source of truth, not a courtesy."
        />
      </div>

      {/* Marquee logo strip */}
      <Mask delay={80} duration={1100}>
        <LogoMarquee />
      </Mask>

      <div className="container-x">
        <div className="conf-metrics" style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0,
          borderBottom: "1px solid var(--rule)", borderTop: "1px solid var(--rule)",
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
      </div>

      {/* Horizontal scroll-driven testimonial rail */}
      <div ref={pinRef} className="h-rail-pin" style={{ height: pinHeight, marginTop: 40 }}>
        <div className="h-rail-sticky">
          <div ref={trackRef} className="h-rail-track">
            {CARDS.map((c, i) => (
              <article key={i} className="h-rail-card">
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 10,
                  letterSpacing: "0.22em", color: "var(--muted)",
                }}>
                  TESTIMONIAL · {String(i + 1).padStart(2, "0")} / {String(CARDS.length).padStart(2, "0")}
                </div>
                <p className="quote">{c.quote}</p>
                <div className="who">
                  <span>{c.who}</span>
                  <span>{c.org}</span>
                </div>
              </article>
            ))}
            <div style={{ flex: "0 0 8vw" }} />
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--rule)" }}>
        {/* used to balance below pin */}
      </div>
      <_LOGOS_NOTE />
    </section>
  );
}

function _LOGOS_NOTE() { void LOGOS; return null; }

function LogoMarquee() {
  // simple css-driven logo strip (kept here so it's part of confidence)
  return (
    <div style={{ borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)", background: "#fff", overflow: "hidden" }}>
      <div className="drift-track" style={{ animationDuration: "44s" }}>
        {Array.from({ length: 3 }).map((_, k) => (
          <span key={k} className="drift-item" style={{
            fontFamily: "var(--font-display)", fontStyle: "italic",
            fontSize: 28, color: "var(--ink-soft)", letterSpacing: "-0.01em",
            padding: "24px 0",
          }}>
            {LOGOS.map((l, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 56, paddingRight: 56 }}>
                {l}
                <span style={{ width: 6, height: 6, background: "var(--ember)", borderRadius: "50%" }} />
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
