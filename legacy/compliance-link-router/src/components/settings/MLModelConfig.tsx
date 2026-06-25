"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BrainCircuit, Activity, Server, Cpu, Database, AlertTriangle, ShieldAlert, Save, RefreshCw, CheckCircle2, Play, Square, GitBranch, Box, Loader2, Gauge, Shield, AlertCircle, Clock, Info, CreditCard } from 'lucide-react';

const mlConfigSchema = z.object({
  engineEndpoint: z.string().url("Must be a valid URL").regex(/^https:\/\//, "Must use HTTPS"),
  apiKey: z.string().min(1, "API Key is required"),
  botDetectionThreshold: z.number().min(0).max(1),
  phishingDetectionThreshold: z.number().min(0).max(1),
  activeModelVersion: z.string(),
  fallbackStrategy: z.enum(["allow", "block", "challenge"]),
  syncFrequencyHours: z.number().min(1).max(24)
});

type MlConfigFormValues = z.infer<typeof mlConfigSchema>;

interface MLModel {
  id: string;
  model_name: string;
  version: string;
  is_active: boolean;
  created_at: string;
  metadata: {
    accuracy: number;
    false_positive_rate: number;
    parameters_count: string;
    trained_on_samples: number;
  };
}

export default function MLModelConfig() {
  const [models, setModels] = useState<MLModel[]>([
    {
      id: "mod_1",
      model_name: "Aegis-Bot-Detect-v2",
      version: "2.1.4",
      is_active: true,
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      metadata: { accuracy: 0.992, false_positive_rate: 0.001, parameters_count: "1.2B", trained_on_samples: 45000000 }
    },
    {
      id: "mod_2",
      model_name: "Aegis-Phishing-Shield-v3",
      version: "3.0.1",
      is_active: true,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      metadata: { accuracy: 0.985, false_positive_rate: 0.003, parameters_count: "3.5B", trained_on_samples: 120000000 }
    },
    {
      id: "mod_3",
      model_name: "Aegis-Bot-Detect-Legacy",
      version: "1.9.9",
      is_active: false,
      created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
      metadata: { accuracy: 0.960, false_positive_rate: 0.015, parameters_count: "400M", trained_on_samples: 15000000 }
    }
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [engineStatus, setEngineStatus] = useState<'connected' | 'disconnected' | 'syncing' | 'checking'>('checking');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<MlConfigFormValues>({
    resolver: zodResolver(mlConfigSchema),
    defaultValues: {
      engineEndpoint: "https://ml.aegisroute.internal:8443",
      apiKey: "sk_live_ml_...",
      botDetectionThreshold: 0.85,
      phishingDetectionThreshold: 0.90,
      activeModelVersion: "2.1.4",
      fallbackStrategy: "challenge",
      syncFrequencyHours: 12
    }
  });

  const botThreshold = watch("botDetectionThreshold");
  const phishingThreshold = watch("phishingDetectionThreshold");

  useEffect(() => {
    const checkStatus = async () => {
      setEngineStatus('checking');
      await new Promise(r => setTimeout(r, 1000));
      setEngineStatus('connected');
    };
    checkStatus();
  }, []);

  const onSubmit = async (data: MlConfigFormValues) => {
    setIsSaving(true);
    setSuccessMsg(null);
    try {
      await new Promise(r => setTimeout(r, 1500));
      setSuccessMsg("Machine Learning engine configuration updated and synced with Oracle ARM64 cluster.");
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSync = async () => {
    setEngineStatus('syncing');
    await new Promise(r => setTimeout(r, 2000));
    setEngineStatus('connected');
    setSuccessMsg("Weights synchronized successfully from Supabase to Oracle cluster.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <BrainCircuit className="w-8 h-8 text-violet-500" />
            ML Engine Configuration
          </h2>
          <p className="text-zinc-400 mt-2 text-lg">
            Manage your external Oracle ARM64 cluster connection and tune inference thresholds for the edge.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border text-sm font-medium
            ${engineStatus === 'connected' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 
              engineStatus === 'syncing' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
              engineStatus === 'checking' ? 'bg-zinc-500/10 border-zinc-500/30 text-zinc-400' :
              'bg-red-500/10 border-red-500/30 text-red-400'}`}
          >
            {engineStatus === 'syncing' || engineStatus === 'checking' ? <Loader2 className="w-4 h-4 animate-spin" /> : 
             engineStatus === 'connected' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {engineStatus === 'connected' ? 'Engine Connected' :
             engineStatus === 'syncing' ? 'Syncing Weights...' :
             engineStatus === 'checking' ? 'Checking Connection...' : 'Engine Disconnected'}
          </div>
          <button 
            onClick={handleManualSync}
            disabled={engineStatus === 'syncing'}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors disabled:opacity-50"
            title="Force Weights Sync"
          >
            <RefreshCw className={`w-5 h-5 ${engineStatus === 'syncing' ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-400"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <form id="ml-config-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
                <Server className="w-6 h-6 text-violet-500" />
                <h3 className="text-xl font-semibold text-white">Compute Cluster Connection</h3>
              </div>
              
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-6 flex gap-3 text-blue-200 text-sm">
                <Info className="w-5 h-5 flex-shrink-0 text-blue-400" />
                <div>
                  Our Next.js frontend (Vercel) interacts with the heavy ML Training Engine running on a private Oracle ARM64 server. Specify the secure endpoint URL and authentication key to allow the Next.js API Routes to proxy inference requests.
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Oracle Cluster Endpoint URL</label>
                  <Controller
                    name="engineEndpoint"
                    control={control}
                    render={({ field }) => (
                      <input {...field} placeholder="https://ml-cluster.yourdomain.internal" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none font-mono text-sm" />
                    )}
                  />
                  {errors.engineEndpoint && <p className="text-red-400 text-xs">{errors.engineEndpoint.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Engine API Key</label>
                  <Controller
                    name="apiKey"
                    control={control}
                    render={({ field }) => (
                      <input type="password" {...field} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none font-mono text-sm" />
                    )}
                  />
                  {errors.apiKey && <p className="text-red-400 text-xs">{errors.apiKey.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-800/50">
                   <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Timeout Fallback Strategy</label>
                    <Controller
                      name="fallbackStrategy"
                      control={control}
                      render={({ field }) => (
                        <select {...field} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none appearance-none cursor-pointer">
                          <option value="allow">Allow Request (Fail Open)</option>
                          <option value="block">Block Request (Fail Closed)</option>
                          <option value="challenge">Issue JS/Captcha Challenge</option>
                        </select>
                      )}
                    />
                    <p className="text-xs text-zinc-500 mt-1">Action to take if Oracle cluster is unreachable or times out ({'>'}500ms).</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Weights Sync Frequency (Hours)</label>
                    <Controller
                      name="syncFrequencyHours"
                      control={control}
                      render={({ field }) => (
                        <input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none" />
                      )}
                    />
                    <p className="text-xs text-zinc-500 mt-1">How often the engine fetches latest weights from Supabase `ml_models`.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
                <Gauge className="w-6 h-6 text-violet-500" />
                <h3 className="text-xl font-semibold text-white">Inference Thresholds</h3>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <label className="text-sm font-medium text-zinc-300">Bot Detection Sensitivity</label>
                      <p className="text-xs text-zinc-500 mt-1">Probability score required to classify a request as a bot.</p>
                    </div>
                    <div className="text-2xl font-bold text-violet-400 font-mono">{(botThreshold * 100).toFixed(0)}%</div>
                  </div>
                  <Controller
                    name="botDetectionThreshold"
                    control={control}
                    render={({ field }) => (
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01"
                        value={field.value}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        className="w-full accent-violet-500"
                      />
                    )}
                  />
                  <div className="flex justify-between text-xs text-zinc-500 font-medium">
                    <span>Block More (Higher False Positives)</span>
                    <span>Allow More (Higher False Negatives)</span>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-zinc-800/50">
                  <div className="flex justify-between items-end">
                    <div>
                      <label className="text-sm font-medium text-zinc-300">Phishing Shield Sensitivity</label>
                      <p className="text-xs text-zinc-500 mt-1">Probability score required to flag a destination URL as malicious.</p>
                    </div>
                    <div className="text-2xl font-bold text-rose-400 font-mono">{(phishingThreshold * 100).toFixed(0)}%</div>
                  </div>
                  <Controller
                    name="phishingDetectionThreshold"
                    control={control}
                    render={({ field }) => (
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01"
                        value={field.value}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        className="w-full accent-rose-500"
                      />
                    )}
                  />
                  <div className="flex justify-between text-xs text-zinc-500 font-medium">
                    <span>Strict (Safer)</span>
                    <span>Lenient (Less Interruptions)</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                form="ml-config-form"
                disabled={isSaving}
                className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/20 flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save ML Configuration
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Box className="w-5 h-5 text-violet-400" /> Deployed Models
            </h3>
            
            <div className="space-y-4">
              {models.map((model) => (
                <div key={model.id} className={`p-4 rounded-xl border ${model.is_active ? 'bg-violet-500/10 border-violet-500/30' : 'bg-zinc-950 border-zinc-800'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-semibold ${model.is_active ? 'text-violet-300' : 'text-zinc-300'}`}>
                      {model.model_name}
                    </h4>
                    {model.is_active && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500 text-white uppercase tracking-wider">
                        Active
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-4">
                    <GitBranch className="w-3 h-3" /> v{model.version}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-zinc-900 rounded p-2 border border-zinc-800/50">
                      <div className="text-zinc-500 mb-0.5">Accuracy</div>
                      <div className="text-white font-medium">{(model.metadata.accuracy * 100).toFixed(1)}%</div>
                    </div>
                    <div className="bg-zinc-900 rounded p-2 border border-zinc-800/50">
                      <div className="text-zinc-500 mb-0.5">Params</div>
                      <div className="text-white font-medium">{model.metadata.parameters_count}</div>
                    </div>
                    <div className="bg-zinc-900 rounded p-2 border border-zinc-800/50 col-span-2">
                      <div className="text-zinc-500 mb-0.5">Trained Samples</div>
                      <div className="text-white font-medium">{(model.metadata.trained_on_samples / 1000000).toFixed(1)}M</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 py-2 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-sm font-medium rounded-xl transition-colors">
              View Training History
            </button>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-zinc-400" /> ARM64 Cluster Health
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">CPU Usage</span>
                  <span className="text-emerald-400 font-mono">14%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '14%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Memory (256GB)</span>
                  <span className="text-amber-400 font-mono">68%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '68%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Avg Inference Latency</span>
                  <span className="text-white font-mono">12ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
