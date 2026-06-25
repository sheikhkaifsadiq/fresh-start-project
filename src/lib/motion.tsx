import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";

/* -------------------------------------------------------------------------- */
/*  Global pointer + scroll bus                                                */
/* -------------------------------------------------------------------------- */

type Pointer = { x: number; y: number; nx: number; ny: number; vx: number; vy: number };

const PointerCtx = createContext<{ ref: { current: Pointer } } | null>(null);

export function MotionProvider({ children }: { children: ReactNode }) {
  const ref = useRef<Pointer>({ x: 0, y: 0, nx: 0, ny: 0, vx: 0, vy: 0 });

  useEffect(() => {
    let last = { x: 0, y: 0, t: performance.now() };
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      const dt = Math.max(1, now - last.t);
      const vx = (e.clientX - last.x) / dt;
      const vy = (e.clientY - last.y) / dt;
      ref.current.x = e.clientX;
      ref.current.y = e.clientY;
      ref.current.nx = (e.clientX / window.innerWidth) * 2 - 1;
      ref.current.ny = (e.clientY / window.innerHeight) * 2 - 1;
      ref.current.vx = vx;
      ref.current.vy = vy;
      last = { x: e.clientX, y: e.clientY, t: now };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return <PointerCtx.Provider value={{ ref }}>{children}</PointerCtx.Provider>;
}

export function usePointer() {
  const ctx = useContext(PointerCtx);
  return ctx?.ref ?? { current: { x: 0, y: 0, nx: 0, ny: 0, vx: 0, vy: 0 } };
}

/* -------------------------------------------------------------------------- */
/*  Reduced motion                                                             */
/* -------------------------------------------------------------------------- */

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
    m.addEventListener("change", fn);
    return () => m.removeEventListener("change", fn);
  }, []);
  return reduced;
}

/* -------------------------------------------------------------------------- */
/*  Element scroll progress (0 = entering, 0.5 = centered, 1 = leaving)        */
/* -------------------------------------------------------------------------- */

export function useElementProgress<T extends HTMLElement>(
  onFrame: (p: number, raw: number) => void,
  opts: { range?: [number, number]; clamp?: boolean } = {}
) {
  const ref = useRef<T | null>(null);
  const cbRef = useRef(onFrame);
  cbRef.current = onFrame;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let visible = false;
    const io = new IntersectionObserver(
      (es) => {
        visible = es.some((e) => e.isIntersecting);
      },
      { threshold: [0, 0.001, 0.999, 1], rootMargin: "20% 0px 20% 0px" }
    );
    io.observe(el);

    const [r0, r1] = opts.range ?? [0, 1];
    const clamp = opts.clamp ?? true;

    const loop = () => {
      if (visible) {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        // raw: 0 when bottom of viewport hits top of element, 1 when top of viewport passes bottom
        const raw = (vh - rect.top) / (vh + rect.height);
        let p = (raw - r0) / (r1 - r0);
        if (clamp) p = Math.min(1, Math.max(0, p));
        cbRef.current(p, raw);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}

/* -------------------------------------------------------------------------- */
/*  Parallax helpers                                                           */
/* -------------------------------------------------------------------------- */

export function useParallax<T extends HTMLElement>(speed = 0.2, axis: "y" | "x" = "y") {
  return useElementProgress<T>((p) => {
    const el = (ref as any).current as HTMLElement | null;
    if (!el) return;
    const offset = (p - 0.5) * 200 * speed;
    el.style.transform =
      axis === "y"
        ? `translate3d(0, ${offset}px, 0)`
        : `translate3d(${offset}px, 0, 0)`;
  });

  // (ref is the return of useElementProgress; this fn assigns to el inside callback)
  // Note: keeping closure-style for ergonomics
  // eslint-disable-next-line
  var ref: any;
}

// Cleaner version
export function useParallaxRef<T extends HTMLElement>(speed = 0.2, axis: "y" | "x" = "y") {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let visible = false;
    const io = new IntersectionObserver(
      (es) => (visible = es.some((e) => e.isIntersecting)),
      { rootMargin: "30% 0px" }
    );
    io.observe(el);
    const loop = () => {
      if (visible) {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const center = rect.top + rect.height / 2;
        const dist = center - vh / 2;
        const t = dist * speed * -1;
        el.style.transform =
          axis === "y"
            ? `translate3d(0, ${t}px, 0)`
            : `translate3d(${t}px, 0, 0)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [speed, axis]);
  return ref;
}

/* -------------------------------------------------------------------------- */
/*  Magnetic hover                                                             */
/* -------------------------------------------------------------------------- */

export function useMagnetic<T extends HTMLElement>(strength = 0.35, radius = 160) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    let active = false;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const ex = rect.left + rect.width / 2;
      const ey = rect.top + rect.height / 2;
      const dx = e.clientX - ex;
      const dy = e.clientY - ey;
      const d = Math.hypot(dx, dy);
      if (d < radius) {
        active = true;
        tx = dx * strength;
        ty = dy * strength;
      } else if (active) {
        active = false;
        tx = 0; ty = 0;
      }
    };
    const onLeave = () => { tx = 0; ty = 0; };

    const loop = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      el.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [strength, radius]);
  return ref;
}

/* -------------------------------------------------------------------------- */
/*  Tilt                                                                       */
/* -------------------------------------------------------------------------- */

export function useTilt<T extends HTMLElement>(max = 8, scale = 1.01) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let rx = 0, ry = 0, cx = 0, cy = 0, sc = 1, tsc = 1;
    let inside = false;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      ry = (px - 0.5) * max * 2;
      rx = -(py - 0.5) * max * 2;
      tsc = scale;
      inside = true;
    };
    const onLeave = () => { rx = 0; ry = 0; tsc = 1; inside = false; };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);

    const loop = () => {
      cx += (rx - cx) * 0.12;
      cy += (ry - cy) * 0.12;
      sc += (tsc - sc) * 0.12;
      el.style.transform = `perspective(1100px) rotateX(${cx.toFixed(2)}deg) rotateY(${cy.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      void inside;
    };
  }, [max, scale]);
  return ref;
}

/* -------------------------------------------------------------------------- */
/*  Pointer parallax (children move in response to global cursor)              */
/* -------------------------------------------------------------------------- */

export function usePointerParallax<T extends HTMLElement>(strength = 12) {
  const ref = useRef<T | null>(null);
  const pointer = usePointer();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let cx = 0, cy = 0;
    const loop = () => {
      const { nx, ny } = pointer.current;
      cx += (nx * strength - cx) * 0.06;
      cy += (ny * strength - cy) * 0.06;
      el.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [strength, pointer]);
  return ref;
}

/* -------------------------------------------------------------------------- */
/*  In-view                                                                    */
/* -------------------------------------------------------------------------- */

export function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (e.isIntersecting) { setSeen(true); io.disconnect(); }
      }),
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen] as const;
}

