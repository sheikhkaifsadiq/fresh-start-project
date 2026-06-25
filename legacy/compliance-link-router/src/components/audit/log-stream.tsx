"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, Cpu, Activity, Database, Zap, Lock, Eye, AlertTriangle } from 'lucide-react';

interface StreamEvent {
  id: string;
  timestamp: number;
  ip: string;
  action: string;
  threatLevel: number;
  region: string;
  payloadSize: number;
  status: number;
  latency: number;
}

const REGIONS = ['us-east-1', 'eu-west-2', 'ap-northeast-1', 'sa-east-1', 'us-west-2'];
const ACTIONS = ['DNS_RESOLVE', 'LINK_CLICK', 'AUTH_ATTEMPT', 'API_CALL', 'DB_QUERY', 'EDGE_CACHE_MISS'];

const generateEvent = (): StreamEvent => ({
  id: `evt_${Math.random().toString(36).substr(2, 9)}`,
  timestamp: Date.now(),
  ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
  action: ACTIONS[Math.floor(Math.random() * ACTIONS.length)],
  threatLevel: Math.random(),
  region: REGIONS[Math.floor(Math.random() * REGIONS.length)],
  payloadSize: Math.floor(Math.random() * 1024 * 50),
  status: Math.random() > 0.9 ? 403 : Math.random() > 0.95 ? 500 : 200,
  latency: Math.floor(Math.random() * 150) + 10,
});

