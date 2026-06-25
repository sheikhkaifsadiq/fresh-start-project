/**
 * Shared motion physics — the "house language" every animated element obeys.
 * Packets, glyphs, charts, labels, counters, cards all damp/spring through
 * these constants so the page feels like one machine, not nine widgets.
 *
 * Rule of thumb:
 *   - Use `lerpK` inside a per-frame loop:  v += (target - v) * lerpK(SPRING.x, dt)
 *   - Use EASE.* as cubic-bezier strings in CSS transitions.
 *   - Use SPRING.* numbers as a smoothing rate (higher = stiffer).
 */

export const EASE = {
  // Drift/glyph parallax — soft catch-up
  drift:   "cubic-bezier(0.22, 1, 0.36, 1)",
  // Section reveals, panel assembly
  reveal:  "cubic-bezier(0.76, 0, 0.24, 1)",
  // Counters, value swaps
  tick:    "cubic-bezier(0.4, 0, 0.2, 1)",
  // Decisive ink — verdicts, branches
  ink:     "cubic-bezier(0.65, 0, 0.35, 1)",
} as const;

/** Smoothing rates (1/sec). Higher = stiffer. */
export const SPRING = {
  glyph:   6,   // editorial type drift
  packet:  9,   // request token across rails / globe
  camera:  4,   // pipeline camera push / tilt
  chart:   7,   // chart breathing, data points
  ui:      12,  // ui labels, counters, tags
} as const;

/** Critically-damped lerp factor for a given smoothing rate and dt (seconds). */
export const lerpK = (rate: number, dt: number) =>
  1 - Math.exp(-Math.max(0, rate) * Math.max(0, dt));

export const clamp = (x: number, lo = 0, hi = 1) =>
  Math.min(hi, Math.max(lo, x));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Map x from [a,b] into 0..1, clamped. The site's only range helper. */
export const range = (x: number, a: number, b: number) =>
  clamp((x - a) / (b - a));

/** Slight overshoot envelope (0 at edges, 1 in middle). */
export const arc = (t: number) => Math.sin(clamp(t) * Math.PI);
