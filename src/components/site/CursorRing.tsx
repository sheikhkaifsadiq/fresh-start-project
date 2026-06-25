import { useEffect, useRef, useState } from "react";

export function CursorRing() {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (matchMedia("(hover: none)").matches) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let x = -100, y = -100, tx = -100, ty = -100;
    const onMove = (e: PointerEvent) => { tx = e.clientX; ty = e.clientY; };
    const onOver = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      setHover(!!t?.closest("a, button, .tilt, .magnetic, input"));
    };
    const loop = () => {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      el.style.transform = `translate3d(${x - 14}px, ${y - 14}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
    };
  }, []);

  return <div ref={ref} className={`cursor-ring ${hover ? "is-hover" : ""}`} aria-hidden />;
}
