import { useEffect, useRef, useState } from "react";
import { useStage } from "../../lib/stage";

const REGIONS = ["SFO-01", "LHR-02", "FRA-03", "SIN-04", "HND-05", "GRU-06", "DXB-07", "SYD-08"];

/**
 * Fixed bottom-edge telemetry strip. Always-on secondary motion:
 * live decision latency, threats intercepted (monotonic), active region,
 * and a scroll-position track marker. Mono chrome — reads as infrastructure.
 */
export function TelemetryChrome() {
  const stage = useStage();
  const [ms, setMs] = useState(11.4);
  const [blocked, setBlocked] = useState(184412);
  const [region, setRegion] = useState(REGIONS[0]);
  const trackRef = useRef<HTMLSpanElement>(null);
  const tickRef  = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // gentle live updates, independent of frame rate
    const id1 = setInterval(() => setMs(8.4 + Math.random() * 6.2), 900);
    const id2 = setInterval(() => setBlocked((b) => b + 1 + Math.floor(Math.random() * 3)), 1100);
    const id3 = setInterval(() => setRegion(REGIONS[Math.floor(Math.random() * REGIONS.length)]), 2400);
    return () => { clearInterval(id1); clearInterval(id2); clearInterval(id3); };
  }, []);

  useEffect(() => {
    return stage.subscribe((f) => {
      if (tickRef.current) tickRef.current.style.left = (f.scrollProgress * 100).toFixed(2) + "%";
      if (trackRef.current) trackRef.current.style.transform = `scaleX(${f.scrollProgress.toFixed(3)})`;
    });
  }, [stage]);

  return (
    <div className="tchrome" aria-hidden>
      <div className="tchrome-row">
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
