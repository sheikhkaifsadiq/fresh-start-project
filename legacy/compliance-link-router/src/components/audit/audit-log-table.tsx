"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion";
import { 
  Search, Filter, Download, Activity, ShieldAlert, CheckCircle2, 
  Clock, Server, Globe, MousePointerClick, Shield, ArrowUpDown, 
  MoreVertical, ChevronRight, ChevronDown, RefreshCw, Layers,
  Terminal, Hash, Database, Network, Cpu, HardDrive, Key, AlertTriangle, Eye, Lock
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface AuditLog {
  id: string;
  ip_address: string;
  user_agent: string;
  bot_probability_score: number;
  action: string;
  created_at: string;
  user_id: string;
  metadata?: Record<string, any>;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  resource_id?: string;
  location?: string;
  status_code?: number;
}

interface AuditLogTableProps {
  initialLogs?: AuditLog[];
  projectId?: string;
}

const ROWS_PER_PAGE = 50;
const ROW_HEIGHT = 64;

export const AuditLogTable: React.FC<AuditLogTableProps> = ({ initialLogs = [], projectId }) => {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof AuditLog>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(true);
  const supabase = createClient();
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order(sortField, { ascending: sortDirection === 'asc' })
        .limit(ROWS_PER_PAGE * 4); // Fetch a buffer

      if (searchTerm) {
        query = query.or(`action.ilike.%${searchTerm}%,ip_address.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (data) setLogs(data as AuditLog[]);
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, sortField, sortDirection, searchTerm]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!isStreaming) return;
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        (payload) => {
          setLogs((prev) => [payload.new as AuditLog, ...prev].slice(0, 500));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, isStreaming]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const toggleSort = (field: keyof AuditLog) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getRiskColor = (score: number) => {
    if (score > 80) return "text-red-500 bg-red-500/10 border-red-500/20";
    if (score > 50) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    if (score > 20) return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
  };

  const getActionIcon = (action: string) => {
    if (action.includes('login')) return <Key className="w-4 h-4" />;
    if (action.includes('delete')) return <AlertTriangle className="w-4 h-4" />;
    if (action.includes('create')) return <Layers className="w-4 h-4" />;
    if (action.includes('update')) return <RefreshCw className="w-4 h-4" />;
    if (action.includes('click')) return <MousePointerClick className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip_address.includes(searchTerm) ||
      (log.user_id && log.user_id.includes(searchTerm))
    );
  }, [logs, searchTerm]);

  const visibleLogs = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 5);
    const endIndex = Math.min(filteredLogs.length, startIndex + Math.ceil(800 / ROW_HEIGHT) + 10);
    return filteredLogs.slice(startIndex, endIndex).map((log, index) => ({
      ...log,
      absoluteIndex: startIndex + index
    }));
  }, [filteredLogs, scrollTop]);

  const toggleSelectAll = () => {
    if (selectedLogs.size === filteredLogs.length) {
      setSelectedLogs(new Set());
    } else {
      setSelectedLogs(new Set(filteredLogs.map(l => l.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedLogs);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedLogs(newSet);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02] backdrop-blur-xl">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
            <Shield className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white tracking-tight">Audit Fleet Logistics</h2>
            <p className="text-sm text-zinc-400">Real-time immutable transaction ledger</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              placeholder="Query logs by IP, action, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-80 bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-zinc-400">⌘</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-zinc-400">K</kbd>
            </div>
          </div>

          <button className="flex items-center space-x-2 px-4 py-2 bg-black/40 hover:bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-300 transition-all">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-black/40 hover:bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-300 transition-all">
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button 
            onClick={() => setIsStreaming(!isStreaming)}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg text-sm transition-all ${
              isStreaming 
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20' 
                : 'bg-black/40 border-white/10 text-zinc-400 hover:bg-white/5'
            }`}
          >
            <Activity className={`w-4 h-4 ${isStreaming ? 'animate-pulse' : ''}`} />
            <span>{isStreaming ? 'Live' : 'Paused'}</span>
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[48px_180px_200px_140px_160px_1fr_48px] gap-4 px-6 py-3 border-b border-white/5 bg-black/20 text-xs font-medium text-zinc-500 uppercase tracking-wider sticky top-0 z-10">
        <div className="flex items-center justify-center">
          <button 
            onClick={toggleSelectAll}
            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
              selectedLogs.size === filteredLogs.length && filteredLogs.length > 0
                ? 'bg-indigo-500 border-indigo-500' 
                : 'border-zinc-600 hover:border-zinc-400 bg-transparent'
            }`}
          >
            {selectedLogs.size === filteredLogs.length && filteredLogs.length > 0 && <CheckCircle2 className="w-3 h-3 text-white" />}
          </button>
        </div>
        <button onClick={() => toggleSort('created_at')} className="flex items-center space-x-1 hover:text-zinc-300">
          <Clock className="w-3 h-3" />
          <span>Timestamp</span>
          <ArrowUpDown className="w-3 h-3 opacity-50" />
        </button>
        <button onClick={() => toggleSort('action')} className="flex items-center space-x-1 hover:text-zinc-300">
          <Activity className="w-3 h-3" />
          <span>Action Type</span>
          <ArrowUpDown className="w-3 h-3 opacity-50" />
        </button>
        <button onClick={() => toggleSort('bot_probability_score')} className="flex items-center space-x-1 hover:text-zinc-300">
          <ShieldAlert className="w-3 h-3" />
          <span>Risk Score</span>
          <ArrowUpDown className="w-3 h-3 opacity-50" />
        </button>
        <button onClick={() => toggleSort('ip_address')} className="flex items-center space-x-1 hover:text-zinc-300">
          <Network className="w-3 h-3" />
          <span>Source IP</span>
          <ArrowUpDown className="w-3 h-3 opacity-50" />
        </button>
        <div className="flex items-center space-x-1">
          <Globe className="w-3 h-3" />
          <span>User Agent Details</span>
        </div>
        <div className="flex items-center justify-center">
          <Hash className="w-3 h-3" />
        </div>
      </div>

      {/* Virtualized Table Body */}
      <div 
        ref={tableContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto relative custom-scrollbar bg-black/40"
      >
        {isLoading && logs.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 space-y-4">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500/50" />
            <p className="text-sm font-medium tracking-widest uppercase">Decoupling telemetry streams...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 space-y-4">
            <Search className="w-12 h-12 opacity-20" />
            <p className="text-sm">No audit records match the current dimensional filters.</p>
          </div>
        ) : (
          <div style={{ height: filteredLogs.length * ROW_HEIGHT }} className="relative w-full">
            <AnimatePresence>
              {visibleLogs.map(({ absoluteIndex, ...log }) => {
                const isSelected = selectedLogs.has(log.id);
                const isExpanded = expandedRow === log.id;
                
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${absoluteIndex * ROW_HEIGHT}px)`,
                      height: isExpanded ? ROW_HEIGHT + 300 : ROW_HEIGHT,
                      zIndex: isExpanded ? 10 : 1,
                    }}
                    className={`group border-b border-white/5 transition-colors ${
                      isSelected ? 'bg-indigo-500/5' : 'hover:bg-white/[0.02] bg-transparent'
                    } ${isExpanded ? 'bg-zinc-900/80 shadow-2xl backdrop-blur-xl' : ''}`}
                  >
                    <div className="grid grid-cols-[48px_180px_200px_140px_160px_1fr_48px] gap-4 px-6 h-16 items-center text-sm">
                      <div className="flex items-center justify-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleSelect(log.id); }}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            isSelected 
                              ? 'bg-indigo-500 border-indigo-500' 
                              : 'border-zinc-600 group-hover:border-zinc-400 bg-transparent'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </button>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-zinc-400 font-mono text-xs">
                        <span>{new Intl.DateTimeFormat('en-US', {
                          month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3
                        }).format(new Date(log.created_at))}</span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400">
                          {getActionIcon(log.action)}
                        </div>
                        <span className="text-zinc-200 font-medium truncate">{log.action}</span>
                      </div>

                      <div className="flex items-center">
                        <div className={`px-2.5 py-1 rounded-full border text-xs font-semibold flex items-center space-x-1.5 ${getRiskColor(log.bot_probability_score)}`}>
                          <ShieldAlert className="w-3 h-3" />
                          <span>{(log.bot_probability_score * 100).toFixed(1)}% Risk</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-zinc-300 font-mono text-xs px-2 py-1 bg-black/50 rounded border border-white/5">{log.ip_address}</span>
                      </div>

                      <div className="flex items-center text-zinc-400 truncate pr-4">
                        <span className="truncate text-xs">{log.user_agent}</span>
                      </div>

                      <div className="flex items-center justify-center">
                        <button 
                          onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                          className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${isExpanded ? 'bg-white/10 text-white' : 'text-zinc-500'}`}
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details Panel */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 300 }}
                          exit={{ opacity: 0, height: 0 }}
                          className="px-6 pb-6 overflow-hidden"
                        >
                          <div className="w-full h-full bg-black/60 border border-white/10 rounded-xl p-6 grid grid-cols-3 gap-6 overflow-hidden">
                            
                            {/* Column 1: Core Metrics */}
                            <div className="flex flex-col space-y-4">
                              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center space-x-2">
                                <Database className="w-3 h-3" />
                                <span>Event Payload</span>
                              </h4>
                              <div className="bg-black/50 border border-white/5 rounded-lg p-4 font-mono text-xs space-y-2 h-full overflow-y-auto">
                                <div className="grid grid-cols-[100px_1fr] gap-2">
                                  <span className="text-zinc-500">Event ID:</span>
                                  <span className="text-indigo-400">{log.id}</span>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] gap-2">
                                  <span className="text-zinc-500">Target User:</span>
                                  <span className="text-amber-400">{log.user_id || 'anonymous'}</span>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] gap-2">
                                  <span className="text-zinc-500">Resource:</span>
                                  <span className="text-emerald-400">{log.resource_id || 'system_wide'}</span>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] gap-2 mt-4 pt-4 border-t border-white/5">
                                  <span className="text-zinc-500">Location:</span>
                                  <span className="text-zinc-300">{log.location || 'Unknown Coordinates'}</span>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] gap-2">
                                  <span className="text-zinc-500">Status:</span>
                                  <span className="text-zinc-300">{log.status_code || 200} OK</span>
                                </div>
                              </div>
                            </div>

                            {/* Column 2: JSON Metadata Viewer */}
                            <div className="flex flex-col space-y-4 col-span-2">
                              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center space-x-2">
                                <Terminal className="w-3 h-3" />
                                <span>Raw Telemetry Data</span>
                              </h4>
                              <div className="bg-[#0d0d12] border border-white/5 rounded-lg p-4 font-mono text-xs overflow-y-auto h-full shadow-inner relative group">
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button className="p-1.5 bg-white/10 hover:bg-white/20 rounded border border-white/10 text-white transition-colors">
                                    Copy JSON
                                  </button>
                                </div>
                                <pre className="text-zinc-300 whitespace-pre-wrap">
                                  <span className="text-pink-500">{`{`}</span>{'\n'}
                                  {`  `}
                                  <span className="text-blue-400">"headers"</span>: <span className="text-pink-500">{`{`}</span>{'\n'}
                                  {`    `}
                                  <span className="text-blue-400">"user-agent"</span>: <span className="text-green-400">"{log.user_agent}"</span>,{'\n'}
                                  {`    `}
                                  <span className="text-blue-400">"x-forwarded-for"</span>: <span className="text-green-400">"{log.ip_address}"</span>{'\n'}
                                  {`  `}
                                  <span className="text-pink-500">{`}`}</span>,{'\n'}
                                  {`  `}
                                  <span className="text-blue-400">"security_context"</span>: <span className="text-pink-500">{`{`}</span>{'\n'}
                                  {`    `}
                                  <span className="text-blue-400">"ml_anomaly_score"</span>: <span className="text-orange-400">{log.bot_probability_score}</span>,{'\n'}
                                  {`    `}
                                  <span className="text-blue-400">"threat_intel_match"</span>: <span className="text-orange-400">false</span>,{'\n'}
                                  {`    `}
                                  <span className="text-blue-400">"rate_limit_hits"</span>: <span className="text-orange-400">0</span>{'\n'}
                                  {`  `}
                                  <span className="text-pink-500">{`}`}</span>{'\n'}
                                  {log.metadata && Object.entries(log.metadata).map(([k, v]) => (
                                    <React.Fragment key={k}>
                                      {`  `}, <span className="text-blue-400">"{k}"</span>: <span className="text-green-400">{JSON.stringify(v)}</span>{'\n'}
                                    </React.Fragment>
                                  ))}
                                  <span className="text-pink-500">{`}`}</span>
                                </pre>
                              </div>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer / Pagination */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/[0.02]">
        <div className="text-xs text-zinc-500 font-medium">
          Showing {visibleLogs.length > 0 ? visibleLogs[0].absoluteIndex + 1 : 0} to {visibleLogs.length > 0 ? visibleLogs[visibleLogs.length - 1].absoluteIndex + 1 : 0} of {filteredLogs.length} events
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex -space-x-1 mr-4">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center z-30 ring-2 ring-[#0a0a0c]">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center z-20 ring-2 ring-[#0a0a0c]">
              <Database className="w-3 h-3 text-indigo-500" />
            </div>
            <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center z-10 ring-2 ring-[#0a0a0c]">
              <Cpu className="w-3 h-3 text-amber-500" />
            </div>
          </div>
          <span className="text-xs text-zinc-400 mr-4 font-mono">System Nominal • Latency: 12ms</span>

          <button className="px-3 py-1.5 rounded-md border border-white/10 bg-black/40 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 text-xs font-medium">
            Previous
          </button>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, '...', 12].map((page, i) => (
              <button key={i} className={`w-8 h-8 flex items-center justify-center rounded-md text-xs font-medium transition-colors ${page === 1 ? 'bg-indigo-500 text-white' : 'text-zinc-400 hover:bg-white/10'}`}>
                {page}
              </button>
            ))}
          </div>
          <button className="px-3 py-1.5 rounded-md border border-white/10 bg-black/40 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 text-xs font-medium">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
