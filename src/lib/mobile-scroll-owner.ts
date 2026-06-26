import { useEffect, useRef } from "react";

type OwnedRef = { current: HTMLElement | null };

type OwnedScrollOptions = {
  enabled?: boolean;
  maxWidth?: number;
  sectionRef: OwnedRef;
  triggerRef: OwnedRef;
  steps: number;
  pxPerStep?: number;
  onProgress: (progress: number) => void;
  onActiveChange?: (active: boolean) => void;
};

const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));

function isMobileViewport(maxWidth: number) {
  return typeof window !== "undefined" && window.innerWidth <= maxWidth;
}

/**
 * Mobile-only scroll ownership controller.
 *
 * It prevents native wheel/touch movement while a chapter is active and maps
 * vertical input delta into a 0..1 local timeline. The page is then released
 * immediately before/after the owned section when the timeline reaches either
 * end. Desktop/laptop viewports never enter this path.
 */
export function useMobileScrollOwner({
  enabled = true,
  maxWidth = 720,
  sectionRef,
  triggerRef,
  steps,
  pxPerStep = 0.78,
  onProgress,
  onActiveChange,
}: OwnedScrollOptions) {
  const activeRef = useRef(false);
  const progressRef = useRef(0);
  const touchYRef = useRef<number | null>(null);
  const progressCb = useRef(onProgress);
  const activeCb = useRef(onActiveChange);

  progressCb.current = onProgress;
  activeCb.current = onActiveChange;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    let lockY = window.scrollY;
    let lockRaf = 0;

    const stopLock = () => {
      if (lockRaf) cancelAnimationFrame(lockRaf);
      lockRaf = 0;
    };

    const startLock = () => {
      stopLock();
      lockY = window.scrollY;
      const loop = () => {
        if (!activeRef.current) return;
        if (Math.abs(window.scrollY - lockY) > 0.5) {
          window.scrollTo({ top: lockY, behavior: "auto" });
        }
        lockRaf = requestAnimationFrame(loop);
      };
      lockRaf = requestAnimationFrame(loop);
    };

    const setActive = (next: boolean) => {
      if (activeRef.current === next) return;
      activeRef.current = next;
      if (next) startLock();
      else stopLock();
      window.dispatchEvent(new CustomEvent("aegis:scroll-owner", { detail: { active: next } }));
      activeCb.current?.(next);
    };

    const shouldEnter = (delta: number) => {
      if (delta <= 0 || !isMobileViewport(maxWidth)) return false;
      const trigger = triggerRef.current;
      const section = sectionRef.current;
      if (!trigger || !section) return false;
      const sr = section.getBoundingClientRect();
      if (sr.bottom <= window.innerHeight * 0.45 || sr.top >= window.innerHeight * 0.72) return false;
      const r = trigger.getBoundingClientRect();
      const center = r.top + r.height / 2;
      return center <= window.innerHeight * 0.54;
    };

    const release = (direction: "forward" | "backward") => {
      const section = sectionRef.current;
      if (!section) {
        setActive(false);
        return;
      }
      const y = window.scrollY + section.getBoundingClientRect().top;
      const target = direction === "forward"
        ? y + section.offsetHeight + 1
        : Math.max(0, y - window.innerHeight * 0.24);
      setActive(false);
      window.scrollTo({ top: target, behavior: "auto" });
      requestAnimationFrame(() => window.scrollTo({ top: target, behavior: "auto" }));
    };

    const applyDelta = (delta: number, event?: Event) => {
      if (!isMobileViewport(maxWidth)) return false;

      if (!activeRef.current) {
        if (!shouldEnter(delta)) return false;
        progressRef.current = 0;
        progressCb.current(0);
        setActive(true);
      }

      event?.preventDefault();
      event?.stopPropagation();

      const total = Math.max(260, window.innerHeight * pxPerStep * Math.max(1, steps - 1));
      const next = progressRef.current + delta / total;

      if (next >= 1 && delta > 0) {
        progressRef.current = 1;
        progressCb.current(1);
        release("forward");
        return true;
      }

      if (next <= 0 && delta < 0) {
        progressRef.current = 0;
        progressCb.current(0);
        release("backward");
        return true;
      }

      progressRef.current = clamp(next);
      progressCb.current(progressRef.current);
      return true;
    };

    const onWheel = (event: WheelEvent) => {
      applyDelta(event.deltaY, event);
    };

    const onTouchStart = (event: TouchEvent) => {
      touchYRef.current = event.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY;
      if (y == null || touchYRef.current == null) return;
      const delta = touchYRef.current - y;
      if (Math.abs(delta) < 1) return;
      if (applyDelta(delta, event)) touchYRef.current = y;
    };

    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });

    return () => {
      stopLock();
      window.removeEventListener("wheel", onWheel, { capture: true });
      window.removeEventListener("touchstart", onTouchStart, { capture: true });
      window.removeEventListener("touchmove", onTouchMove, { capture: true });
    };
  }, [enabled, maxWidth, pxPerStep, sectionRef, steps, triggerRef]);
}