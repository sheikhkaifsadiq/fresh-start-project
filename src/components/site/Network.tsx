import { useEffect, useRef } from "react";
import { SectionHead } from "./SectionHead";
import { Reveal } from "./Reveal";

// Approximate equirectangular coords (lon, lat) → SVG (x, y) for a 960x440 map
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
const project = (lon: number, lat: number) => {
  const x = ((lon + 180) / 360) * W;
  const y = ((90 - lat) / 180) * H;
  return [x, y] as const;
};

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
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const paths = ref.current?.querySelectorAll<SVGPathElement>("path[data-arc]");
    if (!paths) return;
    paths.forEach((p, i) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = `${len}`;
      p.style.transition = `stroke-dashoffset 1.6s var(--ease-out) ${i * 90}ms`;
    });
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          paths.forEach((p) => { p.style.strokeDashoffset = "0"; });
          io.disconnect();
        }
      }),
      { threshold: 0.25 }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
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
        <Reveal>
          <div className="edge">
            <svg ref={ref} viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
              {/* Land-mass stippling */}
              {Array.from({ length: 1100 }).map((_, i) => {
                const x = (i * 53) % W;
                const y = ((i * 89) % H);
                // sparse mask roughly approximating continents (visual texture)
                const inLand =
                  (x > 110 && x < 280 && y > 80 && y < 240) || // NA
                  (x > 260 && x < 360 && y > 240 && y < 360) || // SA
                  (x > 430 && x < 580 && y > 80 && y < 230) || // EU
                  (x > 480 && x < 640 && y > 230 && y < 360) || // AF
                  (x > 580 && x < 820 && y > 100 && y < 260) || // ASIA
                  (x > 770 && x < 880 && y > 290 && y < 360);   // AU
                if (!inLand) return null;
                return <circle key={i} cx={x} cy={y} r={0.9} fill="#3a3d44" />;
              })}

              {ARCS.map(([a, b], i) => {
                const na = NODES.find((n) => n.id === a)!;
                const nb = NODES.find((n) => n.id === b)!;
                const pa = project(na.lon, na.lat);
                const pb = project(nb.lon, nb.lat);
                return (
                  <path
                    key={i}
                    data-arc
                    d={arcPath(pa, pb)}
                    fill="none"
                    stroke="#c25535"
                    strokeOpacity="0.7"
                    strokeWidth="1"
                  />
                );
              })}

              {NODES.map((n) => {
                const [x, y] = project(n.lon, n.lat);
                return (
                  <g key={n.id}>
                    <circle cx={x} cy={y} r="6" fill="#c25535" opacity="0.18" />
                    <circle cx={x} cy={y} r="2.4" fill="#f3eee0" />
                    <text x={x + 8} y={y + 3}
                      fontFamily="IBM Plex Mono" fontSize="9"
                      fill="#cfc8b6" letterSpacing="1.5">
                      {n.name}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="edge-legend">
              <span><i style={{ background: "#c25535" }} /> Active routing path</span>
              <span><i style={{ background: "#f3eee0" }} /> Edge POP</span>
              <span>p50 RTT · 11.4ms · p95 · 28.0ms</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
