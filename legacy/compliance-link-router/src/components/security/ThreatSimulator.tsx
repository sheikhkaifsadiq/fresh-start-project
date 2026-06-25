"use client";

import React, { useState } from "react";
import { ShieldAlert, Crosshair, Play, Activity, Server, Zap, Globe, AlertTriangle } from "lucide-react";

export default function ThreatSimulator() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedAttack, setSelectedAttack] = useState("sql");

  const runSimulation = () => {
    setIsRunning(true);
    setLogs([]);
    let step = 0;
    
    const steps = [
      `[INIT] Provisioning virtual attacker node in region EU-WEST...`,
      `[DNS] Resolving target edge endpoints for Aegis Route...`,
      `[ATTACK] Launching ${selectedAttack.toUpperCase()} payload injection...`,
      `[WAF] Request intercepted by Edge Node #402.`,
      `[ML] Executing fast-path bot probability inference... Score: 0.94`,
      `[BLOCK] Payload matched signature OR ML score threshold exceeded.`,
      `[RESULT] Threat Neutralized. Connection dropped (403 Forbidden).`
    ];

    const interval = setInterval(() => {
      if (step < steps.length) {
        setLogs(prev => [...prev, steps[step]]);
        step++;
      } else {
        clearInterval(interval);
        setIsRunning(false);
      }
    }, 800);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Crosshair className="w-6 h-6 text-rose-500" />
            Threat Simulator
          </h2>
          <p className="text-sm text-slate-400 mt-1">Test your WAF and ML defenses with simulated attack vectors safely.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Controls */}
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-400">Select Attack Vector</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: "sql", name: "SQL Injection", desc: "Classic UNION SELECT payload" },
                { id: "xss", name: "Cross-Site Scripting", desc: "Obfuscated <script> tag" },
                { id: "bot", name: "Headless Scraper", desc: "Puppeteer stealth bypass" },
                { id: "ddos", name: "L7 Flood", desc: "Volumetric request spam" }
              ].map(attack => (
                <label key={attack.id} className={`p-4 border rounded-xl cursor-pointer transition-all ${
                  selectedAttack === attack.id 
                    ? "bg-rose-500/10 border-rose-500/50 text-rose-300 shadow-inner" 
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600"
                }`}>
                  <input type="radio" name="attack" className="sr-only" checked={selectedAttack === attack.id} onChange={() => setSelectedAttack(attack.id)} />
                  <div className="font-bold text-sm text-white mb-1">{attack.name}</div>
                  <div className="text-xs">{attack.desc}</div>
                </label>
              ))}
            </div>
          </div>

          <button 
            onClick={runSimulation}
            disabled={isRunning}
            className="w-full py-4 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-lg shadow-rose-500/20 flex justify-center items-center gap-2"
          >
            {isRunning ? <Activity className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
            {isRunning ? "SIMULATING ATTACK..." : "FIRE PAYLOAD"}
          </button>
        </div>

        {/* Console Output */}
        <div className="bg-[#0d1117] border border-slate-800 rounded-2xl p-4 font-mono text-sm relative overflow-hidden flex flex-col h-64 md:h-auto">
          <div className="text-slate-500 mb-2 border-b border-slate-800 pb-2 flex items-center justify-between">
            <span>Terminal: Aegis Simulator</span>
            {isRunning && <span className="text-rose-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3 animate-pulse" /> Live</span>}
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
            {logs.length === 0 && !isRunning && (
              <div className="text-slate-600 italic mt-4 text-center">Ready to simulate. Select an attack and fire.</div>
            )}
            {logs.map((log, i) => (
              <div key={i} className={`${
                log.includes("BLOCK") ? "text-emerald-400 font-bold" :
                log.includes("ATTACK") ? "text-rose-400" :
                "text-slate-300"
              }`}>
                {log}
              </div>
            ))}
            {isRunning && <div className="text-slate-500 animate-pulse">_</div>}
          </div>
        </div>

      </div>
    </div>
  );
}
