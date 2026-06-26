import { useEffect, useState } from "react";
import { SectionHead } from "./SectionHead";
import { useTilt, Mask } from "../../lib/motion";
import { useRequestToken } from "../../lib/token";

type Row = { ip: string; ua: string; score: number; verdict: "ALLOW" | "DENY" | "CHALLENGE"; canonical?: boolean; id?: string };

const SEED: Row[] = [
  { ip: "45.155.205.12", ua: "python-requests/2.31",                score: 0.94, verdict: "DENY" },
  { ip: "188.114.97.3", ua: "Chrome/124 (Headless)",                score: 0.71, verdict: "CHALLENGE" },
  { ip: "73.92.144.18", ua: "Mozilla/5.0 (iPhone) Mobile/15E148",   score: 0.08, verdict: "ALLOW" },
  { ip: "162.247.74.7", ua: "curl/8.4.0",                           score: 0.88, verdict: "DENY" },
  { ip: "24.34.18.221", ua: "Mozilla/5.0 (Windows) Firefox/126.0",  score: 0.11, verdict: "ALLOW" },
  { ip: "193.32.162.4", ua: "Go-http-client/1.1",                   score: 0.82, verdict: "DENY" },
  { ip: "98.115.40.66", ua: "Mozilla/5.0 (Macintosh) Chrome/125",   score: 0.06, verdict: "ALLOW" },
];

const SYN_IPS = [
  "104.28.7.91", "172.69.34.18", "8.40.115.22", "192.0.2.144",
  "203.0.113.7", "198.51.100.42", "104.21.55.118", "162.247.74.7",
];
const SYN_UAS = [
  "Chrome/126 · macOS", "Safari/17 · iOS", "Edge/124 · Win11",
  "Firefox/127 · Linux", "Chrome/126 · Android", "Brave/1.65 · macOS",
];
const SYN_VERDICTS: Row["verdict"][] = ["ALLOW", "ALLOW", "ALLOW", "CHALLENGE", "DENY"];

function synthetic(seed: number): Row {
  const ip = SYN_IPS[seed % SYN_IPS.length];
  const ua = SYN_UAS[(seed * 3) % SYN_UAS.length];
  const verdict = SYN_VERDICTS[(seed * 7) % SYN_VERDICTS.length];
  const score = verdict === "DENY" ? 0.78 + (seed % 17) / 100
              : verdict === "CHALLENGE" ? 0.55 + (seed % 23) / 100
              : (seed % 13) / 100;
  return { ip, ua, score, verdict };
}

export function Threat() {
  const token = useRequestToken();
  const [tick, setTick] = useState(0);
  const canonicalRow: Row = {
    // canonical request continues to follow the user — but its surface
    // (ip, ua, score, verdict) rotates with the live system so the row
    // never reads as static copy.
    ip: synthetic(tick).ip,
    ua: synthetic(tick + 2).ua,
    score: synthetic(tick).score,
    verdict: synthetic(tick).verdict,
    canonical: true,
    id: token.id,
  };
  const [rows, setRows] = useState<Row[]>([canonicalRow, ...SEED]);
  const tilt1 = useTilt<HTMLDivElement>(4, 1.005);
  const tilt2 = useTilt<HTMLDivElement>(4, 1.005);

  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);
      setRows((r) => {
        // Rotate the body below the canonical row.
        const [head, ...tail] = r;
        const fresh = synthetic(Date.now() % 9973);
        tail.unshift(fresh);
        tail.pop();
        return [head, ...tail];
      });
    }, 1600);
    return () => clearInterval(id);
  }, []);

  // Keep canonical row in sync with rotating tick.
  useEffect(() => {
    setRows((r) => {
      const next = [...r];
      next[0] = {
        ip: synthetic(tick).ip,
        ua: synthetic(tick + 2).ua,
        score: synthetic(tick).score,
        verdict: synthetic(tick).verdict,
        canonical: true,
        id: token.id,
      };
      return next;
    });
  }, [tick, token.id]);

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
                    Live · /q4/launch · tracking 0x{token.id}
                  </span>
                  <span>Last 60s</span>
                </div>
                <div style={{ overflow: "hidden" }}>
                  {rows.slice(0, 7).map((r, i) => (
                    <div
                      key={r.ip + i}
                      className={`req-row ${r.verdict === "ALLOW" ? "ok" : "bad"}`}
                      style={{
                        animation: i === 0 ? undefined : "rowIn .55s var(--ease-out)",
                        background: r.canonical ? "color-mix(in oklab, var(--ink) 4%, transparent)" : undefined,
                        borderLeft: r.canonical ? "2px solid var(--ink)" : undefined,
                        paddingLeft: r.canonical ? 10 : undefined,
                      }}
                    >
                      <div className="ip">{r.ip}{r.canonical ? "  · REQ 0x" + r.id : ""}</div>
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
