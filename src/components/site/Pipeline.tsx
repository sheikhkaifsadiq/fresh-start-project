import { useEffect, useRef, useState } from "react";
import { SectionHead } from "./SectionHead";
import { useStage } from "../../lib/stage";
import { useRequestToken } from "../../lib/token";

/**
 * Decision Pipeline — the centerpiece. 320vh pinned.
 * A request packet physically travels across 5 stages while the camera
 * pushes in, a fingerprint extracts mid-flight, ML feature bars build,
 * a verdict resolves, and the branch glows safe-cream or threat-ember.
 */

const STAGES = [
  { idx: "01", ttl: "Ingest",  desc: "TLS terminated, headers parsed at the nearest edge POP." },
  { idx: "02", ttl: "Inspect", desc: "ASN, UA, JA4 hashed against the live reputation graph." },
  { idx: "03", ttl: "Score",   desc: "On-edge model returns calibrated risk with feature attribution." },
  { idx: "04", ttl: "Decide",  desc: "Policy resolves: allow, challenge, reroute, sink, or deny." },
  { idx: "05", ttl: "Route",   desc: "302 emitted to clean destination. Decision logged." },
];

const FEATURES = [
  { k: "asn.rep",       w: 0.82, threat: 0.71 },
  { k: "ja4.entropy",   w: 0.64, threat: 0.55 },
  { k: "ua.coherence",  w: 0.48, threat: 0.62 },
  { k: "geo.velocity",  w: 0.39, threat: 0.44 },
  { k: "hdr.signature", w: 0.71, threat: 0.83 },
  { k: "tls.fp",        w: 0.55, threat: 0.49 },
];

