"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  AlertTriangle, 
  Globe, 
  Server, 
  ShieldAlert, 
  Target, 
  Zap, 
  Search, 
  Filter, 
  Download,
  Eye,
  Maximize2,
  XCircle,
  Network
} from "lucide-react";

interface Anomaly {
  id: string;
  timestamp: string;
  score: number;
  type: string;
  description: string;
  clusterId: string;
  ipAddresses: string[];
}

const MOCK_ANOMALIES: Anomaly[] = Array.from({ length: 24 }).map((_, i) => ({
  id: `ano-${Date.now()}-${i}`,
  timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
  score: 0.5 + Math.random() * 0.5,
  type: ["Volume Spike", "Geographic Dispersal", "Path Bruteforce", "Header Tampering", "Slowloris Pattern"][Math.floor(Math.random() * 5)],
  description: "Isolation Forest model detected an outlier cluster deviating by 3.4 sigma from historical baseline.",
  clusterId: `cluster-${Math.floor(Math.random() * 100)}`,
  ipAddresses: Array.from({ length: Math.floor(Math.random() * 5) + 1 }).map(() => `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.0/24`)
}));

export default function AnomalyDetectionPanel() {
  const [anomalies, setAnomalies] = useState(MOCK_ANOMALIES);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  
  // Sorting
  const sortedAnomalies = [...anomalies].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-xl h-[800px] flex flex-col font-sans relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-amber-500" />
            Unsupervised Anomaly Detection
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time clustering and isolation forest detection across high-dimensional feature spaces.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 text-sm">
            <Network className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-300 font-mono">Model: IsoForest-v1.2</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-6 relative z-10 overflow-hidden">
        
        {/* Anomaly List */}
        <div className={`flex flex-col gap-4 overflow-y-auto custom-scrollbar transition-all duration-300 ${selectedAnomaly ? 'w-1/2 pr-2' : 'w-full'}`}>
          <AnimatePresence>
            {sortedAnomalies.map((anomaly, i) => (
              <motion.div
                key={anomaly.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedAnomaly(anomaly)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  selectedAnomaly?.id === anomaly.id 
                    ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]" 
                    : "bg-slate-950/50 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${anomaly.score > 0.9 ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-200">{anomaly.type}</h3>
                      <p className="text-xs text-slate-500 font-mono">{new Date(anomaly.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-slate-500 uppercase">Anomaly Score</span>
                    <span className={`font-mono font-black text-lg ${anomaly.score > 0.9 ? 'text-rose-500' : 'text-amber-500'}`}>
                      {anomaly.score.toFixed(3)}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                  {anomaly.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {anomaly.ipAddresses.slice(0, 3).map((ip, idx) => (
                    <span key={idx} className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-500 flex items-center gap-1">
                      <Server className="w-3 h-3" /> {ip}
                    </span>
                  ))}
                  {anomaly.ipAddresses.length > 3 && (
                    <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-500">
                      +{anomaly.ipAddresses.length - 3} more
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Anomaly Details Panel */}
        <AnimatePresence>
          {selectedAnomaly && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-1/2 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-500" /> Cluster Analysis
                </h3>
                <button 
                  onClick={() => setSelectedAnomaly(null)}
                  className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                
                {/* 3D Scatter Plot Mockup */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl h-64 relative overflow-hidden flex items-center justify-center group">
                   <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800/50 via-slate-900/50 to-slate-950/50" />
                   
                   <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                     {/* Safe Zone */}
                     <circle cx="50" cy="50" r="20" fill="rgba(16, 185, 129, 0.05)" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="0.5" strokeDasharray="2 2" />
                     <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(245, 158, 11, 0.2)" strokeWidth="0.5" strokeDasharray="2 2" />
                     
                     {/* Background Normal Data Points */}
                     {Array.from({ length: 150 }).map((_, i) => {
                       const angle = Math.random() * Math.PI * 2;
                       const radius = Math.random() * 20;
                       return (
                         <circle 
                           key={`norm-${i}`}
                           cx={50 + Math.cos(angle) * radius} 
                           cy={50 + Math.sin(angle) * radius} 
                           r="0.5" 
                           fill="rgba(148, 163, 184, 0.3)" 
                         />
                       )
                     })}

                     {/* The Anomaly Cluster */}
                     {Array.from({ length: 30 }).map((_, i) => {
                       const angle = Math.random() * Math.PI * 0.5 + Math.PI * 1.2; // Top left quadrant
                       const radius = 30 + Math.random() * 15;
                       return (
                         <motion.circle 
                           key={`ano-${i}`}
                           cx={50 + Math.cos(angle) * radius} 
                           cy={50 + Math.sin(angle) * radius} 
                           r="1" 
                           fill={selectedAnomaly.score > 0.9 ? "#fb7185" : "#fbbf24"} 
                           initial={{ opacity: 0, scale: 0 }}
                           animate={{ opacity: 1, scale: 1 }}
                           transition={{ delay: i * 0.02 }}
                           className="drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]"
                         />
                       )
                     })}
                   </svg>

                   <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[10px] text-slate-500 font-mono">
                     <span>PCA_1 (Request Volume)</span>
                     <span>PCA_2 (Header Entropy)</span>
                   </div>
                   <button className="absolute top-2 right-2 p-1.5 bg-slate-800/80 text-slate-400 rounded opacity-0 group-hover:opacity-100 transition-opacity border border-slate-700 backdrop-blur-sm">
                      <Maximize2 className="w-3 h-3" />
                   </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <span className="text-xs text-slate-500 uppercase font-bold tracking-widest block mb-1">Isolation Depth</span>
                    <span className="text-2xl font-mono text-white">4.2</span>
                    <span className="text-xs text-slate-500 ml-2">Avg: 12.8</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <span className="text-xs text-slate-500 uppercase font-bold tracking-widest block mb-1">Feature Contrib</span>
                    <span className="text-lg font-mono text-white truncate block">User-Agent</span>
                    <span className="text-xs text-rose-400">+45% deviance</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Globe className="w-4 h-4 text-indigo-400" /> Origin IPs Involved
                  </h4>
                  <div className="flex flex-col gap-2">
                    {selectedAnomaly.ipAddresses.map(ip => (
                      <div key={ip} className="flex justify-between items-center p-2 bg-slate-950 border border-slate-800 rounded-lg">
                        <span className="font-mono text-sm text-slate-300">{ip}</span>
                        <button className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-1 rounded border border-rose-500/20 transition-colors">
                          Block CIDR
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                   <button className="w-full py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-bold rounded-xl transition-colors border border-amber-500/30">
                     Create WAF Rule from Cluster
                   </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
