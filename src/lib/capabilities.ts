export type Tier = "high" | "low";

export function detectTier(): Tier {
  if (typeof window === "undefined") return "high";
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const cores = navigator.hardwareConcurrency ?? 8;
  const mobile = window.matchMedia?.("(pointer: coarse)").matches;
  if (reduce || cores < 4 || mobile) return "low";
  return "high";
}

export function supportsWebGL(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
