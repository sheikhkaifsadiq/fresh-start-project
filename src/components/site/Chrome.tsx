import { useEffect, useRef, useState } from "react";
import { useProgressSubscribe } from "../../lib/scroll-progress";
import { BEATS, activeBeatIndex, alignClass } from "../scene/beats";

export function Chrome() {
  const numRef = useRef<HTMLSpanElement>(null);
  const subRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const lastIdx = useRef(-1);

  useProgressSubscribe((p) => {
    const idx = activeBeatIndex(p);
    if (idx !== lastIdx.current) {
      lastIdx.current = idx;
      const b = BEATS[idx];
      if (numRef.current) numRef.current.textContent = roman(b.id) + " / XII";
      if (subRef.current) subRef.current.textContent = b.name.toUpperCase();
    }
    if (fillRef.current) fillRef.current.style.transform = `scaleX(${p})`;
    if (hintRef.current) hintRef.current.style.opacity = p > 0.04 ? "0" : "1";
  });

  return (
    <>
      <div className="wordmark" aria-hidden>
        <span>
          aegisroute<span className="dot" />
        </span>
      </div>

      <div className="meta-left-top">
        <div><span className="em">Brand</span> · AegisRoute</div>
        <div><span className="em">Year</span> · MMXXVI</div>
      </div>

      <div className="meta-top">
        <div><span className="em">A film by</span> AegisRoute</div>
        <div><span className="em">No. </span>01 of 01</div>
      </div>

      <div className="rail">
        <span ref={numRef} className="rail-num">I / XII</span>
        <span ref={subRef} className="rail-sub">ORIGIN</span>
      </div>

      <div className="scroll-hint" ref={hintRef}>
        <span>Scroll to begin</span>
        <span className="bar"><span className="fill" ref={fillRef} /></span>
      </div>
    </>
  );
}

function roman(n: number) {
  const map: [number, string][] = [
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  for (const [v, s] of map) { while (n >= v) { out += s; n -= v; } }
  return out;
}
