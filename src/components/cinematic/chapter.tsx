import { useEffect, useRef, type ReactNode } from "react";
import { useCinematicScroll } from "./scroll";

/** Split a string into <span class="w"><span>word </span></span> nodes for masked reveal. */
export function Words({ children }: { children: string }) {
  const parts = children.split(" ");
  return (
    <span className="cine-words">
      {parts.map((w, i) => (
        <span key={i} className="w">
          <span>{w}</span>
        </span>
      ))}
    </span>
  );
}

/**
 * A pinned full-viewport text frame whose body fades in when its
 * chapter index becomes active. No layout — just an empty 100vh
 * slot inside the long scroll page that overlays the fixed Canvas.
 */
export function Chapter({
  index,
  align = "left",
  children,
  className,
}: {
  index: number;
  align?: "left" | "right" | "center";
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const scroll = useCinematicScroll();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return scroll.subscribe(({ c }) => {
      // Active when current chapter is within ±0.5 of this index
      const d = Math.abs(c - index);
      const active = d < 0.55;
      el.classList.toggle("is-active", active);
    });
  }, [scroll, index]);

  return (
    <section ref={ref} className={`cine-chapter ${align}${className ? ` ${className}` : ""}`}>
      <div className="inner">{children}</div>
    </section>
  );
}
