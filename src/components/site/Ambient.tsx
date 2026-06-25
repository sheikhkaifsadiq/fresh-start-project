import { useEffect, useRef } from "react";
import { usePointer } from "../../lib/motion";

/**
 * Fixed, low-opacity background field that reacts to pointer + scroll.
 * Two large radial "lamps" drift on a long lerp behind everything,
 * plus a soft grain layer. Never the hero; just ambient depth.
 */
export function Ambient() {
  const ref = useRef<HTMLDivElement>(null);
  const pointer = usePointer();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let cx = 50, cy = 30, dx = 60, dy = 70;
    const loop = () => {
      const { nx, ny } = pointer.current;
      const y = window.scrollY;
      const targetCx = 50 + nx * 10;
      const targetCy = 30 + ny * 8 + y * 0.01;
      const targetDx = 60 - nx * 12;
      const targetDy = 70 - ny * 10 - y * 0.008;
      cx += (targetCx - cx) * 0.04;
      cy += (targetCy - cy) * 0.04;
      dx += (targetDx - dx) * 0.04;
      dy += (targetDy - dy) * 0.04;
      el.style.setProperty("--ax", `${cx.toFixed(2)}%`);
      el.style.setProperty("--ay", `${cy.toFixed(2)}%`);
      el.style.setProperty("--bx", `${dx.toFixed(2)}%`);
      el.style.setProperty("--by", `${dy.toFixed(2)}%`);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [pointer]);

  return <div ref={ref} className="ambient" aria-hidden />;
}
