"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldAlert, Globe, Server, Activity, Database, Radar, MapPin, Zap, Shield, AlertCircle, Clock, Info, CreditCard, CheckCircle2 } from 'lucide-react';

interface ThreatEvent {
  id: string;
  timestamp: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  type: string;
  sourceIp: string;
  country: string;
  description: string;
  target: string;
}

// Mock live threat data generator
const generateThreat = (): ThreatEvent => {
  const types = ["DDoS Pattern Detected", "SQL Injection Payload", "Credential Stuffing", "Anomalous Bot Swarm", "BGP Hijack Attempt", "Zero-day Signature Match"];
  const countries = ["RU", "CN", "BR", "IN", "US", "IR", "KP", "VN"];
  const severities: ("CRITICAL" | "HIGH" | "MEDIUM" | "LOW")[] = ["CRITICAL", "HIGH", "HIGH", "MEDIUM", "MEDIUM", "LOW"];
  
  return {
    id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    severity: severities[Math.floor(Math.random() * severities.length)],
    type: types[Math.floor(Math.random() * types.length)],
    sourceIp: `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
    country: countries[Math.floor(Math.random() * countries.length)],
    description: "Automated threat intelligence feed detected malicious signature matching known CVE database.",
    target: `/api/v1/auth/login`
  };
};

export default function ThreatIntelligenceFeed() {
  const [events, setEvents] = useState<ThreatEvent[]>([]);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    // Initial events
    setEvents(Array.from({ length: 5 }, generateThreat));
  }, []);

  useEffect(() => {
    if (!isLive) return;
    
    // Randomly generate new threats
    const interval = setInterval(() => {
      if (Math.random() > 0.4) {
        setEvents(prev => [generateThreat(), ...prev].slice(0, 50)); // Keep last 50
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive]);

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case "CRITICAL": return "text-rose-500 bg-rose-500/10 border-rose-500/30";
      case "HIGH": return "text-orange-500 bg-orange-500/10 border-orange-500/30";
      case "MEDIUM": return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      case "LOW": return "text-blue-400 bg-blue-500/10 border-blue-500/30";
      default: return "text-slate-400 bg-slate-500/10 border-slate-500/30";
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-xl flex flex-col h-[600px] overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="flex justify-between items-center mb-6 relative z-10 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radar className={`w-6 h-6 ${isLive ? 'text-rose-500' : 'text-slate-500'}`} />
            {isLive && (
              <span className="absolute inset-0 animate-ping rounded-full bg-rose-500/50 opacity-75"></span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Global Threat Feed</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Connected to Aegis Intelligence Network</p>
          </div>
        </div>
        <button 
          onClick={() => setIsLive(!isLive)}
          className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center gap-2 ${
            isLive ? "bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]" : "bg-slate-800 text-slate-400 border-slate-700"
          }`}
        >
          {isLive ? <><div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"/> LIVE STREAM</> : "PAUSED"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10 space-y-3">
        <AnimatePresence initial={false}>
          {events.map((evt) => (
            <motion.div
              key={evt.id}
              initial={{ opacity: 0, height: 0, x: -20 }}
              animate={{ opacity: 1, height: 'auto', x: 0 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 hover:bg-slate-900 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase border ${getSeverityColor(evt.severity)}`}>
                      {evt.severity}
                    </span>
                    <span className="text-sm font-bold text-slate-200">{evt.type}</span>
                    <span className="text-xs text-slate-500 font-mono flex items-center gap-1 ml-auto">
                      <Clock className="w-3 h-3" />
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 mt-3">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Server className="w-4 h-4 text-slate-500" />
                      <span className="font-mono">{evt.sourceIp}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span>{evt.country}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 col-span-2 sm:col-span-1 truncate" title={evt.target}>
                      <Globe className="w-4 h-4 text-slate-500" />
                      <span className="truncate">{evt.target}</span>
                    </div>
                  </div>
                </div>
                
                <button className="opacity-0 group-hover:opacity-100 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all border border-slate-700/50">
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
