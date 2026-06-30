import { useEffect, useRef, useState } from "react";
import { useStage } from "../../lib/stage";
import { useMobileScrollOwner } from "../../lib/mobile-scroll-owner";

/**
 * Terminology — an editorial vocabulary chapter.
 *
 * Desktop: kept visually identical to the previous DriftBand marquee so the
 * desktop experience does not change.
 * Mobile (≤720px): becomes a pinned horizontal chapter. The user keeps
 * scrolling vertically; each term snaps into the centre of the viewport.
 * After the last term clears centre, the page releases back to vertical flow.
 */

const PHRASE = "Inspect · Score · Decide · Route · Observe · Repeat";

const TERMS: { word: string; def: string; n: string }[] = [
  { n: "01", word: "Inspect", def: "Every request is read at the edge before a single byte is routed." },
  { n: "02", word: "Score",   def: "A confidence value is assigned to the request in under three milliseconds." },
  { n: "03", word: "Decide",  def: "Allow, challenge, or deny — chosen against the live policy graph." },
  { n: "04", word: "Route",   def: "Resolved through the nearest edge to the canonical destination." },
  { n: "05", word: "Observe", def: "Telemetry streams back into the model. Nothing is forgotten." },
  { n: "06", word: "Repeat",  def: "The next request inherits everything the last one taught us." },
];

export function Terminology() {
  const isMobile = useIsMobile();
  if (!isMobile) {
    // Preserve the original drift-band marquee on desktop, untouched.
    return (
      <section aria-hidden className="drift-band">
        <div className="drift-track">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="drift-item">
              {PHRASE}<span className="drift-sep">·</span>
            </span>
          ))}
        </div>
      </section>
    );
  }
  return <TerminologyMobile />;
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

function TerminologyMobile() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<HTMLSpanElement>(null);
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
    const eased = k * k * (3 - 2 * k);
    const offsetFor = (idx: number) => {
      const card = cards[idx];
      return window.innerWidth / 2 - (card.offsetLeft + card.offsetWidth / 2);
    };
    const a = offsetFor(i);
    const b = offsetFor(Math.min(max, i + 1));
    track.style.transform = `translate3d(${(a + (b - a) * eased).toFixed(2)}px, 0, 0)`;
    if (indexRef.current) indexRef.current.textContent = String(Math.round(scaled) + 1).padStart(2, "0");
  };

  useMobileScrollOwner({
    sectionRef,
    triggerRef: firstCardRef,
    steps: TERMS.length,
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
      void f;
      applyProgress(0);
    });
  }, [stage]);

  return (
    <section ref={sectionRef} className="term-chapter section-pin" aria-label="Vocabulary" style={{ minHeight: "300vh" }}>
      <div className={`section-pin-inner term-sticky${owned ? " is-owned" : ""}`} style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <header className="term-head">
          <span className="ki"><span /> Vocabulary</span>
          <h2 className="term-title">
            Six verbs the platform <em>performs</em> on every request.
          </h2>
          <div aria-hidden className="term-inline-marquee">
            <div className="drift-track">
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={i} className="drift-item">
                  {PHRASE}<span className="drift-sep">·</span>
                </span>
              ))}
            </div>
          </div>
          <p className="term-intro">
            <span ref={indexRef}>01</span> / {String(TERMS.length).padStart(2, "0")}
            <span className="term-intro-sep">·</span>
            Scroll to advance the chapter.
          </p>
        </header>
        <div className="term-viewport">
          <div ref={trackRef} className="term-track">
            {TERMS.map((t, i) => (
              <article
                key={t.n}
                ref={(el) => {
                  cardRefs.current[i] = el;
                  if (i === 0) firstCardRef.current = el;
                }}
                className="term-card"
              >
                <span className="term-n">{t.n}</span>
                <h3 className="term-word">{t.word}.</h3>
                <p className="term-def">{t.def}</p>
              </article>
            ))}
            <div className="term-tail" aria-hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
