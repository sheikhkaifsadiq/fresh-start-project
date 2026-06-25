import { useEffect, useRef, useState } from "react";
import { useStage } from "../../lib/stage";

const REGIONS = ["SFO-01", "LHR-02", "FRA-03", "SIN-04", "HND-05", "GRU-06", "DXB-07", "SYD-08"];

/**
 * Scene-reactive telemetry strip. Latency floor, intercept cadence, and
 * region churn all bend with the active scene — Problem/Threat run hot,
 * Confidence/Finale calm. Scroll velocity adds jitter on top.
 */

// Per-scene baseline (mirrors RoutingField scene table)
//  ms = min..max decision latency window
//  intMs = ms between intercepted++ ticks
//  regMs = ms between region churn
const SCENES = [
  { ms: [8.6, 11.8], intMs: 1400, regMs: 3200 }, // hero
  { ms: [13.4, 22.0], intMs:  520, regMs: 1400 }, // problem (congested)
  { ms: [9.6, 13.2], intMs:  900, regMs: 2200 }, // pipeline
  { ms: [11.2, 18.4], intMs:  380, regMs: 1700 }, // threat (interception spikes)
  { ms: [9.2, 12.4], intMs: 1100, regMs: 2400 }, // analytics
  { ms: [7.8, 10.6], intMs:  900, regMs:  900 }, // network (global churn)
  { ms: [8.8, 11.4], intMs: 1600, regMs: 2600 }, // layers
  { ms: [8.4, 10.4], intMs: 2400, regMs: 3200 }, // confidence
  { ms: [9.0, 10.2], intMs: 3600, regMs: 4600 }, // finale (near-silent)
];

function lerp(a: number, b: number, k: number) { return a + (b - a) * k; }

function scene(p: number) {
  const f = p * (SCENES.length - 1);
  const i = Math.min(SCENES.length - 2, Math.max(0, Math.floor(f)));
  const k = f - i;
  const a = SCENES[i], b = SCENES[i + 1];
  return {
    msLo: lerp(a.ms[0], b.ms[0], k),
    msHi: lerp(a.ms[1], b.ms[1], k),
    intMs: lerp(a.intMs, b.intMs, k),
    regMs: lerp(a.regMs, b.regMs, k),
  };
}

export function TelemetryChrome() {
  const stage = useStage();
  const [ms, setMs] = useState(11.4);
  const [blocked, setBlocked] = useState(184412);
  const [region, setRegion] = useState(REGIONS[0]);
  const trackRef = useRef<HTMLSpanElement>(null);
  const tickRef  = useRef<HTMLSpanElement>(null);
  const rowRef   = useRef<HTMLDivElement>(null);

  // Scene-reactive cadences via per-frame accumulators (no interval drift)
  useEffect(() => {
    let lastMs = 0, lastInt = 0, lastReg = 0;
    let cMs = 11.4; // smoothed latency
    return stage.subscribe((f) => {
      const sc = scene(f.scrollProgress);
      const now = f.t * 1000;
      // velocity-driven nervousness — fast scroll = more jitter, higher floor
      const vJit = f.scrollVAbs * 4.2;

      if (now - lastMs > 280 + Math.random() * 240) {
        const target = sc.msLo + Math.random() * (sc.msHi - sc.msLo) + vJit;
        cMs += (target - cMs) * 0.45;
        setMs(cMs);
        lastMs = now;
      }
      const intCadence = Math.max(120, sc.intMs - f.scrollVAbs * 600);
      if (now - lastInt > intCadence) {
        setBlocked((b) => b + 1 + Math.floor(Math.random() * 3));
        lastInt = now;
      }
      if (now - lastReg > sc.regMs) {
        setRegion(REGIONS[Math.floor(Math.random() * REGIONS.length)]);
        lastReg = now;
      }

      if (tickRef.current) tickRef.current.style.left = (f.scrollProgress * 100).toFixed(2) + "%";
      if (trackRef.current) trackRef.current.style.transform = `scaleX(${f.scrollProgress.toFixed(3)})`;
      if (rowRef.current) {
        // strip tightens (letter-spacing + opacity) under heavy scroll
        rowRef.current.style.letterSpacing = (0.14 + f.scrollVAbs * 0.06).toFixed(3) + "em";
      }
    });
  }, [stage]);

  return (
    <div className="tchrome" aria-hidden>
      <div ref={rowRef} className="tchrome-row">
        <span className="tchrome-cell">
          <i className="tchrome-dot" />
          <span className="tchrome-k">DECISION</span>
          <span className="tchrome-v">{ms.toFixed(2)}<em>ms</em></span>
        </span>
        <span className="tchrome-cell">
          <span className="tchrome-k">INTERCEPTED · SESSION</span>
          <span className="tchrome-v tabular">{blocked.toLocaleString()}</span>
        </span>
        <span className="tchrome-cell">
          <span className="tchrome-k">EDGE</span>
          <span className="tchrome-v">{region}</span>
        </span>
        <span className="tchrome-cell tchrome-track" aria-hidden>
          <span className="tchrome-track-bar">
            <span ref={trackRef} className="tchrome-track-fill" />
            <span ref={tickRef}  className="tchrome-track-tick" />
          </span>
        </span>
        <span className="tchrome-cell tchrome-end">
          <span className="tchrome-k">TLS 1.3</span>
          <span className="tchrome-v">SECURE</span>
        </span>
      </div>
    </div>
  );
}

