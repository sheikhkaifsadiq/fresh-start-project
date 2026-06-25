import { useEffect, useRef, useState } from "react";
import createGlobe from "cobe";
import { SectionHead } from "./SectionHead";

// Well-spaced edge POPs across distinct regions
const NODES = [
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

export function Network() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phiRef = useRef(4.2); // start centered on Atlantic / Europe
  const widthRef = useRef(0);
  const pointerInteracting = useRef<number | null>(null);
  const pointerDelta = useRef(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let frame = 0;

    const onResize = () => {
      if (!canvas) return;
      widthRef.current = canvas.offsetWidth;
    };
    onResize();
    window.addEventListener("resize", onResize);

    const globe = createGlobe(canvas, {
      devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      width: widthRef.current * 2,
      height: widthRef.current * 2,
      phi: phiRef.current,
      theta: 0.25,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 18000,
      mapBrightness: 5.2,
      baseColor: [0.32, 0.34, 0.38],
      markerColor: [0.76, 0.33, 0.21], // ember
      glowColor: [0.16, 0.16, 0.18],
      markers: NODES.map((n) => ({ location: [n.lat, n.lon] as [number, number], size: 0.06 })),
      onRender: (state) => {
        if (pointerInteracting.current === null) {
          phiRef.current += 0.0022;
        }
        state.phi = phiRef.current + pointerDelta.current;
        state.width = widthRef.current * 2;
        state.height = widthRef.current * 2;
        if (!frame) setReady(true);
        frame++;
      },
    });

    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
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
          <div className="globe-stage">
            <canvas
              ref={canvasRef}
              className="globe-canvas"
              style={{ opacity: ready ? 1 : 0 }}
              onPointerDown={(e) => {
                pointerInteracting.current = e.clientX - pointerDelta.current * 100;
                (e.currentTarget as HTMLCanvasElement).style.cursor = "grabbing";
              }}
              onPointerUp={(e) => {
                pointerInteracting.current = null;
                (e.currentTarget as HTMLCanvasElement).style.cursor = "grab";
              }}
              onPointerOut={() => {
                pointerInteracting.current = null;
              }}
              onMouseMove={(e) => {
                if (pointerInteracting.current !== null) {
                  const delta = e.clientX - pointerInteracting.current;
                  pointerDelta.current = delta / 100;
                }
              }}
              onTouchMove={(e) => {
                if (pointerInteracting.current !== null && e.touches[0]) {
                  const delta = e.touches[0].clientX - pointerInteracting.current;
                  pointerDelta.current = delta / 100;
                }
              }}
            />
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
