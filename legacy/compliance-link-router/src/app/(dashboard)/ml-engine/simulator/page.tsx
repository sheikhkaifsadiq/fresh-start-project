'use client';


import { useState, useEffect } from 'react';
import { TrafficFeatures } from '@/lib/ml/types';
import { DEFAULT_WEIGHTS, featuresToVector, forwardPass } from '@/lib/ml/neural-network';
import { ShieldAlert, ShieldCheck, Activity, Cpu, Globe, Server } from 'lucide-react';

export default function MLSulatorPage() {
  const [features, setFeatures] = useState<TrafficFeatures>({
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    requestRatePerMin: 10,
    headerCount: 15,
    hasSecFetchHeaders: true,
    acceptLangPresent: true,
    uaEntropy: 6.5,
    headerOrderScore: 0.9,
    connectionTimeMs: 150,
    refererPresent: true,
    asnType: 'isp',
    velocityScore: 1,
    geoMismatch: false,
    headlessBrowser: false,
  });

  const [score, setScore] = useState(0);

  useEffect(() => {
    const vector = featuresToVector(features);
    const result = forwardPass(vector, DEFAULT_WEIGHTS);
    setScore(result);
  }, [features]);

  const isBot = score > 0.85;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Live Traffic Simulator</h1>
        <p className="text-gray-400">
          Tweak the 14 microscopic data points below and watch the Edge Neural Network score the traffic in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SCORE DISPLAY */}
        <div className="lg:col-span-1 space-y-6">
          <div className={`p-8 rounded-2xl border backdrop-blur-xl transition-all duration-500 ${
            isBot ? 'bg-red-950/20 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]' 
                  : 'bg-emerald-950/20 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
          }`}>
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              {isBot ? (
                <ShieldAlert className="w-20 h-20 text-red-500 animate-pulse" />
              ) : (
                <ShieldCheck className="w-20 h-20 text-emerald-500" />
              )}
              
              <div>
                <div className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-1">Bot Probability</div>
                <div className={`text-6xl font-black tabular-nums tracking-tighter ${
                  isBot ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  {(score * 100).toFixed(1)}%
                </div>
              </div>

              <div className={`px-4 py-1 rounded-full text-sm font-bold tracking-wider uppercase border ${
                isBot ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                {isBot ? 'BLOCKED' : 'ALLOWED'}
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              Vector Analysis
            </h3>
            <div className="flex flex-wrap gap-2">
              {featuresToVector(features).map((v, i) => (
                <div key={i} className="text-xs font-mono bg-black/40 px-2 py-1 rounded text-gray-400 border border-white/5">
                  [{i}]: {v.toFixed(2)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Behavioral Metrics
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm text-gray-400">Request Rate (per min)</label>
                  <span className="text-sm font-mono text-blue-400">{features.requestRatePerMin}</span>
                </div>
                <input 
                  type="range" min="1" max="500" value={features.requestRatePerMin}
                  onChange={(e) => setFeatures({...features, requestRatePerMin: parseInt(e.target.value)})}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm text-gray-400">Velocity Score</label>
                  <span className="text-sm font-mono text-blue-400">{features.velocityScore}</span>
                </div>
                <input 
                  type="range" min="0" max="20" value={features.velocityScore}
                  onChange={(e) => setFeatures({...features, velocityScore: parseInt(e.target.value)})}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm text-gray-400">Connection Time (ms)</label>
                  <span className="text-sm font-mono text-blue-400">{features.connectionTimeMs}ms</span>
                </div>
                <input 
                  type="range" min="5" max="3000" value={features.connectionTimeMs}
                  onChange={(e) => setFeatures({...features, connectionTimeMs: parseInt(e.target.value)})}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-purple-400" />
              Protocol Signatures
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Has Sec-Fetch Headers</span>
                <input 
                  type="checkbox" checked={features.hasSecFetchHeaders}
                  onChange={(e) => setFeatures({...features, hasSecFetchHeaders: e.target.checked})}
                  className="w-5 h-5 accent-purple-500 rounded bg-black/50 border-white/20"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Has Accept-Language</span>
                <input 
                  type="checkbox" checked={features.acceptLangPresent}
                  onChange={(e) => setFeatures({...features, acceptLangPresent: e.target.checked})}
                  className="w-5 h-5 accent-purple-500 rounded bg-black/50 border-white/20"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Headless Browser Mode</span>
                <input 
                  type="checkbox" checked={features.headlessBrowser}
                  onChange={(e) => setFeatures({...features, headlessBrowser: e.target.checked})}
                  className="w-5 h-5 accent-red-500 rounded bg-black/50 border-white/20"
                />
              </label>

              <div className="pt-2">
                <label className="text-sm text-gray-400 mb-1 block">ASN Type</label>
                <select 
                  value={features.asnType}
                  onChange={(e) => setFeatures({...features, asnType: e.target.value as any})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-sm outline-none focus:border-purple-500"
                >
                  <option value="isp">Residential ISP (Human)</option>
                  <option value="business">Business/Enterprise</option>
                  <option value="hosting">Datacenter / Hosting (Bot)</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-6 md:col-span-2">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-pink-400" />
              Advanced Fingerprinting
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">User Agent Simulation</label>
                <input 
                  type="text" 
                  value={features.userAgent}
                  onChange={(e) => setFeatures({...features, userAgent: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-sm outline-none focus:border-pink-500 font-mono"
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setFeatures({...features, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0'})} className="text-[10px] uppercase tracking-wider bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-gray-400 transition-colors">Chrome</button>
                  <button onClick={() => setFeatures({...features, userAgent: 'python-requests/2.31.0'})} className="text-[10px] uppercase tracking-wider bg-white/5 hover:bg-red-500/20 px-2 py-1 rounded text-red-400 transition-colors">Python</button>
                  <button onClick={() => setFeatures({...features, userAgent: ''})} className="text-[10px] uppercase tracking-wider bg-white/5 hover:bg-red-500/20 px-2 py-1 rounded text-red-400 transition-colors">Empty</button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Geo/Timezone Mismatch</span>
                  <input 
                    type="checkbox" checked={features.geoMismatch}
                    onChange={(e) => setFeatures({...features, geoMismatch: e.target.checked})}
                    className="w-5 h-5 accent-pink-500 rounded bg-black/50 border-white/20"
                  />
                </label>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm text-gray-400">Header Count</label>
                    <span className="text-sm font-mono text-pink-400">{features.headerCount}</span>
                  </div>
                  <input 
                    type="range" min="0" max="30" value={features.headerCount}
                    onChange={(e) => setFeatures({...features, headerCount: parseInt(e.target.value)})}
                    className="w-full accent-pink-500"
                  />
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
