import { Color } from "three";

type Stop = {
  at: number;
  fog: string;
  skyTop: string;
  skyBottom: string;
  accent: string;
  edge: string;
};

// 12 stops, hand-tuned. Asymmetric pacing — not equidistant — so acts breathe differently.
const stops: Stop[] = [
  { at: 0.00, fog: "#dcd5c8", skyTop: "#c9c2b4", skyBottom: "#9a9384", accent: "#6c6457", edge: "#3a342c" },
  { at: 0.11, fog: "#e7e1d0", skyTop: "#d6d2bd", skyBottom: "#a8a892", accent: "#7e8a72", edge: "#3f4438" },
  { at: 0.22, fog: "#efe8d4", skyTop: "#efe7d0", skyBottom: "#d4cbb6", accent: "#c9b48f", edge: "#48402f" },
  { at: 0.32, fog: "#f1e1d2", skyTop: "#f0d8c6", skyBottom: "#dcb9a4", accent: "#cf7c66", edge: "#3a2722" },
  { at: 0.43, fog: "#ecdcc6", skyTop: "#e9cfae", skyBottom: "#c8a378", accent: "#b88550", edge: "#3a2a1c" },
  { at: 0.53, fog: "#f5ead0", skyTop: "#f5e9cb", skyBottom: "#b89e74", accent: "#e0c790", edge: "#2e2418" },
  { at: 0.63, fog: "#dcd8e0", skyTop: "#d0cbde", skyBottom: "#a09cb4", accent: "#8e8fb4", edge: "#2c2a36" },
  { at: 0.72, fog: "#dde6df", skyTop: "#cad7cd", skyBottom: "#94a89c", accent: "#8aa898", edge: "#28332d" },
  { at: 0.80, fog: "#ece6d4", skyTop: "#e6dfca", skyBottom: "#aaa18a", accent: "#3a342c", edge: "#1e1a14" },
  { at: 0.88, fog: "#f3ead0", skyTop: "#f3e7c8", skyBottom: "#caac82", accent: "#c89a6a", edge: "#3a2818" },
  { at: 0.94, fog: "#ece5d1", skyTop: "#e1dac6", skyBottom: "#a8a08c", accent: "#6c6457", edge: "#2a2620" },
  { at: 1.00, fog: "#f5e2c0", skyTop: "#f3d9af", skyBottom: "#d09a62", accent: "#b6703a", edge: "#3a2412" },
];

function lerpHex(a: string, b: string, t: number) {
  return new Color(a).lerp(new Color(b), t);
}

export type Sample = {
  fog: Color; skyTop: Color; skyBottom: Color; accent: Color; edge: Color;
};

export function samplePalette(p: number): Sample {
  const c = Math.min(1, Math.max(0, p));
  let i = 0;
  for (; i < stops.length - 1; i++) if (c <= stops[i + 1].at) break;
  const a = stops[i];
  const b = stops[Math.min(stops.length - 1, i + 1)];
  const span = Math.max(0.0001, b.at - a.at);
  const t = smoothstep(0, 1, (c - a.at) / span);
  return {
    fog: lerpHex(a.fog, b.fog, t),
    skyTop: lerpHex(a.skyTop, b.skyTop, t),
    skyBottom: lerpHex(a.skyBottom, b.skyBottom, t),
    accent: lerpHex(a.accent, b.accent, t),
    edge: lerpHex(a.edge, b.edge, t),
  };
}

export function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function easeOutQuart(x: number) { return 1 - Math.pow(1 - x, 4); }
export function easeInOutCubic(x: number) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
