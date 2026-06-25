import { useEffect, useRef, useState } from "react";
import { useRequestToken } from "../../lib/token";
import { useStage } from "../../lib/stage";


/**
 * HeroPipeline — the product, visible in the first viewport.
 *
 *   Incoming Link  →  AI Inspection  →  Threat Decision  →  Safe Route
 *
 * A packet enters from the left, gets inspected (score rises), a verdict
 * is taken, and the packet is routed to the corresponding edge POP. The
 * loop runs continuously — the system is alive before the user scrolls.
 */

type Sample = {
  id: string;
  src: string;
  ua: string;
  asn: string;
  score: number;
  verdict: "ALLOW" | "CHALLENGE" | "SINK";
  pop: string;
};

const SAMPLES: Sample[] = [
  { id: "67a2", src: "aegis.to/q4-launch", ua: "Chrome/126 · macOS",   asn: "AS13335", score: 0.04, verdict: "ALLOW",     pop: "SFO-04" },
  { id: "8be1", src: "aegis.to/q4-launch", ua: "headless/119 · linux", asn: "AS14061", score: 0.91, verdict: "SINK",      pop: "FRA-11" },
  { id: "4f73", src: "aegis.to/invite",    ua: "curl/8.4",             asn: "AS16509", score: 0.74, verdict: "CHALLENGE", pop: "DUB-02" },
  { id: "29ac", src: "aegis.to/press-kit", ua: "Safari/17 · iOS",      asn: "AS7922",  score: 0.07, verdict: "ALLOW",     pop: "JFK-07" },
  { id: "b5d4", src: "aegis.to/login",     ua: "python-requests/2.31", asn: "AS8075",  score: 0.83, verdict: "SINK",      pop: "SEA-03" },
];

const STAGE_MS = 1600; // per stage
const STAGES = ["Incoming Link", "AI Inspection", "Threat Decision", "Safe Route"] as const;

export function HeroPipeline() {
  const token = useRequestToken();
  const [i, setI] = useState(0);          // which sample
  const [stage, setStage] = useState(0);  // 0..3
  const sample = SAMPLES[i];

  useEffect(() => {
    const id = setInterval(() => {
      setStage((s) => {
        if (s < 3) return s + 1;
        setI((n) => (n + 1) % SAMPLES.length);
        return 0;
      });
    }, STAGE_MS);
    return () => clearInterval(id);
  }, []);

  // 0..1 progress used to position the packet on the rail.
  const progress = Math.min(1, stage / 3);
  const verdictColor =
    sample.verdict === "ALLOW" ? "#2f6f4e" :
    sample.verdict === "SINK"  ? "#c25535" :
                                 "#b3812a";

  return (
    <div className="hp-stage" aria-label="Live routing pipeline">
      <div className="hp-head">
        <span className="hp-dot" style={{ background: verdictColor }} />
        <span>LIVE · running on tracked REQ 0x{token.id}</span>
      </div>

      <div className="hp-rail">
        {/* base rail */}
        <div className="hp-line" />
        {/* progress rail */}
        <div
          className="hp-line hp-line-fill"
          style={{ width: `${progress * 100}%`, background: verdictColor }}
        />

        {STAGES.map((label, idx) => {
          const active = stage >= idx;
          return (
            <div
              key={label}
              className={`hp-node ${active ? "on" : ""}`}
              style={{ left: `${(idx / 3) * 100}%` }}
            >
              <div
                className="hp-bullet"
                style={active ? { background: idx === stage ? verdictColor : "var(--ink)", borderColor: idx === stage ? verdictColor : "var(--ink)" } : undefined}
              />
              <div className="hp-label">
                <div className="hp-step">0{idx + 1}</div>
                <div className="hp-name">{label}</div>
              </div>
            </div>
          );
        })}

        {/* travelling packet — translate scales with progress so it never overflows the rail */}
        <div
          className="hp-packet"
          style={{
            left: `${progress * 100}%`,
            transform: `translate(${-progress * 100}%, -100%)`,
            background: verdictColor,
            transition: `left ${STAGE_MS}ms cubic-bezier(0.76,0,0.24,1), transform ${STAGE_MS}ms cubic-bezier(0.76,0,0.24,1), background .2s linear`,
          }}
        >
          0x{sample.id}
        </div>

      </div>

      <div className="hp-readout">
        <Field label="Source" value={sample.src} show />
        <Field label="Client" value={sample.ua} show={stage >= 1} />
        <Field label="ASN"    value={sample.asn} show={stage >= 1} />
        <Field
          label="Score"
          show={stage >= 1}
          value={
            <span style={{ color: verdictColor }}>
              {sample.score.toFixed(2)}
              <span className="hp-bar">
                <span
                  className="hp-bar-fill"
                  style={{
                    width: stage >= 1 ? `${sample.score * 100}%` : "0%",
                    background: verdictColor,
                  }}
                />
              </span>
            </span>
          }
        />
        <Field
          label="Verdict"
          show={stage >= 2}
          value={
            <span style={{ color: verdictColor, letterSpacing: "0.18em" }}>{sample.verdict}</span>
          }
        />
        <Field
          label="Routed → POP"
          show={stage >= 3}
          value={<span style={{ color: "var(--ink)" }}>{sample.pop}</span>}
        />
      </div>
    </div>
  );
}

function Field({ label, value, show }: { label: string; value: React.ReactNode; show: boolean }) {
  return (
    <div
      className="hp-field"
      style={{
        opacity: show ? 1 : 0.18,
        transform: show ? "translateY(0)" : "translateY(4px)",
        transition: "opacity .55s var(--ease-out), transform .55s var(--ease-out)",
      }}
    >
      <div className="hp-field-l">{label}</div>
      <div className="hp-field-v">{show ? value : <span style={{ color: "var(--muted)" }}>—</span>}</div>
    </div>
  );
}

