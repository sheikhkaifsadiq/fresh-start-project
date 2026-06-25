import { useRef } from "react";
import { useProgressSubscribe } from "../../lib/scroll-progress";
import { BEATS, activeBeatIndex, alignClass } from "../scene/beats";
import { MagneticButton } from "./MagneticButton";

export function Overlay() {
  const aRef = useRef<HTMLDivElement>(null);
  const bRef = useRef<HTMLDivElement>(null);
  const layerARef = useRef<HTMLDivElement>(null);
  const layerBRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const which = useRef<"a" | "b">("a");
  const lastIdx = useRef(-1);

  useProgressSubscribe((p) => {
    const idx = activeBeatIndex(p);
    if (idx !== lastIdx.current) {
      lastIdx.current = idx;
      const b = BEATS[idx];
      const inEl = which.current === "a" ? bRef.current : aRef.current;
      const outEl = which.current === "a" ? aRef.current : bRef.current;
      const inLayer = which.current === "a" ? layerBRef.current : layerARef.current;
      const outLayer = which.current === "a" ? layerARef.current : layerBRef.current;
      if (inEl && inLayer && outEl && outLayer) {
        inEl.innerHTML = b.headline;
        const al = alignClass(b.align);
        inLayer.className = `act-headline-layer ${al}`;
        outLayer.className = `act-headline-layer ${alignClass(b.align)} is-prev`;
        // toggle classes
        inEl.classList.remove("is-out");
        inEl.classList.add("is-in");
        outEl.classList.remove("is-in");
        outEl.classList.add("is-out");
      }
      which.current = which.current === "a" ? "b" : "a";
    }
    if (ctaRef.current) {
      ctaRef.current.classList.toggle("is-on", p > 0.96);
    }
  });

  return (
    <>
      <div ref={layerARef} className="act-headline-layer items-end pb-[16vh] justify-start pl-[7vw]">
        <div
          ref={aRef}
          className="act-headline is-in"
          dangerouslySetInnerHTML={{ __html: BEATS[0].headline }}
        />
      </div>
      <div ref={layerBRef} className="act-headline-layer items-end pb-[16vh] justify-start pl-[7vw] is-prev">
        <div ref={bRef} className="act-headline is-out" />
      </div>

      <div ref={ctaRef} className="cta-layer">
        <MagneticButton onClick={() => {
          const e = document.querySelector<HTMLInputElement>("#hidden-link");
          e?.focus();
          window.alert("AegisRoute — early access opens soon.\n\nThank you for watching.");
        }}>
          Route your first link <span className="arrow">→</span>
        </MagneticButton>
        <input id="hidden-link" type="text" aria-hidden tabIndex={-1} style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }} />
      </div>

      {/* Visually-hidden H1 for SEO — the spoken anchor of the film */}
      <h1
        style={{
          position: "absolute", width: 1, height: 1,
          padding: 0, margin: -1, overflow: "hidden",
          clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0,
        }}
      >
        AegisRoute — Edge-routed URL shortening with AI threat detection.
      </h1>
    </>
  );
}
