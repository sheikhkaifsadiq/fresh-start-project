import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";

/**
 * Single shared RAF / pointer / scroll bus.
 * Every animated layer subscribes here so all writes happen in one frame,
 * in deterministic order: scroll → pointer → scene → DOM.
 *
 * This eliminates the "everything moves independently" feel and is what
 * lets the page behave as one interconnected system.
 */
export type StageFrame = {
  t: number;            // seconds since stage start
  dt: number;           // seconds since last frame
  scrollY: number;
  scrollMax: number;
  scrollProgress: number; // 0..1
  scrollV: number;        // smoothed scroll velocity, signed, ~px/ms
  scrollVAbs: number;     // smoothed |velocity|, 0..1 normalised
  vh: number;
  vw: number;
  // pointer (smoothed)
  px: number;  py: number;     // raw px
  nx: number;  ny: number;     // -1..1 normalised
  sx: number;  sy: number;     // smoothed normalised
  vx: number;  vy: number;     // velocity px/ms
  speed: number;               // smoothed |velocity| 0..1
};

type Subscriber = (f: StageFrame) => void;

type StageApi = {
  subscribe: (fn: Subscriber) => () => void;
  frame: { current: StageFrame };
};

const StageCtx = createContext<StageApi | null>(null);

const initFrame = (): StageFrame => ({
  t: 0, dt: 0,
  scrollY: 0, scrollMax: 1, scrollProgress: 0, scrollV: 0, scrollVAbs: 0,
  vh: typeof window !== "undefined" ? window.innerHeight : 800,
  vw: typeof window !== "undefined" ? window.innerWidth  : 1280,
  px: 0, py: 0, nx: 0, ny: 0, sx: 0, sy: 0,
  vx: 0, vy: 0, speed: 0,
});

export function StageProvider({ children }: { children: ReactNode }) {
  const frame = useRef<StageFrame>(initFrame());
  const subs = useRef<Set<Subscriber>>(new Set());

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const start = last;

    // raw pointer
    let rpx = window.innerWidth / 2;
    let rpy = window.innerHeight / 2;
    let lpx = rpx, lpy = rpy, ltp = last;

    const onMove = (e: PointerEvent) => {
      rpx = e.clientX;
      rpy = e.clientY;
    };
    const onResize = () => {
      frame.current.vw = window.innerWidth;
      frame.current.vh = window.innerHeight;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", onResize);

    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const f = frame.current;
      f.t = (now - start) / 1000;
      f.dt = dt;

      // scroll
      f.scrollY = window.scrollY;
      f.scrollMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      f.scrollProgress = Math.min(1, Math.max(0, f.scrollY / f.scrollMax));

      // pointer velocity
      const ptDt = Math.max(1, now - ltp);
      f.vx = (rpx - lpx) / ptDt;
      f.vy = (rpy - lpy) / ptDt;
      lpx = rpx; lpy = rpy; ltp = now;

      // normalised + smoothed pointer
      f.px = rpx; f.py = rpy;
      f.nx = (rpx / f.vw) * 2 - 1;
      f.ny = (rpy / f.vh) * 2 - 1;
      const k = 1 - Math.pow(0.001, dt); // critically-damped lerp factor
      f.sx += (f.nx - f.sx) * k;
      f.sy += (f.ny - f.sy) * k;
      const speed = Math.min(1, Math.hypot(f.vx, f.vy) / 2.2);
      f.speed += (speed - f.speed) * Math.min(1, dt * 6);

      subs.current.forEach((s) => s(f));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const api: StageApi = {
    frame,
    subscribe(fn) {
      subs.current.add(fn);
      return () => { subs.current.delete(fn); };
    },
  };

  return <StageCtx.Provider value={api}>{children}</StageCtx.Provider>;
}

export function useStage() {
  const ctx = useContext(StageCtx);
  if (!ctx) {
    // Fallback so components don't crash if rendered outside a provider (e.g. SSR / tests)
    const ref = useRef<StageFrame>(initFrame());
    return { subscribe: () => () => {}, frame: ref } as StageApi;
  }
  return ctx;
}

/** Subscribe to every stage frame. Callback receives the shared frame state. */
export function useStageFrame(cb: (f: StageFrame) => void) {
  const stage = useStage();
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => stage.subscribe((f) => ref.current(f)), [stage]);
}
