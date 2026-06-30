import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useCinematicScroll } from "./scroll";

/* ============================================================
   Reusable animated data visualizations for the cinematic landing.
   Pure SVG / CSS — no extra dependencies. Each viz animates on its
   own RAF loop and reacts to scroll progress when relevant.
   ============================================================ */

function useTick(intervalMs = 80, active = true) {
  const [, setT] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setT((n) => (n + 1) % 1e9), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, active]);
}

function rand(seed: number) {
  // deterministic pseudo random
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/* SSR-safe client gate — prevents hydration mismatch from Math.random() */
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return <>{m ? children : fallback}</>;
}

/* 3D tilt wrapper — perspective + cursor magnetism (DOM-side gravity) */
export function Tilt3D({ children, intensity = 10, className = "", magnet = 0.08 }: { children: ReactNode; intensity?: number; className?: string; magnet?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0, mx = 0, my = 0, cmx = 0, cmy = 0, glow = 0, tglow = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width  - 0.5) *  intensity;
      ty = ((e.clientY - r.top)  / r.height - 0.5) * -intensity;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy);
      const radius = Math.max(r.width, r.height);
      if (dist < radius * 1.5) {
        const k = 1 - dist / (radius * 1.5);
        mx = dx * magnet * k; my = dy * magnet * k; tglow = k;
      } else { mx = 0; my = 0; tglow = 0; }
    };
    const onLeave = () => { tx = 0; ty = 0; mx = 0; my = 0; tglow = 0; };
    const tick = () => {
      cx += (tx - cx) * 0.10; cy += (ty - cy) * 0.10;
      cmx += (mx - cmx) * 0.12; cmy += (my - cmy) * 0.12;
      glow += (tglow - glow) * 0.1;
      el.style.transform = `perspective(1400px) rotateX(${cy.toFixed(2)}deg) rotateY(${cx.toFixed(2)}deg) translate3d(${cmx.toFixed(2)}px, ${cmy.toFixed(2)}px, 0)`;
      el.style.setProperty("--tilt-glow", glow.toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("pointermove", onMove); el.removeEventListener("mouseleave", onLeave); };
  }, [intensity, magnet]);
  return <div ref={ref} className={`dv-tilt ${className}`} style={{ transformStyle: "preserve-3d", willChange: "transform" }}>{children}</div>;
}

