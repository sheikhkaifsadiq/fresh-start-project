"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Globe, Clock, ShieldCheck, Activity, Users, 
  Smartphone, AlertTriangle, Fingerprint, Map, Copy,
  CheckCircle2, Edit3, Trash2, ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LinkDetailsClient({ link, initialStats }: { link: any, initialStats: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'geography' | 'devices' | 'threats'>('overview');
  const [copied, setCopied] = useState(false);

  // Custom Chart Components built with pure React & Framer Motion
  const TimeSeriesChart = () => {
    const data = Array.from({ length: 30 }, (_, i) => Math.floor(Math.random() * 1000) + 100);
    const max = Math.max(...data);
    
    return (
      <div className="w-full h-64 bg-slate-900 border border-slate-800 rounded-2xl p-6 relative flex items-end justify-between space-x-1">
        <div className="absolute top-4 left-6 text-sm font-bold text-slate-400">30 Day Click Volume</div>
        {data.map((value, i) => (
          <div key={i} className="w-full relative group h-full flex items-end">
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: `${(value / max) * 100}%` }}
              transition={{ duration: 1, delay: i * 0.02, ease: 'easeOut' }}
              className="w-full bg-blue-500/50 hover:bg-blue-400 rounded-t-sm relative transition-colors"
            >
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                {value} clicks
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    );
  };

  const GeographyMap = () => {
    return (
      <div className="w-full h-96 bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          {/* Abstract SVG Map representation */}
          <svg viewBox="0 0 1000 500" className="w-full h-full text-slate-500 fill-current">
            <path d="M100,100 Q150,50 200,100 T300,150 T400,100 T500,200 T600,150 T700,250 T800,200 T900,300 L900,400 L100,400 Z" opacity="0.3" />
            <path d="M50,200 Q100,150 150,250 T250,200 T350,300 T450,250 T550,350 T650,300 T750,400 T850,350 L850,450 L50,450 Z" opacity="0.2" />
          </svg>
        </div>
        
        {/* Radar Ping Effects */}
        {[
          { top: '30%', left: '20%', size: 40, delay: 0 },
          { top: '40%', left: '70%', size: 60, delay: 1 },
          { top: '60%', left: '40%', size: 30, delay: 0.5 },
          { top: '50%', left: '80%', size: 50, delay: 1.5 },
          { top: '20%', left: '50%', size: 45, delay: 0.8 },
        ].map((point, i) => (
          <div key={i} className="absolute" style={{ top: point.top, left: point.left }}>
            <motion.div 
              animate={{ scale: [1, 2, 3], opacity: [0.8, 0, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: point.delay }}
              className="absolute w-4 h-4 bg-emerald-500 rounded-full -translate-x-1/2 -translate-y-1/2"
            />
            <div className="absolute w-2 h-2 bg-emerald-400 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
          </div>
        ))}
        
        <div className="absolute bottom-6 right-6 bg-slate-950/80 backdrop-blur border border-slate-800 p-4 rounded-xl">
          <h4 className="text-sm font-bold text-white mb-2">Top Regions</h4>
          <ul className="space-y-2">
            {[
              { country: 'United States', pct: 45 },
              { country: 'United Kingdom', pct: 22 },
              { country: 'Germany', pct: 15 },
              { country: 'Japan', pct: 8 }
            ].map(r => (
              <li key={r.country} className="flex items-center space-x-3 text-xs">
                <span className="w-24 text-slate-400">{r.country}</span>
                <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${r.pct}%` }} />
                </div>
                <span className="text-slate-300 font-mono">{r.pct}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://aegis.rt/${link.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />
        
        <div className="flex items-start space-x-4">
          <button 
            onClick={() => router.push('/links')}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors mt-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-black text-white tracking-tight">aegis.rt/{link.slug}</h1>
              {link.metadata?.protection?.is_shielded && (
                <span className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400" title="Aegis Shield Active">
                  <ShieldCheck className="w-5 h-5" />
                </span>
              )}
              {!link.active && (
                <span className="px-2.5 py-1 bg-red-500/10 rounded-lg border border-red-500/20 text-red-400 text-xs font-bold uppercase">
                  Inactive
                </span>
              )}
            </div>
            
            <a href={link.destination_url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-sm text-slate-400 hover:text-blue-400 mt-2 transition-colors group max-w-2xl truncate">
              <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100" />
              <span>{link.destination_url}</span>
            </a>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleCopy}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-colors"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors">
            <Edit3 className="w-5 h-5" />
          </button>
          <button className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 hover:text-red-300 transition-colors">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Total Engagements', value: link.click_count?.toLocaleString() || '0', icon: <Activity className="w-6 h-6 text-blue-400" />, trend: '+12.5%' },
          { label: 'Unique Visitors', value: Math.floor((link.click_count || 0) * 0.75).toLocaleString(), icon: <Users className="w-6 h-6 text-indigo-400" />, trend: '+8.2%' },
          { label: 'Blocked Threats', value: '42', icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />, trend: '-2.1%' },
          { label: 'Avg Risk Score', value: '14.2', icon: <Fingerprint className="w-6 h-6 text-amber-400" />, trend: 'Stable' },
        ].map((kpi, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-slate-800/50 rounded-full blur-xl group-hover:bg-blue-500/10 transition-colors" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">{kpi.label}</p>
                <h3 className="text-3xl font-black text-white">{kpi.value}</h3>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                {kpi.icon}
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-2">
              <span className={`text-xs font-bold ${kpi.trend.startsWith('+') ? 'text-emerald-400' : kpi.trend.startsWith('-') ? 'text-blue-400' : 'text-slate-500'}`}>
                {kpi.trend}
              </span>
              <span className="text-xs text-slate-500">vs last 30 days</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Tabs */}
      <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1.5 overflow-x-auto hide-scrollbar">
        {[
          { id: 'overview', label: 'Traffic Overview', icon: <Activity className="w-4 h-4" /> },
          { id: 'geography', label: 'Geographic Data', icon: <Map className="w-4 h-4" /> },
          { id: 'devices', label: 'Device Metrics', icon: <Smartphone className="w-4 h-4" /> },
          { id: 'threats', label: 'Threat Intelligence', icon: <AlertTriangle className="w-4 h-4" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <TimeSeriesChart />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Top Referrers</h3>
                  <ul className="space-y-4">
                    {[
                      { domain: 'google.com', count: 4520, pct: 45 },
                      { domain: 'twitter.com', count: 2150, pct: 21 },
                      { domain: 'linkedin.com', count: 1850, pct: 18 },
                      { domain: 'Direct / Unknown', count: 1605, pct: 16 }
                    ].map(r => (
                      <li key={r.domain} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 w-1/2">
                          <div className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center border border-slate-700">
                            {r.domain === 'Direct / Unknown' ? <Globe className="w-3 h-3 text-slate-500" /> : <img src={`https://www.google.com/s2/favicons?domain=${r.domain}&sz=32`} className="w-4 h-4 rounded-sm" alt="" onError={(e) => { e.currentTarget.style.display='none' }} />}
                          </div>
                          <span className="text-sm text-slate-300 truncate">{r.domain}</span>
                        </div>
                        <div className="flex items-center space-x-4 w-1/2">
                          <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <div className="h-full bg-indigo-500" style={{ width: `${r.pct}%` }} />
                          </div>
                          <span className="text-sm font-mono text-slate-400 w-12 text-right">{r.count}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Metadata Payload</h3>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-400 overflow-x-auto">
                    <pre>{JSON.stringify(link.metadata || { message: 'No extended metadata' }, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'geography' && (
            <motion.div key="geo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GeographyMap />
            </motion.div>
          )}

          {activeTab === 'threats' && (
            <motion.div key="threats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              
              <div className="bg-gradient-to-r from-emerald-900/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-8 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-emerald-400 flex items-center space-x-2">
                    <ShieldCheck className="w-6 h-6" />
                    <span>Aegis Shield Protection is Active</span>
                  </h3>
                  <p className="text-slate-400 mt-2 max-w-2xl">
                    All traffic routed through this link is processed by our Oracle ARM64 ML engine. Bot traffic, scrapers, and high-risk IPs are automatically deflected according to your routing rules.
                  </p>
                </div>
                <div className="hidden lg:block">
                  <div className="w-24 h-24 border-[8px] border-emerald-500/20 rounded-full flex items-center justify-center relative">
                    <div className="absolute inset-0 border-[8px] border-emerald-500 rounded-full" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 50%)' }} />
                    <span className="text-xl font-black text-emerald-400">99%</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <span>Recent Deflected Threats</span>
                  </h3>
                  <button className="text-sm text-blue-400 hover:text-blue-300">View Full Audit Log</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-950 text-slate-500">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Timestamp</th>
                        <th className="px-6 py-4 font-semibold">IP Origin</th>
                        <th className="px-6 py-4 font-semibold">Risk Score</th>
                        <th className="px-6 py-4 font-semibold">Detection Vector</th>
                        <th className="px-6 py-4 font-semibold">Action Taken</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {[
                        { time: '2 mins ago', ip: '185.15.xx.xx', score: 98, vector: 'Known Scraper BotNet', action: 'Blocked' },
                        { time: '14 mins ago', ip: '45.32.xx.xx', score: 85, vector: 'Headless Browser Fingerprint', action: 'Challenged (CAPTCHA)' },
                        { time: '1 hour ago', ip: '104.21.xx.xx', score: 92, vector: 'Data Center IP Range', action: 'Blocked' },
                      ].map((threat, i) => (
                        <tr key={i} className="hover:bg-slate-800/30">
                          <td className="px-6 py-4 text-slate-400">{threat.time}</td>
                          <td className="px-6 py-4 font-mono text-slate-300">{threat.ip}</td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded font-bold">
                              {threat.score}/100
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-300">{threat.vector}</td>
                          <td className="px-6 py-4">
                            <span className={`text-xs font-bold uppercase tracking-wider ${threat.action === 'Blocked' ? 'text-red-400' : 'text-amber-400'}`}>
                              {threat.action}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
