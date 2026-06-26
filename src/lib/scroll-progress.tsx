import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import Lenis from "lenis";

type ProgressRef = { current: number };
type Sub = (p: number) => void;

const Ctx = createContext<{
  ref: ProgressRef;
  subscribe: (fn: Sub) => () => void;
} | null>(null);

export function ScrollProgressProvider({ children }: { children: ReactNode }) {
  const ref = useRef<number>(0);
  const subs = useRef<Set<Sub>>(new Set());

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.35,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.1,
    });

    const onOwnedScroll = (event: Event) => {
      const active = Boolean((event as CustomEvent<{ active?: boolean }>).detail?.active);
      if (active) lenis.stop();
      else lenis.start();
    };
    window.addEventListener("aegis:scroll-owner", onOwnedScroll as EventListener);

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, window.scrollY / max));
      ref.current = p;
      subs.current.forEach((fn) => fn(p));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("aegis:scroll-owner", onOwnedScroll as EventListener);
      lenis.destroy();
    };
  }, []);

  const api = useMemo(
    () => ({
      ref: ref as ProgressRef,
      subscribe(fn: Sub) {
        subs.current.add(fn);
        fn(ref.current);
        return () => {
          subs.current.delete(fn);
        };
      },
    }),
    []
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProgressRef(): ProgressRef {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProgressRef outside ScrollProgressProvider");
  return ctx.ref;
}

export function useProgressSubscribe(fn: Sub) {
  const ctx = useContext(Ctx);
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!ctx) return;
    return ctx.subscribe((p) => ref.current(p));
  }, [ctx]);
}
