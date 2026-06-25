"use client";

import React from "react";
import { ShieldCheck, Crosshair, AlertOctagon, TrendingUp, TrendingDown, Activity, Globe, Lock, ShieldAlert } from "lucide-react";

export default function SecurityPostureScore() {
  const score = 94; // Example score
  const color = score > 90 ? "text-emerald-400" : score > 70 ? "text-amber-400" : "text-rose-400";
  const bgGradient = score > 90 ? "from-emerald-500/20" : score > 70 ? "from-amber-500/20" : "from-rose-500/20";
  const strokeColor = score > 90 ? "#34d399" : score > 70 ? "#fbbf24" : "#fb7185";

  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl ${bgGradient} to-transparent rounded-bl-full opacity-50 blur-3xl pointer-events-none`} />

      <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6 relative z-10">
        <ShieldCheck className="w-6 h-6 text-indigo-400" />
        Security Posture Score
      </h2>

      <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
        
        {/* Massive Gauge */}
        <div className="relative w-48 h-48 sm:w-64 sm:h-64 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
             {/* Background Track */}
             <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
             {/* Foreground Score Track */}
             <circle 
               cx="50" cy="50" r="45" 
               fill="none" 
               stroke={strokeColor} 
               strokeWidth="8" 
               strokeDasharray={`${score * 2.82} 282`} 
               strokeLinecap="round"
               className="drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]"
               style={{ transition: "stroke-dasharray 1s ease-in-out" }}
             />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl sm:text-7xl font-black ${color} tracking-tighter`}>{score}</span>
            <span className="text-xs sm:text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">/ 100</span>
          </div>
        </div>

        <div className="flex-1 space-y-6 w-full">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Excellent Posture</h3>
            <p className="text-slate-400 text-sm">
              Your link routing configuration is highly secure. ML Engine active, strict WAF rules enabled, and anomalous behavior is automatically challenged.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PostureMetric icon={Crosshair} label="Rule Coverage" value="98%" trend="up" />
            <PostureMetric icon={AlertOctagon} label="Threat Blocking" value="Auto" color="text-emerald-400" />
            <PostureMetric icon={Globe} label="Geo-Compliance" value="Pass" color="text-emerald-400" />
            <PostureMetric icon={Lock} label="Encryption" value="Strict" color="text-indigo-400" />
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> Recommendations
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5" />
                Consider enforcing rate limits on the `/api/v2` endpoints.
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5" />
                Review newly added Threat Intelligence signatures from Aegis Network.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function PostureMetric({ icon: Icon, label, value, trend, color = "text-white" }: any) {
  return (
    <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-900 rounded-lg">
          <Icon className="w-4 h-4 text-slate-400" />
        </div>
        <span className="text-sm text-slate-400 font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`font-bold ${color}`}>{value}</span>
        {trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-500" />}
        {trend === 'down' && <TrendingDown className="w-3 h-3 text-rose-500" />}
      </div>
    </div>
  );
}