/* -------------------------------------------------------------------------- */
/*  Kinetic Headline — char/word reveal w/ clip-path mask                      */
/* -------------------------------------------------------------------------- */

type KineticProps = {
  text: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  style?: CSSProperties;
  split?: "word" | "char";
  delay?: number;
  stagger?: number;
  duration?: number;
  from?: "bottom" | "top" | "left" | "right";
  italicWords?: number[];
};

export function Kinetic({
  text,
  as: Tag = "h2",
  className = "",
  style,
  split = "word",
  delay = 0,
  stagger,
  duration = 1100,
  from = "bottom",
  italicWords = [],
}: KineticProps) {
  const [ref, seen] = useInView<HTMLElement>(0.2);
  const reduced = usePrefersReducedMotion();
  const words = useMemo(() => text.split(" "), [text]);
  const sg = stagger ?? (split === "char" ? 22 : 60);

  const trIn = "translate3d(0,0,0)";
  const trOut =
    from === "bottom" ? "translate3d(0,110%,0)" :
    from === "top"    ? "translate3d(0,-110%,0)" :
    from === "left"   ? "translate3d(-110%,0,0)" : "translate3d(110%,0,0)";

  const Comp = Tag as any;
  return (
    <Comp ref={ref as any} className={`kinetic ${className}`} style={style} aria-label={text}>
      {words.map((w, wi) => {
        const isEm = italicWords.includes(wi);
        if (split === "char") {
          return (
            <span className="kw" key={wi} aria-hidden>
              {[...w].map((c, ci) => {
                const idx = words.slice(0, wi).reduce((a, b) => a + b.length, 0) + ci;
                const d = reduced ? 0 : delay + idx * sg;
                return (
                  <span className="kc" key={ci}>
                    <span
                      className={isEm ? "ki em" : "ki"}
                      style={{
                        transform: seen || reduced ? trIn : trOut,
                        transition: `transform ${duration}ms cubic-bezier(0.2, 0.8, 0.2, 1) ${d}ms`,
                      }}
                    >{c}</span>
                  </span>
                );
              })}
              {wi < words.length - 1 && <span className="ksp">&nbsp;</span>}
            </span>
          );
        }
        const d = reduced ? 0 : delay + wi * sg;
        return (
          <span className="kw" key={wi} aria-hidden>
            <span
              className={isEm ? "ki em" : "ki"}
              style={{
                transform: seen || reduced ? trIn : trOut,
                transition: `transform ${duration}ms cubic-bezier(0.2, 0.8, 0.2, 1) ${d}ms`,
              }}
            >{w}</span>
            {wi < words.length - 1 && <span className="ksp">&nbsp;</span>}
          </span>
        );
      })}
    </Comp>
  );
}

/* -------------------------------------------------------------------------- */
/*  Mask reveal block (clip-path inset)                                        */
/* -------------------------------------------------------------------------- */

export function Mask({
  children,
  delay = 0,
  duration = 1200,
  direction = "up",
  className = "",
  style,
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right";
  className?: string;
  style?: CSSProperties;
}) {
  const [ref, seen] = useInView<HTMLDivElement>(0.15);
  const reduced = usePrefersReducedMotion();
  const closed =
    direction === "up"    ? "inset(0 0 100% 0)" :
    direction === "down"  ? "inset(100% 0 0 0)" :
    direction === "left"  ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)";
  return (
    <div
      ref={ref}
      className={`mask-reveal ${className}`}
      style={{
        ...style,
        clipPath: seen || reduced ? "inset(0 0 0 0)" : closed,
        WebkitClipPath: seen || reduced ? "inset(0 0 0 0)" : closed,
        transition: `clip-path ${duration}ms cubic-bezier(0.76, 0, 0.24, 1) ${delay}ms, -webkit-clip-path ${duration}ms cubic-bezier(0.76, 0, 0.24, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Count-up tied to view                                                      */
/* -------------------------------------------------------------------------- */

export function CountUp({
  to,
  duration = 1600,
  format = (n) => n.toLocaleString(),
  className,
  style,
}: {
  to: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
  style?: CSSProperties;
}) {
  const [ref, seen] = useInView<HTMLSpanElement>(0.4);
  const [v, setV] = useState(0);
  useLayoutEffect(() => {
    if (!seen) return;
    let raf = 0;
    const start = performance.now();
    const loop = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setV(Math.round(to * eased));
      if (k < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [seen, to, duration]);
  return <span ref={ref} className={className} style={style}>{format(v)}</span>;
}
