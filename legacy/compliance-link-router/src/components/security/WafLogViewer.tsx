"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, Search, Download, RefreshCw, ShieldAlert, Clock, Server, Globe, ChevronRight, Database, TerminalSquare, Network, XCircle, CheckCircle2, AlertTriangle, Cpu, Key, ShieldCheck, Eye, Maximize2, Shield, AlertCircle, Activity, Info, CreditCard } from 'lucide-react';
import { createClient } from "@/lib/supabase/client";

// Large dummy data generation for the WafLogViewer
const MOCK_LOGS = Array.from({ length: 500 }).map((_, i) => {
  const actions = ["BLOCK", "ALLOW", "CHALLENGE", "LOG_ONLY"];
  const action = actions[Math.floor(Math.random() * actions.length)];
  const botScore = Math.random();
  const ruleHits = ["Rate Limit Exceeded", "SQLi Pattern Match", "Bot Score Threshold", "GeoBlock Restriction", "None"];
  const ruleHit = action === "ALLOW" ? "None" : ruleHits[Math.floor(Math.random() * (ruleHits.length - 1))];
  
  return {
    id: `log-${Date.now()}-${i}`,
    timestamp: new Date(Date.now() - Math.random() * 100000000).toISOString(),
    ip_address: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    country: ["US", "GB", "DE", "FR", "CN", "RU", "BR", "IN"][Math.floor(Math.random() * 8)],
    action: action,
    bot_probability_score: botScore,
    rule_id: ruleHit,
    method: ["GET", "POST", "PUT", "DELETE"][Math.floor(Math.random() * 4)],
    path: ["/api/v1/auth", "/api/v1/links", "/dashboard", "/login", "/favicon.ico"][Math.floor(Math.random() * 5)],
    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    asn: `AS${Math.floor(Math.random() * 50000)}`,
    latency_ms: Math.floor(Math.random() * 500),
  };
});

