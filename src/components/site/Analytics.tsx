import { useEffect, useRef, useState } from "react";
import { SectionHead } from "./SectionHead";
import { Mask } from "../../lib/motion";

function useTicker(initial: number, delta: number, ms = 1600) {
  const [v, setV] = useState(initial);
  useEffect(() => {
    const id = setInterval(() => setV((x) => x + Math.round(Math.random() * delta)), ms);
    return () => clearInterval(id);
  }, [delta, ms]);
  return v;
}

function AreaChart() {
  const [seed, setSeed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeed((s) => s + 1), 2400);
    return () => clearInterval(id);
  }, []);
  const pts = Array.from({ length: 48 }).map((_, i) => {
    const x = (i / 47) * 600;
    const base = 80 + Math.sin(i * 0.4 + seed * 0.3) * 22;
    const noise = Math.sin(i * 1.3 + seed) * 8;
    const y = 140 - (base + noise) * 0.6;
    return [x, y] as const;
  });
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  const area = `${path} L 600 140 L 0 140 Z`;
  return (
    <svg viewBox="0 0 600 160" style={{ width: "100%", height: "auto" }}>
      <defs>
        <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14161a" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#14161a" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 35, 70, 105, 140].map((y) => (
        <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="#ece6d4" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#ga)" style={{ transition: "d .8s var(--ease-out)" }} />
      <path d={path} fill="none" stroke="#14161a" strokeWidth="1.5"
        style={{ transition: "d .8s var(--ease-out)" }} />
      {/* Live cursor */}
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" fill="#c25535">
        <animate attributeName="r" values="3;6;3" dur="1.6s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function RegionBar({ l, v, on, delay }: { l: string; v: number; on: boolean; delay: number }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 140px 36px",
      alignItems: "center", gap: 12, padding: "8px 0",
      fontFamily: "var(--font-mono)", fontSize: 11,
      transform: on ? "none" : "translateX(-12px)",
      opacity: on ? 1 : 0,
      transition: `transform .7s var(--ease-out) ${delay}ms, opacity .7s var(--ease-out) ${delay}ms`,
    }}>
      <span>{l}</span>
      <div style={{ height: 3, background: "var(--paper-2)", position: "relative" }}>
        <div style={{
          position: "absolute", inset: 0,
          width: on ? `${v * 2.4}%` : "0%",
          background: "var(--ink)",
          transition: `width 1.1s cubic-bezier(0.76,0,0.24,1) ${delay + 200}ms`,
        }} />
      </div>
      <span style={{ textAlign: "right", color: "var(--muted)" }}>{v}%</span>
    </div>
  );
}

export function Analytics() {
  const [range, setRange] = useState<"1H" | "24H" | "7D">("24H");
  const deltaByRange = { "1H": 1, "24H": 4, "7D": 14 } as const;
  const multByRange = { "1H": 0.04, "24H": 1, "7D": 6.8 } as const;
  const clicks = useTicker(2147893, deltaByRange[range]);
  const blocked = useTicker(184412, Math.max(1, Math.round(deltaByRange[range] / 2)));
  const uniq = useTicker(412708, 1);
  const displayedClicks = Math.round(clicks * multByRange[range]);

  const wrap = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setOn(true)),
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="analytics" className="section">
      <div className="container-x">
        <SectionHead
          num="04 / Real-Time Analytics"
          kicker="Decisions become signal"
          title={<>Every redirect leaves a <em>readable trace.</em></>}
          body="Live counts, geography, posture, and integrity in one panel. Built for the operator who needs to answer what happened — and why — without leaving the page."
        />
        <div ref={wrap} className="dash" style={{ perspective: 1400 }}>
          <Mask delay={0} duration={900}>
            <div style={{
              transform: on ? "rotateY(0)" : "rotateY(-6deg) translateX(-20px)",
              transformOrigin: "left center",
              transition: "transform 1s var(--ease-out)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
                <div>
                  <div className="kicker">Traffic · /q4/launch · {range}</div>
                  <div className="font-display" style={{ fontSize: 32, marginTop: 8, letterSpacing: "-0.02em" }}>
                    {displayedClicks.toLocaleString()} <span style={{ color: "var(--muted)", fontSize: 14, fontFamily: "var(--font-mono)" }}>requests</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["1H", "24H", "7D"] as const).map((r) => {
                    const active = r === range;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRange(r)}
                        className="tag"
                        style={{
                          cursor: "pointer",
                          background: active ? "var(--ink)" : "transparent",
                          color: active ? "var(--paper)" : "var(--ink)",
                          borderColor: active ? "var(--ink)" : undefined,
                          font: "inherit",
                          letterSpacing: "inherit",
                          textTransform: "inherit",
                        }}
                        aria-pressed={active}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>
              <AreaChart />
            </div>
          </Mask>

          <Mask delay={120} duration={900}>
            <div style={{
              transform: on ? "rotateY(0)" : "rotateY(6deg) translateX(20px)",
              transformOrigin: "right center",
              transition: "transform 1s var(--ease-out) 120ms",
            }}>
              <div className="dash-stats">
                {[
                  { v: `${(blocked / 1000).toFixed(1)}K`, l: "Blocked · 24h", d: 0 },
                  { v: `${(uniq / 1000).toFixed(1)}K`, l: "Unique Humans", d: 120 },
                  { v: "8.6%", l: "Threat Rate", d: 240 },
                ].map((c, i) => (
                  <div key={i} className="cell" style={{
                    transform: on ? "none" : "translateY(20px)",
                    opacity: on ? 1 : 0,
                    transition: `transform .8s var(--ease-out) ${c.d}ms, opacity .8s var(--ease-out) ${c.d}ms`,
                  }}>
                    <div className="v">{c.v}</div>
                    <div className="l">{c.l}</div>
                  </div>
                ))}
              </div>
              <div className="rule" style={{ margin: "28px 0" }} />
              <div className="kicker">Top regions</div>
              <div style={{ marginTop: 14 }}>
                {[
                  { l: "United States", v: 38 },
                  { l: "Germany", v: 17 },
                  { l: "Japan", v: 12 },
                  { l: "Brazil", v: 9 },
                  { l: "United Kingdom", v: 7 },
                ].map((r, i) => (
                  <RegionBar key={i} l={r.l} v={r.v} on={on} delay={300 + i * 100} />
                ))}
              </div>
            </div>
          </Mask>
        </div>
      </div>
    </section>
  );
}
