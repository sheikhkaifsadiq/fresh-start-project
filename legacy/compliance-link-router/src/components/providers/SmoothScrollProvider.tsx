'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

/**
 * Global Smooth Scroll Provider
 * Wraps the entire app in Lenis inertia-based momentum physics scroll.
 * GPU-accelerated — zero layout thrashing.
 */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    const handle = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(handle);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
