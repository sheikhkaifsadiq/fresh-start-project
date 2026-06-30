import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";

/* ============================================================
   Reveal — per-element in/out animation with 12 directions.
   Uses IntersectionObserver so each element animates as it enters
   AND leaves the viewport (so scrolling back up replays).
   ============================================================ */

export type RevealVariant =
  | "up" | "down" | "left" | "right"
  | "zoom" | "zoom-out"
  | "rot-l" | "rot-r"
  | "flip-x" | "flip-y"
  | "skew" | "blur"
  | "swing" | "clip-l" | "clip-r" | "clip-up" | "clip-down"
  | "elastic" | "drop" | "rise"
  | "split" | "pop";

const VARIANT_STYLES: Record<RevealVariant, { from: CSSProperties; to: CSSProperties }> = {
  up:        { from: { opacity: 0, transform: "translate3d(0,40px,0)" },              to: { opacity: 1, transform: "translate3d(0,0,0)" } },
  down:      { from: { opacity: 0, transform: "translate3d(0,-40px,0)" },             to: { opacity: 1, transform: "translate3d(0,0,0)" } },
  left:      { from: { opacity: 0, transform: "translate3d(-60px,0,0)" },             to: { opacity: 1, transform: "translate3d(0,0,0)" } },
  right:     { from: { opacity: 0, transform: "translate3d(60px,0,0)" },              to: { opacity: 1, transform: "translate3d(0,0,0)" } },
  zoom:      { from: { opacity: 0, transform: "scale(.78)" },                         to: { opacity: 1, transform: "scale(1)" } },
  "zoom-out":{ from: { opacity: 0, transform: "scale(1.22)" },                        to: { opacity: 1, transform: "scale(1)" } },
  "rot-l":   { from: { opacity: 0, transform: "rotate(-14deg) translate3d(-20px,20px,0)" }, to: { opacity: 1, transform: "rotate(0) translate3d(0,0,0)" } },
  "rot-r":   { from: { opacity: 0, transform: "rotate(14deg) translate3d(20px,20px,0)" },   to: { opacity: 1, transform: "rotate(0) translate3d(0,0,0)" } },
  "flip-x":  { from: { opacity: 0, transform: "perspective(1200px) rotateX(72deg)" }, to: { opacity: 1, transform: "perspective(1200px) rotateX(0)" } },
  "flip-y":  { from: { opacity: 0, transform: "perspective(1200px) rotateY(-72deg)" }, to: { opacity: 1, transform: "perspective(1200px) rotateY(0)" } },
  skew:      { from: { opacity: 0, transform: "skewY(8deg) translate3d(0,30px,0)" },  to: { opacity: 1, transform: "skewY(0) translate3d(0,0,0)" } },
  blur:      { from: { opacity: 0, filter: "blur(18px)", transform: "scale(1.04)" },  to: { opacity: 1, filter: "blur(0)", transform: "scale(1)" } },
  swing:     { from: { opacity: 0, transform: "rotate(-22deg) translate3d(0,-30px,0)", transformOrigin: "top center" }, to: { opacity: 1, transform: "rotate(0)" } },
  "clip-l":  { from: { opacity: 0, clipPath: "inset(0 100% 0 0)" },                   to: { opacity: 1, clipPath: "inset(0 0 0 0)" } },
  "clip-r":  { from: { opacity: 0, clipPath: "inset(0 0 0 100%)" },                   to: { opacity: 1, clipPath: "inset(0 0 0 0)" } },
  "clip-up": { from: { opacity: 0, clipPath: "inset(100% 0 0 0)" },                   to: { opacity: 1, clipPath: "inset(0 0 0 0)" } },
  "clip-down":{ from: { opacity: 0, clipPath: "inset(0 0 100% 0)" },                  to: { opacity: 1, clipPath: "inset(0 0 0 0)" } },
  elastic:   { from: { opacity: 0, transform: "scale(.4) rotate(-8deg)" },            to: { opacity: 1, transform: "scale(1) rotate(0)" } },
  drop:      { from: { opacity: 0, transform: "translate3d(0,-120px,0) scale(.9)" },  to: { opacity: 1, transform: "translate3d(0,0,0) scale(1)" } },
  rise:      { from: { opacity: 0, transform: "translate3d(0,120px,0) scale(.9)" },   to: { opacity: 1, transform: "translate3d(0,0,0) scale(1)" } },
  split:     { from: { opacity: 0, clipPath: "inset(45% 0 45% 0)", transform: "scale(.95)" }, to: { opacity: 1, clipPath: "inset(0 0 0 0)", transform: "scale(1)" } },
  pop:       { from: { opacity: 0, transform: "scale(.2)" },                          to: { opacity: 1, transform: "scale(1)" } },
};

const EASE_BY_VARIANT: Record<string, string> = {
  elastic: "cubic-bezier(.34,1.56,.64,1)",
  pop:     "cubic-bezier(.34,1.56,.64,1)",
  drop:    "cubic-bezier(.6,-0.28,.4,1.6)",
  rise:    "cubic-bezier(.2,.7,.15,1)",
  swing:   "cubic-bezier(.34,1.56,.64,1)",
};

export function Reveal({
  v = "up",
  delay = 0,
  duration = 900,
  className = "",
  as: Tag = "div",
  children,
  amount = 0.18,
  style,
  magnet = false,
}: {
  v?: RevealVariant;
  delay?: number;
  duration?: number;
  className?: string;
  as?: any;
  children: ReactNode;
  amount?: number;
  style?: CSSProperties;
  /** subtle cursor attraction (translate toward pointer) */
  magnet?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const inViewRef = useRef(false);
  const { from, to } = VARIANT_STYLES[v];
  const ease = EASE_BY_VARIANT[v] ?? "cubic-bezier(.2,.7,.15,1)";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Set initial "from" state
    Object.assign(el.style, from as any);
    el.style.transition = `transform ${duration}ms ${ease} ${delay}ms, opacity ${duration}ms ease ${delay}ms, filter ${duration}ms ease ${delay}ms, clip-path ${duration}ms ${ease} ${delay}ms`;
    el.style.willChange = "transform, opacity, filter, clip-path";

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          Object.assign(el.style, to as any);
          inViewRef.current = true;
        } else {
          Object.assign(el.style, from as any);
          inViewRef.current = false;
        }
      }
    }, { threshold: [0, amount] });
    io.observe(el);

    let cleanupMag: (() => void) | undefined;
    if (magnet) {
      let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;
      const onMove = (ev: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const dx = ev.clientX - (r.left + r.width / 2);
        const dy = ev.clientY - (r.top + r.height / 2);
        const dist = Math.hypot(dx, dy);
        const radius = Math.max(r.width, r.height);
        if (dist < radius * 1.4) {
          const k = 1 - dist / (radius * 1.4);
          tx = dx * 0.06 * k;
          ty = dy * 0.06 * k;
        } else { tx = 0; ty = 0; }
      };
      const tick = () => {
        cx += (tx - cx) * 0.12;
        cy += (ty - cy) * 0.12;
        if (inViewRef.current) {
          el.style.transform = `${(to.transform as string) || ""} translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
        }
        raf = requestAnimationFrame(tick);
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      raf = requestAnimationFrame(tick);
      cleanupMag = () => { window.removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); };
    }

    return () => { io.disconnect(); cleanupMag?.(); };
  }, [from, to, ease, delay, duration, amount, magnet]);

  return <Tag ref={ref} className={className} style={style}>{children}</Tag>;
}
