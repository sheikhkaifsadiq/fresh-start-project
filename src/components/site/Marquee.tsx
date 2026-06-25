import { useEffect, useRef, type ReactNode } from "react";

export function Marquee({
  children,
  speed = 40,
  direction = "left",
  className = "",
}: {
  children: ReactNode;
  speed?: number; // px/sec
  direction?: "left" | "right";
  className?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let raf = 0;
    let x = 0;
    let last = performance.now();
    const sign = direction === "left" ? -1 : 1;
    const loop = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      x += sign * speed * dt;
      const w = el.scrollWidth / 2;
      if (w > 0) {
        if (x <= -w) x += w;
        if (x >= 0 && sign === 1) x -= w;
      }
      el.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [speed, direction]);

  return (
    <div className={`marquee ${className}`}>
      <div ref={track} className="marquee-track">
        <div className="marquee-group">{children}</div>
        <div className="marquee-group" aria-hidden>{children}</div>
      </div>
    </div>
  );
}
