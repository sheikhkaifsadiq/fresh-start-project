"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, LineChart, PieChart, Activity, Shield, Globe, 
  MapPin, TrendingUp, AlertOctagon, Lock, Unlock, Database,
  Search, Maximize2, RefreshCw, Calendar, Download, Share2
} from 'lucide-react';

// --- Types ---
interface StatMetric {
  id: string;
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  history: number[];
}

interface RegionData {
  code: string;
  name: string;
  requests: number;
  threats: number;
  latency: number;
  coordinates: [number, number];
}

// --- Mock Data Generators ---
const generateMetrics = (): StatMetric[] => [
  { id: 'm1', label: 'Total Events Analyzed', value: 2459201, change: 12.5, trend: 'up', history: Array.from({length: 24}, () => Math.random() * 100) },
  { id: 'm2', label: 'Blocked Threats', value: 8432, change: -4.2, trend: 'down', history: Array.from({length: 24}, () => Math.random() * 20) },
  { id: 'm3', label: 'Avg Anomaly Score', value: 0.12, change: 0.01, trend: 'up', history: Array.from({length: 24}, () => Math.random() * 0.3) },
  { id: 'm4', label: 'Global Latency (ms)', value: 18.4, change: -1.2, trend: 'down', history: Array.from({length: 24}, () => 15 + Math.random() * 10) },
];

const generateRegions = (): RegionData[] => [
  { code: 'NA', name: 'North America', requests: 1204000, threats: 4200, latency: 12, coordinates: [25, 25] },
  { code: 'EU', name: 'Europe', requests: 840000, threats: 2100, latency: 18, coordinates: [45, 50] },
  { code: 'AS', name: 'Asia Pacific', requests: 950000, threats: 3800, latency: 24, coordinates: [65, 75] },
  { code: 'SA', name: 'South America', requests: 120000, threats: 400, latency: 35, coordinates: [70, 30] },
  { code: 'AF', name: 'Africa', requests: 80000, threats: 200, latency: 45, coordinates: [60, 50] },
  { code: 'OC', name: 'Oceania', requests: 150000, threats: 300, latency: 22, coordinates: [80, 85] },
];

