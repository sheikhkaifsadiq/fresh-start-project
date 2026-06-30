import { useEffect, useState } from "react";

/**
 * Cinematic preloader — count-up + chrome counter.
 *  - finishes when document is loaded AND a minimum stage time has elapsed
 *  - reveals via translateY(-100%) curtain
 */
export function CinematicPreloader({
  minMs = 900,
  onDone,
}: {
  minMs?: number;
  onDone?: () => void;
}) {
  const [pct, setPct] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;

    const ready = () =>
      document.readyState === "complete" ||
      document.readyState === "interactive";

    const tick = (t: number) => {
      const elapsed = t - start;
      // Asymptotic curve toward 90% until ready, then snap to 100
      const cap = ready() && elapsed > minMs ? 1 : 0.93;
      setPct((prev) => {
        const next = prev + (cap - prev) * 0.06;
        return next < cap ? next : cap;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [minMs]);

  useEffect(() => {
    if (pct < 0.995) return;
    const t1 = window.setTimeout(() => setHidden(true), 220);
    const t2 = window.setTimeout(() => onDone?.(), 1100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [pct, onDone]);

  const n = Math.min(100, Math.round(pct * 100));

  return (
    <div className={`cine-preloader${hidden ? " gone" : ""}`} aria-hidden={hidden}>
      <div>
        <div className="num">
          {String(n).padStart(3, "0")}<em>.</em>
        </div>
      </div>
      <div className="meta">
        <span>Aegis · Route</span>
        <span>Spinning up edge intelligence</span>
        <span>v1 — 38 regions online</span>
      </div>
      <div className="bar"><i style={{ transform: `scaleX(${pct})` }} /></div>
    </div>
  );
}
