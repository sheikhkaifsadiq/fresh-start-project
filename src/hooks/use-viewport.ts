/**
 * @file src/hooks/use-viewport.ts
 * @description Single source of truth for viewport class.
 * Three classes, not two. Tablet is not "small desktop" and is not
 * "big mobile" — it gets its own composition.
 *
 *   mobile  ≤ 720px   (phones · single-hand · bottom nav)
 *   tablet  721–1024px (iPad portrait/landscape · split layouts)
 *   desktop ≥ 1025px  (full cinematic landing · sidebar app)
 *
 * Returns 'desktop' on the server so SSR markup matches what most
 * crawlers see; the client re-measures on mount and switches.
 */

import { useEffect, useState } from "react";

export type Viewport = "mobile" | "tablet" | "desktop";

function classify(w: number): Viewport {
  if (w <= 720) return "mobile";
  if (w <= 1024) return "tablet";
  return "desktop";
}

export function useViewport(): Viewport {
  const [v, setV] = useState<Viewport>(() =>
    typeof window === "undefined" ? "desktop" : classify(window.innerWidth)
  );
  useEffect(() => {
    const on = () => setV(classify(window.innerWidth));
    on();
    window.addEventListener("resize", on, { passive: true });
    return () => window.removeEventListener("resize", on);
  }, []);
  return v;
}
