import { useEffect, useRef, useState } from "react";

/**
 * Authored entry sequence. The site is *already in motion* underneath —
 * routing field is rendering, hero is already typing — and the curtain
 * uncovers it diagonally. Counter is product telemetry (requests
 * inspected this session), not a loading percent label.
 *
 * Reduced motion: snap straight to revealed state on first paint.
 */
const STATUSES = [
  "INITIALISING EDGE MESH",
  "LINKING 38 REGIONS",
  "WARMING ML MODELS",
  "SYNCING REPUTATION GRAPH",
  "HANDSHAKE COMPLETE",
];

export function Preloader({ onDone }: { onDone: () => void }) {
  if (typeof window !== 'undefined' && !(window as any).AegisStartup?.preloaderStart) {
    if ((window as any).AegisStartup) {
      (window as any).AegisStartup.preloaderStart = performance.now();
      console.log('[Startup] 4. Preloader Rendered:', performance.now().toFixed(2) + 'ms');
    }
  }

  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);
  const [tag, setTag] = useState("READY");
  const [counter, setCounter] = useState(0);
  const charsRef = useRef<HTMLSpanElement[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setProgress(1); setCounter(2147893);
      setDone(true);
      setTimeout(() => { setGone(true); onDone?.(); }, 80);
      return;
    }

    document.body.style.overflow = "hidden";

    const start = performance.now();
    const duration = 2400; // Original cinematic loading sequence
    let raf = 0;
    
    const fallbackTimer = setTimeout(() => {
      setGone(true);
      document.body.style.overflow = "";
      onDone?.();
    }, duration + 2000);

    const tick = () => {
      const now = performance.now();
      const k = Math.min(1, Math.max(0, (now - start) / duration));
      const eased = 1 - Math.pow(1 - k, 2.4);
      setProgress(eased);
      // odometer-style counter, ends at a plausible session figure
      setCounter(Math.round(eased * 2147893));
      if (k < 1) raf = requestAnimationFrame(tick);
      else {
        setTag("ROUTING");
        setTimeout(() => setDone(true), 240);   // start curtain
        setTimeout(() => {
          setGone(true);
          document.body.style.overflow = "";
          onDone?.();
        }, 1700); // Wait for curtain to clear, then handoff
      }
    };
    raf = requestAnimationFrame(tick);

    const statusTimer = setInterval(() => {
      setStatusIdx((i) => Math.min(STATUSES.length - 1, i + 1));
    }, 340);

    return () => {
      clearTimeout(fallbackTimer);
      cancelAnimationFrame(raf);
      clearInterval(statusTimer);
      document.body.style.overflow = "";
    };
  }, []);

  if (gone) return null;

  const brand = "AEGISROUTE";

  return (
    <div className={`preloader ${done ? "is-done" : ""}`} aria-hidden={done}>
      {/* Structural axes draw in first */}
      <div className="pre-axes" aria-hidden>
        <span className="pre-axis pre-axis-h" style={{ transform: `scaleX(${Math.min(1, progress * 4)})` }} />
        <span className="pre-axis pre-axis-v pre-axis-v1" style={{ transform: `scaleY(${Math.min(1, Math.max(0, (progress - 0.05) * 4))})` }} />
        <span className="pre-axis pre-axis-v pre-axis-v2" style={{ transform: `scaleY(${Math.min(1, Math.max(0, (progress - 0.12) * 4))})` }} />
        <span className="pre-axis pre-axis-v pre-axis-v3" style={{ transform: `scaleY(${Math.min(1, Math.max(0, (progress - 0.18) * 4))})` }} />
      </div>

      <div className="pre-grid" />
      <div className="pre-noise" />

      {/* Top chrome */}
      <header className="pre-top">
        <div className="pre-mono pre-top-l">
          <span className="pre-dot" />
          <span>AR · ROUTING FABRIC · {tag}</span>
        </div>
        <div className="pre-mono pre-top-c">N 37.7749° · W 122.4194° / SFO-EDGE-01</div>
        <div className="pre-mono pre-top-r">© 2026 / V3.0.0</div>
      </header>

      {/* Request stream on the horizon */}
      <div className="pre-stream" aria-hidden>
        {Array.from({ length: 14 }).map((_, i) => {
          const delay = (i * 0.18) % 2.4;
          const bad = i % 5 === 2;
          return (
            <span
              key={i}
              className={`pre-pkt ${bad ? "is-bad" : ""}`}
              style={{ animationDelay: `${delay}s`, top: `${(i * 7) % 84 + 6}%` }}
            />
          );
        })}
      </div>

      {/* Center stage */}
      <section className="pre-stage">
        <div className="pre-counter" aria-label={`${counter} requests inspected`}>
          <span className="pre-counter-num">{counter.toLocaleString()}</span>
          <span className="pre-counter-label">REQUESTS · INSPECTED · SESSION</span>
        </div>

        <h1 className="pre-brand" aria-label={brand}>
          {brand.split("").map((c, i) => {
            const cp = Math.max(0, Math.min(1, progress * (brand.length + 2) - i - 0.2));
            return (
              <span key={i} className="pre-char-wrap">
                <span
                  ref={(el) => { if (el) charsRef.current[i] = el; }}
                  className="pre-char"
                  style={{
                    transform: `translate3d(0, ${(1 - cp) * 110}%, 0)`,
                    opacity: 0.1 + cp * 0.9,
                  }}
                >
                  {c}
                </span>
              </span>
            );
          })}
        </h1>

        <div className="pre-meta">
          <div className="pre-meta-col">
            <span className="pre-mono pre-meta-k">SYSTEM</span>
            <span className="pre-mono pre-meta-v">{STATUSES[statusIdx]}</span>
          </div>
          <div className="pre-meta-col pre-meta-col--right">
            <span className="pre-mono pre-meta-k">CHANNEL</span>
            <span className="pre-mono pre-meta-v">TLS 1.3 · QUIC · 0-RTT</span>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="pre-marquee" aria-hidden>
        <div className="pre-marquee-track">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="pre-marquee-item">
              ROUTE · INSPECT · SCORE · DECIDE · OBSERVE — ROUTE · INSPECT · SCORE · DECIDE · OBSERVE — 
            </span>
          ))}
        </div>
      </div>

      {/* Progress rule */}
      <div className="pre-rule">
        <span className="pre-rule-fill" style={{ transform: `scaleX(${progress})` }} />
        <span className="pre-rule-tick" style={{ left: `${progress * 100}%` }} />
      </div>

      {/* Diagonal panel curtain reveal */}
      <div className="pre-curtain pre-curtain-a" />
      <div className="pre-curtain pre-curtain-b" />
    </div>
  );
}
