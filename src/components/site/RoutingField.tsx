import { useEffect, useRef } from "react";
import { usePointer, usePrefersReducedMotion } from "../../lib/motion";

/**
 * Page-wide ambient routing field.
 * Fixed full-viewport canvas drawing a sparse edge-POP graph with
 * request packets continuously traveling along edges. Some packets
 * are intercepted mid-flight (threat). Pointer biases nearest nodes.
 *
 * This is the page's "the system is always routing" layer. It sits
 * behind everything; product diagrams sit on top of it.
 */
type Node = { x: number; y: number; r: number; bx: number; by: number; pulse: number };
type Edge = [number, number];
type Packet = {
  edge: number;
  t: number;
  speed: number;
  hostile: boolean;
  intercepted: boolean;
  flash: number;
};

const NODE_COUNT = 22;

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function RoutingField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = usePointer();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let last = performance.now();

    let nodes: Node[] = [];
    let edges: Edge[] = [];
    let packets: Packet[] = [];

    const buildGraph = () => {
      const rand = seeded(7);
      nodes = Array.from({ length: NODE_COUNT }).map(() => {
        const x = rand() * width;
        const y = rand() * height;
        return { x, y, bx: x, by: y, r: 1.6 + rand() * 1.2, pulse: rand() };
      });
      // connect each node to 2 nearest
      edges = [];
      for (let i = 0; i < nodes.length; i++) {
        const dists = nodes
          .map((n, j) => ({ j, d: Math.hypot(n.x - nodes[i].x, n.y - nodes[i].y) }))
          .filter((d) => d.j !== i)
          .sort((a, b) => a.d - b.d)
          .slice(0, 2);
        for (const d of dists) {
          if (!edges.find(([a, b]) => (a === i && b === d.j) || (a === d.j && b === i))) {
            edges.push([i, d.j]);
          }
        }
      }
      packets = [];
      const initial = reduced ? 0 : 14;
      for (let i = 0; i < initial; i++) spawnPacket(rand());
    };

    const spawnPacket = (r?: number) => {
      const rr = r ?? Math.random();
      const edge = Math.floor(rr * edges.length);
      const hostile = Math.random() < 0.18;
      packets.push({
        edge,
        t: 0,
        speed: 0.0006 + Math.random() * 0.0006,
        hostile,
        intercepted: false,
        flash: 0,
      });
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildGraph();
    };
    resize();
    window.addEventListener("resize", resize);

    // Pulse density / intercept rate keyed to scroll position (which section)
    let density = 1;
    let interceptBias = 0.18;
    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, window.scrollY / max));
      // Pipeline (.2-.35) and Threat (.35-.5) → denser + more intercepts
      density = p > 0.18 && p < 0.55 ? 1.4 : 1.0;
      interceptBias = p > 0.32 && p < 0.5 ? 0.42 : 0.16;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const draw = (t: number) => {
      const dt = Math.min(64, t - last);
      last = t;

      // pointer bias
      const px = pointer.current.x;
      const py = pointer.current.y;

      ctx.clearRect(0, 0, width, height);

      // Subtle grid behind everything
      ctx.strokeStyle = "rgba(20,22,26,0.025)";
      ctx.lineWidth = 1;
      const gridSize = 96;
      ctx.beginPath();
      for (let x = (window.scrollY * 0.02) % gridSize; x < width; x += gridSize) {
        ctx.moveTo(x, 0); ctx.lineTo(x, height);
      }
      for (let y = (window.scrollY * 0.02) % gridSize; y < height; y += gridSize) {
        ctx.moveTo(0, y); ctx.lineTo(width, y);
      }
      ctx.stroke();

      // update nodes with pointer pull
      for (const n of nodes) {
        const dx = px - n.bx;
        const dy = py - n.by;
        const d = Math.hypot(dx, dy);
        const pull = d < 220 ? (1 - d / 220) * 14 : 0;
        const tx = n.bx + (d > 0 ? (dx / d) * pull : 0);
        const ty = n.by + (d > 0 ? (dy / d) * pull : 0);
        n.x += (tx - n.x) * 0.08;
        n.y += (ty - n.y) * 0.08;
        n.pulse += dt * 0.0008;
      }

      // edges
      ctx.lineWidth = 1;
      for (const [a, b] of edges) {
        const na = nodes[a], nb = nodes[b];
        ctx.strokeStyle = "rgba(20,22,26,0.06)";
        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
        ctx.stroke();
      }

      // nodes
      for (const n of nodes) {
        const a = 0.18 + (Math.sin(n.pulse * 4) + 1) * 0.05;
        ctx.fillStyle = `rgba(20,22,26,${a})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // packets
      if (!reduced) {
        for (let i = packets.length - 1; i >= 0; i--) {
          const p = packets[i];
          const [a, b] = edges[p.edge] ?? edges[0];
          const na = nodes[a], nb = nodes[b];
          if (!na || !nb) { packets.splice(i, 1); continue; }
          p.t += p.speed * dt * density;

          // chance of interception around 0.4-0.7 of edge if hostile
          if (p.hostile && !p.intercepted && p.t > 0.35 + Math.random() * 0.15) {
            if (Math.random() < interceptBias) {
              p.intercepted = true;
              p.flash = 1;
            }
          }

          const x = na.x + (nb.x - na.x) * p.t;
          const y = na.y + (nb.y - na.y) * p.t;

          if (p.intercepted) {
            const r = 4 + (1 - p.flash) * 18;
            ctx.fillStyle = `rgba(194,85,53,${0.18 * p.flash})`;
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = `rgba(194,85,53,${p.flash})`;
            ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
            p.flash -= dt * 0.0015;
            if (p.flash <= 0) { packets.splice(i, 1); }
          } else {
            // trailing line
            const tail = Math.max(0, p.t - 0.06);
            const tx = na.x + (nb.x - na.x) * tail;
            const ty = na.y + (nb.y - na.y) * tail;
            ctx.strokeStyle = p.hostile ? "rgba(194,85,53,0.55)" : "rgba(20,22,26,0.55)";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(tx, ty); ctx.lineTo(x, y);
            ctx.stroke();

            ctx.fillStyle = p.hostile ? "rgba(194,85,53,0.95)" : "rgba(20,22,26,0.85)";
            ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();

            if (p.t >= 1) packets.splice(i, 1);
          }
        }

        // maintain density
        const target = Math.floor(14 * density);
        while (packets.length < target) spawnPacket();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pointer, reduced]);

  return <canvas ref={canvasRef} className="routing-field" aria-hidden />;
}
