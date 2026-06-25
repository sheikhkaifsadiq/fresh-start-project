"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Shield, ShieldAlert, Activity, Server, Globe, Lock, AlertTriangle, Eye, RefreshCw, Filter, Download, Zap, XOctagon, Crosshair, Cpu, CheckCircle2, XCircle, Search, Settings2, SlidersHorizontal, Plus, Trash2, Power, History, Fingerprint } from "lucide-react";

export interface AuditLog {
  id: string;
  ip_address: string;
  user_agent: string;
  bot_probability_score: number;
  action: string;
  created_at: string;
  user_id: string;
}

export interface WafRule {
  id: string;
  name: string;
  description: string;
  action: "BLOCK" | "ALLOW" | "CHALLENGE" | "RATE_LIMIT";
  condition: "EQUALS" | "CONTAINS" | "GREATER_THAN" | "LESS_THAN" | "MATCHES_REGEX";
  target: "IP" | "USER_AGENT" | "BOT_SCORE" | "GEOLOCATION" | "PATH" | "HEADERS";
  value: string;
  priority: number;
  enabled: boolean;
}

const DEFAULT_WAF_RULES: WafRule[] = [
  { id: "rule-1", name: "Block High Bot Score", description: "Automatically block requests with bot probability > 0.9", action: "BLOCK", condition: "GREATER_THAN", target: "BOT_SCORE", value: "0.9", priority: 10, enabled: true },
  { id: "rule-2", name: "Rate Limit API", description: "Enforce strict rate limits on /api/* endpoints", action: "RATE_LIMIT", condition: "CONTAINS", target: "PATH", value: "/api/", priority: 20, enabled: true },
  { id: "rule-3", name: "Challenge Suspicious IPs", description: "Issue JS challenge for known suspicious IP ranges", action: "CHALLENGE", condition: "MATCHES_REGEX", target: "IP", value: "^192\\.168\\.", priority: 30, enabled: false },
  { id: "rule-4", name: "Block Bad User Agents", description: "Block obsolete or known scraping user agents", action: "BLOCK", condition: "CONTAINS", target: "USER_AGENT", value: "curl", priority: 40, enabled: true },
  { id: "rule-5", name: "Allow Corporate VPN", description: "Bypass restrictions for internal network", action: "ALLOW", condition: "EQUALS", target: "IP", value: "10.0.0.1", priority: 5, enabled: true }
];