// Scroll choreography — fractions of the pinned timeline
const T = {
  enter:    [0.00, 0.10],
  travel1:  [0.10, 0.28], // ingest → inspect
  inspect:  [0.20, 0.34], // fingerprint extracts
  travel2:  [0.34, 0.50], // inspect → score
  score:    [0.42, 0.62], // bars build
  travel3:  [0.58, 0.72], // score → decide
  decide:   [0.66, 0.80], // branch chooses
  travel4:  [0.78, 0.92], // decide → route
  resolve:  [0.88, 1.00],
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (x: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
const range = (x: number, [a, b]: number[]) => clamp((x - a) / (b - a));

export function Pipeline() {
  const wrap = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const fpRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const verdictRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<Array<HTMLDivElement | null>>([]);
  const stageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const stage = useStage();
  const token = useRequestToken();
  const [verdict, setVerdict] = useState<"unknown" | "threat" | "safe">("unknown");
  const [activeIdx, setActiveIdx] = useState(0);
  const [tMs, setTMs] = useState("0.00");
  // Deterministic — the canonical token resolves the same on every render.
  const isThreat = useRef(token.verdict !== "ALLOW");

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;

    const unsub = stage.subscribe((f) => {
      const rect = el.getBoundingClientRect();
      const total = rect.height - f.vh;
      const passed = Math.min(total, Math.max(0, -rect.top));
      const t = total > 0 ? passed / total : 0;

      // ─── Camera push-in + slight parallax with scroll velocity ───
      if (cameraRef.current) {
        const push = 1 + range(t, [0, 0.7]) * 0.06 - range(t, [0.85, 1]) * 0.04;
        const vTilt = clamp(f.scrollV * 0.04, -1.6, 1.6);
        const yOff = range(t, [0.2, 0.9]) * -14;
        cameraRef.current.style.transform =
          `perspective(1600px) translateY(${yOff}px) rotateX(${vTilt}deg) scale(${push})`;
      }

      // ─── Token travel across the rail ───
      const stops = [0.05, 0.27, 0.5, 0.72, 0.95];
      const seg = clamp(t / 0.95);
      // Find which segment we're between
      let pos = stops[0];
      for (let i = 0; i < stops.length - 1; i++) {
        const a = stops[i], b = stops[i + 1];
        const localStart = i / (stops.length - 1) * 0.95;
        const localEnd = (i + 1) / (stops.length - 1) * 0.95;
        if (seg >= localStart && seg <= localEnd) {
          const k = (seg - localStart) / (localEnd - localStart);
          // ease + slight overshoot on fast scroll
          const eased = k * k * (3 - 2 * k);
          const overshoot = clamp(f.scrollVAbs * 0.08, 0, 0.08) * Math.sin(k * Math.PI);
          pos = lerp(a, b, eased) + overshoot;
          break;
        }
      }
      if (seg >= 0.95) pos = stops[stops.length - 1];

      if (tokenRef.current && trackRef.current) {
        const w = trackRef.current.offsetWidth;
        const threat = isThreat.current;
        const branched = t > T.decide[1];
        const yLift = branched ? (threat ? 36 : -36) : 0;
        tokenRef.current.style.transform =
          `translate3d(${pos * w - 6}px, ${yLift}px, 0)`;
        tokenRef.current.style.background = branched
          ? (threat ? "var(--ember)" : "var(--signal)")
          : "var(--ink)";
        tokenRef.current.style.boxShadow = branched
          ? (threat
              ? "0 0 26px 8px rgba(194,85,53,0.55)"
              : "0 0 26px 8px rgba(47,109,90,0.45)")
          : "0 0 18px 4px rgba(20,22,26,0.25)";
      }

      // ─── Stage activation (the packet's presence lights them) ───
      const idx = pos < 0.16 ? 0 : pos < 0.38 ? 1 : pos < 0.61 ? 2 : pos < 0.83 ? 3 : 4;
      setActiveIdx(idx);
      stageRefs.current.forEach((s, i) => {
        if (!s) return;
        const on = i <= idx;
        s.style.borderColor = on ? "color-mix(in oklab, var(--ember) 30%, var(--rule))" : "var(--rule)";
        s.style.background = on
          ? "linear-gradient(180deg, color-mix(in oklab, var(--ember) 6%, var(--paper)), var(--paper))"
          : "var(--paper)";
      });

      // ─── Fingerprint extraction overlay (stage 02) ───
      if (fpRef.current) {
        const k = range(t, T.inspect);
        fpRef.current.style.opacity = String(k);
        fpRef.current.style.transform = `translateY(${(1 - k) * 16}px)`;
      }

      // ─── ML feature bars build (stage 03) ───
      if (scoreRef.current) {
        const k = range(t, T.score);
        scoreRef.current.style.opacity = String(k);
        scoreRef.current.style.transform = `translateY(${(1 - k) * 16}px)`;
        const threat = isThreat.current;
        barRefs.current.forEach((b, i) => {
          if (!b) return;
          const target = (threat ? FEATURES[i].threat : FEATURES[i].w) * 100;
          const v = target * clamp(k * 1.4 - i * 0.08);
          b.style.width = `${v}%`;
          b.style.background = threat && v > 55 ? "var(--ember)" : "var(--ink)";
        });
      }

      // ─── Verdict resolves at decide ───
      const decidedK = range(t, T.decide);
      if (decidedK > 0.5) setVerdict(isThreat.current ? "threat" : "safe");
      else if (decidedK === 0) setVerdict("unknown");
      if (verdictRef.current) {
        verdictRef.current.style.opacity = String(range(t, [T.decide[0], T.decide[1]]));
      }

      setTMs((11.4 * clamp(t)).toFixed(2));
    });

    return unsub;
  }, [stage]);

  return (
    <section id="routing" className="section pipeline-section" style={{ paddingBottom: 0 }}>
      <div className="container-x">
        <SectionHead
          num="02 / Intelligent Routing"
          kicker="The decision pipeline"
          title={<>Watch one request travel <em>the entire stack.</em></>}
          body="Five stages. One packet. From the edge POP to the final 302 — every inspection, score, and policy decision happens before the redirect resolves."
        />
      </div>

      <div ref={wrap} className="pipeline-pin" style={{ minHeight: "320vh" }}>
        <div className="sticky" style={{ top: 0, height: "100vh", display: "flex", alignItems: "center" }}>
          <div className="container-x" style={{ width: "100%" }}>
            <div ref={cameraRef} className="pipeline-camera" style={{ transformOrigin: "center 60%", willChange: "transform" }}>
              <div className="pipeline-cinema">
                {/* Header strip */}
                <div className="pcin-head">
                  <div className="pcin-stamp">REQ · 0x{token.id}</div>
                  <div className="pcin-stamp">T+{tMs}ms</div>
                  <div className="pcin-stamp">STAGE / {STAGES[activeIdx].idx} · {STAGES[activeIdx].ttl.toUpperCase()}</div>
                </div>

                {/* Stages rail — only active stage holds the description */}
                <div className="pcin-rail">
                  {STAGES.map((s, i) => {
                    const active = i === activeIdx;
                    const past = i < activeIdx;
                    return (
                      <div
                        key={s.idx}
                        ref={(el) => { stageRefs.current[i] = el; }}
                        className="pcin-stage"
                        style={{
                          opacity: active ? 1 : past ? 0.42 : 0.22,
                          transform: active ? "translateY(-2px)" : "translateY(0)",
                          transition: "opacity .6s var(--ease-out), transform .6s var(--ease-out), border-color .4s, background .4s",
                        }}
                      >
                        <div className="pcin-idx">{s.idx}</div>
                        <div className="pcin-ttl">{s.ttl}</div>
                        <div
                          className="pcin-desc"
                          style={{
                            opacity: active ? 1 : 0,
                            maxHeight: active ? 120 : 0,
                            overflow: "hidden",
                            transition: "opacity .5s var(--ease-out), max-height .5s var(--ease-out)",
                          }}
                        >
                          {s.desc}
                        </div>
                      </div>
                    );
                  })}

                  {/* Track + packet */}
                  <div ref={trackRef} className="pcin-track" aria-hidden>
                    <div className="pcin-track-line" />
                    <div ref={tokenRef} className="pcin-token" />
                  </div>

                  {/* Branch lines (safe up / threat down) */}
                  <svg className="pcin-branch" viewBox="0 0 1000 240" preserveAspectRatio="none" aria-hidden>
                    <path d="M 720 120 Q 820 120 880 60" className="branch safe" />
                    <path d="M 720 120 Q 820 120 880 180" className="branch threat" />
                  </svg>
                </div>


                {/* Floating overlays — fingerprint + ML score */}
                <div className="pcin-overlays">
                  <div ref={fpRef} className="pcin-fp" style={{ opacity: 0 }}>
                    <div className="pcin-stamp">FINGERPRINT · JA4 · REQ 0x{token.id}</div>
                    <div className="pcin-fp-hash">{token.hash}</div>
                    <div className="pcin-fp-meta">
                      <span>{token.asn.toLowerCase()}</span><span>geo {token.geo.split(" ")[0]}</span><span>ua {token.ua.split(" · ")[0].toLowerCase()}</span><span>tls 1.3</span>
                    </div>
                  </div>

                  <div ref={scoreRef} className="pcin-score" style={{ opacity: 0 }}>
                    <div className="pcin-stamp">MODEL · aegis-v4 · 6 features</div>
                    {FEATURES.map((ft, i) => (
                      <div key={ft.k} className="pcin-bar-row">
                        <span className="pcin-bar-k">{ft.k}</span>
                        <div className="pcin-bar"><div ref={(el) => { barRefs.current[i] = el; }} /></div>
                      </div>
                    ))}
                  </div>

                  <div ref={verdictRef} className="pcin-verdict" style={{ opacity: 0 }}>
                    <div className="pcin-stamp">VERDICT</div>
                    <div className={`pcin-verdict-val ${verdict}`}>
                      {verdict === "threat" ? "INTERCEPT · sink to /honey" :
                       verdict === "safe"   ? "ALLOW · 302 → destination" :
                       "EVALUATING…"}
                    </div>
                    <div className="pcin-stamp" style={{ opacity: 0.6 }}>
                      decision in {tMs}ms · logged · replayable
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
