"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Server, Activity, Shield, Network, Cpu, HardDrive, 
  AlertTriangle, CheckCircle, Globe, CloudRain, Clock, 
  Zap, Database, Lock, Search, Play, Pause, RefreshCw, BarChart3, Wifi
} from "lucide-react";

interface NodeStatus {
  id: string;
  region: string;
  status: "healthy" | "degraded" | "offline";
  cpuUsage: number;
  memoryUsage: number;
  networkIn: number;
  networkOut: number;
  uptime: string;
  activeConnections: number;
  lastPing: string;
}

const generateMockNodes = (): NodeStatus[] => {
  const regions = ["us-east-1", "us-west-2", "eu-central-1", "ap-northeast-1", "sa-east-1", "ap-southeast-2"];
  return regions.map((region, i) => ({
    id: `node-${region}-${Math.floor(Math.random() * 1000)}`,
    region,
    status: Math.random() > 0.8 ? (Math.random() > 0.5 ? "degraded" : "offline") : "healthy",
    cpuUsage: Math.floor(Math.random() * 100),
    memoryUsage: Math.floor(Math.random() * 100),
    networkIn: Math.floor(Math.random() * 5000),
    networkOut: Math.floor(Math.random() * 8000),
    uptime: `${Math.floor(Math.random() * 60)}d ${Math.floor(Math.random() * 24)}h`,
    activeConnections: Math.floor(Math.random() * 20000),
    lastPing: new Date(Date.now() - Math.random() * 10000).toISOString(),
  }));
};