export default function WafDashboard() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [rules, setRules] = useState<WafRule[]>(DEFAULT_WAF_RULES);
  const [activeTab, setActiveTab] = useState<"overview" | "rules" | "logs" | "settings">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const supabase = createClient();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      if (data) setLogs(data as AuditLog[]);
    } catch (err) {
      console.error("Failed to fetch WAF logs:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const stats = useMemo(() => {
    const totalRequests = logs.length;
    const blockedRequests = logs.filter(l => l.action === "BLOCK").length;
    const avgBotScore = logs.reduce((acc, curr) => acc + (curr.bot_probability_score || 0), 0) / (totalRequests || 1);
    const uniqueIps = new Set(logs.map(l => l.ip_address)).size;

    return { totalRequests, blockedRequests, avgBotScore, uniqueIps };
  }, [logs]);

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/50 p-6 rounded-3xl border border-slate-800/60 backdrop-blur-xl shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 z-0" />
          <div className="relative z-10 flex items-center gap-5">
            <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                WAF Dashboard
              </h1>
              <p className="text-slate-400 font-medium mt-1">Web Application Firewall & Edge Security</p>
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="px-4 py-2 bg-slate-800/80 rounded-full border border-slate-700/50 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-semibold text-emerald-400">Protection Active</span>
            </div>
            <button onClick={fetchLogs} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700/50 text-slate-300">
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
            </button>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 bg-slate-900/40 p-1 rounded-2xl border border-slate-800/50 w-fit backdrop-blur-md">
          {[
            { id: "overview", icon: Activity, label: "Overview" },
            { id: "rules", icon: SlidersHorizontal, label: "Firewall Rules" },
            { id: "logs", icon: History, label: "Audit Logs" },
            { id: "settings", icon: Settings2, label: "Settings" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                activeTab === tab.id 
                ? "bg-slate-800 text-indigo-400 shadow-md shadow-black/20" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard title="Total Monitored" value={stats.totalRequests.toString()} icon={Globe} trend="+12.5%" color="indigo" />
                  <StatCard title="Threats Blocked" value={stats.blockedRequests.toString()} icon={ShieldAlert} trend="-2.4%" color="rose" />
                  <StatCard title="Avg Bot Score" value={stats.avgBotScore.toFixed(3)} icon={Cpu} trend="+0.05" color="amber" />
                  <StatCard title="Unique Origins" value={stats.uniqueIps.toString()} icon={Server} trend="+5.2%" color="emerald" />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/60 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-400" />
                        Traffic & Threat Volume
                      </h3>
                      <select className="bg-slate-950 border border-slate-800 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500 transition-colors text-slate-300">
                        <option>Last 24 Hours</option>
                        <option>Last 7 Days</option>
                        <option>Last 30 Days</option>
                      </select>
                    </div>
                    <div className="h-64 flex items-end justify-between gap-2 px-2">
                      {/* Fake Chart Bars for visual density */}
                      {Array.from({ length: 24 }).map((_, i) => {
                        const height = Math.random() * 100;
                        const isThreat = Math.random() > 0.7;
                        return (
                          <div key={i} className="w-full flex flex-col justify-end gap-1 group relative">
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${height * 0.3}%` }}
                              className={`w-full rounded-t-sm ${isThreat ? 'bg-rose-500/80' : 'bg-indigo-500/80'} transition-all duration-500 group-hover:brightness-125`} 
                            />
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${height * 0.7}%` }}
                              className="w-full rounded-b-sm bg-slate-700/50 transition-all duration-500 group-hover:bg-slate-600/50" 
                            />
                            {/* Tooltip */}
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                              {Math.floor(height * 10)} reqs
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-4 px-2">
                      <span>00:00</span>
                      <span>06:00</span>
                      <span>12:00</span>
                      <span>18:00</span>
                      <span>24:00</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800/60 rounded-3xl p-6 shadow-xl backdrop-blur-sm flex flex-col">
                    <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2 mb-6">
                      <Target className="w-5 h-5 text-rose-400" />
                      Top Attack Vectors
                    </h3>
                    <div className="space-y-4 flex-1">
                      {[
                        { name: "SQL Injection", count: 1245, pct: 45 },
                        { name: "Cross-Site Scripting", count: 843, pct: 30 },
                        { name: "Bad Bot Scraping", count: 421, pct: 15 },
                        { name: "DDoS Attempt", count: 210, pct: 10 }
                      ].map((vector, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-300 font-medium">{vector.name}</span>
                            <span className="text-slate-400">{vector.count}</span>
                          </div>
                          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${vector.pct}%` }}
                              transition={{ duration: 1, delay: i * 0.1 }}
                              className={`h-full rounded-full ${
                                i === 0 ? "bg-rose-500" : 
                                i === 1 ? "bg-amber-500" : 
                                i === 2 ? "bg-purple-500" : "bg-blue-500"
                              }`} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-sm font-medium rounded-xl transition-colors border border-slate-700/50">
                      View Detailed Analysis
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "rules" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50 backdrop-blur-md">
                  <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Search rules..." 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-200 placeholder:text-slate-600"
                    />
                  </div>
                  <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 whitespace-nowrap">
                    <Plus className="w-4 h-4" />
                    Create Rule
                  </button>
                </div>

                <div className="grid gap-4">
                  {rules.map((rule, idx) => (
                    <motion.div 
                      key={rule.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex flex-col md:flex-row gap-6 p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
                        rule.enabled 
                          ? "bg-slate-900/60 border-slate-700/50 shadow-lg" 
                          : "bg-slate-900/20 border-slate-800/30 opacity-75"
                      }`}
                    >
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-slate-100">{rule.name}</h3>
                          <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold tracking-wider ${
                            rule.action === "BLOCK" ? "bg-rose-500/20 text-rose-400 border border-rose-500/20" :
                            rule.action === "ALLOW" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" :
                            rule.action === "CHALLENGE" ? "bg-amber-500/20 text-amber-400 border border-amber-500/20" :
                            "bg-blue-500/20 text-blue-400 border border-blue-500/20"
                          }`}>
                            {rule.action}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">{rule.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-mono">
                          <span className="text-slate-500">IF</span>
                          <span className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-md text-indigo-300">{rule.target}</span>
                          <span className="text-slate-500">{rule.condition.toLowerCase().replace("_", " ")}</span>
                          <span className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-md text-purple-300">"{rule.value}"</span>
                          <span className="text-slate-500 ml-2">PRIORITY</span>
                          <span className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-md text-slate-300">{rule.priority}</span>
                        </div>
                      </div>

                      <div className="flex md:flex-col items-center justify-between md:justify-center gap-4 md:border-l md:border-slate-800 md:pl-6">
                        <label className="relative inline-flex items-center cursor-pointer group">
                          <input type="checkbox" className="sr-only peer" checked={rule.enabled} onChange={() => toggleRule(rule.id)} />
                          <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 group-hover:shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
                          <span className="ml-3 text-sm font-medium text-slate-300 w-12">{rule.enabled ? "On" : "Off"}</span>
                        </label>
                        
                        <button 
                          onClick={() => deleteRule(rule.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "logs" && (
              <div className="bg-slate-900/60 border border-slate-800/60 rounded-3xl shadow-xl overflow-hidden backdrop-blur-sm">
                <div className="p-4 border-b border-slate-800/60 flex flex-wrap gap-4 items-center justify-between bg-slate-900/80">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-300">Filters:</span>
                    <select className="bg-slate-950 border border-slate-800 text-sm rounded-lg px-3 py-1.5 outline-none text-slate-300">
                      <option value="all">All Actions</option>
                      <option value="block">Blocked Only</option>
                      <option value="allow">Allowed Only</option>
                    </select>
                    <select className="bg-slate-950 border border-slate-800 text-sm rounded-lg px-3 py-1.5 outline-none text-slate-300">
                      <option value="all">All Targets</option>
                      <option value="api">API Endpoints</option>
                      <option value="static">Static Assets</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="text" 
                        placeholder="Search IP or Hash..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-sm outline-none w-64 text-slate-200"
                      />
                    </div>
                    <button className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700/50 text-slate-300 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/50 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                        <th className="p-4 pl-6">Timestamp</th>
                        <th className="p-4">Action</th>
                        <th className="p-4">IP Address</th>
                        <th className="p-4">Bot Score</th>
                        <th className="p-4">User Agent Snippet</th>
                        <th className="p-4 pr-6 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {loading && logs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                            Loading audit logs...
                          </td>
                        </tr>
                      ) : logs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">No logs found.</td>
                        </tr>
                      ) : (
                        logs.filter(l => l.ip_address?.includes(searchTerm) || l.action?.toLowerCase().includes(searchTerm.toLowerCase())).map((log, idx) => (
                          <motion.tr 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                            key={log.id} 
                            className="hover:bg-slate-800/30 transition-colors group"
                          >
                            <td className="p-4 pl-6 text-sm text-slate-400 whitespace-nowrap">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide border ${
                                log.action === "BLOCK" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                                log.action === "ALLOW" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                "bg-slate-500/10 text-slate-400 border-slate-500/20"
                              }`}>
                                {log.action === "BLOCK" ? <XOctagon className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                                {log.action}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm text-slate-300">{log.ip_address}</span>
                                <button className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-indigo-400 transition-all">
                                  <Filter className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      log.bot_probability_score > 0.8 ? "bg-rose-500" :
                                      log.bot_probability_score > 0.4 ? "bg-amber-500" : "bg-emerald-500"
                                    }`}
                                    style={{ width: `${(log.bot_probability_score || 0) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs font-mono text-slate-400">
                                  {(log.bot_probability_score || 0).toFixed(2)}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-xs text-slate-500 max-w-[200px] truncate" title={log.user_agent}>
                              {log.user_agent || "Unknown User Agent"}
                            </td>
                            <td className="p-4 pr-6 text-right">
                              <button className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded transition-colors inline-flex">
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/60 border border-slate-800/60 rounded-3xl p-6 shadow-xl backdrop-blur-sm space-y-6">
                  <h3 className="text-xl font-bold text-slate-200 border-b border-slate-800 pb-4">Engine Configuration</h3>
                  
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-300">Strict Mode</h4>
                        <p className="text-sm text-slate-500">Automatically blocks requests with medium bot probability.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-300">Log Anonymization</h4>
                        <p className="text-sm text-slate-500">Hash last octet of IP addresses in audit logs for compliance.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-300">Geographic Filtering</h4>
                        <p className="text-sm text-slate-500">Enable routing decisions based on IP geographic data.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800">
                    <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-indigo-500/20">
                      Save Configuration
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/60 rounded-3xl p-6 shadow-xl backdrop-blur-sm space-y-6">
                  <h3 className="text-xl font-bold text-slate-200 border-b border-slate-800 pb-4">Machine Learning Models</h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 border border-indigo-500/30 bg-indigo-500/5 rounded-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2">
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                      </div>
                      <h4 className="font-semibold text-indigo-300 flex items-center gap-2">
                        <Cpu className="w-4 h-4" />
                        AegisBotNet v2.4
                      </h4>
                      <p className="text-sm text-slate-400 mt-1">Deep learning model for bot classification. Specialized in headless browser detection.</p>
                      <div className="mt-4 flex gap-4 text-xs font-mono text-slate-500">
                        <span>Latency: ~12ms</span>
                        <span>Accuracy: 99.4%</span>
                      </div>
                    </div>

                    <div className="p-4 border border-slate-700/50 bg-slate-800/20 rounded-2xl">
                      <h4 className="font-semibold text-slate-300 flex items-center gap-2">
                        <Fingerprint className="w-4 h-4" />
                        AnomalyDetector v1.1
                      </h4>
                      <p className="text-sm text-slate-400 mt-1">Detects unusual traffic spikes and pattern deviations using Isolation Forest.</p>
                      <div className="mt-4 flex gap-4 text-xs font-mono text-slate-500">
                        <span>Latency: ~5ms</span>
                        <span>Status: Standby</span>
                      </div>
                    </div>
                  </div>

                  <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors border border-slate-700/50 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Check for Model Updates
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Utility components

function Target({ className }: { className?: string }) {
  return <Crosshair className={className} />;
}

function StatCard({ title, value, icon: Icon, trend, color }: { title: string, value: string, icon: any, trend: string, color: string }) {
  const isPositive = trend.startsWith('+');
  
  const colorMap: Record<string, string> = {
    indigo: "from-indigo-500/20 to-indigo-500/0 text-indigo-400 border-indigo-500/30",
    rose: "from-rose-500/20 to-rose-500/0 text-rose-400 border-rose-500/30",
    emerald: "from-emerald-500/20 to-emerald-500/0 text-emerald-400 border-emerald-500/30",
    amber: "from-amber-500/20 to-amber-500/0 text-amber-400 border-amber-500/30"
  };

  const bgGradient = colorMap[color];

  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      className={`relative overflow-hidden rounded-3xl border bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm ${bgGradient.split(' ')[2]}`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${bgGradient.split(' ')[0]} rounded-bl-full opacity-50 blur-2xl`} />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-2xl bg-slate-950/50 border border-slate-800`}>
            <Icon className={`w-6 h-6 ${bgGradient.split(' ')[2]}`} />
          </div>
          <span className={`text-xs font-bold px-2 py-1 rounded-md bg-slate-950 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend}
          </span>
        </div>
        <div>
          <h4 className="text-slate-400 font-medium text-sm">{title}</h4>
          <p className="text-3xl font-extrabold text-white mt-1 tracking-tight">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}
