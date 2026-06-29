import { useEffect, useRef, useState } from "react";
import createGlobe from "cobe";
import { SectionHead } from "./SectionHead";

// Well-spaced edge POPs across distinct regions
const NODES: { name: string; lat: number; lon: number }[] = [
  { name: "SFO", lat: 37.77, lon: -122.42 },
  { name: "GRU", lat: -23.55, lon: -46.63 },
  { name: "LHR", lat: 51.50, lon: -0.12 },
  { name: "FRA", lat: 50.11, lon: 8.68 },
  { name: "JNB", lat: -26.20, lon: 28.04 },
  { name: "DXB", lat: 25.20, lon: 55.27 },
  { name: "SIN", lat: 1.35, lon: 103.82 },
  { name: "HND", lat: 35.55, lon: 139.78 },
  { name: "SYD", lat: -33.87, lon: 151.21 },
];

const ARC_PAIRS: [string, string][] = [
  ["SFO", "LHR"], ["LHR", "FRA"], ["FRA", "DXB"], ["DXB", "SIN"],
  ["SIN", "HND"], ["SIN", "SYD"], ["SFO", "HND"], ["LHR", "GRU"], ["FRA", "JNB"],
];

export function Network() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement("canvas");
    canvas.className = "globe-canvas";
    canvas.style.opacity = "0";
    canvas.style.transition = "opacity 1s ease";
    canvas.style.cursor = "grab";
    container.appendChild(canvas);

    let width = container.offsetWidth;
    if (width === 0) width = 500; // Fallback to prevent WebGL crash on 0-width init
    
    let phi = 4.2;
    let pointerDelta = 0;
    let pointerStart: number | null = null;
    let raf = 0;
    let isDestroyed = false;

    const arcs = ARC_PAIRS.map(([a, b]) => {
      const na = NODES.find((n) => n.name === a)!;
      const nb = NODES.find((n) => n.name === b)!;
      return {
        from: [na.lat, na.lon] as [number, number],
        to: [nb.lat, nb.lon] as [number, number],
      };
    });

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: width * dpr,
      height: width * dpr,
      phi,
      theta: 0.22,
      dark: 1,
      diffuse: 1.25,
      mapSamples: 20000,
      mapBrightness: 5.6,
      mapBaseBrightness: 0.08,
      baseColor: [0.34, 0.36, 0.40],
      markerColor: [0.78, 0.34, 0.22],
      glowColor: [0.14, 0.14, 0.16],
      markers: NODES.map((n) => ({ location: [n.lat, n.lon] as [number, number], size: 0.06 })),
      arcs,
      arcColor: [0.83, 0.40, 0.26],
      arcWidth: 1.2,
      arcHeight: 0.32,
    });

    let first = true;
    const tick = () => {
      if (isDestroyed) return;
      if (pointerStart === null) phi += 0.0022;
      
      try {
        globe.update({ phi: phi + pointerDelta, width: width * dpr, height: width * dpr });
      } catch (err) {
        console.warn("Globe update skipped:", err);
      }
      
      if (first) {
        first = false;
        requestAnimationFrame(() => {
          setReady(true);
          canvas.style.opacity = "1";
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onResize = () => { width = container.offsetWidth; };
    window.addEventListener("resize", onResize);

    const onDown = (e: PointerEvent) => { pointerStart = e.clientX - pointerDelta * 100; canvas.style.cursor = "grabbing"; };
    const onUp = () => { pointerStart = null; canvas.style.cursor = "grab"; };
    const onMove = (e: PointerEvent) => {
      if (pointerStart !== null) pointerDelta = (e.clientX - pointerStart) / 100;
    };
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointermove", onMove);

    return () => {
      isDestroyed = true;
      cancelAnimationFrame(raf);
      try { globe.destroy(); } catch (e) {}
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <section id="network" className="section">
      <div className="container-x">
        <SectionHead
          num="05 / Global Edge Network"
          kicker="Decisions, locally"
          title={<>38 regions. One <em>routing fabric.</em></>}
          body="Every decision runs on the POP nearest the user. Models, policy, and reputation are replicated continuously — no round-trip to a central brain."
        />
        <div className="edge edge-wrap">
          <div className="globe-stage" ref={containerRef}>
            {/* canvas dynamically injected here */}
          </div>

          <div className="edge-legend">
            <span><i style={{ background: "#c25535" }} /> Active edge POP</span>
            <span><i style={{ background: "#f3eee0" }} /> {NODES.length} regions · always-on</span>
            <span>p50 RTT · 11.4ms · p95 · 28.0ms</span>
          </div>
        </div>
      </div>
    </section>
  );
}
