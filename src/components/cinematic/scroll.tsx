import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

/**
 * Single source of scroll truth for the cinematic landing.
 *  - Uses Lenis (already in stack) for smooth scrolling on desktop.
 *  - Exposes:
 *      progress01      0 → 1 across the full document
 *      chapter         current chapter index (float, e.g. 2.37)
 *      chapterCount    total chapters
 *      subscribe(fn)   per-frame callback for WebGL camera
 */

type Frame = { p: number; c: number; v: number };
type Subscriber = (f: Frame) => void;

type Ctx = {
  chapterCount: number;
  subscribe: (fn: Subscriber) => () => void;
  /** read latest frame (no render) */
  read: () => Frame;
  /** React state mirror, updated rAF-throttled, for non-canvas UI */
  progress01: number;
  chapter: number;
};

const ScrollCtx = createContext<Ctx | null>(null);

export function CinematicScrollProvider({
  children,
  chapterCount,
}: {
  children: ReactNode;
  chapterCount: number;
}) {
  const subsRef = useRef<Set<Subscriber>>(new Set());
  const frameRef = useRef<Frame>({ p: 0, c: 0, v: 0 });
  const [mirror, setMirror] = useState<{ p: number; c: number }>({ p: 0, c: 0 });

  useEffect(() => {
    let raf = 0;
    let lenis: any = null;
    let mirrorAcc = 0;
    let lastP = 0;
    let lastT = performance.now();

    const tick = (t: number) => {
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      const y = window.scrollY || window.pageYOffset || 0;
      const p = Math.max(0, Math.min(1, y / max));
      const dt = Math.max(1, t - lastT); lastT = t;
      const v = (p - lastP) / (dt / 1000); lastP = p;
      const c = p * (chapterCount - 1);
      const f: Frame = { p, c, v };
      frameRef.current = f;
      for (const fn of subsRef.current) fn(f);

      // Throttle React mirror to ~10fps
      mirrorAcc += dt;
      if (mirrorAcc > 100) {
        mirrorAcc = 0;
        setMirror((prev) => (Math.abs(prev.p - p) > 0.001 ? { p, c } : prev));
      }
      raf = requestAnimationFrame(tick);
    };

    // Init Lenis (graceful if anything goes wrong)
    (async () => {
      try {
        const Lenis = (await import("lenis")).default;
        lenis = new Lenis({
          duration: 1.05,
          easing: (x: number) => 1 - Math.pow(1 - x, 3),
          smoothWheel: true,
          touchMultiplier: 1.2,
        });
        const lenisRaf = (time: number) => {
          lenis?.raf(time);
          requestAnimationFrame(lenisRaf);
        };
        requestAnimationFrame(lenisRaf);
      } catch {
        /* fall back to native scroll */
      }
    })();

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      try { lenis?.destroy?.(); } catch { /* noop */ }
    };
  }, [chapterCount]);

  const ctx = useMemo<Ctx>(
    () => ({
      chapterCount,
      subscribe: (fn) => {
        subsRef.current.add(fn);
        fn(frameRef.current);
        return () => subsRef.current.delete(fn);
      },
      read: () => frameRef.current,
      progress01: mirror.p,
      chapter: mirror.c,
    }),
    [chapterCount, mirror],
  );

  return <ScrollCtx.Provider value={ctx}>{children}</ScrollCtx.Provider>;
}

export function useCinematicScroll() {
  const c = useContext(ScrollCtx);
  if (!c) throw new Error("useCinematicScroll must be used inside CinematicScrollProvider");
  return c;
}