export default function WafLogViewer() {
  const [logs, setLogs] = useState(MOCK_LOGS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(r => setTimeout(r, 800));
    // Simulate getting new logs
    setLogs(prev => [MOCK_LOGS[Math.floor(Math.random() * MOCK_LOGS.length)], ...prev].slice(0, 500));
    setIsRefreshing(false);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (selectedAction !== "ALL" && log.action !== selectedAction) return false;
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        return (
          log.ip_address.includes(lowerSearch) || 
          log.path.toLowerCase().includes(lowerSearch) ||
          log.rule_id.toLowerCase().includes(lowerSearch)
        );
      }
      return true;
    });
  }, [logs, searchTerm, selectedAction]);

  const getActionColor = (action: string) => {
    switch(action) {
      case "ALLOW": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "BLOCK": return "text-rose-400 bg-rose-500/10 border-rose-500/30";
      case "CHALLENGE": return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      case "LOG_ONLY": return "text-slate-400 bg-slate-500/10 border-slate-500/30";
      default: return "text-slate-400 bg-slate-500/10 border-slate-500/30";
    }
  };

  const getActionIcon = (action: string) => {
    switch(action) {
      case "ALLOW": return <CheckCircle2 className="w-4 h-4" />;
      case "BLOCK": return <XCircle className="w-4 h-4" />;
      case "CHALLENGE": return <ShieldAlert className="w-4 h-4" />;
      case "LOG_ONLY": return <TerminalSquare className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl h-[800px] flex flex-col font-sans">
      
      {/* Header and Controls */}
      <div className="p-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TerminalSquare className="w-6 h-6 text-indigo-400" />
            WAF Audit Logs Explorer
          </h2>
          <p className="text-sm text-slate-400 mt-1">Deep dive into individual requests evaluated by the rules engine.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search IP, Path, Rule..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 bg-slate-950 border border-slate-700 text-sm rounded-xl pl-9 pr-4 py-2 outline-none focus:border-indigo-500 text-slate-200"
            />
          </div>

          <select 
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-sm rounded-xl px-4 py-2 outline-none focus:border-indigo-500 text-slate-300 appearance-none cursor-pointer"
          >
            <option value="ALL">All Actions</option>
            <option value="ALLOW">Allowed</option>
            <option value="BLOCK">Blocked</option>
            <option value="CHALLENGE">Challenged</option>
            <option value="LOG_ONLY">Log Only</option>
          </select>

          <button 
            onClick={handleRefresh}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700 text-slate-300"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-indigo-400" : ""}`} />
          </button>
          
          <button className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700 text-slate-300">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Split View */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Logs Table */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar transition-all duration-300 ${selectedLog ? 'w-2/3 border-r border-slate-800' : 'w-full'}`}>
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-md z-10 border-b border-slate-800 shadow-sm">
              <tr className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                <th className="p-4 pl-6">Timestamp</th>
                <th className="p-4">Action</th>
                <th className="p-4">Origin</th>
                <th className="p-4">Request</th>
                <th className="p-4">Rule Hit</th>
                <th className="p-4">Bot Score</th>
                <th className="p-4 pr-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredLogs.map((log) => (
                <tr 
                  key={log.id} 
                  onClick={() => setSelectedLog(log)}
                  className={`hover:bg-slate-800/40 transition-colors cursor-pointer group ${
                    selectedLog?.id === log.id ? 'bg-indigo-500/10' : ''
                  }`}
                >
                  <td className="p-4 pl-6 text-xs text-slate-400 whitespace-nowrap font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest border ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)}
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-300">{log.ip_address}</span>
                      <span className="text-xs text-slate-500">{log.country}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 max-w-[150px]">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        log.method === 'GET' ? 'bg-blue-500/10 text-blue-400' : 
                        log.method === 'POST' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                      }`}>
                        {log.method}
                      </span>
                      <span className="text-xs text-slate-400 truncate" title={log.path}>{log.path}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs text-slate-300 truncate max-w-[150px] inline-block" title={log.rule_id}>
                      {log.rule_id}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            log.bot_probability_score > 0.8 ? "bg-rose-500" :
                            log.bot_probability_score > 0.4 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${log.bot_probability_score * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-slate-500">
                        {log.bot_probability_score.toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${selectedLog?.id === log.id ? 'rotate-90 text-indigo-400' : 'group-hover:text-slate-400'}`} />
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    No logs match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Selected Log Details Pane */}
        <AnimatePresence>
          {selectedLog && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "33.333333%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-slate-900/80 border-l border-slate-800 flex flex-col overflow-y-auto custom-scrollbar"
            >
              <div className="p-5 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-400" /> Request Inspection
                </h3>
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-6">
                
                {/* Summary Card */}
                <div className={`p-4 rounded-xl border ${getActionColor(selectedLog.action)} bg-opacity-5`}>
                  <div className="flex items-center gap-2 mb-2">
                    {getActionIcon(selectedLog.action)}
                    <span className="font-black text-sm tracking-widest">{selectedLog.action}</span>
                  </div>
                  <p className="text-xs opacity-80 leading-relaxed">
                    This request was {selectedLog.action.toLowerCase()} by the WAF engine because it matched the rule: 
                    <strong className="block mt-1 font-mono">{selectedLog.rule_id}</strong>
                  </p>
                </div>

                {/* Network & Origin Details */}
                <section>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Globe className="w-3 h-3" /> Origin Details
                  </h4>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-sm">
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-500">IP Address</span>
                      <span className="text-indigo-300">{selectedLog.ip_address}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-500">ASN</span>
                      <span className="text-slate-300">{selectedLog.asn}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-500">Country</span>
                      <span className="text-slate-300">{selectedLog.country}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Latency</span>
                      <span className="text-amber-400">{selectedLog.latency_ms}ms</span>
                    </div>
                  </div>
                </section>

                {/* Request Details */}
                <section>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Server className="w-3 h-3" /> HTTP Request
                  </h4>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-sm">
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-500">Method</span>
                      <span className="text-blue-400">{selectedLog.method}</span>
                    </div>
                    <div className="flex flex-col border-b border-slate-800 pb-2 gap-1">
                      <span className="text-slate-500">Path</span>
                      <span className="text-slate-300 break-all">{selectedLog.path}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500">User-Agent</span>
                      <span className="text-slate-400 text-xs break-all">{selectedLog.user_agent}</span>
                    </div>
                  </div>
                </section>

                {/* ML Analysis Details */}
                <section>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Cpu className="w-3 h-3" /> ML Engine Analysis
                  </h4>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400 font-mono">Bot Probability Score</span>
                        <span className="text-slate-200 font-mono font-bold">{selectedLog.bot_probability_score.toFixed(4)}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            selectedLog.bot_probability_score > 0.8 ? "bg-rose-500" :
                            selectedLog.bot_probability_score > 0.4 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${selectedLog.bot_probability_score * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between text-slate-500">
                        <span>Heuristic Sub-score</span>
                        <span>{(Math.random()).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Fingerprint Match</span>
                        <span>{(Math.random()).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>IP Reputation</span>
                        <span>{(Math.random()).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </section>
                
                {/* JSON Payload Viewer */}
                <section>
                   <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Database className="w-3 h-3" /> Raw JSON Log
                  </h4>
                  <div className="bg-[#0d1117] border border-slate-800 rounded-xl p-4 overflow-x-auto relative group">
                    <pre className="text-[10px] font-mono text-indigo-300">
                      {JSON.stringify(selectedLog, null, 2)}
                    </pre>
                    <button className="absolute top-2 right-2 p-1.5 bg-slate-800 text-slate-400 rounded opacity-0 group-hover:opacity-100 transition-opacity border border-slate-700">
                      <Maximize2 className="w-3 h-3" />
                    </button>
                  </div>
                </section>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
