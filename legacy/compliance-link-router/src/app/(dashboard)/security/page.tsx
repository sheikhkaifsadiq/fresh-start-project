"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shield, ShieldAlert, Cpu, Database, Activity, Map, Search, Network } from "lucide-react";
import SecurityPostureScore from "@/components/security/SecurityPostureScore";
import ThreatIntelligenceFeed from "@/components/security/ThreatIntelligenceFeed";
import BotProtectionEngine from "@/components/security/BotProtectionEngine";
import RuleEngineUI from "@/components/security/RuleEngineUI";
import WafLogViewer from "@/components/security/WafLogViewer";
import RateLimiterConfig from "@/components/security/RateLimiterConfig";
import IpBlacklistManager from "@/components/security/IpBlacklistManager";

export default function SecurityDashboard() {
  const [activeView, setActiveView] = useState("overview");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30">
      
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800/80 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
              <ShieldAlert className="w-6 h-6 text-rose-500" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Security Command Center</h1>
          </div>

          <div className="flex flex-wrap gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {[
              { id: "overview", label: "Overview", icon: Activity },
              { id: "rules", label: "Rule Engine", icon: Network },
              { id: "bot", label: "Bot Config", icon: Cpu },
              { id: "limits", label: "Rate Limits", icon: Shield },
              { id: "reputation", label: "IP Rep", icon: Database },
              { id: "logs", label: "Audit Logs", icon: Search },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeView === tab.id 
                    ? "bg-slate-800 text-white shadow-md" 
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden lg:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto p-6 space-y-8 mt-4">
        
        {activeView === "overview" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
            className="space-y-8"
          >
            <SecurityPostureScore />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ThreatIntelligenceFeed />
              <div className="bg-slate-900/60 border border-slate-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-xl flex flex-col">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                  <Map className="w-6 h-6 text-emerald-400" />
                  Live Attack Map
                </h2>
                <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                  <Globe className="w-64 h-64 text-slate-800/50" strokeWidth={1} />
                  
                  {/* Fake attack lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <motion.path d="M 100 200 Q 250 100 400 250" fill="none" stroke="#fb7185" strokeWidth="2" strokeDasharray="5 5" className="opacity-50" />
                    <motion.path d="M 300 100 Q 400 300 200 400" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="5 5" className="opacity-50" />
                    <motion.circle cx="400" cy="250" r="4" fill="#fb7185" animate={{ r: [4, 10, 4], opacity: [1, 0, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                    <motion.circle cx="200" cy="400" r="4" fill="#fbbf24" animate={{ r: [4, 10, 4], opacity: [1, 0, 1] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }} />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeView === "rules" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <RuleEngineUI />
          </motion.div>
        )}

        {activeView === "bot" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <BotProtectionEngine />
          </motion.div>
        )}

        {activeView === "limits" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <RateLimiterConfig />
          </motion.div>
        )}

        {activeView === "reputation" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <IpBlacklistManager />
          </motion.div>
        )}

        {activeView === "logs" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <WafLogViewer />
          </motion.div>
        )}

      </div>
    </div>
  );
}

// Ensure globe icon is available
function Globe({ className, strokeWidth }: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth || "2"} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  );
}
