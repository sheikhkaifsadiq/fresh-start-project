"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Network, Activity, Cpu, Layers, Maximize2, Minimize2, Play, Pause, RefreshCcw, Database, AlertCircle, Zap } from "lucide-react";

interface NodeData {
  id: string;
  layer: number;
  value: number;
  bias: number;
  activation: string;
}

interface EdgeData {
  source: string;
  target: string;
  weight: number;
}

interface NetworkState {
  nodes: NodeData[];
  edges: EdgeData[];
  metrics: {
    loss: number;
    accuracy: number;
    epoch: number;
    learningRate: number;
  };
}

// Generate complex synthetic data for visualizer
const generateNetwork = (layers: number[]): NetworkState => {
  const nodes: NodeData[] = [];
  const edges: EdgeData[] = [];
  
  let nodeId = 0;
  const layerNodes: string[][] = [];

  // Create Nodes
  layers.forEach((nodeCount, layerIdx) => {
    const currentLayerNodes: string[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const id = `n_${nodeId++}`;
      currentLayerNodes.push(id);
      nodes.push({
        id,
        layer: layerIdx,
        value: Math.random(),
        bias: Math.random() * 2 - 1,
        activation: layerIdx === layers.length - 1 ? 'sigmoid' : 'relu'
      });
    }
    layerNodes.push(currentLayerNodes);
  });

  // Create Edges
  for (let l = 0; l < layerNodes.length - 1; l++) {
    const currentLayer = layerNodes[l];
    const nextLayer = layerNodes[l + 1];

    currentLayer.forEach(source => {
      nextLayer.forEach(target => {
        // Keep it sparse for rendering performance if too many connections
        if (Math.random() > 0.3 || currentLayer.length <= 4) {
          edges.push({
            source,
            target,
            weight: Math.random() * 2 - 1
          });
        }
      });
    });
  }

  return {
    nodes,
    edges,
    metrics: {
      loss: Math.random() * 0.5,
      accuracy: 0.8 + Math.random() * 0.15,
      epoch: Math.floor(Math.random() * 1000),
      learningRate: 0.001
    }
  };
};

