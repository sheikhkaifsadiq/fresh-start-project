"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  BarChart, 
  Settings, 
  Activity, 
  Play, 
  StopCircle, 
  Save, 
  History, 
  TrendingDown, 
  Zap, 
  Database,
  Terminal,
  Cpu,
  Layers
} from "lucide-react";

export default function ModelTrainingDashboard() {
  const [isTraining, setIsTraining] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [loss, setLoss] = useState(0.45);
  const [accuracy, setAccuracy] = useState(0.82);

  // Fake chart points for the SVG graph
  const [history, setHistory] = useState<{e: number, l: number, a: number}[]>([{e: 0, l: 0.45, a: 0.82}]);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTraining) {
      interval = setInterval(() => {
        setEpoch(prev => {
          const next = prev + 1;
          const newLoss = Math.max(0.01, loss - Math.random() * 0.05);
          const newAcc = Math.min(0.999, accuracy + Math.random() * 0.02);
          setLoss(newLoss);
          setAccuracy(newAcc);
          setHistory(h => [...h, { e: next, l: newLoss, a: newAcc }].slice(-50)); // keep last 50
          return next;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isTraining, loss, accuracy]);

  const toggleTraining = () => {
    if (!isTraining && epoch > 0 && epoch < 100) {
      // Resume
      setIsTraining(true);
    } else if (!isTraining) {
      // Restart
      setEpoch(0);
      setLoss(0.45);
      setAccuracy(0.82);
      setHistory([{e: 0, l: 0.45, a: 0.82}]);
      setIsTraining(true);
    } else {
      setIsTraining(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden font-sans">
      <div className="flex flex-col lg:flex-row gap-8 relative z-10">
        
        {/* Left Column: Hyperparameters */}
        <div className="w-full lg:w-1/3 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Cpu className="w-6 h-6 text-indigo-400" />
              Retraining Engine
            </h2>
            <p className="text-sm text-slate-400 mt-1">Fine-tune the bot detection model using fresh edge network data logs.</p>
          </div>

          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 shadow-inner space-y-5">
            <h3 className="font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Settings className="w-4 h-4 text-slate-400" /> Hyperparameters
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-400">
                  <label>Learning Rate</label>
                  <span className="font-mono">0.001</span>
                </div>
                <input type="range" min="1" max="100" defaultValue="10" className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-400">
                  <label>Batch Size</label>
                  <span className="font-mono">256</span>
                </div>
                <select className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500">
                  <option>64</option>
                  <option>128</option>
                  <option selected>256</option>
                  <option>512</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-400">
                  <label>Max Epochs</label>
                  <span className="font-mono">100</span>
                </div>
                <input type="number" defaultValue="100" className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500 font-mono" />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-400">
                  <label>Architecture</label>
                </div>
                <select className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500">
                  <option>Aegis MLP v2 (Default)</option>
                  <option>Aegis Transformer Lite</option>
                  <option>Isolation Forest Ensemble</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 shadow-inner">
             <h3 className="font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
              <Database className="w-4 h-4 text-emerald-400" /> Training Dataset
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Source Table</span>
                <span className="text-slate-300 font-mono">audit_logs_archived</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sample Size</span>
                <span className="text-emerald-400 font-mono">15.4M Rows</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Feature Count</span>
                <span className="text-indigo-400 font-mono">24 Extracted</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Training Visualizer */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          
          <div className="flex gap-4">
            <button 
              onClick={toggleTraining}
              className={`flex-1 py-4 rounded-2xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg ${
                isTraining 
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/50 hover:bg-rose-500/30" 
                  : "bg-indigo-600 text-white border border-indigo-500/50 hover:bg-indigo-500 shadow-indigo-500/20"
              }`}
            >
              {isTraining ? <StopCircle className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {isTraining ? "STOP TRAINING" : epoch > 0 ? "RESUME TRAINING" : "INITIALIZE RETRAINING"}
            </button>
            <button className="px-6 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-2xl font-bold transition-all flex items-center gap-2">
              <Save className="w-5 h-5" /> Save Weights
            </button>
          </div>

          {/* Real-time Metrics Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Epoch</p>
              <p className="text-3xl font-mono text-white">{epoch}<span className="text-slate-600 text-lg">/100</span></p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-transparent pointer-events-none" />
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
                Loss <TrendingDown className="w-3 h-3 text-rose-400" />
              </p>
              <p className="text-3xl font-mono text-rose-400">{loss.toFixed(4)}</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent pointer-events-none" />
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
                Accuracy <Zap className="w-3 h-3 text-emerald-400" />
              </p>
              <p className="text-3xl font-mono text-emerald-400">{(accuracy * 100).toFixed(2)}%</p>
            </div>
          </div>

          {/* SVG Graph for Loss & Accuracy */}
          <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 min-h-[300px] relative flex flex-col">
            <h3 className="text-sm font-bold text-slate-400 flex justify-between items-center z-10 relative">
              <span className="flex items-center gap-2"><BarChart className="w-4 h-4" /> Live Training Curves</span>
              <div className="flex gap-4 text-xs font-mono">
                <span className="text-rose-400 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-400"/> Val Loss</span>
                <span className="text-emerald-400 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400"/> Val Accuracy</span>
              </div>
            </h3>

            {/* Fake Graph Area */}
            <div className="flex-1 mt-4 relative border-l border-b border-slate-800">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none">
                {[0,1,2,3,4].map(i => <div key={i} className="w-full h-px bg-white" />)}
              </div>
              
              <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                {/* Loss Line */}
                <motion.polyline 
                  points={history.map((h, i) => `${(i / Math.max(1, history.length - 1)) * 100}%,${(h.l / 0.5) * 100}%`).join(' ')}
                  fill="none"
                  stroke="#fb7185" // rose-400
                  strokeWidth="3"
                  className="transition-all duration-300 drop-shadow-[0_0_8px_rgba(251,113,133,0.5)]"
                  vectorEffect="non-scaling-stroke"
                />
                
                {/* Accuracy Line (inverted Y because SVG 0 is top) */}
                <motion.polyline 
                  points={history.map((h, i) => `${(i / Math.max(1, history.length - 1)) * 100}%,${(1 - h.a) * 100}%`).join(' ')}
                  fill="none"
                  stroke="#34d399" // emerald-400
                  strokeWidth="3"
                  className="transition-all duration-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          </div>

          {/* Terminal Output */}
          <div className="h-32 bg-[#0d1117] border border-slate-800 rounded-2xl p-4 overflow-y-auto custom-scrollbar font-mono text-xs">
            <div className="text-slate-500 mb-1">$&gt; Starting Model Training Sequence...</div>
            {history.map((h, i) => (
              <div key={i} className="text-indigo-300/80">
                <span className="text-slate-500">[{new Date().toISOString().split('T')[1].split('.')[0]}]</span> 
                {' '}Epoch {h.e.toString().padStart(3, '0')}/100 
                <span className="text-slate-600"> ━━━━━━━━━━━━━━━━━━━━━━ </span> 
                val_loss: <span className="text-rose-400">{h.l.toFixed(4)}</span> - 
                val_accuracy: <span className="text-emerald-400">{h.a.toFixed(4)}</span>
              </div>
            ))}
            {isTraining && <div className="text-slate-400 animate-pulse">_</div>}
          </div>

        </div>
      </div>
    </div>
  );
}
