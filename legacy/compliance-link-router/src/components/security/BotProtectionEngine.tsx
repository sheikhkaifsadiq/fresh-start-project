"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Activity, 
  Shield, 
  AlertTriangle, 
  Cpu, 
  Settings2, 
  Target, 
  SlidersHorizontal,
  Bot,
  Zap,
  Globe,
  Lock,
  EyeOff
} from "lucide-react";

export default function BotProtectionEngine() {
  const [sensitivity, setSensitivity] = useState(75);
  const [challengeType, setChallengeType] = useState("managed");
  const [actionHigh, setActionHigh] = useState("block");
  const [actionMedium, setActionMedium] = useState("challenge");

  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      
      {/* Decorative BG */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row gap-10">
        
        {/* Left Column: Settings */}
        <div className="flex-1 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Bot className="w-6 h-6 text-indigo-400" />
              Bot Management Engine
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Configure how the ML Engine responds to automated traffic. Adjust sensitivity and response thresholds.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 shadow-inner">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-slate-200">Detection Sensitivity</h3>
                </div>
                <span className="text-xs font-mono font-bold bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-md border border-indigo-500/30">
                  {sensitivity}%
                </span>
              </div>
              
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={sensitivity}
                onChange={(e) => setSensitivity(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
                <span>Permissive</span>
                <span>Balanced</span>
                <span>Aggressive</span>
              </div>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 shadow-inner space-y-4">
              <h3 className="font-bold text-slate-200 flex items-center gap-2">
                <Target className="w-4 h-4 text-rose-400" />
                Action Thresholds
              </h3>
              
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <p className="text-sm font-medium text-rose-400">High Bot Probability (&gt;0.85)</p>
                    <p className="text-xs text-slate-500">Definite automated traffic</p>
                  </div>
                  <select 
                    value={actionHigh}
                    onChange={(e) => setActionHigh(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500 w-full sm:w-40"
                  >
                    <option value="block">Block</option>
                    <option value="challenge">Challenge</option>
                    <option value="log">Log Only</option>
                  </select>
                </div>

                <div className="w-full h-px bg-slate-800" />

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <p className="text-sm font-medium text-amber-400">Medium Bot Probability (&gt;0.40)</p>
                    <p className="text-xs text-slate-500">Likely automated or scraper</p>
                  </div>
                  <select 
                    value={actionMedium}
                    onChange={(e) => setActionMedium(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500 w-full sm:w-40"
                  >
                    <option value="block">Block</option>
                    <option value="challenge">Challenge</option>
                    <option value="log">Log Only</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 shadow-inner">
              <h3 className="font-bold text-slate-200 flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-emerald-400" />
                Challenge Configuration
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={`relative p-4 rounded-xl border cursor-pointer transition-all ${
                  challengeType === "managed" 
                    ? "bg-indigo-500/10 border-indigo-500/50" 
                    : "bg-slate-900 border-slate-800 hover:border-slate-700"
                }`}>
                  <input type="radio" name="challenge" value="managed" checked={challengeType === "managed"} onChange={() => setChallengeType("managed")} className="sr-only" />
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className={`w-4 h-4 ${challengeType === "managed" ? "text-indigo-400" : "text-slate-500"}`} />
                    <span className={`font-bold ${challengeType === "managed" ? "text-indigo-300" : "text-slate-300"}`}>Managed JS</span>
                  </div>
                  <p className="text-xs text-slate-500">Invisible PoW calculation. Fast and non-intrusive for users.</p>
                </label>
                
                <label className={`relative p-4 rounded-xl border cursor-pointer transition-all ${
                  challengeType === "interactive" 
                    ? "bg-indigo-500/10 border-indigo-500/50" 
                    : "bg-slate-900 border-slate-800 hover:border-slate-700"
                }`}>
                  <input type="radio" name="challenge" value="interactive" checked={challengeType === "interactive"} onChange={() => setChallengeType("interactive")} className="sr-only" />
                  <div className="flex items-center gap-2 mb-1">
                    <EyeOff className={`w-4 h-4 ${challengeType === "interactive" ? "text-indigo-400" : "text-slate-500"}`} />
                    <span className={`font-bold ${challengeType === "interactive" ? "text-indigo-300" : "text-slate-300"}`}>Interactive</span>
                  </div>
                  <p className="text-xs text-slate-500">Forces user interaction (e.g. Turnstile / Captcha).</p>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Analytics & Visualization */}
        <div className="w-full md:w-1/3 flex flex-col gap-6">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-inner flex-1">
            <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" />
              Bot Traffic Analysis
            </h3>
            
            {/* Visualizer Gauge */}
            <div className="relative w-48 h-48 mx-auto mt-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="8" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="url(#gradient)" strokeWidth="8" strokeDasharray={`${sensitivity * 2.51} 251`} className="transition-all duration-1000" />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="100%" stopColor="#e11d48" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white">{sensitivity}%</span>
                <span className="text-xs text-slate-500 font-mono">Block Rate</span>
              </div>
            </div>

            <div className="space-y-4 mt-8">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                <span className="text-sm text-slate-400">Total Requests</span>
                <span className="font-mono text-white">12,450,912</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                <span className="text-sm text-rose-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Blocked Bots</span>
                <span className="font-mono text-rose-400 font-bold">2,104,855</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                <span className="text-sm text-amber-400 flex items-center gap-1"><Shield className="w-3 h-3"/> Challenged</span>
                <span className="font-mono text-amber-400 font-bold">845,102</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-emerald-400 flex items-center gap-1"><Lock className="w-3 h-3"/> Verified Humans</span>
                <span className="font-mono text-emerald-400 font-bold">9,500,955</span>
              </div>
            </div>
          </div>
          
          <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20 flex justify-center items-center gap-2">
            <Settings2 className="w-5 h-5" /> Apply Configuration
          </button>
        </div>

      </div>
    </div>
  );
}
