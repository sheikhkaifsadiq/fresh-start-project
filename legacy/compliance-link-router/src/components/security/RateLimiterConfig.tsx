"use client";

import React, { useState } from "react";
import { Clock, Shield, SlidersHorizontal, Activity, Zap, Server, Trash2, Plus, Save } from "lucide-react";

export default function RateLimiterConfig() {
  const [tiers, setTiers] = useState([
    { id: 1, name: "Global Edge Default", reqs: 100, window: 60, action: "BLOCK", priority: 100 },
    { id: 2, name: "Auth Endpoints", reqs: 5, window: 60, action: "CHALLENGE", priority: 10 },
    { id: 3, name: "Static Assets", reqs: 500, window: 10, action: "LOG_ONLY", priority: 50 },
  ]);

  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-800/80 pb-4 relative z-10">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-400" />
            Rate Limiting Engine
          </h2>
          <p className="text-sm text-slate-400 mt-1">Configure sliding window rate limits across distributed edge nodes.</p>
        </div>
        
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20">
          <Save className="w-4 h-4" /> Save Configuration
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        
        {/* Metric Cards */}
        <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 shadow-inner">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-400 text-sm font-medium">Global Limit Hits (24h)</span>
            <Shield className="w-4 h-4 text-rose-400" />
          </div>
          <span className="text-3xl font-black text-white font-mono">45.2K</span>
          <div className="mt-2 text-xs text-rose-400 flex items-center gap-1">+12% from yesterday</div>
        </div>

        <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 shadow-inner">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-400 text-sm font-medium">Redis Sync Latency</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-3xl font-black text-white font-mono">4.2ms</span>
          <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">Optimal State</div>
        </div>

        <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 shadow-inner">
           <div className="flex justify-between items-start mb-2">
            <span className="text-slate-400 text-sm font-medium">Active Counters</span>
            <Server className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-3xl font-black text-white font-mono">1.2M</span>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">Across all Edge PoPs</div>
        </div>

      </div>

      {/* Rules Tiers */}
      <div className="mt-8 relative z-10 space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-slate-200">Enforcement Tiers</h3>
          <button className="text-sm text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add Tier
          </button>
        </div>

        {tiers.map((tier) => (
          <div key={tier.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-6 hover:bg-slate-800/50 transition-colors">
            
            <div className="flex-1 w-full space-y-3">
              <input 
                type="text" 
                value={tier.name}
                className="bg-transparent text-lg font-bold text-white border-b border-transparent hover:border-slate-700 focus:border-indigo-500 outline-none w-full transition-colors pb-1"
                onChange={() => {}}
              />
              <div className="flex flex-wrap items-center gap-4 text-sm font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-700 text-indigo-300 flex items-center gap-2">
                    <Activity className="w-3 h-3" />
                    {tier.reqs} requests
                  </span>
                </div>
                <span className="text-slate-600 font-sans italic">per</span>
                <div className="flex items-center gap-2">
                  <span className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-700 text-amber-300 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {tier.window} seconds
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <label className="text-xs font-bold text-slate-500 uppercase">Action</label>
                <select className={`bg-slate-950 border text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:ring-1 transition-all ${
                  tier.action === 'BLOCK' ? 'border-rose-500/50 text-rose-400' :
                  tier.action === 'CHALLENGE' ? 'border-amber-500/50 text-amber-400' :
                  'border-slate-700 text-slate-300'
                }`}>
                  <option value="BLOCK">BLOCK (429)</option>
                  <option value="CHALLENGE">JS CHALLENGE</option>
                  <option value="LOG_ONLY">LOG ONLY</option>
                </select>
              </div>
              <button className="p-2.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 rounded-xl transition-colors border border-transparent hover:border-rose-500/30 mt-5 sm:mt-0">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}