export const AuditStats: React.FC = () => {
  const [metrics, setMetrics] = useState<StatMetric[]>([]);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('24h');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // Simulate network request
    const timer = setTimeout(() => {
      setMetrics(generateMetrics());
      setRegions(generateRegions());
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [timeRange]);

  // --- Components ---

  const Sparkline = ({ data, color }: { data: number[], color: string }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((val - min) / range) * 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <polygon 
          points={`0,100 ${points} 100,100`} 
          fill={`url(#gradient-${color})`} 
        />
        <polyline 
          points={points} 
          fill="none" 
          stroke={color} 
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const WorldMapMock = ({ regions }: { regions: RegionData[] }) => {
    return (
      <div className="relative w-full aspect-[2/1] bg-black/40 border border-white/5 rounded-xl overflow-hidden group">
        {/* Fake grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4%_8%]" />
        
        {/* Fake continents (just blobs) */}
        <div className="absolute top-[10%] left-[10%] w-[35%] h-[40%] bg-white/[0.02] rounded-[40%_60%_70%_30%] blur-xl" />
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[45%] bg-white/[0.02] rounded-[50%_50%_30%_70%] blur-xl" />
        <div className="absolute bottom-[20%] left-[25%] w-[15%] h-[30%] bg-white/[0.02] rounded-[40%_60%_70%_30%] blur-xl" />
        <div className="absolute bottom-[30%] right-[30%] w-[20%] h-[40%] bg-white/[0.02] rounded-[50%_50%_30%_70%] blur-xl" />

        {/* Region Nodes */}
        {regions.map((r, i) => (
          <div 
            key={r.code}
            className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{ top: `${r.coordinates[0]}%`, left: `${r.coordinates[1]}%` }}
          >
            {/* Ping animation */}
            <div className="absolute w-12 h-12 rounded-full border border-indigo-500/30 animate-ping" style={{ animationDelay: `${i * 0.5}s` }} />
            
            {/* Core dot */}
            <div className={`w-3 h-3 rounded-full relative z-10 ${r.threats > 3000 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]'}`} />
            
            {/* Tooltip (Hover) */}
            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 border border-white/10 p-2 rounded shadow-xl whitespace-nowrap z-20 pointer-events-none">
              <div className="text-xs font-bold text-white mb-1">{r.name}</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-mono">
                <span className="text-zinc-500">Reqs:</span>
                <span className="text-white text-right">{(r.requests / 1000).toFixed(1)}k</span>
                <span className="text-zinc-500">Threats:</span>
                <span className="text-red-400 text-right">{r.threats}</span>
                <span className="text-zinc-500">Latency:</span>
                <span className="text-emerald-400 text-right">{r.latency}ms</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const ActivityHeatmap = () => {
    const days = 7;
    const hours = 24;
    return (
      <div className="w-full bg-black/40 border border-white/5 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Event Density Matrix</span>
          </h3>
          <div className="flex items-center space-x-2 text-[10px] text-zinc-500 font-mono">
            <span>LESS</span>
            <div className="flex space-x-1">
              <div className="w-3 h-3 rounded-sm bg-indigo-500/10" />
              <div className="w-3 h-3 rounded-sm bg-indigo-500/30" />
              <div className="w-3 h-3 rounded-sm bg-indigo-500/50" />
              <div className="w-3 h-3 rounded-sm bg-indigo-500/70" />
              <div className="w-3 h-3 rounded-sm bg-indigo-500" />
            </div>
            <span>MORE</span>
          </div>
        </div>
        
        <div className="flex">
          {/* Y-axis labels */}
          <div className="flex flex-col justify-between pr-4 text-[10px] text-zinc-500 font-mono py-1">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
            <span>Sun</span>
          </div>
          
          {/* Heatmap Grid */}
          <div className="flex-1 grid grid-cols-24 gap-1 relative">
             <div className="absolute top-[-20px] left-0 right-0 flex justify-between text-[10px] text-zinc-500 font-mono">
               <span>00:00</span>
               <span>12:00</span>
               <span>23:59</span>
             </div>
            {Array.from({ length: days * hours }).map((_, i) => {
              const val = Math.random();
              const intensity = val > 0.9 ? 'bg-indigo-500' : val > 0.7 ? 'bg-indigo-500/70' : val > 0.4 ? 'bg-indigo-500/50' : val > 0.2 ? 'bg-indigo-500/30' : 'bg-indigo-500/10';
              return (
                <div 
                  key={i} 
                  className={`aspect-square rounded-sm ${intensity} hover:ring-2 ring-white/50 cursor-crosshair transition-all`}
                  title={`Activity Level: ${(val * 100).toFixed(0)}%`}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col space-y-6">
      
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-black/40 p-4 rounded-xl border border-white/5">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-zinc-400" />
          <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
            {(['24h', '7d', '30d', '90d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  timeRange === range 
                    ? 'bg-indigo-500 text-white shadow-lg' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-zinc-300 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <button className="flex items-center space-x-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-zinc-300 transition-colors">
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
          <button className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 border border-indigo-400/50 rounded-lg text-xs font-medium text-white transition-colors">
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Dashboard</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(metric => (
          <div key={metric.id} className="bg-black/40 border border-white/5 rounded-xl p-5 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{metric.label}</p>
                <div className="flex items-end space-x-2 mt-1">
                  <h4 className="text-2xl font-bold text-white">
                    {metric.id === 'm3' ? metric.value.toFixed(2) : metric.value.toLocaleString()}
                  </h4>
                  <span className={`text-xs font-mono mb-1 ${metric.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {metric.trend === 'up' ? '+' : ''}{metric.change}%
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                {metric.id === 'm1' && <Database className="w-4 h-4 text-indigo-400" />}
                {metric.id === 'm2' && <Shield className="w-4 h-4 text-red-400" />}
                {metric.id === 'm3' && <Activity className="w-4 h-4 text-amber-400" />}
                {metric.id === 'm4' && <Globe className="w-4 h-4 text-emerald-400" />}
              </div>
            </div>
            
            <div className="h-12 w-full mt-4 opacity-50 group-hover:opacity-100 transition-opacity">
              <Sparkline 
                data={metric.history} 
                color={metric.id === 'm2' ? '#ef4444' : metric.id === 'm4' ? '#10b981' : '#6366f1'} 
              />
            </div>
          </div>
        ))}
      </div>

      {/* Complex Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Geographic & Heatmap */}
        <div className="lg:col-span-2 flex flex-col space-y-6">
          
          {/* Geo Map */}
          <div className="bg-[#0a0a0c] border border-white/10 rounded-2xl p-6 shadow-xl">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-base font-semibold text-white flex items-center space-x-2">
                 <Globe className="w-5 h-5 text-indigo-400" />
                 <span>Global Threat Topography</span>
               </h3>
               <button className="p-1.5 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-zinc-400 transition-colors">
                 <Maximize2 className="w-4 h-4" />
               </button>
             </div>
             
             <WorldMapMock regions={regions} />
             
             <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/5">
                <div className="text-center">
                  <div className="text-[10px] text-zinc-500 uppercase">Primary Target Region</div>
                  <div className="text-sm text-white font-medium mt-1">North America</div>
                </div>
                <div className="text-center border-l border-white/5">
                  <div className="text-[10px] text-zinc-500 uppercase">Highest Threat Vector</div>
                  <div className="text-sm text-red-400 font-medium mt-1">Asia Pacific</div>
                </div>
                <div className="text-center border-l border-white/5">
                  <div className="text-[10px] text-zinc-500 uppercase">Optimal Latency</div>
                  <div className="text-sm text-emerald-400 font-medium mt-1">NA East</div>
                </div>
             </div>
          </div>

          {/* Heatmap */}
          <ActivityHeatmap />
          
        </div>

        {/* Right Column: Breakdown Lists */}
        <div className="flex flex-col space-y-6">
          
          {/* Action Distribution (Donut Chart alternative using progress bars) */}
          <div className="bg-[#0a0a0c] border border-white/10 rounded-2xl p-6 shadow-xl flex-1">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2 mb-6">
              <PieChart className="w-4 h-4 text-purple-400" />
              <span>Event Classification</span>
            </h3>

            <div className="space-y-5">
              {[
                { label: 'Link Resolution', val: 65, color: 'bg-indigo-500' },
                { label: 'API Access', val: 20, color: 'bg-purple-500' },
                { label: 'Dashboard Login', val: 10, color: 'bg-emerald-500' },
                { label: 'System Admin', val: 3, color: 'bg-amber-500' },
                { label: 'Threat Mitigation', val: 2, color: 'bg-red-500' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-zinc-300">{item.label}</span>
                    <span className="text-zinc-500 font-mono">{item.val}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.val}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${item.color}`} 
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5">
              <h4 className="text-[10px] text-zinc-500 uppercase font-semibold mb-4">Top Suspicious IPs</h4>
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-red-500/5 border border-red-500/10">
                    <div className="flex items-center space-x-2">
                      <AlertOctagon className="w-3 h-3 text-red-400" />
                      <span className="text-xs text-zinc-300 font-mono">192.168.{i * 45}.{i * 12}</span>
                    </div>
                    <span className="text-[10px] text-red-400 font-bold bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                      BLOCK
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
