"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface SankeyNode {
  id: string;
  label?: string;
  color?: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyDiagramProps {
  nodes: SankeyNode[];
  links: SankeyLink[];
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  nodeWidth?: number;
  nodePadding?: number;
  colors?: string[];
  showTooltip?: boolean;
  interactive?: boolean;
}

export const SankeyDiagram: React.FC<SankeyDiagramProps> = ({
  nodes,
  links,
  width = 800,
  height = 500,
  margin = { top: 20, right: 20, bottom: 20, left: 20 },
  nodeWidth = 24,
  nodePadding = 16,
  colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"],
  showTooltip = true,
  interactive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });
  const [hoveredLink, setHoveredLink] = useState<{ link: SankeyLink; x: number; y: number } | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{ node: SankeyNode; value: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width: w, height: h } = entries[0].contentRect;
        if (w > 0 && h > 0) setDimensions({ width: w, height: h });
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const innerWidth = Math.max(0, dimensions.width - margin.left - margin.right);
  const innerHeight = Math.max(0, dimensions.height - margin.top - margin.bottom);

  // Compute Layout (Very simplified Sankey engine)
  const { computedNodes, computedLinks } = useMemo(() => {
    if (nodes.length === 0 || links.length === 0) return { computedNodes: [], computedLinks: [] };

    // Find sources and targets for each node
    const nodeMap = new Map<string, { in: number; out: number; layer: number; y: number; x: number; height: number }>();
    nodes.forEach(n => nodeMap.set(n.id, { in: 0, out: 0, layer: 0, y: 0, x: 0, height: 0 }));

    links.forEach(l => {
      if (nodeMap.has(l.source)) nodeMap.get(l.source)!.out += l.value;
      if (nodeMap.has(l.target)) nodeMap.get(l.target)!.in += l.value;
    });

    // Assign layers (BFS)
    const layers: string[][] = [[]];
    nodes.forEach(n => {
      if (nodeMap.get(n.id)!.in === 0) {
        layers[0].push(n.id);
        nodeMap.get(n.id)!.layer = 0;
      }
    });

    let currentLayer = 0;
    let hasMore = true;
    while (hasMore && currentLayer < 10) {
      hasMore = false;
      const nextLayerNodes = new Set<string>();
      links.forEach(l => {
        if (nodeMap.get(l.source)!.layer === currentLayer) {
          nextLayerNodes.add(l.target);
        }
      });
      if (nextLayerNodes.size > 0) {
        layers.push(Array.from(nextLayerNodes));
        Array.from(nextLayerNodes).forEach(id => {
          if(nodeMap.has(id)) nodeMap.get(id)!.layer = currentLayer + 1;
        });
        hasMore = true;
        currentLayer++;
      }
    }

    // Assign X positions
    const layerCount = layers.length;
    const xStep = layerCount > 1 ? (innerWidth - nodeWidth) / (layerCount - 1) : 0;
    
    // Find max total value in any layer to scale heights
    let maxLayerValue = 0;
    layers.forEach(layerNodes => {
      let layerTotal = 0;
      layerNodes.forEach(id => {
        const n = nodeMap.get(id)!;
        layerTotal += Math.max(n.in, n.out);
      });
      if (layerTotal > maxLayerValue) maxLayerValue = layerTotal;
    });

    const valueScale = maxLayerValue > 0 ? (innerHeight - (Math.max(...layers.map(l => l.length)) * nodePadding)) / maxLayerValue : 1;

    // Calculate Node Heights & Y positions
    layers.forEach((layerNodes, layerIdx) => {
      let currentY = 0;
      layerNodes.forEach(id => {
        const n = nodeMap.get(id)!;
        n.x = layerIdx * xStep;
        n.height = Math.max(1, Math.max(n.in, n.out) * valueScale);
        n.y = currentY;
        currentY += n.height + nodePadding;
      });
    });

    // Compute Link Paths
    const computedLinks: any[] = [];
    const sourceOffsets = new Map<string, number>();
    const targetOffsets = new Map<string, number>();

    links.forEach(l => {
      if (!nodeMap.has(l.source) || !nodeMap.has(l.target)) return;
      const source = nodeMap.get(l.source)!;
      const target = nodeMap.get(l.target)!;
      
      const sourceOffset = sourceOffsets.get(l.source) || 0;
      const targetOffset = targetOffsets.get(l.target) || 0;

      const linkHeight = l.value * valueScale;

      const x0 = source.x + nodeWidth;
      const y0 = source.y + sourceOffset + linkHeight / 2;
      const x1 = target.x;
      const y1 = target.y + targetOffset + linkHeight / 2;

      // Cubic bezier path for Sankey link
      const d = `M ${x0} ${y0} C ${x0 + (x1 - x0) / 2} ${y0}, ${x0 + (x1 - x0) / 2} ${y1}, ${x1} ${y1}`;

      computedLinks.push({
        ...l,
        d,
        strokeWidth: linkHeight,
        sourceNode: nodes.find(n => n.id === l.source),
        targetNode: nodes.find(n => n.id === l.target),
      });

      sourceOffsets.set(l.source, sourceOffset + linkHeight);
      targetOffsets.set(l.target, targetOffset + linkHeight);
    });

    const finalNodes = nodes.map((n, i) => {
      const data = nodeMap.get(n.id);
      return {
        ...n,
        ...data,
        color: n.color || colors[i % colors.length]
      };
    });

    return { computedNodes: finalNodes, computedLinks };
  }, [nodes, links, innerWidth, innerHeight, nodeWidth, nodePadding, colors]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive) return;
    // Basic hit test is handled by individual elements
  };

  return (
    <div className="w-full h-full flex flex-col relative" ref={containerRef}>
      <div className="flex-1 relative">
        <svg
          width="100%"
          height="100%"
          onMouseMove={handleMouseMove}
          className="overflow-visible"
        >
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            
            {/* Links */}
            {computedLinks.map((l, i) => (
              <motion.path
                key={`link-${i}`}
                d={l.d}
                fill="none"
                stroke={l.sourceNode?.color || "#ffffff"}
                strokeOpacity={hoveredLink?.link === l ? 0.6 : 0.2}
                strokeWidth={l.strokeWidth}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, delay: i * 0.1, ease: "easeInOut" }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredLink({ link: l, x: e.clientX - rect.left, y: e.clientY - rect.top });
                  setHoveredNode(null);
                }}
                onMouseLeave={() => setHoveredLink(null)}
                className="transition-opacity cursor-pointer"
              />
            ))}

            {/* Nodes */}
            {computedNodes.map((n: any, i) => (
              <g key={`node-${n.id}`} transform={`translate(${n.x}, ${n.y})`}>
                <motion.rect
                  width={nodeWidth}
                  height={n.height}
                  fill={n.color}
                  rx={4}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  style={{ transformOrigin: "top" }}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredNode({ node: n, value: Math.max(n.in, n.out), x: n.x, y: n.y });
                    setHoveredLink(null);
                  }}
                  onMouseLeave={() => setHoveredNode(null)}
                  className="cursor-pointer hover:brightness-125 transition-all"
                />
                <text
                  x={n.x > innerWidth / 2 ? -8 : nodeWidth + 8}
                  y={n.height / 2}
                  dy="0.35em"
                  textAnchor={n.x > innerWidth / 2 ? "end" : "start"}
                  className="text-xs font-semibold fill-white/80 pointer-events-none"
                >
                  {n.label || n.id}
                </text>
              </g>
            ))}

          </g>
        </svg>

        {/* Tooltips */}
        <AnimatePresence>
          {hoveredLink && showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute pointer-events-none z-50 bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-lg p-3 shadow-xl flex flex-col gap-1"
              style={{ left: margin.left + hoveredLink.x, top: margin.top + hoveredLink.y }}
            >
              <div className="text-white/60 text-xs">
                {hoveredLink.link.source} → {hoveredLink.link.target}
              </div>
              <div className="text-white font-bold">{hoveredLink.link.value.toLocaleString()}</div>
            </motion.div>
          )}

          {hoveredNode && showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute pointer-events-none z-50 bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-lg p-3 shadow-xl flex flex-col gap-1"
              style={{ left: margin.left + hoveredNode.x + nodeWidth + 10, top: margin.top + hoveredNode.y }}
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: hoveredNode.node.color }} />
                <span className="text-white font-bold">{hoveredNode.node.label || hoveredNode.node.id}</span>
              </div>
              <div className="text-white/80 text-sm mt-1">Total Flow: {hoveredNode.value.toLocaleString()}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
