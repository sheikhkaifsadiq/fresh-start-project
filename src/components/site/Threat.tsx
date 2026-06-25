import { useEffect, useState } from "react";
import { SectionHead } from "./SectionHead";
import { Reveal } from "./Reveal";

type Row = { ip: string; ua: string; score: number; verdict: "ALLOW" | "DENY" | "CHALLENGE" };

const SEED: Row[] = [
  { ip: "104.28.7.91",  ua: "Mozilla/5.0 (Macintosh) Safari/17.4",       score: 0.04, verdict: "ALLOW" },
  { ip: "45.155.205.12", ua: "python-requests/2.31",                     score: 0.94, verdict: "DENY" },
  { ip: "188.114.97.3", ua: "Chrome/124 (Headless)",                     score: 0.71, verdict: "CHALLENGE" },
  { ip: "73.92.144.18", ua: "Mozilla/5.0 (iPhone) Mobile/15E148",        score: 0.08, verdict: "ALLOW" },
  { ip: "162.247.74.7", ua: "curl/8.4.0",                                score: 0.88, verdict: "DENY" },
  { ip: "24.34.18.221", ua: "Mozilla/5.0 (Windows) Firefox/126.0",       score: 0.11, verdict: "ALLOW" },
  { ip: "193.32.162.4", ua: "Go-http-client/1.1",                        score: 0.82, verdict: "DENY" },
  { ip: "98.115.40.66", ua: "Mozilla/5.0 (Macintosh) Chrome/125",        score: 0.06, verdict: "ALLOW" },
];

export function Threat() {
  const [rows, setRows] = useState(SEED);

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
          <Reveal>
            <div className="panel">
              <div style={{
                padding: "14px 18px",
                borderBottom: "1px solid var(--rule)",
                display: "flex", justifyContent: "space-between",
                fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.18em",
                textTransform: "uppercase", color: "var(--muted)",
              }}>
                <span>Live · /q4/launch</span>
                <span>Last 60s</span>
              </div>
              <div>
                {rows.slice(0, 7).map((r, i) => (
                  <div key={i} className={`req-row ${r.verdict === "ALLOW" ? "ok" : "bad"}`}>
                    <div className="ip">{r.ip}</div>
                    <div className="ua">{r.ua}</div>
                    <div className="score">{r.score.toFixed(2)}</div>
                    <div className="verdict">{r.verdict}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="panel panel-pad" style={{ height: "100%" }}>
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
                { l: "Header order · non-browser pattern", v: 0.74 },
                { l: "Request cadence · 38 rps from /24", v: 0.81 },
                { l: "Historical abuse · 7d window", v: 0.66 },
              ].map((f, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    fontFamily: "var(--font-mono)", fontSize: 11,
                    color: "var(--ink-soft)", marginBottom: 6,
                  }}>
                    <span>{f.l}</span>
                    <span>{f.v.toFixed(2)}</span>
                  </div>
                  <div style={{
                    height: 3, background: "var(--paper-2)", position: "relative",
                  }}>
                    <div style={{
                      position: "absolute", inset: 0,
                      width: `${f.v * 100}%`,
                      background: "var(--ember)",
                      transition: "width .8s var(--ease-out)",
                    }} />
                  </div>
                </div>
              ))}
              <div className="tag danger" style={{ marginTop: 24 }}>
                Composite 0.94 · DENY
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