/* Radial heatmap — circular polar grid (new viz) */
export function RadialHeatmap() {
  const N = 12, R = 6;
  const [grid, setGrid] = useState(() => Array.from({ length: N * R }, (_, i) => rand(i)));
  useEffect(() => {
    const id = window.setInterval(() => {
      setGrid((g) => g.map((v, i) => (Math.random() < 0.22 ? Math.random() : v * 0.94)));
    }, 320);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="dv-card">
      <div className="dv-card-head"><span>BEHAVIOURAL HEATMAP · 72 BUCKETS</span><span>POLAR</span></div>
      <svg viewBox="-100 -100 200 200" style={{ width: "100%", height: 200 }}>
        {grid.map((v, i) => {
          const ring = Math.floor(i / N), slice = i % N;
          const r1 = 12 + ring * 12, r2 = r1 + 11;
          const a1 = (slice / N) * Math.PI * 2 - Math.PI / 2;
          const a2 = a1 + (Math.PI * 2) / N - 0.02;
          const p = (r: number, a: number) => `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;
          const d = `M${p(r1,a1)} L${p(r2,a1)} A${r2},${r2} 0 0 1 ${p(r2,a2)} L${p(r1,a2)} A${r1},${r1} 0 0 0 ${p(r1,a1)} Z`;
          const c = v > 0.78 ? "var(--c-magenta)" : v > 0.55 ? "var(--c-amber)" : v > 0.32 ? "var(--c-aqua)" : "var(--c-indigo)";
          return <path key={i} d={d} fill={c} opacity={0.2 + v * 0.75} style={{ transition: "opacity .35s ease, fill .35s ease" }} />;
        })}
        <circle r="9" fill="var(--c-ink)" stroke="var(--cine-line)" />
        <text textAnchor="middle" dy="3" fontSize="8" fill="var(--cine-paper)" fontFamily="var(--cine-mono)">CORE</text>
      </svg>
    </div>
  );
}

/* Vertical waterfall — staggered streaming counters */
export function Waterfall() {
  const rows = [
    { k: "DNS",      v: 0.4, c: "var(--c-sky)" },
    { k: "TLS",      v: 0.9, c: "var(--c-aqua)" },
    { k: "INGEST",   v: 0.6, c: "var(--c-lime)" },
    { k: "FEATURES", v: 2.2, c: "var(--c-amber)" },
    { k: "ML",       v: 3.4, c: "var(--c-coral)" },
    { k: "RULES",    v: 0.9, c: "var(--c-magenta)" },
    { k: "DECIDE",   v: 0.4, c: "var(--c-violet)" },
    { k: "ROUTE",    v: 0.3, c: "var(--c-bubble)" },
  ];
  const max = 4.0;
  let acc = 0;
  return (
    <div className="dv-card">
      <div className="dv-card-head"><span>WATERFALL · STAGE TIMING</span><span>ms</span></div>
      <div className="dv-waterfall">
        {rows.map((r, i) => {
          const left = (acc / 10) * 100;
          acc += r.v;
          return (
            <div key={r.k} className="dv-wf-row">
              <span className="dv-wf-k">{r.k}</span>
              <div className="dv-wf-track">
                <i style={{ left: `${left}%`, width: `${(r.v / 10) * 100}%`, background: r.c, animationDelay: `${i * 80}ms` }} />
              </div>
              <span className="dv-wf-v">{r.v.toFixed(1)}</span>
            </div>
          );
        })}
      </div>
      <div className="dv-card-foot"><span>END-TO-END</span><span style={{ color: "var(--c-aqua)" }}>{acc.toFixed(1)} ms</span></div>
    </div>
  );
}


/* ---------- 1. Live counter chip ---------- */
export function StatChip({
  label, value, suffix = "", accent = "var(--cine-phosphor)", wobble = 0,
}: { label: string; value: number; suffix?: string; accent?: string; wobble?: number }) {
  const [v, setV] = useState(value);
  useEffect(() => {
    if (!wobble) { setV(value); return; }
    const id = window.setInterval(() => {
      setV(value + (Math.random() - 0.5) * 2 * wobble);
    }, 600);
    return () => clearInterval(id);
  }, [value, wobble]);
  return (
    <div className="dv-chip">
      <div className="dv-chip-label">{label}</div>
      <div className="dv-chip-value" style={{ color: accent }}>
        {Number.isInteger(value) && !wobble ? v.toFixed(0) : v.toFixed(2)}
        <span className="dv-chip-suffix">{suffix}</span>
      </div>
    </div>
  );
}

/* ---------- 2. Live area chart (req/sec) ---------- */
export function LiveAreaChart({ color = "var(--c-aqua)", height = 140, label = "REQ / SEC" }: { color?: string; height?: number; label?: string }) {
  const N = 60;
  const ref = useRef<SVGSVGElement>(null);
  const dataRef = useRef<number[]>(Array.from({ length: N }, (_, i) => 40 + Math.sin(i / 4) * 18 + Math.random() * 10));
  const [, setT] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      const last = dataRef.current[dataRef.current.length - 1];
      const next = Math.max(8, Math.min(100, last + (Math.random() - 0.5) * 22 + Math.sin(Date.now() / 800) * 4));
      dataRef.current = [...dataRef.current.slice(1), next];
      setT((n) => n + 1);
    }, 220);
    return () => clearInterval(id);
  }, []);

  const W = 320, H = height;
  const max = 110;
  const pts = dataRef.current.map((v, i) => [(i / (N - 1)) * W, H - (v / max) * (H - 12) - 6] as const);
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const area = `${path} L${W},${H} L0,${H} Z`;
  const cur = dataRef.current[dataRef.current.length - 1];

  return (
    <div className="dv-card">
      <div className="dv-card-head">
        <span>{label}</span>
        <span className="dv-pulse-dot" /> live
      </div>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height }}>
        <defs>
          <linearGradient id="dv-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((r) => (
          <line key={r} x1="0" x2={W} y1={H * r} y2={H * r} stroke="var(--cine-line-soft)" strokeDasharray="2 4" />
        ))}
        <path d={area} fill="url(#dv-area)" />
        <path d={path} fill="none" stroke={color} strokeWidth={1.6} />
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.5" fill={color}>
          <animate attributeName="r" values="3.5;5.5;3.5" dur="1.4s" repeatCount="indefinite" />
        </circle>
      </svg>
      <div className="dv-card-foot">
        <span>{cur.toFixed(0)} req/s</span>
        <span style={{ color }}>+{((cur - dataRef.current[0]) / dataRef.current[0] * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
}

/* ---------- 3. Multi-line edge latency ---------- */
export function EdgeLatencyChart() {
  const N = 50;
  const seriesRef = useRef([
    { name: "LHR", color: "var(--c-aqua)",   data: Array.from({ length: N }, (_, i) => 8 + Math.sin(i / 3) * 2 + Math.random()) },
    { name: "NRT", color: "var(--c-magenta)",data: Array.from({ length: N }, (_, i) => 11 + Math.cos(i / 4) * 3 + Math.random()) },
    { name: "SFO", color: "var(--c-amber)",  data: Array.from({ length: N }, (_, i) => 6 + Math.sin(i / 2) * 1.5 + Math.random()) },
  ]);
  const [, setT] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      seriesRef.current = seriesRef.current.map((s) => {
        const last = s.data[s.data.length - 1];
        const next = Math.max(3, Math.min(20, last + (Math.random() - 0.5) * 2.4));
        return { ...s, data: [...s.data.slice(1), next] };
      });
      setT((n) => n + 1);
    }, 260);
    return () => clearInterval(id);
  }, []);

  const W = 360, H = 160;
  return (
    <div className="dv-card">
      <div className="dv-card-head"><span>P50 LATENCY · 3 REGIONS</span><span>ms</span></div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: H }}>
        {[0.25, 0.5, 0.75].map((r) => (
          <line key={r} x1="0" x2={W} y1={H * r} y2={H * r} stroke="var(--cine-line-soft)" />
        ))}
        {seriesRef.current.map((s) => {
          const pts = s.data.map((v, i) => `${(i / (N - 1)) * W},${H - (v / 22) * (H - 10) - 4}`).join(" L");
          return (
            <g key={s.name}>
              <path d={`M${pts}`} fill="none" stroke={s.color} strokeWidth={1.5} opacity={0.9} />
              <circle cx={W} cy={H - (s.data[s.data.length - 1] / 22) * (H - 10) - 4} r="2.5" fill={s.color} />
            </g>
          );
        })}
      </svg>
      <div className="dv-legend">
        {seriesRef.current.map((s) => (
          <span key={s.name}><i style={{ background: s.color }} />{s.name} <b>{s.data[s.data.length - 1].toFixed(1)}ms</b></span>
        ))}
      </div>
    </div>
  );
}

/* ---------- 4. Threat feed (rotating live requests) ---------- */
const COUNTRIES = ["US", "DE", "BR", "JP", "IN", "GB", "FR", "NG", "AU", "SG", "CA", "ZA", "MX", "AR", "KR"];
const VERDICTS = [
  { label: "ALLOW",     color: "var(--c-aqua)",    weight: 70 },
  { label: "CHALLENGE", color: "var(--c-amber)",   weight: 20 },
  { label: "BLOCK",     color: "var(--c-magenta)", weight: 8  },
  { label: "ROUTE A/B", color: "var(--c-sky)",     weight: 12 },
];
function pickVerdict(seed: number) {
  const total = VERDICTS.reduce((s, v) => s + v.weight, 0);
  let r = rand(seed) * total;
  for (const v of VERDICTS) { if ((r -= v.weight) <= 0) return v; }
  return VERDICTS[0];
}
export function ThreatFeed() {
  const [rows, setRows] = useState(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: 1000 + i,
      ip: `${Math.floor(rand(i) * 255)}.${Math.floor(rand(i + 9) * 255)}.${Math.floor(rand(i + 17) * 255)}.${Math.floor(rand(i + 31) * 255)}`,
      country: COUNTRIES[Math.floor(rand(i + 5) * COUNTRIES.length)],
      score: Math.floor(rand(i + 3) * 100),
      v: pickVerdict(i),
      ms: (rand(i + 11) * 14 + 2).toFixed(1),
    })),
  );
  useEffect(() => {
    let n = 1100;
    const id = window.setInterval(() => {
      n += 1;
      setRows((prev) => [
        {
          id: n,
          ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          country: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
          score: Math.floor(Math.random() * 100),
          v: pickVerdict(n),
          ms: (Math.random() * 14 + 2).toFixed(1),
        },
        ...prev.slice(0, 7),
      ]);
    }, 900);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="dv-card dv-feed">
      <div className="dv-card-head"><span>LIVE REQUEST STREAM</span><span className="dv-pulse-dot" /></div>
      <div className="dv-feed-rows">
        {rows.map((r, i) => (
          <div key={r.id} className="dv-feed-row" style={{ opacity: 1 - i * 0.08 }}>
            <span className="dv-mono">#{r.id.toString(16).toUpperCase()}</span>
            <span className="dv-mono dv-dim">{r.ip}</span>
            <span className="dv-flag">{r.country}</span>
            <span className="dv-score">
              <i style={{ width: `${r.score}%`, background: r.v.color }} />
              <b>{r.score}</b>
            </span>
            <span className="dv-verdict" style={{ color: r.v.color, borderColor: r.v.color }}>{r.v.label}</span>
            <span className="dv-mono dv-dim">{r.ms}ms</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 5. Confidence gauge ---------- */
export function ConfidenceGauge({ value = 96.4 }: { value?: number }) {
  const [v, setV] = useState(value - 4);
  useEffect(() => {
    const id = window.setInterval(() => setV(value + (Math.random() - 0.5) * 0.6), 700);
    return () => clearInterval(id);
  }, [value]);
  const R = 70, C = 2 * Math.PI * R;
  const offset = C - (v / 100) * C;
  return (
    <div className="dv-card dv-gauge">
      <div className="dv-card-head"><span>MODEL CONFIDENCE</span><span>v4.2</span></div>
      <svg viewBox="-100 -100 200 200" style={{ width: "100%", height: 200 }}>
        <circle r={R} fill="none" stroke="var(--cine-line)" strokeWidth="8" />
        <circle r={R} fill="none" stroke="var(--c-aqua)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={offset}
          transform="rotate(-90)"
          style={{ transition: "stroke-dashoffset .6s ease, stroke .6s ease",
            stroke: v > 80 ? "var(--c-aqua)" : v > 50 ? "var(--c-amber)" : "var(--c-magenta)" }} />
        <text textAnchor="middle" dy="-4" fontSize="34" fill="var(--cine-paper)" fontFamily="var(--cine-display)" fontWeight="300">
          {v.toFixed(1)}<tspan fontSize="16" fill="var(--cine-chrome)">%</tspan>
        </text>
        <text textAnchor="middle" dy="22" fontSize="9" letterSpacing="0.3em" fill="var(--cine-chrome)" fontFamily="var(--cine-mono)">
          PRECISION
        </text>
      </svg>
      <div className="dv-legend">
        <span><i style={{ background: "var(--c-aqua)" }} />TP 982,341</span>
        <span><i style={{ background: "var(--c-amber)" }} />FP 412</span>
        <span><i style={{ background: "var(--c-magenta)" }} />FN 38</span>
      </div>
    </div>
  );
}

/* ---------- 6. Decision pipeline (animated) ---------- */
export function PipelineViz() {
  const stages = [
    { k: "INGEST",  ms: 0.4, color: "var(--c-sky)"     },
    { k: "PARSE",   ms: 1.1, color: "var(--c-aqua)"    },
    { k: "FEATURE", ms: 2.4, color: "var(--c-lime)"    },
    { k: "MODEL",   ms: 3.8, color: "var(--c-amber)"   },
    { k: "RULES",   ms: 0.9, color: "var(--c-coral)"   },
    { k: "DECIDE",  ms: 0.6, color: "var(--c-magenta)" },
    { k: "ROUTE",   ms: 0.3, color: "var(--c-violet)"  },
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((x) => (x + 1) % stages.length), 700);
    return () => clearInterval(id);
  }, [stages.length]);
  return (
    <div className="dv-card">
      <div className="dv-card-head"><span>DECISION PIPELINE · PER REQUEST</span><span>7 STAGES</span></div>
      <div className="dv-pipeline">
        {stages.map((s, idx) => (
          <div key={s.k} className={`dv-pipe-stage ${i >= idx ? "lit" : ""}`} style={{ ["--c" as any]: s.color }}>
            <div className="dv-pipe-bar"><i /></div>
            <div className="dv-pipe-k">{s.k}</div>
            <div className="dv-pipe-ms">{s.ms.toFixed(1)}ms</div>
          </div>
        ))}
      </div>
      <div className="dv-card-foot"><span>TOTAL</span><span style={{ color: "var(--c-aqua)" }}>9.5 ms · P50</span></div>
    </div>
  );
}

/* ---------- 7. Bar race (top destinations) ---------- */
export function BarRace() {
  const [bars, setBars] = useState(() => [
    { k: "checkout.app",    v: 82 },
    { k: "docs.aegis.dev",  v: 64 },
    { k: "blog/launch",     v: 51 },
    { k: "promo/holiday",   v: 38 },
    { k: "press kit",       v: 22 },
  ]);
  useEffect(() => {
    const id = window.setInterval(() => {
      setBars((prev) =>
        prev.map((b) => ({ ...b, v: Math.max(8, Math.min(100, b.v + (Math.random() - 0.5) * 14)) }))
            .sort((a, b) => b.v - a.v),
      );
    }, 1200);
    return () => clearInterval(id);
  }, []);
  const max = Math.max(...bars.map((b) => b.v));
  const palette = ["var(--c-aqua)", "var(--c-magenta)", "var(--c-amber)", "var(--c-sky)", "var(--c-violet)"];
  return (
    <div className="dv-card">
      <div className="dv-card-head"><span>TOP ROUTED DESTINATIONS · LAST 60s</span><span>%</span></div>
      <div className="dv-bars">
        {bars.map((b, i) => (
          <div key={b.k} className="dv-bar-row" style={{ order: i }}>
            <span className="dv-bar-label">{b.k}</span>
            <div className="dv-bar-track">
              <i style={{ width: `${(b.v / max) * 100}%`, background: palette[i % palette.length] }} />
            </div>
            <span className="dv-bar-val">{b.v.toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 8. Geo dots (animated traffic globe-flat) ---------- */
export function GeoMap() {
  const POINTS = useMemo(
    () => Array.from({ length: 38 }, (_, i) => ({
      x: rand(i) * 100,
      y: 28 + rand(i + 7) * 44,
      r: 0.7 + rand(i + 13) * 2.4,
      delay: rand(i + 21) * 3,
      hot: rand(i + 9) > 0.75,
    })),
    [],
  );
  return (
    <div className="dv-card dv-geo">
      <div className="dv-card-head"><span>EDGE POPs · LIVE</span><span>38 REGIONS</span></div>
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" style={{ width: "100%", height: 180 }}>
        {/* faint meridians */}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`m${i}`} x1={(i / 11) * 100} x2={(i / 11) * 100} y1="0" y2="60" stroke="var(--cine-line-soft)" strokeWidth="0.1" />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={`p${i}`} x1="0" x2="100" y1={(i / 5) * 60} y2={(i / 5) * 60} stroke="var(--cine-line-soft)" strokeWidth="0.1" />
        ))}
        {POINTS.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={p.r} fill={p.hot ? "var(--c-magenta)" : "var(--c-aqua)"} opacity="0.9" />
            {p.hot && (
              <circle cx={p.x} cy={p.y} r={p.r} fill="none" stroke="var(--c-magenta)" strokeWidth="0.2">
                <animate attributeName="r" from={p.r} to={p.r * 6} dur="2.4s" begin={`${p.delay}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.7" to="0" dur="2.4s" begin={`${p.delay}s`} repeatCount="indefinite" />
              </circle>
            )}
          </g>
        ))}
        {/* link arcs */}
        {[
          [18, 28, 52, 32], [52, 32, 78, 26], [22, 36, 70, 44], [40, 22, 86, 38],
        ].map(([x1, y1, x2, y2], i) => {
          const mx = (x1 + x2) / 2, my = Math.min(y1, y2) - 8;
          return (
            <path key={i} d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`}
              fill="none" stroke="var(--c-aqua)" strokeWidth="0.18" strokeDasharray="1 1.5" opacity="0.7">
              <animate attributeName="stroke-dashoffset" from="0" to="20" dur="2s" repeatCount="indefinite" />
            </path>
          );
        })}
      </svg>
      <div className="dv-legend">
        <span><i style={{ background: "var(--c-aqua)" }} />POP</span>
        <span><i style={{ background: "var(--c-magenta)" }} />Under load</span>
      </div>
    </div>
  );
}

/* ---------- 9. Donut (traffic mix) ---------- */
export function DonutMix() {
  const slices = [
    { k: "Humans",      v: 64, c: "var(--c-aqua)" },
    { k: "Good bots",   v: 18, c: "var(--c-sky)" },
    { k: "Scrapers",    v: 10, c: "var(--c-amber)" },
    { k: "Malicious",   v: 5,  c: "var(--c-magenta)" },
    { k: "Unknown",     v: 3,  c: "var(--c-violet)" },
  ];
  const total = slices.reduce((s, x) => s + x.v, 0);
  const R = 56, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="dv-card">
      <div className="dv-card-head"><span>TRAFFIC COMPOSITION · 24H</span><span>{total}%</span></div>
      <div className="dv-donut-row">
        <svg viewBox="-80 -80 160 160" style={{ width: 180, height: 180 }}>
          <circle r={R} fill="none" stroke="var(--cine-line)" strokeWidth="14" />
          {slices.map((s) => {
            const len = (s.v / total) * C;
            const dash = `${len} ${C - len}`;
            const off = -acc;
            acc += len;
            return (
              <circle key={s.k} r={R} fill="none" stroke={s.c} strokeWidth="14"
                strokeDasharray={dash} strokeDashoffset={off} transform="rotate(-90)" />
            );
          })}
          <text textAnchor="middle" dy="-2" fontSize="20" fontFamily="var(--cine-display)" fontWeight="300" fill="var(--cine-paper)">12.4M</text>
          <text textAnchor="middle" dy="16" fontSize="7" letterSpacing="0.3em" fill="var(--cine-chrome)" fontFamily="var(--cine-mono)">REQUESTS</text>
        </svg>
        <ul className="dv-donut-legend">
          {slices.map((s) => (
            <li key={s.k}><i style={{ background: s.c }} /><span>{s.k}</span><b>{s.v}%</b></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------- 10. Stat grid for proof ---------- */
export function StatGrid() {
  return (
    <div className="dv-stat-grid">
      <StatChip label="P50 LATENCY"      value={4.1}   suffix="ms" wobble={0.2} />
      <StatChip label="P99 LATENCY"      value={11.4}  suffix="ms" wobble={0.4} accent="var(--c-amber)" />
      <StatChip label="THREATS BLOCKED"  value={2.84}  suffix="M"  accent="var(--c-magenta)" />
      <StatChip label="UPTIME"           value={99.99} suffix="%"  />
      <StatChip label="EDGE POPs"        value={38}    accent="var(--c-sky)" />
      <StatChip label="RULES ENGINE"     value={1247}  suffix=" rps" wobble={12} accent="var(--c-violet)" />
    </div>
  );
}

/* ---------- 11. Sparkline row ---------- */
export function Sparkline({ data, color = "var(--c-aqua)", w = 110, h = 32 }: { data: number[]; color?: string; w?: number; h?: number }) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = Math.max(0.001, max - min);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(" L");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
      <path d={`M${pts}`} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

/* ---------- 12. Fingerprint signal matrix (Inspect) ---------- */
export function SignalMatrix() {
  const [grid, setGrid] = useState(() => Array.from({ length: 9 * 16 }, (_, i) => rand(i)));
  useEffect(() => {
    const id = window.setInterval(() => {
      setGrid((g) => g.map((v, i) => (Math.random() < 0.18 ? Math.random() : v)));
    }, 380);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="dv-card">
      <div className="dv-card-head"><span>FINGERPRINT · 187 SIGNALS</span><span>JA4 · TLS · HTTP/2</span></div>
      <div className="dv-matrix">
        {grid.map((v, i) => (
          <i key={i} style={{
            background: v > 0.85 ? "var(--c-magenta)" :
                        v > 0.7  ? "var(--c-amber)"   :
                        v > 0.4  ? "var(--c-aqua)"    : "rgba(200,194,232,0.08)",
            opacity: 0.4 + v * 0.6,
          }} />
        ))}
      </div>
      <div className="dv-legend">
        <span><i style={{ background: "var(--c-aqua)" }} />Match</span>
        <span><i style={{ background: "var(--c-amber)" }} />Anomaly</span>
        <span><i style={{ background: "var(--c-magenta)" }} />Threat signal</span>
      </div>
    </div>
  );
}

/* ---------- 13. Scroll-driven progress ring ---------- */
export function ScrollRing() {
  const { progress01 } = useCinematicScroll();
  const R = 28, C = 2 * Math.PI * R;
  return (
    <svg viewBox="-40 -40 80 80" width="64" height="64">
      <circle r={R} fill="none" stroke="var(--cine-line)" strokeWidth="3" />
      <circle r={R} fill="none" stroke="var(--c-aqua)" strokeWidth="3"
        strokeDasharray={C} strokeDashoffset={C - progress01 * C}
        strokeLinecap="round" transform="rotate(-90)" />
      <text textAnchor="middle" dy="4" fontSize="11" fill="var(--cine-paper)" fontFamily="var(--cine-mono)">
        {Math.round(progress01 * 100)}%
      </text>
    </svg>
  );
}

/* Re-export tick noop for tree-shake consistency */
export { useTick };
