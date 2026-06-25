import { useEffect, useRef } from "react";
import { useStage } from "../../lib/stage";

/**
 * Oversized editorial type fragment that drifts independently of section
 * content (15% faster than scroll) and occasionally passes in front of
 * the section's diagram. One per section. Fraunces italic.
 *
 * align controls horizontal position; `over` lifts it to z-index 5 so
 * it crosses the foreground for the configured passage.
 */
export function SectionGlyph({
  text,
  align = "right",
  size = "18vw",
  shade = "ink",
  over = false,
  top = "auto",
}: {
  text: string;
  align?: "left" | "right" | "center";
  size?: string;
  shade?: "ink" | "ember" | "paper";
  over?: boolean;
  top?: string;
}) {
  const stage = useStage();
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;
    let visible = false;
    const io = new IntersectionObserver(
      (es) => { visible = es.some(e => e.isIntersecting); },
      { rootMargin: "30% 0px" }
    );
    io.observe(wrap);

    let cy = 0;
    let raf = 0;
    const unsub = stage.subscribe((f) => {
      if (!visible) return;
      const rect = wrap.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const dist = (center - f.vh / 2) / f.vh; // -1..+1ish
      const parallax = dist * -180 * 1.15;     // moves opposite scroll, faster
      const drift = f.sx * 14;                 // mouse drift
      const target = parallax + drift;
      cy += (target - cy) * 0.18;
      inner.style.transform = `translate3d(${cy.toFixed(2)}px, 0, 0)`;
    });
    return () => { io.disconnect(); unsub(); cancelAnimationFrame(raf); };
  }, [stage]);

  const color =
    shade === "ember" ? "color-mix(in oklab, var(--ember) 18%, transparent)" :
    shade === "paper" ? "color-mix(in oklab, var(--paper) 80%, transparent)" :
                        "color-mix(in oklab, var(--ink) 7%, transparent)";

  return (
    <div
      ref={wrapRef}
      className={`section-glyph ${over ? "over" : ""}`}
      style={{
        position: "absolute",
        top,
        left: align === "left" ? "-4vw" : "auto",
        right: align === "right" ? "-4vw" : "auto",
        ...(align === "center" ? { left: "50%", transform: "translateX(-50%)" } : null),
        pointerEvents: "none",
        zIndex: over ? 5 : 0,
        overflow: "hidden",
        width: "auto",
        whiteSpace: "nowrap",
      }}
      aria-hidden
    >
      <span
        ref={innerRef}
        style={{
          display: "inline-block",
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: size,
          lineHeight: 0.86,
          letterSpacing: "-0.035em",
          color,
          willChange: "transform",
        }}
      >
        {text}
      </span>
    </div>
  );
}
