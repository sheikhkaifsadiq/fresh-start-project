"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Activity, StopCircle, RefreshCw, AlertTriangle, Info, Plus, Trash2, Shield, ArrowRight, Database, AlertCircle, Clock, CreditCard, CheckCircle2 } from 'lucide-react';
import { z } from "zod";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const ruleSchema = z.object({
  id: z.string(),
  pathPattern: z.string().min(1, "Pattern required"),
  limit: z.number().min(1),
  windowMs: z.number().min(1000), // milliseconds
  action: z.enum(["block", "log", "challenge"])
});

const rateLimitSchema = z.object({
  globalLimit: z.number().min(100),
  globalWindow: z.enum(["1m", "5m", "15m", "1h"]),
  customRules: z.array(ruleSchema)
});

type RateLimitFormValues = z.infer<typeof rateLimitSchema>;

export default function RateLimitingSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const { control, handleSubmit, register } = useForm<RateLimitFormValues>({
    resolver: zodResolver(rateLimitSchema),
    defaultValues: {
      globalLimit: 10000,
      globalWindow: "15m",
      customRules: [
        { id: "1", pathPattern: "/api/links/create", limit: 100, windowMs: 60000, action: "block" },
        { id: "2", pathPattern: "/api/auth/*", limit: 20, windowMs: 300000, action: "challenge" }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "customRules"
  });

  const onSubmit = async (data: RateLimitFormValues) => {
    setIsSaving(true);
    setSuccess(false);
    await new Promise(r => setTimeout(r, 1200));
    setSuccess(true);
    setIsSaving(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 p-6">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Zap className="w-8 h-8 text-yellow-500" />
          Rate Limiting & WAF
        </h2>
        <p className="text-zinc-400 mt-2 text-lg">
          Protect your endpoints from DDoS attacks, brute force, and abuse with granular rate limits.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-zinc-400" /> Current Usage
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-400">Global API Requests (last 1h)</span>
                  <span className="text-white font-medium">45,212 / 100,000</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-400">Blocked Requests (last 24h)</span>
                  <span className="text-red-400 font-medium">1,204</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-sm text-yellow-200">
              <AlertTriangle className="w-4 h-4 inline mr-2 text-yellow-500" />
              Rate limits are evaluated at the Edge network layer (Cloudflare/Vercel Edge) for maximum protection.
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8 backdrop-blur-xl">
              <h3 className="text-xl font-semibold text-white mb-6">Global Protection</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Default Rate Limit (req per IP)</label>
                  <Controller
                    name="globalLimit"
                    control={control}
                    render={({ field }) => (
                      <input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none" />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Time Window</label>
                  <Controller
                    name="globalWindow"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none appearance-none cursor-pointer">
                        <option value="1m">1 Minute</option>
                        <option value="5m">5 Minutes</option>
                        <option value="15m">15 Minutes</option>
                        <option value="1h">1 Hour</option>
                      </select>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-white">Custom Endpoint Rules</h3>
                  <p className="text-sm text-zinc-400 mt-1">Override global settings for specific paths.</p>
                </div>
                <button
                  type="button"
                  onClick={() => append({ id: Math.random().toString(), pathPattern: "", limit: 100, windowMs: 60000, action: "block" })}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Rule
                </button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="flex-1 w-full space-y-1">
                      <label className="text-xs text-zinc-500 font-medium uppercase">Path Pattern</label>
                      <input 
                        {...register(`customRules.${index}.pathPattern`)} 
                        placeholder="/api/v1/resource/*" 
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-yellow-500 outline-none font-mono" 
                      />
                    </div>
                    
                    <div className="w-full md:w-24 space-y-1">
                      <label className="text-xs text-zinc-500 font-medium uppercase">Limit</label>
                      <input 
                        type="number"
                        {...register(`customRules.${index}.limit`, { valueAsNumber: true })} 
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-yellow-500 outline-none" 
                      />
                    </div>

                    <div className="w-full md:w-32 space-y-1">
                      <label className="text-xs text-zinc-500 font-medium uppercase">Window (ms)</label>
                      <input 
                        type="number"
                        {...register(`customRules.${index}.windowMs`, { valueAsNumber: true })} 
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-yellow-500 outline-none" 
                      />
                    </div>

                    <div className="w-full md:w-32 space-y-1">
                      <label className="text-xs text-zinc-500 font-medium uppercase">Action</label>
                      <select 
                        {...register(`customRules.${index}.action`)} 
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                      >
                        <option value="block">Block (429)</option>
                        <option value="log">Log Only</option>
                        <option value="challenge">Challenge (JS)</option>
                      </select>
                    </div>

                    <div className="pt-5 flex-shrink-0">
                      <button 
                        type="button" 
                        onClick={() => remove(index)}
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {fields.length === 0 && (
                  <div className="text-center p-8 border border-dashed border-zinc-800 rounded-xl text-zinc-500">
                    No custom rules configured. Global limits apply.
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              {success ? (
                <div className="text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Saved successfully
                </div>
              ) : <div></div>}
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-yellow-500/20 flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                Update Protections
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
