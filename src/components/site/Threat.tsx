import { useEffect, useState } from "react";
import { SectionHead } from "./SectionHead";
import { useTilt, Mask } from "../../lib/motion";

type Row = { ip: string; ua: string; score: number; verdict: "ALLOW" | "DENY" | "CHALLENGE" };

const SEED: Row[] = [
  { ip: "104.28.7.91",  ua: "Mozilla/5.0 (Macintosh) Safari/17.4",  score: 0.04, verdict: "ALLOW" },
  { ip: "45.155.205.12", ua: "python-requests/2.31",                score: 0.94, verdict: "DENY" },
  { ip: "188.114.97.3", ua: "Chrome/124 (Headless)",                score: 0.71, verdict: "CHALLENGE" },
  { ip: "73.92.144.18", ua: "Mozilla/5.0 (iPhone) Mobile/15E148",   score: 0.08, verdict: "ALLOW" },
  { ip: "162.247.74.7", ua: "curl/8.4.0",                           score: 0.88, verdict: "DENY" },
  { ip: "24.34.18.221", ua: "Mozilla/5.0 (Windows) Firefox/126.0",  score: 0.11, verdict: "ALLOW" },
  { ip: "193.32.162.4", ua: "Go-http-client/1.1",                   score: 0.82, verdict: "DENY" },
  { ip: "98.115.40.66", ua: "Mozilla/5.0 (Macintosh) Chrome/125",   score: 0.06, verdict: "ALLOW" },
];

export function Threat() {
  const [rows, setRows] = useState(SEED);
  const tilt1 = useTilt<HTMLDivElement>(4, 1.005);
  const tilt2 = useTilt<HTMLDivElement>(4, 1.005);

  useEffect(() => {
    const id = setInterval(() => {
      setRows((r) => {
        const next = [...r];
        next.unshift(next.pop()!);
        return next;
      });
    }, 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="threat" className="section">
      <div className="container-x">
        <SectionHead
          num="03 / Threat Intelligence"
          kicker="Inspection at the edge"
          title={<>Bots, scrapers, and abuse — scored <em>before</em> the click resolves.</>}
          body="An ensemble of fingerprint, behavioural, and reputation features feeds a calibrated model. Every request leaves a verdict, an explanation, and an audit trail."
        />
        <div className="threat-split">
          <Mask delay={0}>
            <div className="tilt-panel">
              <div ref={tilt1} className="panel" style={{ transformStyle: "preserve-3d" }}>
                <div style={{
                  padding: "14px 18px",
                  borderBottom: "1px solid var(--rule)",
                  display: "flex", justifyContent: "space-between",
                  fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.18em",
                  textTransform: "uppercase", color: "var(--muted)",
                }}>
                  <span>
                    <span style={{
                      display: "inline-block", width: 6, height: 6, background: "#2f6d5a",
                      borderRadius: "50%", marginRight: 8,
                      animation: "pulseDot 1.6s infinite",
                    }} />
                    Live · /q4/launch
                  </span>
                  <span>Last 60s</span>
                </div>
                <div style={{ overflow: "hidden" }}>
                  {rows.slice(0, 7).map((r, i) => (
                    <div
                      key={r.ip + i}
                      className={`req-row ${r.verdict === "ALLOW" ? "ok" : "bad"}`}
                      style={{
                        animation: i === 0 ? "rowIn .55s var(--ease-out)" : undefined,
                      }}
                    >
                      <div className="ip">{r.ip}</div>
                      <div className="ua">{r.ua}</div>
                      <div className="score">{r.score.toFixed(2)}</div>
                      <div className="verdict">{r.verdict}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Mask>

          <Mask delay={140}>
            <div className="tilt-panel">
              <div ref={tilt2} className="panel panel-pad" style={{ height: "100%", transformStyle: "preserve-3d" }}>
                <div className="kicker">Feature attribution</div>
                <h3 className="font-display" style={{
                  fontSize: 28, fontWeight: 400, margin: "16px 0 28px",
                  letterSpacing: "-0.01em",
                }}>
                  Why 45.155.205.12 was denied.
                </h3>
                {[
                  { l: "ASN reputation · datacenter origin", v: 0.92 },
                  { l: "JA4 fingerprint · automation library", v: 0.88 },
                  { l: "Header order · non-browser pattern",   v: 0.74 },
                  { l: "Request cadence · 38 rps from /24",   v: 0.81 },
                  { l: "Historical abuse · 7d window",        v: 0.66 },
                ].map((f, i) => (
                  <FeatureBar key={i} l={f.l} v={f.v} delay={i * 120} />
                ))}
                <div className="tag danger" style={{ marginTop: 24 }}>
                  Composite 0.94 · DENY
                </div>
              </div>
            </div>
          </Mask>
        </div>
      </div>

      <style>{`
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.4)} }
        @keyframes rowIn { from { opacity:0; transform: translateX(-20px) } to { opacity:1; transform:none } }
      `}</style>
    </section>
  );
}

function FeatureBar({ l, v, delay }: { l: string; v: number; delay: number }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), 200 + delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontFamily: "var(--font-mono)", fontSize: 11,
        color: "var(--ink-soft)", marginBottom: 6,
      }}>
        <span>{l}</span>
        <span>{v.toFixed(2)}</span>
      </div>
      <div style={{ height: 3, background: "var(--paper-2)", position: "relative" }}>
        <div style={{
          position: "absolute", inset: 0,
          width: on ? `${v * 100}%` : "0%",
          background: "var(--ember)",
          transition: "width 1.1s cubic-bezier(0.76,0,0.24,1)",
        }} />
      </div>
    </div>
  );
}