export const InfrastructureDashboard: React.FC = () => {
  const [nodes, setNodes] = useState<NodeStatus[]>([]);
  const [globalTraffic, setGlobalTraffic] = useState<{ time: string; value: number }[]>([]);
  const [systemScore, setSystemScore] = useState(98);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    setNodes(generateMockNodes());
    
    const initialTraffic = Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      value: Math.floor(Math.random() * 100000)
    }));
    setGlobalTraffic(initialTraffic);
  }, []);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setNodes(prev => prev.map(node => ({
        ...node,
        cpuUsage: Math.max(0, Math.min(100, node.cpuUsage + (Math.random() * 10 - 5))),
        memoryUsage: Math.max(0, Math.min(100, node.memoryUsage + (Math.random() * 6 - 3))),
        activeConnections: Math.max(0, node.activeConnections + Math.floor(Math.random() * 200 - 100)),
        lastPing: new Date().toISOString()
      })));

      setGlobalTraffic(prev => {
        const next = [...prev.slice(1)];
        const lastValue = prev[prev.length - 1].value;
        next.push({
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          value: Math.max(0, lastValue + Math.floor(Math.random() * 20000 - 10000))
        });
        return next;
      });

      setSystemScore(prev => Math.max(0, Math.min(100, prev + (Math.random() * 2 - 1))));
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive]);

  const getStatusColor = (status: NodeStatus["status"]) => {
    switch (status) {
      case "healthy": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "degraded": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "offline": return "text-red-500 bg-red-500/10 border-red-500/20";
    }
  };

  const getHealthMetricColor = (value: number) => {
    if (value > 90) return "text-red-400";
    if (value > 75) return "text-amber-400";
    return "text-emerald-400";
  };

  const totalConnections = nodes.reduce((acc, node) => acc + node.activeConnections, 0);
  const totalNetworkIn = nodes.reduce((acc, node) => acc + node.networkIn, 0);
  const totalNetworkOut = nodes.reduce((acc, node) => acc + node.networkOut, 0);
  const offlineNodes = nodes.filter(n => n.status === "offline").length;

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Header Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="col-span-1 md:col-span-4 bg-[#0a0a0c] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight flex items-center space-x-3">
                <Server className="w-8 h-8 text-indigo-400" />
                <span>Global Infrastructure Matrix</span>
              </h1>
              <p className="text-zinc-400 mt-2 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>System operational across {nodes.length} edge regions</span>
              </p>
            </div>
            
            <div className="mt-6 md:mt-0 flex items-center space-x-6">
              <div className="flex flex-col items-end">
                <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">System Health Score</span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`text-3xl font-mono font-bold ${getHealthMetricColor(100 - systemScore)}`}>
                    {systemScore.toFixed(1)}
                  </span>
                  <span className="text-zinc-500">/ 100</span>
                </div>
              </div>
              
              <div className="h-12 w-px bg-white/10" />
              
              <div className="flex space-x-3">
                <button 
                  onClick={() => setIsLive(!isLive)}
                  className={`p-3 rounded-xl border flex items-center justify-center transition-all ${
                    isLive 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                      : 'bg-black/50 border-white/10 text-zinc-400'
                  }`}
                >
                  {isLive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button 
                  onClick={() => setNodes(generateMockNodes())}
                  className="p-3 rounded-xl border border-white/10 bg-black/50 hover:bg-white/5 text-zinc-400 transition-colors"
                >
                  <RefreshCw className={`w-5 h-5 ${isLive ? 'animate-spin-slow' : ''}`} style={{ animationDuration: '3s' }} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 relative z-10 border-t border-white/10 pt-8">
            <div className="flex flex-col space-y-2">
              <span className="text-xs text-zinc-500 uppercase font-semibold flex items-center space-x-2">
                <Network className="w-4 h-4" />
                <span>Active Connections</span>
              </span>
              <span className="text-2xl text-white font-mono">{totalConnections.toLocaleString()}</span>
            </div>
            <div className="flex flex-col space-y-2">
              <span className="text-xs text-zinc-500 uppercase font-semibold flex items-center space-x-2">
                <Wifi className="w-4 h-4" />
                <span>Global Throughput</span>
              </span>
              <span className="text-2xl text-white font-mono">{(totalNetworkIn + totalNetworkOut).toLocaleString()} <span className="text-sm text-zinc-500">MB/s</span></span>
            </div>
            <div className="flex flex-col space-y-2">
              <span className="text-xs text-zinc-500 uppercase font-semibold flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Threat Interceptions</span>
              </span>
              <span className="text-2xl text-white font-mono">{(totalConnections * 0.012).toFixed(0)} <span className="text-sm text-emerald-500">/hr</span></span>
            </div>
            <div className="flex flex-col space-y-2">
              <span className="text-xs text-zinc-500 uppercase font-semibold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Offline Nodes</span>
              </span>
              <span className={`text-2xl font-mono ${offlineNodes > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {offlineNodes} <span className="text-sm text-zinc-500">/ {nodes.length}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Node Topology */}
        <div className="lg:col-span-2 bg-[#0a0a0c] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Globe className="w-5 h-5 text-indigo-400" />
              <span>Edge Node Topology</span>
            </h2>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-black/50 border border-white/5 rounded-md text-xs text-zinc-400 font-mono">
                Auto-scaling: ACTIVE
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar pr-2 space-y-4">
            {nodes.map(node => (
              <motion.div 
                key={node.id}
                layoutId={node.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 border border-white/5 rounded-xl p-5 hover:bg-white/[0.02] transition-colors group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg border ${getStatusColor(node.status)}`}>
                      {node.status === 'healthy' ? <CheckCircle className="w-5 h-5" /> : 
                       node.status === 'degraded' ? <AlertTriangle className="w-5 h-5" /> : 
                       <Activity className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-white font-medium text-sm flex items-center space-x-2">
                        <span>{node.id}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-zinc-300">
                          {node.region}
                        </span>
                      </h3>
                      <p className="text-xs text-zinc-500 font-mono mt-1">Uptime: {node.uptime} • Last Ping: {node.lastPing.split('T')[1].split('.')[0]}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-mono text-white">{node.activeConnections.toLocaleString()}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Conns</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-black/60 rounded-lg p-3 border border-white/5">
                  <div className="flex flex-col space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 flex items-center space-x-1"><Cpu className="w-3 h-3"/> <span>CPU</span></span>
                      <span className={`font-mono ${getHealthMetricColor(node.cpuUsage)}`}>{node.cpuUsage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${node.cpuUsage}%` }}
                        className={`h-full rounded-full ${node.cpuUsage > 90 ? 'bg-red-500' : node.cpuUsage > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 flex items-center space-x-1"><HardDrive className="w-3 h-3"/> <span>RAM</span></span>
                      <span className={`font-mono ${getHealthMetricColor(node.memoryUsage)}`}>{node.memoryUsage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${node.memoryUsage}%` }}
                        className={`h-full rounded-full ${node.memoryUsage > 90 ? 'bg-red-500' : node.memoryUsage > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col justify-center pl-2 border-l border-white/10">
                    <div className="text-[10px] text-zinc-500 uppercase mb-1">Net In</div>
                    <div className="text-xs text-indigo-400 font-mono flex items-center space-x-1">
                      <CloudRain className="w-3 h-3" />
                      <span>{node.networkIn.toLocaleString()} MB/s</span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center pl-2 border-l border-white/10">
                    <div className="text-[10px] text-zinc-500 uppercase mb-1">Net Out</div>
                    <div className="text-xs text-purple-400 font-mono flex items-center space-x-1">
                      <Zap className="w-3 h-3" />
                      <span>{node.networkOut.toLocaleString()} MB/s</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Column: Mini Charts & Security Logs */}
        <div className="flex flex-col space-y-6 h-[600px]">
          
          {/* Traffic Mini-Chart */}
          <div className="bg-[#0a0a0c] border border-white/10 rounded-2xl p-6 shadow-xl flex-shrink-0">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Global Request Volume</span>
            </h2>
            <div className="h-32 flex items-end space-x-1 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent pointer-events-none" />
              {globalTraffic.slice(-24).map((data, i) => {
                const max = Math.max(...globalTraffic.map(d => d.value));
                const height = max > 0 ? (data.value / max) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col justify-end group relative h-full">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="w-full bg-emerald-500/40 rounded-t-sm group-hover:bg-emerald-400 transition-colors relative z-10"
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-black border border-white/10 rounded px-2 py-1 text-[10px] font-mono whitespace-nowrap z-20 pointer-events-none transition-opacity">
                      {data.value.toLocaleString()} reqs<br/>{data.time}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Critical Security Incidents */}
          <div className="bg-[#0a0a0c] border border-white/10 rounded-2xl p-6 shadow-xl flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
                <Lock className="w-4 h-4 text-red-400" />
                <span>Security Fabric Alerts</span>
              </h2>
              <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 font-mono">
                {offlineNodes > 0 ? 'ELEVATED' : 'NOMINAL'}
              </span>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar space-y-3 pr-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-black/40 border border-white/5 rounded-lg p-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${i === 0 ? 'bg-red-500 animate-pulse' : i < 3 ? 'bg-amber-500' : 'bg-blue-500'}`} />
                      <div>
                        <p className="text-xs text-white font-medium">
                          {i === 0 ? 'DDoS Mitigation Activated' : i < 3 ? 'High Probability Bot Traffic' : 'Suspicious Login Attempt'}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          IP: 192.168.{Math.floor(Math.random() * 255)}.{Math.floor(Math.random() * 255)}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-600 font-mono">{i * 2 + 1}m ago</span>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-4 py-2 border border-white/10 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
              View Full Security Log
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
