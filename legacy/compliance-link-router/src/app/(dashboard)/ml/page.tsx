import React from "react";
import NeuralNetworkVisualizer from "@/components/ml/NeuralNetworkVisualizer";
import FeatureImportanceGraph from "@/components/ml/FeatureImportanceGraph";
import ModelTrainingDashboard from "@/components/ml/ModelTrainingDashboard";
import ModelManagement from "@/components/ml/ModelManagement";
import AnomalyDetectionPanel from "@/components/ml/AnomalyDetectionPanel";
import MlSystemLogs from "@/components/ml/MlSystemLogs";
import { Brain, Cpu, Database, Settings, Shield, Zap, Activity, Target, Terminal } from "lucide-react";

export const metadata = {
  title: "Machine Learning Engine | Aegis Route",
  description: "Monitor and configure the deep learning models powering link security.",
};

export default function MLEnginePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 sm:p-8 selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <Brain className="w-8 h-8 text-indigo-400" />
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white">Machine Learning Core</h1>
            </div>
            <p className="text-slate-400 text-lg max-w-2xl">
              Real-time visualization, model training, and management of the deep neural networks evaluating traffic anomalies.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Oracle Node Status</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400 font-medium font-mono text-sm">ssh-tun: OK</span>
              </div>
            </div>
            <div className="h-10 w-px bg-slate-800" />
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Inference Latency</span>
              <span className="text-white font-mono font-bold text-lg">12.4ms</span>
            </div>
          </div>
        </div>

        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Active Models", value: "3", icon: Cpu, color: "text-blue-400" },
            { label: "Total Inferences", value: "1.24B", icon: Database, color: "text-purple-400" },
            { label: "Threats Detected", value: "45.2M", icon: Shield, color: "text-rose-400" },
            { label: "Avg Confidence", value: "98.7%", icon: Zap, color: "text-amber-400" },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-900/40 border border-slate-800/60 p-6 rounded-3xl backdrop-blur-sm flex items-center gap-4">
              <div className={`p-4 rounded-2xl bg-slate-950 border border-slate-800 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-0.5">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Visualization Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Activity className="w-6 h-6 text-indigo-500" />
                Live Architecture Visualizer
              </h2>
            </div>
            <NeuralNetworkVisualizer />
          </div>

          <div className="lg:col-span-1 space-y-6 flex flex-col">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-500" />
              SHAP Analysis
            </h2>
            <div className="flex-1">
               <FeatureImportanceGraph />
            </div>
          </div>
        </div>

        {/* Unsupervised Anomaly Detection Row */}
        <div className="mt-8">
           <AnomalyDetectionPanel />
        </div>

        {/* Retraining Dashboard & Logs */}
        <div className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <ModelTrainingDashboard />
          </div>
          <div className="xl:col-span-1">
            <MlSystemLogs />
          </div>
        </div>

        {/* Model Registry Section */}
        <div className="mt-8">
          <ModelManagement />
        </div>

      </div>
    </div>
  );
}
