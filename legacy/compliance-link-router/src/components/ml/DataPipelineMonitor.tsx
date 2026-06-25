"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Database, Server, RefreshCw, Activity, ArrowRight, Zap, Play, CheckCircle2, AlertCircle } from "lucide-react";

export default function DataPipelineMonitor() {
  const [isSyncing, setIsSyncing] = useState(true);

  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-800/80 pb-4 relative z-10">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-400" />
            ML Data Pipeline ETL
          </h2>
          <p className="text-sm text-slate-400 mt-1">Monitor the continuous sync between Supabase Edge Logs and Oracle Training Cluster.</p>
        </div>
        <button 
          onClick={() => setIsSyncing(!isSyncing)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
            isSyncing ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 border-indigo-500/30"
          }`}
        >
          {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {isSyncing ? "Sync Active" : "Resume Sync"}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 relative z-10 items-center justify-between">
        
        {/* Source Node */}
        <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 w-full relative group">
          <div className="absolute top-0 right-0 p-3">
             <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-center mb-4">
             <Database className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Supabase Cloud</h3>
          <p className="text-xs text-slate-500 font-mono mt-1">PostgreSQL • Edge Logs</p>
          
          <div className="mt-6 space-y-3 font-mono text-sm">
             <div className="flex justify-between border-b border-slate-800 pb-2">
               <span className="text-slate-400">Total Rows</span>
               <span className="text-white">125.4M</span>
             </div>
             <div className="flex justify-between border-b border-slate-800 pb-2">
               <span className="text-slate-400">Ingest Rate</span>
               <span className="text-emerald-400">+4.2k/sec</span>
             </div>
             <div className="flex justify-between">
               <span className="text-slate-400">Disk Usage</span>
               <span className="text-slate-300">45.2 GB</span>
             </div>
          </div>
        </div>

        {/* Pipeline / Connectors */}
        <div className="flex flex-col items-center justify-center gap-2 shrink-0">
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold uppercase tracking-widest">
            <Activity className="w-4 h-4" /> Kafka Stream
          </div>
          
          <div className="relative w-32 h-12 flex items-center justify-center">
             <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-slate-700 relative">
                  {isSyncing && (
                    <motion.div 
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                      initial={{ left: 0 }}
                      animate={{ left: "100%" }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                </div>
             </div>
             <ArrowRight className="w-6 h-6 text-slate-600 bg-slate-900 rounded-full z-10" />
          </div>
          
          <div className="text-[10px] text-slate-500 font-mono text-center">
            Batch Size: 5000<br/>Latency: 45ms
          </div>
        </div>

        {/* Destination Node */}
        <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 w-full relative">
           <div className="absolute top-0 right-0 p-3">
             <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          </div>
          <div className="w-12 h-12 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center justify-center mb-4">
             <Server className="w-6 h-6 text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Oracle ARM64 Cluster</h3>
          <p className="text-xs text-slate-500 font-mono mt-1">Data Warehouse • Training Set</p>
          
          <div className="mt-6 space-y-3 font-mono text-sm">
             <div className="flex justify-between border-b border-slate-800 pb-2">
               <span className="text-slate-400">Synced Rows</span>
               <span className="text-white">125.4M</span>
             </div>
             <div className="flex justify-between border-b border-slate-800 pb-2">
               <span className="text-slate-400">Sync Status</span>
               {isSyncing ? (
                 <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Synchronized</span>
               ) : (
                 <span className="text-amber-400 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Paused</span>
               )}
             </div>
             <div className="flex justify-between">
               <span className="text-slate-400">Compute Load</span>
               <span className="text-amber-400 flex items-center gap-1"><Zap className="w-3 h-3" /> 84% CPU</span>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