export const LogStreamVisualizer: React.FC = () => {
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // High-frequency event generation for the data stream
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setEvents(prev => {
        const newEvents = [generateEvent(), generateEvent(), ...prev];
        return newEvents.slice(0, 200); // Keep last 200 events in DOM state
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Canvas-based Matrix/Cyberpunk Particle Stream
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: { x: number; y: number; speed: number; char: string; color: string; opacity: number }[] = [];

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    
    window.addEventListener('resize', resize);
    resize();

    // Initialize particles
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 1 + Math.random() * 3,
        char: String.fromCharCode(0x30A0 + Math.random() * 96),
        color: Math.random() > 0.9 ? '#ef4444' : Math.random() > 0.7 ? '#10b981' : '#6366f1',
        opacity: Math.random()
      });
    }

    const draw = () => {
      // Fade out effect
      ctx.fillStyle = 'rgba(5, 5, 5, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = '14px monospace';
      
      particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fillText(p.char, p.x, p.y);
        
        p.y += p.speed;
        
        // Randomly change character
        if (Math.random() > 0.9) {
          p.char = String.fromCharCode(0x30A0 + Math.random() * 96);
        }

        if (p.y > canvas.height) {
          p.y = 0;
          p.x = Math.random() * canvas.width;
          p.speed = 1 + Math.random() * 3;
          p.opacity = Math.random();
        }
      });

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const threatColor = (level: number) => {
    if (level > 0.8) return 'text-red-500 bg-red-500/10 border-red-500/30';
    if (level > 0.5) return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
  };

  const statusColor = (status: number) => {
    if (status >= 500) return 'text-red-400';
    if (status >= 400) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div className="w-full h-full min-h-[600px] rounded-2xl border border-white/10 bg-[#0a0a0c] overflow-hidden relative flex flex-col shadow-2xl">
      
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/50">
            <Activity className="w-4 h-4 text-indigo-400 z-10" />
            {!isPaused && (
              <>
                <div className="absolute inset-0 border border-indigo-500 rounded-lg animate-ping opacity-50" />
                <div className="absolute inset-0 bg-indigo-500 rounded-lg animate-pulse opacity-20" />
              </>
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm tracking-widest uppercase">Global Event Firehose</h3>
            <p className="text-zinc-500 text-[10px] font-mono mt-0.5">WSS://edge.aegis.com/v1/stream</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex space-x-6 text-[10px] font-mono text-zinc-500 mr-4">
            <div className="flex flex-col items-end">
              <span>RATE</span>
              <span className="text-emerald-400 font-bold">{isPaused ? '0' : '4,281'}/s</span>
            </div>
            <div className="flex flex-col items-end">
              <span>DROPS</span>
              <span className="text-zinc-400">0.00%</span>
            </div>
            <div className="flex flex-col items-end">
              <span>LAG</span>
              <span className="text-indigo-400">12ms</span>
            </div>
          </div>
          
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className={`px-4 py-1.5 rounded border text-xs font-mono font-bold transition-all ${
              isPaused 
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30' 
                : 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30'
            }`}
          >
            {isPaused ? 'RESUME STREAM' : 'HALT STREAM'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative mt-[73px]">
        {/* Background Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-40 pointer-events-none" />

        {/* Floating Data Display */}
        <div className="absolute inset-0 z-10 flex flex-col md:flex-row gap-4 p-4">
          
          {/* Left Panel: High Velocity Event Log */}
          <div className="flex-1 bg-black/60 border border-white/5 rounded-xl overflow-hidden backdrop-blur-sm flex flex-col">
            <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-400 uppercase">Live Output Window</span>
              <Terminal className="w-3 h-3 text-zinc-500" />
            </div>
            
            <div className="flex-1 overflow-hidden p-2 font-mono text-[10px] sm:text-xs relative">
              {/* Gradient Mask for fade effect */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />
              
              <div className="h-full flex flex-col-reverse overflow-hidden">
                <AnimatePresence initial={false}>
                  {events.slice(0, 50).map((evt, i) => (
                    <motion.div
                      key={evt.id}
                      initial={{ opacity: 0, x: -20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="py-1 flex items-center hover:bg-white/5 rounded px-2 group cursor-crosshair border-b border-white/5 last:border-none"
                    >
                      <span className="text-zinc-600 w-24 flex-shrink-0">{new Date(evt.timestamp).toISOString().split('T')[1].replace('Z', '')}</span>
                      
                      <span className={`w-16 flex-shrink-0 font-bold ${statusColor(evt.status)}`}>[{evt.status}]</span>
                      
                      <span className="w-32 flex-shrink-0 text-indigo-400">{evt.ip}</span>
                      
                      <span className="w-36 flex-shrink-0 text-zinc-300 truncate">{evt.action}</span>
                      
                      <span className="w-20 flex-shrink-0 text-zinc-500">{evt.region}</span>
                      
                      <div className="flex-1 flex items-center space-x-2">
                        <span className="text-zinc-600 w-16 text-right">{(evt.payloadSize / 1024).toFixed(1)}kb</span>
                        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                          <div 
                            className={`h-full ${evt.threatLevel > 0.8 ? 'bg-red-500' : evt.threatLevel > 0.5 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${evt.threatLevel * 100}%` }}
                          />
                        </div>
                      </div>
                      
                      <button className="opacity-0 group-hover:opacity-100 p-1 bg-white/10 rounded ml-2 text-white transition-opacity">
                        <Eye className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Panel: Aggregated Real-time Stats */}
          <div className="w-full md:w-80 flex flex-col gap-4">
            
            {/* Anomaly Detection Status */}
            <div className="bg-black/60 border border-white/5 rounded-xl p-4 backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              
              <h4 className="text-[10px] font-mono text-zinc-400 uppercase mb-4 flex items-center">
                <Shield className="w-3 h-3 mr-2 text-indigo-400" />
                ML Anomaly Engine
              </h4>

              <div className="space-y-4 relative z-10">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-300">Threat Confidence</span>
                    <span className="text-amber-400 font-mono">{(events.length > 0 ? (events.reduce((a, b) => a + b.threatLevel, 0) / events.length) * 100 : 0).toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500"
                      animate={{ width: `${Math.random() * 40 + 30}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/5 rounded p-2 border border-white/5">
                    <div className="text-[9px] text-zinc-500 mb-1">Blocked IPs</div>
                    <div className="text-red-400 font-mono font-bold">{Math.floor(Math.random() * 1000)}</div>
                  </div>
                  <div className="bg-white/5 rounded p-2 border border-white/5">
                    <div className="text-[9px] text-zinc-500 mb-1">Active Rules</div>
                    <div className="text-emerald-400 font-mono font-bold">14,291</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Region Distribution */}
            <div className="bg-black/60 border border-white/5 rounded-xl p-4 backdrop-blur-sm flex-1 flex flex-col">
              <h4 className="text-[10px] font-mono text-zinc-400 uppercase mb-4 flex items-center">
                <Database className="w-3 h-3 mr-2 text-indigo-400" />
                Edge POP Load
              </h4>

              <div className="flex-1 space-y-3 overflow-auto custom-scrollbar">
                {REGIONS.map(region => {
                  const count = events.filter(e => e.region === region).length;
                  const percent = events.length > 0 ? (count / events.length) * 100 : 0;
                  
                  return (
                    <div key={region} className="flex flex-col space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-zinc-300">{region}</span>
                        <span className="text-zinc-500">{count} req</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden relative">
                        <motion.div
                          className="absolute left-0 top-0 bottom-0 bg-indigo-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ type: 'spring', damping: 15 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
