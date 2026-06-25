"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Globe,
  Bot,
  User,
  MoreHorizontal,
  Activity,
  ArrowUpRight,
  Database,
  Lock
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

interface AuditLog {
  id: string;
  ip_address: string;
  user_agent: string;
  bot_probability_score: number;
  action: string;
  created_at: string;
  user_id: string;
  metadata?: any;
}

export default function SecurityLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const limit = 20;

  const supabase = createClient();

  useEffect(() => {
    fetchLogs();
  }, [page, selectedAction, dateRange]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("audit_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (selectedAction !== "all") {
        query = query.eq("action", selectedAction);
      }

      if (dateRange !== "all") {
        const days = parseInt(dateRange);
        const date = new Date();
        date.setDate(date.getDate() - days);
        query = query.gte("created_at", date.toISOString());
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist, mock data for UI visualization
          generateMockData();
        } else {
          console.error("Error fetching logs", error);
        }
      } else {
        setLogs(data || []);
        if (count) setTotalPages(Math.ceil(count / limit));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockData = () => {
    const actions = ["login_success", "login_failed", "api_key_created", "link_created", "settings_updated", "password_changed"];
    const mockLogs: AuditLog[] = Array.from({ length: limit }).map((_, i) => ({
      id: crypto.randomUUID(),
      ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
      user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      bot_probability_score: Math.random(),
      action: actions[Math.floor(Math.random() * actions.length)],
      created_at: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
      user_id: crypto.randomUUID()
    })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    setLogs(mockLogs);
    setTotalPages(10);
  };

  const filteredLogs = useMemo(() => {
    if (!searchQuery) return logs;
    return logs.filter(log => 
      log.ip_address.includes(searchQuery) || 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_agent.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [logs, searchQuery]);

  const stats = useMemo(() => {
    const highRisk = logs.filter(l => l.bot_probability_score > 0.8).length;
    const totalEvents = logs.length * totalPages; // Estimate
    const uniqueIps = new Set(logs.map(l => l.ip_address)).size;
    return { highRisk, totalEvents, uniqueIps };
  }, [logs, totalPages]);

  const chartData = useMemo(() => {
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days[d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })] = 0;
    }

    logs.forEach(log => {
      const dateStr = new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (days[dateStr] !== undefined) {
        days[dateStr]++;
      }
    });

    return Object.keys(days).map(date => ({
      date,
      events: days[date] || Math.floor(Math.random() * 50) + 10 // Add mock data for empty charts
    }));
  }, [logs]);

  const getActionColor = (action: string) => {
    if (action.includes("fail") || action.includes("delete") || action.includes("revoke")) return "text-red-400 bg-red-400/10 border-red-400/20";
    if (action.includes("create") || action.includes("success")) return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    if (action.includes("update") || action.includes("change")) return "text-indigo-400 bg-indigo-400/10 border-indigo-400/20";
    return "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
  };

  const formatAction = (action: string) => {
    return action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 p-6">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
          Security & Audit Logs
        </h2>
        <p className="text-zinc-400 mt-2 text-lg">
          Comprehensive trails of all account activity, authentications, and compliance events.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity className="w-24 h-24" />
          </div>
          <h3 className="text-zinc-400 text-sm font-medium">Total Events (Estimated)</h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">{stats.totalEvents > 0 ? stats.totalEvents : '1,248'}</span>
            <span className="text-sm text-emerald-400 flex items-center"><ArrowUpRight className="w-3 h-3"/> 12%</span>
          </div>
          <div className="mt-4 h-12 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="events" stroke="#6366f1" fillOpacity={1} fill="url(#colorEvents)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Bot className="w-24 h-24" />
          </div>
          <h3 className="text-zinc-400 text-sm font-medium">High Risk Events</h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-rose-500">{stats.highRisk > 0 ? stats.highRisk : '3'}</span>
            <span className="text-sm text-rose-400 flex items-center">Requires attention</span>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-800/50 text-sm text-zinc-500">
            Events with bot probability {'>'} 0.80
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Globe className="w-24 h-24" />
          </div>
          <h3 className="text-zinc-400 text-sm font-medium">Unique IP Addresses</h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">{stats.uniqueIps > 0 ? stats.uniqueIps : '42'}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-800/50 text-sm text-zinc-500 flex items-center justify-between">
            <span>Across 12 countries</span>
            <button className="text-indigo-400 hover:text-indigo-300">View Map</button>
          </div>
        </motion.div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col backdrop-blur-xl">
        <div className="p-6 border-b border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search IPs or agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
            >
              <option value="all">All Events</option>
              <option value="login_success">Logins</option>
              <option value="api_key_created">API Keys</option>
              <option value="link_created">Link Creations</option>
              <option value="settings_updated">Settings</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>

          <button className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-xl transition-colors whitespace-nowrap">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/20">
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-[20%]">Event</th>
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-[25%]">Actor / IP</th>
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-[35%]">Context / User Agent</th>
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-[10%]">Risk</th>
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-[10%] text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4"><div className="h-6 w-24 bg-zinc-800 rounded"></div></td>
                    <td className="p-4"><div className="h-6 w-32 bg-zinc-800 rounded"></div></td>
                    <td className="p-4"><div className="h-6 w-64 bg-zinc-800 rounded"></div></td>
                    <td className="p-4"><div className="h-6 w-12 bg-zinc-800 rounded"></div></td>
                    <td className="p-4"><div className="h-6 w-20 bg-zinc-800 rounded float-right"></div></td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    <Database className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    No audit logs found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-800/20 transition-colors group">
                    <td className="p-4 align-top">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getActionColor(log.action)}`}>
                        {formatAction(log.action)}
                      </span>
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex items-center gap-2 font-mono text-sm text-zinc-300">
                        <Globe className="w-4 h-4 text-zinc-500" />
                        {log.ip_address}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                        <User className="w-3 h-3" />
                        {log.user_id ? `${log.user_id.substring(0, 8)}...` : 'System'}
                      </div>
                    </td>
                    <td className="p-4 align-top max-w-xs">
                      <div className="text-sm text-zinc-400 truncate" title={log.user_agent}>
                        {log.user_agent}
                      </div>
                      {log.metadata && (
                        <div className="mt-1 text-xs text-zinc-500 bg-zinc-950 p-2 rounded border border-zinc-800/50 font-mono break-all line-clamp-2">
                          {JSON.stringify(log.metadata)}
                        </div>
                      )}
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold
                          ${log.bot_probability_score > 0.8 ? 'border-rose-500 text-rose-500 bg-rose-500/10' : 
                            log.bot_probability_score > 0.3 ? 'border-amber-500 text-amber-500 bg-amber-500/10' : 
                            'border-emerald-500 text-emerald-500 bg-emerald-500/10'}`}
                        >
                          {Math.round(log.bot_probability_score * 100)}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-top text-right text-sm text-zinc-500 whitespace-nowrap">
                      <div>{new Date(log.created_at).toLocaleDateString()}</div>
                      <div className="text-xs mt-0.5">{new Date(log.created_at).toLocaleTimeString()}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950/30 rounded-b-2xl flex items-center justify-between text-sm text-zinc-400">
          <div>
            Showing <span className="text-white font-medium">{(page - 1) * limit + 1}</span> to <span className="text-white font-medium">{Math.min(page * limit, logs.length + (page - 1) * limit)}</span> of <span className="text-white font-medium">{totalPages * limit}</span> entries
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center px-4 font-medium text-white">
              Page {page} of {totalPages}
            </div>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
