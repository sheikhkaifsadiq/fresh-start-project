import { useEffect, useRef } from "react";
import { useStage } from "../../lib/stage";

/**
 * Page-wide ambient: a sparse graph of edge POPs with request packets
 * always in flight. This is the "primary ambient" — never absent from
 * any viewport. Density modulates with scroll progress (idle in hero,
 * busiest mid-page where Pipeline + Threat live).
 *
 * Pure canvas, fixed behind all content, ~0.6% CPU on idle.
 */

type Node = { x: number; y: number; r: number; phase: number };
type Packet = { from: number; to: number; t: number; speed: number; bad: boolean; born: number };

const PALETTE = {
  ink: "rgba(20,22,26,0.55)",
  ruleNode: "rgba(20,22,26,0.16)",
  ruleLink: "rgba(20,22,26,0.06)",
  packetOk: "rgba(47,109,90,0.85)",
  packetBad: "rgba(194,85,53,0.9)",
  intercept: "rgba(194,85,53,0.16)",
};

function reducedMotion() {
  return typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function RoutingField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stage = useStage();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = reducedMotion();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0;
    let nodes: Node[] = [];
    let links: [number, number][] = [];
    let packets: Packet[] = [];

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildGraph();
    };

    const buildGraph = () => {
      // Even, deterministic distribution — feels like infrastructure, not noise.
      const cols = w < 720 ? 5 : 8;
      const rows = h < 700 ? 4 : 5;
      nodes = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const jx = (Math.sin(c * 13.7 + r * 7.3) * 0.5) * (w / cols) * 0.35;
          const jy = (Math.cos(c * 5.1  + r * 11.9) * 0.5) * (h / rows) * 0.35;
          nodes.push({
            x: ((c + 0.5) / cols) * w + jx,
            y: ((r + 0.5) / rows) * h + jy,
            r: 1.4 + ((c + r) % 3 === 0 ? 1.2 : 0),
            phase: (c * 0.7 + r * 1.1),
          });
        }
      }
      // Links: each node to its 2 nearest neighbours
      links = [];
      const seen = new Set<string>();
      nodes.forEach((n, i) => {
        const dists = nodes
          .map((m, j) => ({ j, d: i === j ? Infinity : Math.hypot(m.x - n.x, m.y - n.y) }))
          .sort((a, b) => a.d - b.d)
          .slice(0, 2);
        for (const { j } of dists) {
          const k = i < j ? `${i}-${j}` : `${j}-${i}`;
          if (!seen.has(k)) { seen.add(k); links.push([i, j]); }
        }
      });
    };

    /**
     * Scene-aware ambient.
     * 9 scenes (Hero → Finale). For each: density, threat rate, and a
     * directional bias. The background tells the same story as the foreground.
     *   0 Hero      — sparse traffic, idle
     *   1 Problem   — congested, high threat rate (blind redirect)
     *   2 Pipeline  — directed, even flow
     *   3 Threat    — interception spikes
     *   4 Analytics — organised traffic
     *   5 Network   — global traffic, fastest
     *   6 Layers    — filtered traffic (low threat survives)
     *   7 Confidence— calm
     *   8 Finale    — convergent, near-silent — every system steps aside for CTA
     */
    const SCENES = [
      { density: 0.04, threat: 0.08, speed: 0.85 }, // hero
      { density: 0.32, threat: 0.55, speed: 1.20 }, // problem (congestion)
      { density: 0.18, threat: 0.22, speed: 1.00 }, // pipeline
      { density: 0.26, threat: 0.74, speed: 1.15 }, // threat (interception spikes)
      { density: 0.20, threat: 0.18, speed: 0.95 }, // analytics
      { density: 0.30, threat: 0.20, speed: 1.35 }, // network (global)
      { density: 0.14, threat: 0.06, speed: 0.90 }, // layers (filtered)
      { density: 0.08, threat: 0.04, speed: 0.80 }, // confidence
      { density: 0.02, threat: 0.00, speed: 0.65 }, // finale (calm)
    ];

    // Smoothly interpolate between adjacent scenes — no hard scene cuts.
    const sceneState = (p: number) => {
      const f = p * (SCENES.length - 1);
      const i = Math.min(SCENES.length - 2, Math.max(0, Math.floor(f)));
      const k = f - i;
      const a = SCENES[i], b = SCENES[i + 1];
      return {
        density: a.density + (b.density - a.density) * k,
        threat:  a.threat  + (b.threat  - a.threat)  * k,
        speed:   a.speed   + (b.speed   - a.speed)   * k,
      };
    };

    const spawnPacket = (now: number, threatRate: number, speedMult: number) => {
      if (!links.length) return;
      const [a, b] = links[Math.floor(Math.random() * links.length)];
      const dir = Math.random() < 0.5;
      const bad = Math.random() < threatRate;
      packets.push({
        from: dir ? a : b,
        to:   dir ? b : a,
        t: 0,
        speed: (0.6 + Math.random() * 0.9) * speedMult,
        bad,
        born: now,
      });
      if (packets.length > 140) packets.shift();
    };

    resize();
    window.addEventListener("resize", resize);

    let lastSpawn = 0;
    let lastFrame = performance.now();

    const draw = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;
      const f = stage.frame.current;

      // scene-aware density (no global "scroll = more" curve any more)
      const sc = sceneState(f.scrollProgress);
      const density = reduced ? 0 : sc.density;
      if (now - lastSpawn > 16 && !reduced) {
        if (Math.random() < density) spawnPacket(now, sc.threat, sc.speed);
        lastSpawn = now;
      }

      // Convergence — as the user nears the CTA the whole field steps aside.
      const finaleCalm = Math.max(0, (f.scrollProgress - 0.86) / 0.14);
      canvas.style.opacity = String(1 - finaleCalm * 0.85);

      ctx.clearRect(0, 0, w, h);

      // Pointer attraction: nodes lean toward cursor
      const aX = f.px, aY = f.py;
      const aR = 220;

      // Links
      ctx.lineWidth = 1;
      ctx.strokeStyle = PALETTE.ruleLink;
      ctx.beginPath();
      for (const [i, j] of links) {
        const a = nodes[i], b = nodes[j];
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();

      // Nodes
      for (const n of nodes) {
        const dx = aX - n.x, dy = aY - n.y;
        const d = Math.hypot(dx, dy);
        const pull = d < aR ? (1 - d / aR) * 8 : 0;
        const nx = n.x + (dx / (d || 1)) * pull;
        const ny = n.y + (dy / (d || 1)) * pull;
        const pulse = reduced ? 0 : Math.sin(f.t * 1.4 + n.phase) * 0.35 + 0.35;
        ctx.beginPath();
        ctx.fillStyle = PALETTE.ruleNode;
        ctx.arc(nx, ny, n.r + pulse, 0, Math.PI * 2);
        ctx.fill();
        // store transient for packet lookup
        (n as any)._x = nx; (n as any)._y = ny;
      }

      // Packets
      const live: Packet[] = [];
      for (const p of packets) {
        p.t += dt * p.speed;
        const a = nodes[p.from], b = nodes[p.to];
        if (!a || !b) continue;
        // interception: bad packets get cut around t=0.55-0.7
        const cut = p.bad ? 0.55 + ((p.born % 100) / 100) * 0.15 : Infinity;
        const t = Math.min(p.t, cut);
        if (t >= 1) continue;
        const x = (a as any)._x + ((b as any)._x - (a as any)._x) * t;
        const y = (a as any)._y + ((b as any)._y - (a as any)._y) * t;
        // streak
        const trailT = Math.max(0, t - 0.06);
        const tx = (a as any)._x + ((b as any)._x - (a as any)._x) * trailT;
        const ty = (a as any)._y + ((b as any)._y - (a as any)._y) * trailT;
        ctx.strokeStyle = p.bad ? PALETTE.packetBad : PALETTE.packetOk;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();
        // head dot
        ctx.beginPath();
        ctx.fillStyle = p.bad ? PALETTE.packetBad : PALETTE.packetOk;
        ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
        // interception flash
        if (p.bad && p.t >= cut && p.t < cut + 0.12) {
          ctx.beginPath();
          ctx.fillStyle = PALETTE.intercept;
          ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fill();
        }
        if (p.t < 1) live.push(p);
      }
      packets = live;
    };

    const unsub = stage.subscribe(draw);
    return () => {
      unsub();
      window.removeEventListener("resize", resize);
    };
  }, [stage]);

  return <canvas ref={canvasRef} className="routing-field" aria-hidden />;
}
