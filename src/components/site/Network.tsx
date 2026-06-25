import { useEffect, useRef, useState } from "react";
import { SectionHead } from "./SectionHead";

const NODES = [
  { id: "sfo", name: "SFO", lon: -122.4, lat: 37.8 },
  { id: "iad", name: "IAD", lon: -77.0,  lat: 38.9 },
  { id: "gru", name: "GRU", lon: -46.6,  lat: -23.5 },
  { id: "lhr", name: "LHR", lon: -0.1,   lat: 51.5 },
  { id: "fra", name: "FRA", lon: 8.7,    lat: 50.1 },
  { id: "cdg", name: "CDG", lon: 2.5,    lat: 49.0 },
  { id: "jnb", name: "JNB", lon: 28.0,   lat: -26.2 },
  { id: "dxb", name: "DXB", lon: 55.3,   lat: 25.3 },
  { id: "bom", name: "BOM", lon: 72.9,   lat: 19.1 },
  { id: "sin", name: "SIN", lon: 103.8,  lat: 1.4 },
  { id: "hnd", name: "HND", lon: 139.8,  lat: 35.5 },
  { id: "syd", name: "SYD", lon: 151.2,  lat: -33.9 },
];

const W = 960;
const H = 440;
const project = (lon: number, lat: number): [number, number] => [
  ((lon + 180) / 360) * W,
  ((90 - lat) / 180) * H,
];

const ARCS: [string, string][] = [
  ["sfo", "iad"], ["iad", "lhr"], ["lhr", "fra"], ["fra", "dxb"],
  ["dxb", "bom"], ["bom", "sin"], ["sin", "hnd"], ["sin", "syd"],
  ["iad", "gru"], ["cdg", "jnb"], ["sfo", "hnd"], ["fra", "cdg"],
];

function arcPath(a: [number, number], b: [number, number]) {
  const [x1, y1] = a;
  const [x2, y2] = b;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - Math.hypot(x2 - x1, y2 - y1) * 0.25;
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
}

export function Network() {
  const wrap = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [progress, setProgress] = useState(0);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let raf = 0;
    const loop = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = 1 - (rect.top + rect.height / 2) / (vh + rect.height / 2);
      setProgress(Math.min(1, Math.max(0, p)));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    let raf = 0;
    let start = performance.now();
    const loop = (t: number) => {
      setPulse(((t - start) / 2200) % 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Camera language: pan from west to east, zoom in slightly mid-scroll
  const pan = (progress - 0.5) * 200;
  const zoom = 1 + Math.sin(progress * Math.PI) * 0.18;
  const rotate = (progress - 0.5) * 2;

  return (
    <section id="network" className="section">
      <div className="container-x">
        <SectionHead
          num="05 / Global Edge Network"
          kicker="Decisions, locally"
          title={<>38 regions. One <em>routing fabric.</em></>}
          body="Every decision runs on the POP nearest the user. Models, policy, and reputation are replicated continuously — no round-trip to a central brain."
        />
        <div ref={wrap} className="edge edge-wrap">
          <div style={{
            transform: `translate3d(${-pan}px, 0, 0) scale(${zoom}) rotate(${rotate}deg)`,
            transformOrigin: "50% 50%",
            transition: "transform .15s linear",
          }}>
            <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
              {Array.from({ length: 1100 }).map((_, i) => {
                const x = (i * 53) % W;
                const y = ((i * 89) % H);
                const inLand =
                  (x > 110 && x < 280 && y > 80 && y < 240) ||
                  (x > 260 && x < 360 && y > 240 && y < 360) ||
                  (x > 430 && x < 580 && y > 80 && y < 230) ||
                  (x > 480 && x < 640 && y > 230 && y < 360) ||
                  (x > 580 && x < 820 && y > 100 && y < 260) ||
                  (x > 770 && x < 880 && y > 290 && y < 360);
                if (!inLand) return null;
                return <circle key={i} cx={x} cy={y} r={0.9} fill="#3a3d44" />;
              })}

              {ARCS.map(([a, b], i) => {
                const na = NODES.find((n) => n.id === a)!;
                const nb = NODES.find((n) => n.id === b)!;
                const pa = project(na.lon, na.lat);
                const pb = project(nb.lon, nb.lat);
                const d = arcPath(pa, pb);
                const seg = Math.min(1, Math.max(0, progress * ARCS.length - i));
                return (
                  <g key={i}>
                    <path d={d} fill="none" stroke="#c25535" strokeOpacity="0.22" strokeWidth="1" />
                    <path
                      d={d}
                      fill="none" stroke="#c25535" strokeOpacity="0.95" strokeWidth="1.3"
                      pathLength={1}
                      strokeDasharray="1"
                      strokeDashoffset={1 - seg}
                      style={{ transition: "stroke-dashoffset .15s linear" }}
                    />
                    {seg > 0.4 && (
                      <circle r="2.4" fill="#f3eee0">
                        <animateMotion dur="2.2s" repeatCount="indefinite" path={d}
                          keyTimes="0;1" keyPoints={`${pulse};${pulse + 0.001}`} />
                      </circle>
                    )}
                  </g>
                );
              })}

              {NODES.map((n, i) => {
                const [x, y] = project(n.lon, n.lat);
                const lit = progress * NODES.length > i;
                return (
                  <g key={n.id} style={{ opacity: lit ? 1 : 0.3, transition: "opacity .4s" }}>
                    <circle cx={x} cy={y} r="10" fill="#c25535" opacity={lit ? 0.18 : 0.05}>
                      {lit && <animate attributeName="r" values="6;14;6" dur="2.8s" repeatCount="indefinite" />}
                    </circle>
                    <circle cx={x} cy={y} r="2.4" fill="#f3eee0" />
                    <text x={x + 8} y={y + 3}
                      fontFamily="IBM Plex Mono" fontSize="9"
                      fill="#cfc8b6" letterSpacing="1.5">{n.name}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="edge-legend">
            <span><i style={{ background: "#c25535" }} /> Active routing path</span>
            <span><i style={{ background: "#f3eee0" }} /> Edge POP · {Math.round(progress * NODES.length)} of {NODES.length} online</span>
            <span>p50 RTT · 11.4ms · p95 · 28.0ms</span>
          </div>
        </div>
      </div>
    </section>
  );
}
