import { useEffect, useState } from "react";

export function Preloader() {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Skip for reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDone(true);
      setTimeout(() => setGone(true), 50);
      return;
    }

    const start = performance.now();
    const duration = 1800;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - k, 3);
      setProgress(eased);
      if (k < 1) raf = requestAnimationFrame(tick);
      else {
        setTimeout(() => setDone(true), 220);
        setTimeout(() => setGone(true), 1400);
      }
    };
    raf = requestAnimationFrame(tick);

    // Lock scroll while loading
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (done) document.body.style.overflow = "";
  }, [done]);

  if (gone) return null;

  const pct = Math.round(progress * 100);
  const brand = "AEGISROUTE";
  const revealCount = Math.floor(progress * brand.length);

  return (
    <div className={`preloader ${done ? "is-done" : ""}`} aria-hidden={done}>
      <div className="pre-grid" />

      <div className="pre-top">
        <span className="pre-mono">AR / 2026 — SYSTEM BOOT</span>
        <span className="pre-mono">EDGE · ROUTING · SHIELD</span>
      </div>

      <div className="pre-center">
        <div className="pre-eyebrow pre-mono">
          <span className="pre-dot" />
          Calibrating edge nodes
        </div>
        <h1 className="pre-brand" aria-label="AegisRoute">
          {brand.split("").map((c, i) => (
            <span
              key={i}
              className="pre-char"
              style={{
                opacity: i < revealCount ? 1 : 0.08,
                transform: i < revealCount ? "translateY(0)" : "translateY(0.35em)",
                transition: "opacity 420ms var(--ease-out), transform 620ms var(--ease-out)",
                transitionDelay: `${i * 18}ms`,
              }}
            >
              {c}
            </span>
          ))}
        </h1>
        <div className="pre-tag pre-mono">A smarter route for every link.</div>
      </div>

      <div className="pre-bottom">
        <div className="pre-mono pre-pct">{String(pct).padStart(3, "0")}</div>
        <div className="pre-rule">
          <span className="pre-rule-fill" style={{ transform: `scaleX(${progress})` }} />
        </div>
        <div className="pre-mono pre-status">
          {progress < 0.33 ? "LINKING NODES" : progress < 0.66 ? "WARMING MODELS" : progress < 1 ? "TUNING SIGNAL" : "READY"}
        </div>
      </div>

      <div className="pre-curtain pre-curtain-top" />
      <div className="pre-curtain pre-curtain-bot" />
    </div>
  );
}
