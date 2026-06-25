import { useEffect, useRef, type ReactNode } from "react";

type Props = { children: ReactNode; onClick?: () => void };

export function MagneticButton({ children, onClick }: Props) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const range = 180;
      if (dist < range) {
        const f = (1 - dist / range) * 0.4;
        el.style.transform = `translate(${dx * f}px, ${dy * f}px)`;
      } else {
        el.style.transform = "translate(0,0)";
      }
    };
    const onLeave = () => { el.style.transform = "translate(0,0)"; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <button ref={ref} className="cta-button" onClick={onClick}>
      {children}
    </button>
  );
}
