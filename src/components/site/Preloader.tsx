import { useEffect, useState } from "react";

const STATUSES = [
  "INITIALIZING EDGE MESH",
  "LINKING 312 NODES",
  "WARMING ML MODELS",
  "CALIBRATING THREAT FEED",
  "TUNING SIGNAL",
  "HANDSHAKE COMPLETE",
];

const MARQUEE = "AEGISROUTE — INTELLIGENT URL ROUTING — EDGE NETWORK — AI THREAT DETECTION — REAL-TIME ANALYTICS — ";

export function Preloader() {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(1);
      setDone(true);
      setTimeout(() => setGone(true), 50);
      return;
    }

    const start = performance.now();
    const duration = 2600;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - k, 2.2);
      setProgress(eased);
      if (k < 1) raf = requestAnimationFrame(tick);
      else {
        setTimeout(() => setDone(true), 280);
        setTimeout(() => setGone(true), 1800);
      }
    };
    raf = requestAnimationFrame(tick);

    const statusTimer = setInterval(() => {
      setStatusIdx((i) => (i + 1) % STATUSES.length);
    }, 360);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(statusTimer);
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (done) document.body.style.overflow = "";
  }, [done]);

  if (gone) return null;

  const pct = Math.min(100, Math.round(progress * 100));
  const pctStr = String(pct).padStart(3, "0");
  const brand = "AEGISROUTE";

  return (
    <div className={`preloader ${done ? "is-done" : ""}`} aria-hidden={done}>
      <div className="pre-noise" />
      <div className="pre-grid" />

      {/* Top chrome */}
      <header className="pre-top">
        <div className="pre-mono pre-top-l">
          <span className="pre-dot" />
          <span>AR · BOOT SEQUENCE</span>
        </div>
        <div className="pre-mono pre-top-c">N 37.7749° · W 122.4194° / SFO-EDGE-01</div>
        <div className="pre-mono pre-top-r">© 2026 / V1.0.0</div>
      </header>

      {/* Center stage */}
      <section className="pre-stage">
        <div className="pre-counter" aria-label={`Loading ${pct}%`}>
          <span className="pre-counter-num">{pctStr}</span>
          <span className="pre-counter-pct">%</span>
        </div>

        <h1 className="pre-brand" aria-label={brand}>
          {brand.split("").map((c, i) => {
            const charProgress = Math.max(0, Math.min(1, progress * brand.length - i));
            return (
              <span key={i} className="pre-char-wrap">
                <span
                  className="pre-char"
                  style={{
                    transform: `translateY(${(1 - charProgress) * 100}%)`,
                    opacity: 0.15 + charProgress * 0.85,
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
            <span className="pre-mono pre-meta-v">SECURE / TLS 1.3</span>
          </div>
        </div>
      </section>

      {/* Marquee strip */}
      <div className="pre-marquee">
        <div className="pre-marquee-track">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="pre-marquee-item">{MARQUEE}</span>
          ))}
        </div>
      </div>

      {/* Progress rule */}
      <div className="pre-rule">
        <span className="pre-rule-fill" style={{ transform: `scaleX(${progress})` }} />
        <span className="pre-rule-tick" style={{ left: `${progress * 100}%` }} />
      </div>

      {/* Curtain reveal */}
      <div className="pre-curtain pre-curtain-top" />
      <div className="pre-curtain pre-curtain-bot" />
    </div>
  );
}
