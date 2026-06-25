import { Mask, useTilt } from "../../lib/motion";
import { SectionHead } from "./SectionHead";
import type { ReactNode } from "react";

const ITEMS = [
  {
    tag: "Blind Redirect",
    title: "302s with no awareness.",
    body: "Legacy shorteners forward every request — humans, bots, and abuse — into the destination without inspection. The business absorbs the cost.",
    diagram: (
      <svg viewBox="0 0 320 120" style={{ width: "100%", height: "auto" }}>
        <line x1="20" y1="60" x2="300" y2="60" stroke="#d9d4c7" strokeWidth="1" strokeDasharray="2 4" />
        <circle cx="20" cy="60" r="5" fill="#14161a" />
        <circle cx="300" cy="60" r="5" fill="#14161a" />
        <text x="20" y="42" fontFamily="IBM Plex Mono" fontSize="9" fill="#6b6f76" letterSpacing="2">REQUEST</text>
        <text x="240" y="42" fontFamily="IBM Plex Mono" fontSize="9" fill="#6b6f76" letterSpacing="2">ORIGIN</text>
        {[140, 170, 200].map((cx, i) => (
          <circle key={i} cx={cx} cy="60" r="3" fill="#c25535">
            <animate attributeName="cx" values={`${cx - 8};${cx + 8};${cx - 8}`} dur={`${1.6 + i * 0.2}s`} repeatCount="indefinite" />
          </circle>
        ))}
        <text x="140" y="92" fontFamily="IBM Plex Mono" fontSize="9" fill="#c25535" letterSpacing="2">BOTS · PASS-THROUGH</text>
      </svg>
    ),
  },
  {
    tag: "Bot Saturation",
    title: "63% of traffic is non-human.",
    body: "Crawlers, scrapers, and headless agents inflate analytics, distort attribution, and create silent infrastructure cost on every campaign.",
    diagram: (
      <svg viewBox="0 0 320 120" style={{ width: "100%", height: "auto" }}>
        {Array.from({ length: 40 }).map((_, i) => {
          const x = 12 + (i % 20) * 15;
          const y = 20 + Math.floor(i / 20) * 36;
          const bot = i % 3 !== 0;
          return (
            <rect key={i} x={x} y={y} width="10" height="10"
              fill={bot ? "#c25535" : "#14161a"}
              opacity={bot ? 0.85 : 1}>
              <animate attributeName="opacity"
                values={bot ? "0.85;0.35;0.85" : "1;1;1"}
                dur={`${2 + (i % 5) * 0.3}s`} repeatCount="indefinite" />
            </rect>
          );
        })}
        <text x="12" y="110" fontFamily="IBM Plex Mono" fontSize="9" fill="#6b6f76" letterSpacing="2">25 OF 40 REQUESTS · NON-HUMAN</text>
      </svg>
    ),
  },
  {
    tag: "Zero Visibility",
    title: "Aggregate counts, never causes.",
    body: "A click is a number. AegisRoute treats it as a decision — with geography, posture, intent, and risk attached to every single event.",
    diagram: (
      <svg viewBox="0 0 320 120" style={{ width: "100%", height: "auto" }}>
        {[
          [20, 80, 20], [70, 65, 35], [120, 55, 45], [170, 40, 60], [220, 48, 52], [270, 60, 40],
        ].map(([x, y, h], i) => (
          <g key={i}>
            <rect x={x} y={y} width="40" height={h} fill="#14161a">
              <animate attributeName="height" values={`0;${h};${h}`} dur="1.4s" begin={`${i * 0.12}s`} fill="freeze" />
              <animate attributeName="y" values={`${y + h};${y};${y}`} dur="1.4s" begin={`${i * 0.12}s`} fill="freeze" />
            </rect>
          </g>
        ))}
        <text x="20" y="28" fontFamily="IBM Plex Mono" fontSize="9" fill="#6b6f76" letterSpacing="2">CLICKS — BUT WHO? WHY? WHERE?</text>
      </svg>
    ),
  },
];

function Card({ item, idx }: { item: typeof ITEMS[number]; idx: number }) {
  const ref = useTilt<HTMLDivElement>(6, 1.01);
  return (
    <Mask delay={idx * 140} duration={1100} style={{ height: "100%" }}>
      <div ref={ref} style={{
        background: "#fff", padding: 32, height: "100%",
        display: "flex", flexDirection: "column", gap: 24,
        transformStyle: "preserve-3d",
      }}>
        <div className="tag danger" style={{ alignSelf: "flex-start", transform: "translateZ(20px)" }}>
          {item.tag}
        </div>
        <div style={{
          transform: "translateZ(30px)",
          height: 140,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ width: "100%" }}>{item.diagram}</div>
        </div>
        <div style={{ transform: "translateZ(20px)", marginTop: "auto" }}>
          <h3 style={{
            fontFamily: "var(--font-display)", fontWeight: 400,
            fontSize: 24, letterSpacing: "-0.01em",
            margin: "0 0 8px",
          }}>{item.title as ReactNode}</h3>
          <p style={{ color: "var(--ink-soft)", fontSize: 13, lineHeight: 1.6 }}>{item.body}</p>
        </div>
      </div>
    </Mask>
  );
}

export function Problem() {
  return (
    <section id="problem" className="section">
      <div className="container-x">
        <SectionHead
          num="01 / Problem"
          kicker="Why this exists"
          title={<>The link layer is the last surface still <em>operating blind.</em></>}
          body="Every other surface — DNS, CDN, app, database — has telemetry, posture, and policy. The redirect itself does not. AegisRoute closes that gap."
        />
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1,
          background: "var(--rule)", border: "1px solid var(--rule)",
        }}>
          {ITEMS.map((it, i) => <Card key={i} item={it} idx={i} />)}
        </div>
      </div>
    </section>
  );
}
