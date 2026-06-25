import { Reveal } from "./Reveal";
import { SectionHead } from "./SectionHead";

const ITEMS = [
  {
    tag: "Blind Redirect",
    title: "302s with no awareness.",
    body: "Legacy shorteners forward every request — humans, bots, and abuse — into the destination without inspection. The business absorbs the cost.",
    diagram: (
      <svg viewBox="0 0 320 120" className="w-full h-auto">
        <line x1="20" y1="60" x2="300" y2="60" stroke="#d9d4c7" strokeWidth="1" strokeDasharray="2 4" />
        <circle cx="20" cy="60" r="5" fill="#14161a" />
        <circle cx="300" cy="60" r="5" fill="#14161a" />
        <text x="20" y="42" fontFamily="IBM Plex Mono" fontSize="9" fill="#6b6f76" letterSpacing="2">REQUEST</text>
        <text x="240" y="42" fontFamily="IBM Plex Mono" fontSize="9" fill="#6b6f76" letterSpacing="2">ORIGIN</text>
        <g>
          <circle cx="140" cy="60" r="3" fill="#c25535" />
          <circle cx="170" cy="60" r="3" fill="#c25535" />
          <circle cx="200" cy="60" r="3" fill="#c25535" />
        </g>
        <text x="140" y="92" fontFamily="IBM Plex Mono" fontSize="9" fill="#c25535" letterSpacing="2">BOTS · PASS-THROUGH</text>
      </svg>
    ),
  },
  {
    tag: "Bot Saturation",
    title: "63% of traffic is non-human.",
    body: "Crawlers, scrapers, and headless agents inflate analytics, distort attribution, and create silent infrastructure cost on every campaign.",
    diagram: (
      <svg viewBox="0 0 320 120" className="w-full h-auto">
        {Array.from({ length: 40 }).map((_, i) => {
          const x = 12 + (i % 20) * 15;
          const y = 20 + Math.floor(i / 20) * 36;
          const bot = i % 3 !== 0;
          return (
            <rect key={i} x={x} y={y} width="10" height="10"
              fill={bot ? "#c25535" : "#14161a"}
              opacity={bot ? 0.85 : 1} />
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
      <svg viewBox="0 0 320 120" className="w-full h-auto">
        <rect x="20" y="80" width="40" height="20" fill="#14161a" />
        <rect x="70" y="65" width="40" height="35" fill="#14161a" />
        <rect x="120" y="55" width="40" height="45" fill="#14161a" />
        <rect x="170" y="40" width="40" height="60" fill="#14161a" />
        <rect x="220" y="48" width="40" height="52" fill="#14161a" />
        <rect x="270" y="60" width="30" height="40" fill="#14161a" />
        <text x="20" y="28" fontFamily="IBM Plex Mono" fontSize="9" fill="#6b6f76" letterSpacing="2">CLICKS — BUT WHO? WHY? WHERE?</text>
      </svg>
    ),
  },
];

export function Problem() {
  return (
    <section className="section">
      <div className="container-x">
        <SectionHead
          num="01 / Problem"
          kicker="Why this exists"
          title={<>The link layer is the last surface still <em>operating blind.</em></>}
          body="Every other surface — DNS, CDN, app, database — has telemetry, posture, and policy. The redirect itself does not. AegisRoute closes that gap."
        />
        <div className="problem-grid">
          {ITEMS.map((it, i) => (
            <Reveal key={i} delay={i * 100}>
              <div className="tag danger">{it.tag}</div>
              <div>{it.diagram}</div>
              <div>
                <h3>{it.title}</h3>
                <p>{it.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
