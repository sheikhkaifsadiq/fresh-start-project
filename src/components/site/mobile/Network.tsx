/**
 * @file src/components/site/mobile/Network.tsx
 * @description Network summary with three big numbers and a flat
 * routing strip. No globe — the WebGL globe is desktop-only.
 */

export function MobileNetwork() {
  return (
    <section className="m-section">
      <div className="m-kicker">04 · Global network</div>
      <h2 className="m-h2">
        Routed at the edge. <span className="is-italic">Closer to the request.</span>
      </h2>
      <div className="m-net-grid">
        <div>
          <div className="m-net-num">38</div>
          <div className="m-net-lab">edge regions</div>
        </div>
        <div>
          <div className="m-net-num">12<span className="m-net-unit">ms</span></div>
          <div className="m-net-lab">median decision</div>
        </div>
        <div>
          <div className="m-net-num">99.97<span className="m-net-unit">%</span></div>
          <div className="m-net-lab">availability · 12 mo</div>
        </div>
      </div>
      <RoutingStrip />
    </section>
  );
}

function RoutingStrip() {
  return (
    <div className="m-strip" aria-hidden>
      <svg viewBox="0 0 320 60" preserveAspectRatio="none" width="100%" height="60">
        {Array.from({ length: 7 }).map((_, i) => {
          const x1 = (i / 6) * 320;
          const y1 = 30 + Math.sin(i * 1.3) * 14;
          const x2 = ((i + 1) / 6) * 320;
          const y2 = 30 + Math.sin((i + 1) * 1.3) * 14;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="0.6" opacity="0.4" />;
        })}
        {Array.from({ length: 7 }).map((_, i) => {
          const x = (i / 6) * 320;
          const y = 30 + Math.sin(i * 1.3) * 14;
          return <circle key={i} cx={x} cy={y} r="2" fill="currentColor" />;
        })}
      </svg>
    </div>
  );
}
