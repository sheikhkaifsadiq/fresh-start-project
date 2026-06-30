import { useEffect, useRef, useState } from "react";

/**
 * Cute · technical preloader
 *  - Rotating 3D wireframe cube spelling AEGIS, faces glow per palette color
 *  - Three orbiting data-packet rings around it
 *  - Circular progress dial with monospaced % counter
 *  - Typewriter status feed (cycles fake "boot" lines)
 *  - Exit: cube zooms forward + iris-wipe reveal
 */
const FACES = [
  { c: "A", color: "#3cf0d4" }, // aqua
  { c: "E", color: "#ff2d75" }, // magenta
  { c: "G", color: "#ffb547" }, // amber
  { c: "I", color: "#7cf38a" }, // lime
  { c: "S", color: "#6a6bff" }, // indigo
  { c: "▲", color: "#ff7ae0" }, // bubblegum
];

const BOOT_LINES = [
  "linking edge runtime · 38 pops",
  "warming ml model · v4.2",
  "shaping packet field · 2,400 nodes",
  "calibrating ja4 fingerprint cache",
  "binding gravity to pointer",
  "ignition · cinematic stage ready",
];

export function CinematicPreloader({
  minMs = 1100,
  onDone,
}: {
  minMs?: number;
  onDone?: () => void;
}) {
  const [pct, setPct] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [line, setLine] = useState(0);
  const [typed, setTyped] = useState("");
  const lineRef = useRef(0);

  /* progress ramp */
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const ready = () =>
      document.readyState === "complete" || document.readyState === "interactive";
    const tick = (t: number) => {
      const elapsed = t - start;
      const cap = ready() && elapsed > minMs ? 1 : 0.93;
      setPct((prev) => {
        const next = prev + (cap - prev) * 0.05;
        return next > 0.999 ? 1 : next < cap ? next : cap;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [minMs]);


  /* typewriter cycling */
  useEffect(() => {
    let cancelled = false;
    let i = 0;
    const target = BOOT_LINES[lineRef.current];
    const type = () => {
      if (cancelled) return;
      if (i <= target.length) {
        setTyped(target.slice(0, i));
        i++;
        setTimeout(type, 22 + Math.random() * 28);
      } else {
        setTimeout(() => {
          lineRef.current = (lineRef.current + 1) % BOOT_LINES.length;
          setLine(lineRef.current);
        }, 520);
      }
    };
    type();
    return () => { cancelled = true; };
  }, [line]);

  /* exit — fire once when nearly complete */
  const exitedRef = useRef(false);
  useEffect(() => {
    if (pct < 0.995 || exitedRef.current) return;
    exitedRef.current = true;
    const t1 = window.setTimeout(() => setHidden(true), 260);
    const t2 = window.setTimeout(() => onDone?.(), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [pct, onDone]);


  const n = Math.min(100, Math.round(pct * 100));
  const R = 72;
  const C = 2 * Math.PI * R;
  const offset = C - pct * C;

  return (
    <div className={`cl-preloader${hidden ? " gone" : ""}`} aria-hidden={hidden}>
      {/* twinkle field */}
      <div className="cl-stars" aria-hidden>
        {Array.from({ length: 60 }).map((_, i) => (
          <span key={i} style={{
            left: `${(i * 173) % 100}%`,
            top:  `${(i * 313) % 100}%`,
            animationDelay: `${(i * 0.13) % 3}s`,
          }} />
        ))}
      </div>

      <div className="cl-stage">
        {/* progress dial */}
        <svg className="cl-dial" viewBox="-100 -100 200 200" aria-hidden>
          <circle r={R} fill="none" stroke="rgba(200,200,255,.08)" strokeWidth="1.2" />
          <circle
            r={R} fill="none" stroke="url(#cl-grad)" strokeWidth="2"
            strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset}
            transform="rotate(-90)"
            style={{ transition: "stroke-dashoffset .25s linear" }}
          />
          {/* tick marks */}
          {Array.from({ length: 60 }).map((_, i) => (
            <line
              key={i} x1="0" y1={-R - 6} x2="0" y2={-R - (i % 5 === 0 ? 12 : 8)}
              stroke={i / 60 < pct ? "#3cf0d4" : "rgba(255,255,255,.12)"}
              strokeWidth={i % 5 === 0 ? 1.4 : 0.8}
              transform={`rotate(${i * 6})`}
              style={{ transition: "stroke .3s ease" }}
            />
          ))}
          <defs>
            <linearGradient id="cl-grad" x1="-1" y1="-1" x2="1" y2="1">
              <stop offset="0" stopColor="#3cf0d4" />
              <stop offset=".5" stopColor="#ff2d75" />
              <stop offset="1" stopColor="#ffb547" />
            </linearGradient>
          </defs>
        </svg>

        {/* orbits */}
        <div className="cl-orbit cl-orbit-a" aria-hidden>
          <i style={{ background: "#3cf0d4" }} />
        </div>
        <div className="cl-orbit cl-orbit-b" aria-hidden>
          <i style={{ background: "#ff2d75" }} />
        </div>
        <div className="cl-orbit cl-orbit-c" aria-hidden>
          <i style={{ background: "#ffb547" }} />
        </div>

        {/* 3D cube */}
        <div className="cl-scene">
          <div className="cl-cube">
            {FACES.map((f, i) => (
              <div key={i} className={`cl-face cl-face-${i}`} style={{
                ["--c" as any]: f.color,
              }}>
                <span>{f.c}</span>
                {/* corner ticks */}
                <i className="t tl" /><i className="t tr" /><i className="t bl" /><i className="t br" />
              </div>
            ))}
          </div>
        </div>

        {/* center percentage */}
        <div className="cl-pct">
          <span className="num">{String(n).padStart(2, "0")}</span>
          <span className="sym">%</span>
        </div>
      </div>

      {/* status feed */}
      <div className="cl-feed">
        <span className="dot" />
        <span className="key">AEGIS · ROUTE / boot</span>
        <span className="line">{typed}<i className="caret" /></span>
      </div>

      {/* corner chrome */}
      <div className="cl-chrome tl">
        <span>v1.0</span><span>edge-runtime</span>
      </div>
      <div className="cl-chrome tr">
        <span>POP-LHR-04</span><span className="live"><i />LIVE</span>
      </div>
      <div className="cl-chrome bl">
        <span>frame · {String(Math.floor(n * 3.6)).padStart(3, "0")}</span>
      </div>
      <div className="cl-chrome br">
        <span>{n < 100 ? "loading scene" : "stage ready"}</span>
      </div>

      {/* iris reveal */}
      <div className="cl-iris" aria-hidden />
    </div>
  );
}
