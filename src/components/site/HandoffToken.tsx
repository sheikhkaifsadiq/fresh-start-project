import { useEffect, useRef, useState } from "react";
import { useStage } from "../../lib/stage";
import { useRequestToken } from "../../lib/token";

/**
 * One canonical object, visibly handed from section to section.
 *
 * A small fixed chip pinned to the right rail. As the user scrolls it
 * morphs through nine states — one per scene — and shifts color/shape to
 * match what the current section says about the request. Between scenes
 * the next label pre-arms (cross-fades in over the last 20% of the
 * previous scene) so the handoff is felt, not announced.
 *
 * This is the literal embodiment of "one routing system, nine perspectives."
 */

type Scene = {
  id: string;       // matches section id / order
  label: string;    // what the chip says here
  sub: string;      // small caption
  tone: "ink" | "ember" | "signal"; // verdict colour
  shape: "dot" | "ring" | "bar" | "shield" | "node" | "burst";
};

const SCENES: Scene[] = [
  { id: "hero",        label: "REQ 0x{ID} · issued",        sub: "edge ingress",            tone: "ink",    shape: "dot"    },
  { id: "problem",     label: "REQ 0x{ID} · blind",         sub: "legacy passthrough",      tone: "ember",  shape: "ring"   },
  { id: "routing",     label: "REQ 0x{ID} · inspecting",    sub: "stage {STG} / 05",        tone: "ink",    shape: "bar"    },
  { id: "threat",      label: "REQ 0x{ID} · score {SC}",    sub: "{VRD} · feature attrib",  tone: "signal", shape: "dot"    },
  { id: "analytics",   label: "REQ 0x{ID} · logged",        sub: "datapoint · /q4/launch",  tone: "ink",    shape: "bar"    },
  { id: "network",     label: "REQ 0x{ID} · routed",        sub: "{POP} · {MS}ms",          tone: "signal", shape: "node"   },
  { id: "security",    label: "REQ 0x{ID} · 4/4 passed",    sub: "layered defense",         tone: "signal", shape: "shield" },
  { id: "confidence",  label: "REQ 0x{ID} · proof",         sub: "audit · replayable",      tone: "ink",    shape: "ring"   },
  { id: "cta",         label: "REQ 0x{ID} · resolved",      sub: "{MS}ms · clean 302",      tone: "signal", shape: "burst"  },
];

const TONE: Record<Scene["tone"], { bg: string; fg: string; glow: string }> = {
  ink:    { bg: "var(--ink)",    fg: "var(--paper)", glow: "rgba(20,22,26,0.30)"   },
  ember:  { bg: "var(--ember)",  fg: "#fff",         glow: "rgba(194,85,53,0.45)"  },
  signal: { bg: "var(--signal)", fg: "#fff",         glow: "rgba(47,109,90,0.42)"  },
};

export function HandoffToken() {
  const stage = useStage();
  const token = useRequestToken();
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const subRef = useRef<HTMLSpanElement>(null);
  const shapeRef = useRef<HTMLSpanElement>(null);
  const nextRef = useRef<HTMLSpanElement>(null);
  const [hasJS, setHasJS] = useState(false);

  useEffect(() => {
    setHasJS(true);
    if (!wrapRef.current) return;
    const wrap = wrapRef.current;

    let currentIdx = -1;
    let cy = window.innerHeight * 0.5;
    let cx = 0;

    const fmt = (s: string) =>
      s
        .replace("{ID}", token.id)
        .replace("{SC}", token.score.toFixed(2))
        .replace("{VRD}", token.verdict)
        .replace("{POP}", token.pop)
        .replace("{MS}", token.ms.toFixed(1))
        .replace("{STG}", "03"); // pipeline always shows mid-stage when visible

    const apply = (s: Scene) => {
      const tone = TONE[s.tone];
      if (innerRef.current) {
        innerRef.current.style.background = tone.bg;
        innerRef.current.style.color = tone.fg;
        innerRef.current.style.boxShadow = `0 14px 36px -16px ${tone.glow}, 0 0 0 1px ${tone.glow}`;
      }
      if (labelRef.current) labelRef.current.textContent = fmt(s.label);
      if (subRef.current) subRef.current.textContent = fmt(s.sub);
      if (shapeRef.current) {
        shapeRef.current.dataset.shape = s.shape;
      }
    };

    const unsub = stage.subscribe((f) => {
      // map scroll to scene index using actual section positions for fidelity
      const sections = SCENES.map((s) =>
        document.getElementById(s.id)
      );
      // find which section's midpoint is closest to viewport center
      const vmid = f.vh * 0.5;
      let bestIdx = 0;
      let bestDist = Infinity;
      let localT = 0;
      for (let i = 0; i < sections.length; i++) {
        const el = sections[i];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const mid = r.top + r.height / 2;
        const d = Math.abs(mid - vmid);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
          // local progress through this section, 0..1
          const sp = (vmid - r.top) / r.height;
          localT = Math.min(1, Math.max(0, sp));
        }
      }

      if (bestIdx !== currentIdx) {
        currentIdx = bestIdx;
        apply(SCENES[bestIdx]);
        // pre-arm next label
        if (nextRef.current) {
          const nxt = SCENES[Math.min(SCENES.length - 1, bestIdx + 1)];
          nextRef.current.textContent = `→ ${fmt(nxt.label).split(" · ")[1] ?? ""}`;
        }
      }

      // pre-arm cross-fade between scenes when localT > 0.8
      const preArm = Math.max(0, (localT - 0.8) / 0.2);
      if (nextRef.current) nextRef.current.style.opacity = String(preArm * 0.65);
      if (labelRef.current) labelRef.current.style.opacity = String(1 - preArm * 0.35);

      // gentle vertical follow: tracks viewport center with damping
      const ty = f.vh * 0.5;
      cy += (ty - cy) * 0.18;
      // horizontal: tiny drift on scroll velocity to suggest the object reacts
      const tx = -Math.max(-12, Math.min(12, f.scrollV * 1.8));
      cx += (tx - cx) * 0.15;

      // hide near very top and on CTA finale (last 8%)
      const visible = f.scrollProgress > 0.02 && f.scrollProgress < 0.985;
      wrap.style.opacity = visible ? "1" : "0";
      wrap.style.transform =
        `translate3d(${cx.toFixed(2)}px, calc(${cy.toFixed(2)}px - 50%), 0)`;
    });

    return unsub;
  }, [stage, token]);

  if (!hasJS) return null;

  return (
    <div ref={wrapRef} className="handoff-wrap" aria-hidden>
      <div ref={innerRef} className="handoff-chip">
        <span ref={shapeRef} className="handoff-shape" data-shape="dot" />
        <div className="handoff-text">
          <span ref={labelRef} className="handoff-label">REQ 0x{token.id} · issued</span>
          <span ref={subRef} className="handoff-sub">edge ingress</span>
          <span ref={nextRef} className="handoff-next" style={{ opacity: 0 }} />
        </div>
      </div>
    </div>
  );
}
