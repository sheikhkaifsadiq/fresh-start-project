import { useEffect, useState } from "react";
import { SectionHead } from "./SectionHead";
import { Reveal } from "./Reveal";

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
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14161a" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#14161a" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 35, 70, 105, 140].map((y) => (
        <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="#ece6d4" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#g)" style={{ transition: "d .8s var(--ease-out)" }} />
      <path d={path} fill="none" stroke="#14161a" strokeWidth="1.5" style={{ transition: "d .8s var(--ease-out)" }} />
    </svg>
  );
}

export function Analytics() {
  const clicks = useTicker(2147893, 4);
  const blocked = useTicker(184412, 2);
  const uniq = useTicker(412708, 1);

  return (
    <section id="analytics" className="section">
      <div className="container-x">
        <SectionHead
          num="04 / Real-Time Analytics"
          kicker="Decisions become signal"
          title={<>Every redirect leaves a <em>readable trace.</em></>}
          body="Live counts, geography, posture, and integrity in one panel. Built for the operator who needs to answer what happened — and why — without leaving the page."
        />
        <Reveal>
          <div className="dash">
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
                <div>
                  <div className="kicker">Traffic · /q4/launch · 24h</div>
                  <div className="font-display" style={{ fontSize: 32, marginTop: 8, letterSpacing: "-0.02em" }}>
                    {clicks.toLocaleString()} <span style={{ color: "var(--muted)", fontSize: 14, fontFamily: "var(--font-mono)" }}>requests</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span className="tag">1H</span>
                  <span className="tag" style={{ background: "var(--ink)", color: "var(--paper)", borderColor: "var(--ink)" }}>24H</span>
                  <span className="tag">7D</span>
                </div>
              </div>
              <AreaChart />
            </div>

            <div>
              <div className="dash-stats">
                <div className="cell"><div className="v">{(blocked / 1000).toFixed(1)}K</div><div className="l">Blocked · 24h</div></div>
                <div className="cell"><div className="v">{(uniq / 1000).toFixed(1)}K</div><div className="l">Unique Humans</div></div>
                <div className="cell"><div className="v">8.6%</div><div className="l">Threat Rate</div></div>
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
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "1fr 140px 36px",
                    alignItems: "center", gap: 12, padding: "8px 0",
                    fontFamily: "var(--font-mono)", fontSize: 11,
                  }}>
                    <span>{r.l}</span>
                    <div style={{ height: 3, background: "var(--paper-2)", position: "relative" }}>
                      <div style={{ position: "absolute", inset: 0, width: `${r.v * 2.4}%`, background: "var(--ink)" }} />
                    </div>
                    <span style={{ textAlign: "right", color: "var(--muted)" }}>{r.v}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
