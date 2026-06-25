"use client";

import React, { useState, useEffect } from "react";
import { Terminal, Copy, Cpu, Database, Network, Search, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SystemLog {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  service: "ORACLE_NODE" | "VERCEL_EDGE" | "SUPABASE_SYNC" | "MODEL_PIPELINE";
  message: string;
  metadata?: any;
}

const generateLog = (): SystemLog => {
  const levels: SystemLog["level"][] = ["INFO", "INFO", "INFO", "DEBUG", "WARN", "ERROR"];
  const services: SystemLog["service"][] = ["ORACLE_NODE", "VERCEL_EDGE", "SUPABASE_SYNC", "MODEL_PIPELINE"];
  const messages = [
    "Loaded weights for model AegisBotNet v2.4 in 14ms.",
    "Circuit breaker status: CLOSED.",
    "Syncing 15k rows to audit_logs_archived.",
    "Isolation forest identified new cluster deviation.",
    "Connection timeout reaching Oracle Node via SSH tunnel.",
    "Rate limit counter desync detected across region us-east.",
    "New WAF rule applied to edge network.",
  ];

  return {
    id: `sys-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    level: levels[Math.floor(Math.random() * levels.length)],
    service: services[Math.floor(Math.random() * services.length)],
    message: messages[Math.floor(Math.random() * messages.length)]
  };
};

export default function MlSystemLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isTailing, setIsTailing] = useState(true);

  useEffect(() => {
    setLogs(Array.from({ length: 20 }, generateLog).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }, []);

  useEffect(() => {
    if (!isTailing) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.5) {
        setLogs(prev => [generateLog(), ...prev].slice(0, 100));
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [isTailing]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "ERROR": return "text-rose-400";
      case "WARN": return "text-amber-400";
      case "INFO": return "text-indigo-300";
      case "DEBUG": return "text-slate-500";
      default: return "text-slate-400";
    }
  };

  return (
    <div className="bg-[#0d1117] border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl h-[500px] flex flex-col font-mono text-sm">
      
      {/* Header Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-slate-200 tracking-wider">SYSTEM LOGS</h3>
          <div className="h-4 w-px bg-slate-700 mx-2" />
          <span className="text-xs text-slate-500 flex items-center gap-2">
            <Network className="w-3 h-3" /> Tunnel: OK
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsTailing(!isTailing)}
            className={`px-3 py-1 rounded text-xs font-bold border transition-all flex items-center gap-2 ${
              isTailing ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.1)]" : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            {isTailing ? <><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/> TAILING</> : "PAUSED"}
          </button>
          <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors">
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logs Output */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-1 relative">
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-3 hover:bg-slate-800/30 px-2 py-1 rounded"
            >
              <span className="text-slate-600 shrink-0 select-none">
                {new Date(log.timestamp).toISOString().split('T')[1].replace('Z', '')}
              </span>
              <span className={`w-12 shrink-0 font-bold ${getLevelColor(log.level)}`}>
                {log.level}
              </span>
              <span className="text-purple-400 shrink-0 w-32 truncate" title={log.service}>
                [{log.service}]
              </span>
              <span className="text-slate-300 flex-1 break-words">
                {log.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
