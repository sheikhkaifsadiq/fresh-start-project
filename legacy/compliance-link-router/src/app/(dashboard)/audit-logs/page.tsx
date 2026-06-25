"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, Activity, Search, Command, Zap, Database, 
  Lock, Globe, Cpu, ServerCrash, Layers, Terminal, LineChart
} from "lucide-react";
import { AuditLogTable } from "@/components/audit/audit-log-table";
import { InfrastructureDashboard } from "@/components/audit/infrastructure-dashboard";
import { AuditStats } from "@/components/audit/audit-stats";
import { LogStreamVisualizer } from "@/components/audit/log-stream";

export default function AuditLogsPage() {
  const [activeTab, setActiveTab] = useState<"logs" | "infrastructure" | "analytics" | "stream">("logs");
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-200 relative overflow-hidden font-sans">
      {/* Background Ambient Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] bg-purple-500/5 rounded-full blur-[100px]" />
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* Main Content */}
      <main className="relative z-10 p-6 md:p-8 max-w-[1600px] mx-auto min-h-screen flex flex-col space-y-8">
        
        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10 relative">
          <div className="absolute bottom-[-1px] left-0 w-1/3 h-[1px] bg-gradient-to-r from-indigo-500/50 to-transparent" />
          
          <div className="flex items-start space-x-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.15)] relative group">
              <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <ShieldCheck className="w-7 h-7 text-indigo-400 relative z-10" />
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight flex items-center space-x-3">
                <span>Security & Audit Command Center</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>SYSTEM SECURE</span>
                </span>
              </h1>
              <p className="text-zinc-400 mt-1.5 max-w-2xl text-sm leading-relaxed">
                Immutable tracking of all system mutations, link resolutions, and administrative access. Backed by machine-learning anomaly detection and multi-region redundancy.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsTerminalOpen(!isTerminalOpen)}
              className="px-4 py-2 bg-black/40 hover:bg-white/5 border border-white/10 rounded-xl text-sm font-medium transition-all flex items-center space-x-2 text-zinc-300"
            >
              <Terminal className="w-4 h-4 text-zinc-400" />
              <span>CLI Access</span>
              <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-zinc-500 ml-2">⌘ + T</kbd>
            </button>
            <button className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Generate Compliance Report</span>
            </button>
          </div>
        </header>

        {/* Global Key Metrics Ribbon */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            title="Events Processed (24h)"
            value="14.2M"
            trend="+12.5%"
            trendUp={true}
            icon={<Database className="w-4 h-4" />}
            color="indigo"
          />
          <MetricCard 
            title="Threats Mitigated"
            value="2,845"
            trend="+4.1%"
            trendUp={true}
            icon={<Lock className="w-4 h-4" />}
            color="emerald"
          />
          <MetricCard 
            title="Global Latency Avg"
            value="18ms"
            trend="-2ms"
            trendUp={true}
            icon={<Globe className="w-4 h-4" />}
            color="blue"
          />
          <MetricCard 
            title="Anomaly Score Threshold"
            value="0.85"
            trend="Nominal"
            trendUp={true}
            icon={<Activity className="w-4 h-4" />}
            color="amber"
          />
        </div>

        <div className="flex items-center space-x-1 border-b border-white/10 pb-px overflow-x-auto custom-scrollbar">
          <TabButton 
            active={activeTab === "logs"} 
            onClick={() => setActiveTab("logs")}
            icon={<Layers className="w-4 h-4" />}
            label="Unified Audit Ledger"
          />
          <TabButton 
            active={activeTab === "stream"} 
            onClick={() => setActiveTab("stream")}
            icon={<Activity className="w-4 h-4" />}
            label="Live Firehose Stream"
          />
          <TabButton 
            active={activeTab === "infrastructure"} 
            onClick={() => setActiveTab("infrastructure")}
            icon={<Cpu className="w-4 h-4" />}
            label="Infrastructure Matrix"
          />
          <TabButton 
            active={activeTab === "analytics"} 
            onClick={() => setActiveTab("analytics")}
            icon={<LineChart className="w-4 h-4" />}
            label="Security Analytics"
          />
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            {activeTab === "logs" && (
              <motion.div
                key="logs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-[800px]"
              >
                <AuditLogTable />
              </motion.div>
            )}
            
            {activeTab === "infrastructure" && (
              <motion.div
                key="infra"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <InfrastructureDashboard />
              </motion.div>
            )}

            {activeTab === "stream" && (
              <motion.div
                key="stream"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <LogStreamVisualizer />
              </motion.div>
            )}

            {activeTab === "analytics" && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AuditStats />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>

      {/* Floating Action / Terminal Overlay */}
      <AnimatePresence>
        {isTerminalOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-[500px] h-[350px] bg-black/90 border border-white/10 rounded-xl shadow-2xl backdrop-blur-2xl z-50 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-mono text-zinc-300">aegis-cli v2.4.1</span>
              </div>
              <div className="flex space-x-1.5">
                <button onClick={() => setIsTerminalOpen(false)} className="w-3 h-3 rounded-full bg-zinc-600 hover:bg-red-500 transition-colors" />
                <button className="w-3 h-3 rounded-full bg-zinc-600 hover:bg-amber-500 transition-colors" />
                <button className="w-3 h-3 rounded-full bg-zinc-600 hover:bg-green-500 transition-colors" />
              </div>
            </div>
            <div className="flex-1 p-4 font-mono text-xs text-zinc-300 overflow-y-auto space-y-2">
              <p className="text-emerald-400">Connected to secure enclave. Authorized as root.</p>
              <p>Type 'help' to see available commands.</p>
              <div className="flex items-center mt-4">
                <span className="text-indigo-400 mr-2">root@aegis-core:~#</span>
                <input 
                  type="text" 
                  className="bg-transparent border-none outline-none flex-1 text-white placeholder-zinc-700" 
                  placeholder="tail -f /var/log/audit.log"
                  autoFocus
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Subcomponents

interface MetricCardProps {
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: React.ReactNode;
  color: "indigo" | "emerald" | "amber" | "blue";
}

function MetricCard({ title, value, trend, trendUp, icon, color }: MetricCardProps) {
  const colorMap = {
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  };

  return (
    <div className="p-5 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-sm flex flex-col relative overflow-hidden group hover:border-white/10 transition-colors">
      <div className={`absolute top-0 right-0 w-24 h-24 ${colorMap[color].split(' ')[1]} rounded-bl-full opacity-50 translate-x-1/2 -translate-y-1/2 transition-transform group-hover:scale-110`} />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`p-2 rounded-xl border ${colorMap[color]}`}>
          {icon}
        </div>
        <div className={`text-xs font-medium px-2 py-1 rounded-full border ${trendUp ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
          {trend}
        </div>
      </div>
      
      <div className="relative z-10">
        <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
        <p className="text-sm text-zinc-500 mt-1 font-medium">{title}</p>
      </div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 text-sm font-medium flex items-center space-x-2 border-b-2 transition-all ${
        active 
          ? "border-indigo-500 text-white bg-indigo-500/5" 
          : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5 hover:border-white/10"
      }`}
    >
      <span className={active ? "text-indigo-400" : "text-zinc-500"}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
