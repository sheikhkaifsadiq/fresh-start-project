"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BrainCircuit, 
  Zap, 
  Globe, 
  Fingerprint, 
  Clock, 
  ShieldAlert,
  Info
} from "lucide-react";

interface Feature {
  id: string;
  name: string;
  importance: number;
  category: "network" | "behavioral" | "temporal" | "geographic";
  trend: "up" | "down" | "stable";
  description: string;
}

const INITIAL_FEATURES: Feature[] = [
  { id: "f1", name: "IP Reputation Score", importance: 0.85, category: "network", trend: "up", description: "Historical malicious activity associated with the origin IP address across global threat intelligence databases." },
  { id: "f2", name: "Request Rate Anomaly", importance: 0.72, category: "temporal", trend: "stable", description: "Deviation from baseline request frequency for the specific URL hash." },
  { id: "f3", name: "User-Agent Entropy", importance: 0.68, category: "behavioral", trend: "up", description: "Statistical randomness of the user-agent string, indicating potential spoofing or automated generation." },
  { id: "f4", name: "Geographic Velocity", importance: 0.55, category: "geographic", trend: "down", description: "Implausible travel speed between consecutive requests from the same user session." },
  { id: "f5", name: "Header Order Fingerprint", importance: 0.49, category: "network", trend: "up", description: "Sequential arrangement of HTTP headers compared against known browser fingerprints." },
  { id: "f6", name: "Time of Day Deviation", importance: 0.35, category: "temporal", trend: "stable", description: "Unusual request timing relative to the typical access pattern for the destination domain." },
  { id: "f7", name: "TLS Cipher Suite", importance: 0.42, category: "network", trend: "down", description: "Supported encryption algorithms indicating legacy scripts or headless browsers." },
  { id: "f8", name: "Mouse/Touch Heuristics", importance: 0.61, category: "behavioral", trend: "up", description: "Lack of or unnatural pointer events during JS challenge execution." },
  { id: "f9", name: "ASN Risk Level", importance: 0.78, category: "network", trend: "stable", description: "Classification of the Autonomous System Number as residential, hosting, or known bad actor." },
  { id: "f10", name: "Referrer Anomalies", importance: 0.28, category: "behavioral", trend: "down", description: "Missing or forged HTTP referrer headers inconsistent with the access path." },
];

export default function FeatureImportanceGraph() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  useEffect(() => {
    // Simulate initial load & sorting
    const sorted = [...INITIAL_FEATURES].sort((a, b) => b.importance - a.importance);
    setFeatures(sorted);
  }, []);

  // Simulate real-time model weights updating slightly
  useEffect(() => {
    const interval = setInterval(() => {
      setFeatures(prev => {
        return prev.map(f => {
          // Slight random fluctuation in importance
          const delta = (Math.random() * 0.02) - 0.01;
          const newImportance = Math.max(0.1, Math.min(0.99, f.importance + delta));
          return { ...f, importance: newImportance };
        }).sort((a, b) => sortOrder === "desc" ? b.importance - a.importance : a.importance - b.importance);
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [sortOrder]);

  const filteredFeatures = features.filter(f => activeCategory === "all" || f.category === activeCategory);

  const getCategoryColor = (category: string) => {
    switch(category) {
      case "network": return "from-blue-500 to-indigo-600 border-blue-500/30 text-blue-400";
      case "behavioral": return "from-purple-500 to-fuchsia-600 border-purple-500/30 text-purple-400";
      case "temporal": return "from-amber-500 to-orange-600 border-amber-500/30 text-amber-400";
      case "geographic": return "from-emerald-500 to-teal-600 border-emerald-500/30 text-emerald-400";
      default: return "from-slate-500 to-slate-600 border-slate-500/30 text-slate-400";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case "network": return <Globe className="w-4 h-4" />;
      case "behavioral": return <Fingerprint className="w-4 h-4" />;
      case "temporal": return <Clock className="w-4 h-4" />;
      case "geographic": return <Globe className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden min-h-[600px] flex flex-col">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-slate-800/80 pb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 flex items-center gap-3">
            <BrainCircuit className="w-6 h-6 text-indigo-400" />
            Feature Importance Weights
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-lg">
            Real-time SHAP values reflecting the impact of individual features on the deep learning bot-classification model's final inference.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-slate-950/50 p-1.5 rounded-2xl border border-slate-800">
          {[
            { id: "all", label: "All Features" },
            { id: "network", label: "Network" },
            { id: "behavioral", label: "Behavioral" },
            { id: "temporal", label: "Temporal" }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
                activeCategory === cat.id 
                  ? "bg-slate-800 text-white shadow-md" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Graph Area */}
      <div className="relative z-10 flex-1 flex flex-col gap-5 overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence>
          {filteredFeatures.map((feature, idx) => {
            const colors = getCategoryColor(feature.category);
            const isHovered = hoveredFeature === feature.id;

            return (
              <motion.div
                key={feature.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
                onHoverStart={() => setHoveredFeature(feature.id)}
                onHoverEnd={() => setHoveredFeature(null)}
                className="group relative flex items-center gap-4"
              >
                {/* Info Tooltip Trigger */}
                <div className="w-48 shrink-0 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg border bg-slate-950 ${colors}`}>
                      {getCategoryIcon(feature.category)}
                    </div>
                    <span className="text-sm font-semibold text-slate-200 truncate w-32" title={feature.name}>
                      {feature.name}
                    </span>
                  </div>
                  <Info className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors cursor-help" />
                </div>

                {/* Progress Bar Container */}
                <div className="flex-1 h-8 bg-slate-950/50 rounded-full border border-slate-800/80 p-1 relative overflow-hidden flex items-center shadow-inner">
                  {/* Background Grid for Scale Reference */}
                  <div className="absolute inset-0 flex justify-between px-2 opacity-10 pointer-events-none">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                      <div key={i} className="w-px h-full bg-white" />
                    ))}
                  </div>

                  {/* Animated Bar */}
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${colors.split(' ')[0]} ${colors.split(' ')[1]} relative`}
                    initial={{ width: 0 }}
                    animate={{ width: `${feature.importance * 100}%` }}
                    transition={{ type: "spring", stiffness: 50, damping: 15 }}
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                  </motion.div>
                </div>

                {/* Metrics */}
                <div className="w-24 shrink-0 flex flex-col items-end justify-center font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-100">
                      {feature.importance.toFixed(3)}
                    </span>
                    {feature.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    ) : feature.trend === "down" ? (
                      <TrendingDown className="w-4 h-4 text-rose-500" />
                    ) : (
                      <Activity className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>

                {/* Hover Details Panel */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                      className="absolute z-50 left-56 top-full mt-2 w-80 bg-slate-800 border border-slate-700 p-4 rounded-2xl shadow-2xl backdrop-blur-xl"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-white">{feature.name}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full border bg-slate-900 ${colors}`}>
                          {feature.category}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {feature.description}
                      </p>
                      <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between items-center text-xs text-slate-500">
                        <span>Current Weight: <strong className="text-white">{feature.importance.toFixed(4)}</strong></span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-400" /> Live Updates
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      
      {/* Footer Legend */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5"><TrendingUp className="w-3 h-3 text-emerald-500"/> Increasing Influence</span>
          <span className="flex items-center gap-1.5"><TrendingDown className="w-3 h-3 text-rose-500"/> Decreasing Influence</span>
        </div>
        <div>Model: AegisBotNet v2.4 (Active)</div>
      </div>
    </div>
  );
}
