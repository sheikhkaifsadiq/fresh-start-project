'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface NeuronNode {
  id: string;
  layer: number;
  index: number;
  x: number;
  y: number;
  activation: number; // 0.0 to 1.0
}

// Architecture: [14, 64, 64, 32, 32, 16, 1]
// We render a representative subset for visual clarity: [14, 8, 8, 6, 6, 4, 1]
const VISUAL_LAYERS = [14, 8, 8, 6, 6, 4, 1];
const LAYER_LABELS = ['Input\n14', 'L1\n64', 'L2\n64', 'L3\n32', 'L4\n32', 'L5\n16', 'Output\n1'];

/**
 * Live Neural Network Visualization
 * SVG canvas that renders the 5-layer Deep Neural Network topology.
 * Neurons light up in real-time based on actual activation scores.
 */
export function NeuralNetworkViz({ activations }: { activations?: number[][] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<NeuronNode[]>([]);
  const [dims, setDims] = useState({ w: 800, h: 400 });



  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const { width, height } = svg.getBoundingClientRect();
    setDims({ w: width || 800, h: height || 400 });
  }, []);

  useEffect(() => {
    const { w, h } = dims;
    const newNodes: NeuronNode[] = [];
    const layerCount = VISUAL_LAYERS.length;
    const xStep = w / (layerCount + 1);

    VISUAL_LAYERS.forEach((count, layerIdx) => {
      const yStep = h / (count + 1);
      for (let i = 0; i < count; i++) {
        const activation = activations?.[layerIdx]?.[i] ?? Math.random() * 0.4;
        newNodes.push({
          id: `${layerIdx}-${i}`,
          layer: layerIdx,
          index: i,
          x: xStep * (layerIdx + 1),
          y: yStep * (i + 1),
          activation,
        });
      }
    });

    setNodes(newNodes);
  }, [dims, activations]);

  // Animate neurons randomly when no live data
  useEffect(() => {
    if (activations) return;
    const interval = setInterval(() => {
      setNodes(prev => prev.map(n => ({
        ...n,
        activation: Math.max(0, Math.min(1, n.activation + (Math.random() - 0.5) * 0.3)),
      })));
    }, 800);
    return () => clearInterval(interval);
  }, [activations]);

  const getNodeById = (layer: number, index: number) =>
    nodes.find(n => n.layer === layer && n.index === index);

  const getColor = (activation: number) => {
    if (activation > 0.7) return '#6366f1';
    if (activation > 0.4) return '#818cf8';
    return '#1e1b4b';
  };

  return (
    <div className="relative w-full h-[320px] bg-black/40 rounded-2xl border border-white/10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 to-black/0 pointer-events-none" />
      <svg ref={svgRef} className="w-full h-full">
        {/* Connections */}
        {VISUAL_LAYERS.slice(0, -1).map((fromCount, fromLayer) => {
          const toCount = VISUAL_LAYERS[fromLayer + 1];
          const lines = [];
          for (let i = 0; i < fromCount; i++) {
            for (let j = 0; j < toCount; j++) {
              const from = getNodeById(fromLayer, i);
              const to = getNodeById(fromLayer + 1, j);
              if (!from || !to) continue;
              const opacity = Math.max(0.03, (from.activation + to.activation) / 2 * 0.25);
              lines.push(
                <line
                  key={`${fromLayer}-${i}-${j}`}
                  x1={from.x} y1={from.y}
                  x2={to.x} y2={to.y}
                  stroke={`rgba(99,102,241,${opacity})`}
                  strokeWidth={0.8}
                />
              );
            }
          }
          return lines;
        })}

        {/* Neurons */}
        {nodes.map(node => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={6}
              fill={getColor(node.activation)}
              style={{ transition: 'fill 0.6s ease, r 0.3s ease' }}
            />
            {node.activation > 0.6 && (
              <circle
                cx={node.x}
                cy={node.y}
                r={10}
                fill="none"
                stroke="#6366f1"
                strokeWidth={1}
                opacity={node.activation - 0.5}
              />
            )}
          </g>
        ))}

        {/* Layer Labels */}
        {LAYER_LABELS.map((label, i) => {
          const xStep = (dims.w) / (VISUAL_LAYERS.length + 1);
          return (
            <text
              key={i}
              x={xStep * (i + 1)}
              y={dims.h - 8}
              textAnchor="middle"
              fontSize="9"
              fill="rgba(156,163,175,0.6)"
              fontFamily="monospace"
            >
              {label.replace('\n', ' ')}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