export default function NeuralNetworkVisualizer() {
  const [network, setNetwork] = useState<NetworkState | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 600 });
  const controls = useAnimation();
  
  const supabase = createClient();

  useEffect(() => {
    // Initial architecture: 8 Input, 12 Hidden, 12 Hidden, 4 Hidden, 1 Output (Bot Probability)
    const initialNetwork = generateNetwork([8, 12, 12, 4, 1]);
    setNetwork(initialNetwork);

    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight || 600
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Simulate real-time inference flow
  useEffect(() => {
    if (!isPlaying || !network) return;

    const interval = setInterval(() => {
      setNetwork(prev => {
        if (!prev) return prev;
        
        // Randomly pulse input nodes
        const newNodes = prev.nodes.map(n => {
          if (n.layer === 0) {
            return { ...n, value: Math.max(0, Math.min(1, n.value + (Math.random() * 0.4 - 0.2))) };
          }
          // Propagate forward visually (fake math for visual effect)
          return { ...n, value: Math.random() * 0.8 + 0.2 };
        });

        const newMetrics = {
          ...prev.metrics,
          epoch: prev.metrics.epoch + 1,
          loss: Math.max(0.01, prev.metrics.loss * 0.99 + (Math.random() * 0.01 - 0.005)),
          accuracy: Math.min(0.999, prev.metrics.accuracy * 1.001)
        };

        return { ...prev, nodes: newNodes, metrics: newMetrics };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, network]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!network) return <div className="h-96 flex items-center justify-center text-slate-500">Initializing Core Engine...</div>;

  const layerCount = Math.max(...network.nodes.map(n => n.layer)) + 1;
  const paddingX = 100;
  const paddingY = 80;
  const availableWidth = dimensions.width - paddingX * 2;
  const availableHeight = dimensions.height - paddingY * 2;
  const layerSpacing = availableWidth / (layerCount - 1 || 1);

  // Group nodes by layer to calculate Y positions
  const nodesByLayer: Record<number, NodeData[]> = {};
  network.nodes.forEach(n => {
    if (!nodesByLayer[n.layer]) nodesByLayer[n.layer] = [];
    nodesByLayer[n.layer].push(n);
  });

  const getNodePosition = (node: NodeData) => {
    const layerIndex = node.layer;
    const x = paddingX + (layerIndex * layerSpacing);
    
    const nodesInLayer = nodesByLayer[layerIndex];
    const nodeIndex = nodesInLayer.findIndex(n => n.id === node.id);
    const ySpacing = availableHeight / Math.max(nodesInLayer.length - 1, 1);
    
    // Center vertically if only one node (like output layer)
    const y = nodesInLayer.length === 1 
      ? dimensions.height / 2 
      : paddingY + (nodeIndex * ySpacing);

    return { x, y };
  };

  const positions: Record<string, { x: number, y: number }> = {};
  network.nodes.forEach(n => {
    positions[n.id] = getNodePosition(n);
  });

  return (
    <div 
      ref={containerRef}
      className={`relative w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-800/60 shadow-2xl transition-all duration-500 ${
        isFullscreen ? 'h-screen' : 'h-[700px]'
      }`}
    >
      {/* Background Grid & Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Controls Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-4">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col gap-1">
            <h3 className="text-slate-200 font-bold flex items-center gap-2">
              <Network className="w-5 h-5 text-indigo-400" />
              Aegis Deep Learning Core
            </h3>
            <p className="text-xs text-slate-400 font-mono">Architecture: 8-12-12-4-1 (MLP)</p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl transition-all shadow-lg"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setNetwork(generateNetwork([8, 12, 12, 4, 1]))}
              className="p-3 bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl transition-all shadow-lg"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
            <button 
              onClick={toggleFullscreen}
              className="p-3 bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl transition-all shadow-lg hidden sm:block"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="pointer-events-auto flex flex-col gap-3">
          <MetricsCard title="Real-time Loss" value={network.metrics.loss.toFixed(4)} icon={AlertCircle} color="text-rose-400" />
          <MetricsCard title="Accuracy" value={`${(network.metrics.accuracy * 100).toFixed(2)}%`} icon={CheckCircleIcon} color="text-emerald-400" />
          <MetricsCard title="Inference Rate" value={`${(1000 / (isPlaying ? 1 : Infinity)).toFixed(0)} req/s`} icon={Zap} color="text-amber-400" />
        </div>
      </div>

      {/* Network SVG Visualization */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.2))' }}>
        <defs>
          <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(99, 102, 241, 0.1)" />
            <stop offset="100%" stopColor="rgba(168, 85, 247, 0.4)" />
          </linearGradient>
          
          <linearGradient id="edge-gradient-negative" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(244, 63, 94, 0.1)" />
            <stop offset="100%" stopColor="rgba(244, 63, 94, 0.4)" />
          </linearGradient>
        </defs>

        {/* Render Edges */}
        {network.edges.map((edge, i) => {
          const sourcePos = positions[edge.source];
          const targetPos = positions[edge.target];
          if (!sourcePos || !targetPos) return null;

          const isNegative = edge.weight < 0;
          const strokeWidth = Math.abs(edge.weight) * 1.5;
          const opacity = Math.abs(edge.weight) * 0.5 + 0.1;

          return (
            <motion.path
              key={`${edge.source}-${edge.target}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity }}
              transition={{ duration: 1.5, delay: sourcePos.x * 0.001 }}
              d={`M ${sourcePos.x} ${sourcePos.y} C ${(sourcePos.x + targetPos.x) / 2} ${sourcePos.y}, ${(sourcePos.x + targetPos.x) / 2} ${targetPos.y}, ${targetPos.x} ${targetPos.y}`}
              fill="none"
              stroke={isNegative ? "url(#edge-gradient-negative)" : "url(#edge-gradient)"}
              strokeWidth={strokeWidth}
              className="transition-all duration-300"
            />
          );
        })}

        {/* Pulse Animations along edges */}
        {isPlaying && network.edges.filter(() => Math.random() > 0.8).map((edge, i) => {
           const sourcePos = positions[edge.source];
           const targetPos = positions[edge.target];
           if (!sourcePos || !targetPos) return null;

           return (
             <motion.circle
               key={`pulse-${i}`}
               r={2}
               fill="#fff"
               className="drop-shadow-[0_0_5px_#fff]"
               initial={{ cx: sourcePos.x, cy: sourcePos.y, opacity: 0 }}
               animate={{ cx: targetPos.x, cy: targetPos.y, opacity: [0, 1, 0] }}
               transition={{ duration: Math.random() * 0.5 + 0.5, repeat: Infinity, ease: "linear" }}
             />
           );
        })}
      </svg>

      {/* Render Nodes as HTML Elements for better hover effects & tooltips */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {network.nodes.map((node) => {
          const pos = positions[node.id];
          if (!pos) return null;

          // Color scale based on activation value
          const intensity = Math.floor(node.value * 255);
          const color = node.layer === layerCount - 1 
            ? (node.value > 0.8 ? `rgb(244, 63, 94)` : `rgb(16, 185, 129)`) // Output Layer
            : `rgb(${intensity}, ${intensity}, 255)`; // Hidden layers

          const size = node.layer === 0 ? 16 : node.layer === layerCount - 1 ? 32 : 12;

          return (
            <motion.div
              key={node.id}
              className="absolute rounded-full pointer-events-auto cursor-crosshair group shadow-lg flex items-center justify-center border border-white/20 backdrop-blur-md"
              style={{
                left: pos.x,
                top: pos.y,
                width: size,
                height: size,
                x: '-50%',
                y: '-50%',
                backgroundColor: color,
                boxShadow: `0 0 ${node.value * 15}px ${color}`
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: node.layer * 0.1 }}
              whileHover={{ scale: 1.5, zIndex: 50 }}
            >
              {/* Output Label */}
              {node.layer === layerCount - 1 && (
                <div className="absolute left-full ml-4 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-700 whitespace-nowrap">
                  <p className="text-xs font-bold text-slate-300">Bot Probability</p>
                  <p className={`text-lg font-mono font-bold ${node.value > 0.8 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {(node.value * 100).toFixed(1)}%
                  </p>
                </div>
              )}

              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 bg-slate-900 border border-slate-700 p-2 rounded-lg text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-32 shadow-2xl">
                <p className="text-indigo-300 font-bold border-b border-slate-800 pb-1 mb-1">Node {node.id}</p>
                <div className="flex justify-between text-slate-400"><span>Val:</span><span className="text-white">{node.value.toFixed(3)}</span></div>
                <div className="flex justify-between text-slate-400"><span>Bias:</span><span className="text-white">{node.bias.toFixed(3)}</span></div>
                <div className="flex justify-between text-slate-400"><span>Act:</span><span className="text-white">{node.activation}</span></div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Layer Labels */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-between px-[100px] pointer-events-none z-10 text-slate-500 font-mono text-xs font-bold uppercase tracking-widest">
        <div style={{ transform: 'translateX(-50%)' }}>Input Features</div>
        <div style={{ transform: 'translateX(-50%)' }}>Dense 1</div>
        <div style={{ transform: 'translateX(-50%)' }}>Dense 2</div>
        <div style={{ transform: 'translateX(-50%)' }}>Features Map</div>
        <div style={{ transform: 'translateX(-50%)' }}>Prediction</div>
      </div>
    </div>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}

function MetricsCard({ title, value, icon: Icon, color }: { title: string, value: string, icon: any, color: string }) {
  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-3 rounded-2xl shadow-xl flex items-center gap-4 w-48">
      <div className={`p-2 bg-slate-950 rounded-xl border border-slate-800 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{title}</p>
        <p className={`text-sm font-bold font-mono ${color}`}>{value}</p>
      </div>
    </div>
  );
}
