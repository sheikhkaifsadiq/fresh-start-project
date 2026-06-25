"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Database, 
  UploadCloud, 
  Cpu, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  HardDrive,
  Network
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface MLModel {
  id: string;
  model_name: string;
  version: string;
  metadata: {
    accuracy: number;
    parameters: number;
    architecture: string;
  };
  is_active: boolean;
  created_at: string;
}

export default function ModelManagement() {
  const [models, setModels] = useState<MLModel[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("ml_models")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (!error && data) {
        setModels(data as MLModel[]);
      }
      setLoading(false);
    };

    fetchModels();
  }, [supabase]);

  const toggleActiveStatus = async (id: string, currentStatus: boolean) => {
    // In reality, only one model should be active, but let's just toggle for UI demo purposes
    await supabase.from("ml_models").update({ is_active: !currentStatus }).eq("id", id);
    setModels(models.map(m => m.id === id ? { ...m, is_active: !currentStatus } : m));
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex justify-between items-center mb-6 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-400" />
            Model Registry
          </h2>
          <p className="text-sm text-slate-400 mt-1">Manage deep learning model versions and weights.</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20">
          <UploadCloud className="w-4 h-4" /> Import Weights
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-8">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-500" />
          </div>
        ) : models.length === 0 ? (
          <div className="text-center p-8 border border-dashed border-slate-700 rounded-2xl text-slate-500">
            <HardDrive className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>No models found in the database.</p>
            <p className="text-xs mt-1">Deploy a model to see it listed here.</p>
          </div>
        ) : (
          models.map((model) => (
            <motion.div 
              key={model.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-2xl border transition-all ${
                model.is_active 
                  ? "bg-indigo-500/5 border-indigo-500/30 shadow-lg shadow-indigo-500/5" 
                  : "bg-slate-950/50 border-slate-800/50"
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl mt-1 ${model.is_active ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                    <Network className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-200">{model.model_name}</h3>
                      <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                        {model.version}
                      </span>
                      {model.is_active && (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs font-mono text-slate-500">
                      <span className="flex items-center gap-1">
                        <Cpu className="w-3 h-3" /> {(model.metadata?.parameters || 0).toLocaleString()} params
                      </span>
                      <span>Accuracy: {(model.metadata?.accuracy || 0) * 100}%</span>
                      <span>Arch: {model.metadata?.architecture || 'Unknown'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                  <button 
                    onClick={() => toggleActiveStatus(model.id, model.is_active)}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                      model.is_active 
                        ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700" 
                        : "bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20"
                    }`}
                  >
                    {model.is_active ? "Deactivate" : "Deploy Model"}
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
