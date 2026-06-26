import { useEffect, useRef, useState } from "react";
import { Mask, useTilt } from "../../lib/motion";
import { SectionHead } from "./SectionHead";
import { useStage } from "../../lib/stage";
import { useMobileScrollOwner } from "../../lib/mobile-scroll-owner";
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

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const fn = () => setM(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return m;
}

export function Problem() {
  const isMobile = useIsMobile();
  return (
    <section id="problem" className="section">
      <div className="container-x">
        <SectionHead
          num="01 / Problem"
          kicker="Why this exists"
          title={<>The link layer is the last surface still <em>operating blind.</em></>}
          body="Every other surface — DNS, CDN, app, database — has telemetry, posture, and policy. The redirect itself does not. AegisRoute closes that gap."
        />
      </div>
      {isMobile ? <ProblemMobileRail /> : (
        <div className="container-x">
          <div className="problem-rail">
            {ITEMS.map((it, i) => <Card key={i} item={it} idx={i} />)}
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * Mobile: pinned-horizontal rail — vertical page scroll is converted into
 * horizontal card translation. Each card snaps to viewport centre via the
 * scroll-progress mapping. Background telemetry continues to progress.
 */
function ProblemMobileRail() {
  const pinRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const idxRef = useRef<HTMLSpanElement>(null);
  const firstCardRef = useRef<HTMLElement | null>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const ownedRef = useRef(false);
  const [owned, setOwned] = useState(false);
  const stage = useStage();

  const applyProgress = (p: number) => {
    const track = trackRef.current;
    const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
    if (!track || cards.length === 0) return;
    const max = cards.length - 1;
    const scaled = Math.min(max, Math.max(0, p * max));
    const i = Math.min(max, Math.floor(scaled));
    const k = scaled - i;
    const ease = k * k * (3 - 2 * k);
    const centerOffset = (idx: number) => {
      const card = cards[idx];
      return window.innerWidth / 2 - (card.offsetLeft + card.offsetWidth / 2);
    };
    const a = centerOffset(i);
    const b = centerOffset(Math.min(max, i + 1));
    const x = a + (b - a) * ease;
    track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    if (idxRef.current) idxRef.current.textContent = String(Math.round(scaled) + 1).padStart(2, "0");
  };

  useMobileScrollOwner({
    sectionRef: pinRef,
    triggerRef: firstCardRef,
    steps: ITEMS.length,
    pxPerStep: 0.72,
    onProgress: applyProgress,
    onActiveChange: (active) => {
      ownedRef.current = active;
      setOwned(active);
    },
  });

  useEffect(() => {
    applyProgress(0);
    return stage.subscribe((f) => {
      if (ownedRef.current) return;
      const pin = pinRef.current;
      const track = trackRef.current;
      if (!pin || !track) return;
      void f;
      applyProgress(0);
    });
  }, [stage]);
  return (
    <div ref={pinRef} className="problem-pin" aria-label="Problem rail">
      <div ref={stickyRef} className={`problem-sticky${owned ? " is-owned" : ""}`}>
        <div className="problem-progress">
          <span ref={idxRef}>01</span> / {String(ITEMS.length).padStart(2, "0")}
          <span className="problem-progress-sep">·</span>
          Scroll to advance
        </div>
        <div className="problem-viewport">
          <div ref={trackRef} className="problem-track">
            {ITEMS.map((it, i) => (
              <article
                key={i}
                ref={(el) => {
                  cardRefs.current[i] = el;
                  if (i === 0) firstCardRef.current = el;
                }}
                className="problem-mcard"
              >
                <div className="tag danger" style={{ alignSelf: "flex-start" }}>{it.tag}</div>
                <div className="problem-mcard-diagram">{it.diagram}</div>
                <div>
                  <h3 className="problem-mcard-title">{it.title as ReactNode}</h3>
                  <p className="problem-mcard-body">{it.body}</p>
                </div>
              </article>
            ))}
            <div className="problem-mtail" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}

