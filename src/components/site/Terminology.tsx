import { useEffect, useRef, useState } from "react";
import { useStage } from "../../lib/stage";

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
  return (
    <>
      {/* Marquee restored on mobile — same vocabulary band as desktop, auto-scrolling. */}
      <section aria-hidden className="drift-band drift-band--mobile">
        <div className="drift-track">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="drift-item">
              {PHRASE}<span className="drift-sep">·</span>
            </span>
          ))}
        </div>
      </section>
      <TerminologyMobile />
    </>
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

function TerminologyMobile() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<HTMLSpanElement>(null);
  const stage = useStage();

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const idxEl = indexRef.current;
    if (!section || !track || !idxEl) return;
    const N = TERMS.length;
    return stage.subscribe((f) => {
      const r = section.getBoundingClientRect();
      const total = r.height - f.vh;
      if (total <= 0) return;
      const raw = Math.min(1, Math.max(0, -r.top / total));
      // ease in/out so cards feel like they snap into centre
      const eased = raw;
      const maxX = track.scrollWidth - f.vw;
      track.style.transform = `translate3d(${(-eased * maxX).toFixed(2)}px, 0, 0)`;
      const active = Math.min(N - 1, Math.floor(raw * N + 0.001));
      idxEl.textContent = String(active + 1).padStart(2, "0");
    });
  }, [stage]);

  return (
    <section ref={sectionRef} className="term-chapter" aria-label="Vocabulary">
      <div ref={stickyRef} className="term-sticky">
        <header className="term-head">
          <span className="ki"><span /> Vocabulary</span>
          <h2 className="term-title">
            Six verbs the platform <em>performs</em> on every request.
          </h2>
          <p className="term-intro">
            <span ref={indexRef}>01</span> / {String(TERMS.length).padStart(2, "0")}
            <span className="term-intro-sep">·</span>
            Scroll to advance the chapter.
          </p>
        </header>
        <div className="term-viewport">
          <div ref={trackRef} className="term-track">
            {TERMS.map((t) => (
              <article key={t.n} className="term-card">
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
