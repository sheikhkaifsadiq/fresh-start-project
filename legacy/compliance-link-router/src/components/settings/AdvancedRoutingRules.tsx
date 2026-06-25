"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GitBranch, Globe, Map, Smartphone, 
  ShieldAlert, Settings2, Plus, Trash2, 
  Save, AlertTriangle, CheckCircle2, 
  ArrowRightLeft, Route, Clock, Loader2 
} from "lucide-react";
import { z } from "zod";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const routingConditionSchema = z.object({
  type: z.enum(["country", "device", "browser", "os", "ip", "time"]),
  operator: z.enum(["equals", "not_equals", "in", "not_in"]),
  value: z.string().min(1, "Value required")
});

const routingRuleSchema = z.object({
  id: z.string(),
  name: z.string().min(3),
  priority: z.number().min(1).max(100),
  isActive: z.boolean(),
  conditions: z.array(routingConditionSchema).min(1),
  destinationUrl: z.string().url("Must be a valid URL")
});

const advancedRoutingSchema = z.object({
  globalFallbackUrl: z.string().url("Must be a valid URL"),
  enableIntelligentRouting: z.boolean(),
  respectDoNotTrack: z.boolean(),
  botFallbackStrategy: z.enum(["block", "redirect", "challenge"]),
  botRedirectUrl: z.string().url().optional().or(z.literal("")),
  rules: z.array(routingRuleSchema)
});

type AdvancedRoutingFormValues = z.infer<typeof advancedRoutingSchema>;

export default function AdvancedRoutingRules() {
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { control, handleSubmit, register, watch } = useForm<AdvancedRoutingFormValues>({
    resolver: zodResolver(advancedRoutingSchema),
    defaultValues: {
      globalFallbackUrl: "https://www.acmecorp.com/fallback",
      enableIntelligentRouting: true,
      respectDoNotTrack: true,
      botFallbackStrategy: "block",
      botRedirectUrl: "",
      rules: [
        {
          id: "rule_1",
          name: "EU Users to GDPR Site",
          priority: 10,
          isActive: true,
          destinationUrl: "https://eu.acmecorp.com",
          conditions: [
            { type: "country", operator: "in", value: "FR,DE,IT,ES,NL,BE" }
          ]
        },
        {
          id: "rule_2",
          name: "Mobile App Deep Link",
          priority: 5,
          isActive: true,
          destinationUrl: "acme://app/open",
          conditions: [
            { type: "device", operator: "equals", value: "mobile" },
            { type: "os", operator: "in", value: "iOS,Android" }
          ]
        }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "rules"
  });

  const botStrategy = watch("botFallbackStrategy");

  const onSubmit = async (data: AdvancedRoutingFormValues) => {
    setIsSaving(true);
    setSuccessMsg(null);
    try {
      await new Promise(r => setTimeout(r, 1500));
      setSuccessMsg("Routing rules deployed to Edge network globally.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const addCondition = (ruleIndex: number) => {
    // A bit hacky to update nested arrays in react-hook-form without a deep useFieldArray, 
    // but works for this level of UI simulation.
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Route className="w-8 h-8 text-sky-500" />
            Advanced Edge Routing
          </h2>
          <p className="text-zinc-400 mt-2 text-lg">
            Configure how links are evaluated and redirected at the edge network layer before reaching your servers.
          </p>
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

      <form id="routing-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Global Behaviors */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8 backdrop-blur-xl">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-sky-500" /> Global Edge Behaviors
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Global Fallback URL</label>
                <Controller
                  name="globalFallbackUrl"
                  control={control}
                  render={({ field }) => (
                    <input {...field} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 outline-none font-mono text-sm" />
                  )}
                />
                <p className="text-xs text-zinc-500 mt-1">If all rules fail or a link is deleted, users go here.</p>
              </div>

              <div className="space-y-4 pt-4 border-t border-zinc-800/50">
                <Controller
                  name="enableIntelligentRouting"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-sm font-medium text-white block">Intelligent Routing Engine</span>
                        <span className="text-xs text-zinc-500">Automatically route to lowest-latency region endpoints if multiple are configured</span>
                      </div>
                      <div className="relative ml-4">
                        <input type="checkbox" className="sr-only" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                        <div className={`w-10 h-6 rounded-full transition-colors ${field.value ? 'bg-sky-500' : 'bg-zinc-700'}`}></div>
                        <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${field.value ? 'translate-x-4' : 'translate-x-0'}`}></div>
                      </div>
                    </label>
                  )}
                />

                <Controller
                  name="respectDoNotTrack"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-sm font-medium text-white block">Respect Do-Not-Track (DNT)</span>
                        <span className="text-xs text-zinc-500">Do not execute device/location tracking if DNT header is present</span>
                      </div>
                      <div className="relative ml-4">
                        <input type="checkbox" className="sr-only" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                        <div className={`w-10 h-6 rounded-full transition-colors ${field.value ? 'bg-emerald-500' : 'bg-zinc-700'}`}></div>
                        <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${field.value ? 'translate-x-4' : 'translate-x-0'}`}></div>
                      </div>
                    </label>
                  )}
                />
              </div>
            </div>

            <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-6">
              <h4 className="font-medium text-white mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" /> Bot Handling at Edge
              </h4>
              <div className="space-y-4">
                <Controller
                  name="botFallbackStrategy"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 hover:bg-zinc-800/50 cursor-pointer transition-colors">
                        <input type="radio" checked={field.value === 'block'} onChange={() => field.onChange('block')} className="text-rose-500 focus:ring-rose-500/20 bg-zinc-900 border-zinc-700" />
                        <div>
                          <div className="text-sm font-medium text-white">Block Requests</div>
                          <div className="text-xs text-zinc-500">Return a 403 Forbidden status immediately</div>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 hover:bg-zinc-800/50 cursor-pointer transition-colors">
                        <input type="radio" checked={field.value === 'challenge'} onChange={() => field.onChange('challenge')} className="text-rose-500 focus:ring-rose-500/20 bg-zinc-900 border-zinc-700" />
                        <div>
                          <div className="text-sm font-medium text-white">Cloudflare Challenge</div>
                          <div className="text-xs text-zinc-500">Issue a Turnstile/JS challenge before proceeding</div>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 hover:bg-zinc-800/50 cursor-pointer transition-colors">
                        <input type="radio" checked={field.value === 'redirect'} onChange={() => field.onChange('redirect')} className="text-rose-500 focus:ring-rose-500/20 bg-zinc-900 border-zinc-700" />
                        <div>
                          <div className="text-sm font-medium text-white">Honeypot Redirect</div>
                          <div className="text-xs text-zinc-500">Send detected bots to a specific URL silently</div>
                        </div>
                      </label>
                    </div>
                  )}
                />
                
                <AnimatePresence>
                  {botStrategy === 'redirect' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <Controller
                        name="botRedirectUrl"
                        control={control}
                        render={({ field }) => (
                          <div className="mt-2">
                            <input {...field} placeholder="https://acmecorp.com/honeypot" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none" />
                          </div>
                        )}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Global Rule Overrides */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <ArrowRightLeft className="w-6 h-6 text-sky-500" />
              <h3 className="text-xl font-semibold text-white">Global Rules Evaluation</h3>
            </div>
            <button
              type="button"
              onClick={() => append({ 
                id: Math.random().toString(), 
                name: "New Rule", 
                priority: 50, 
                isActive: true, 
                destinationUrl: "", 
                conditions: [{ type: "country", operator: "equals", value: "" }] 
              })}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Global Rule
            </button>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sm text-sky-200">
              <AlertTriangle className="w-4 h-4 inline mr-2 text-sky-500" />
              Global rules override individual link settings. They are evaluated in order of Priority (1 is highest).
            </div>

            {fields.map((rule, index) => (
              <div key={rule.id} className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-zinc-800 flex flex-wrap gap-4 items-center justify-between bg-zinc-900/30">
                  <div className="flex items-center gap-4 flex-1">
                    <Controller
                      name={`rules.${index}.isActive`}
                      control={control}
                      render={({ field }) => (
                        <button 
                          type="button"
                          onClick={() => field.onChange(!field.value)}
                          className={`w-12 h-6 rounded-full relative transition-colors ${field.value ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                        >
                          <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${field.value ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                      )}
                    />
                    <div className="flex-1 min-w-[200px]">
                      <input 
                        {...register(`rules.${index}.name`)} 
                        placeholder="Rule Name" 
                        className="w-full bg-transparent border-none text-white font-semibold focus:ring-0 outline-none px-2 py-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 font-medium uppercase">Priority</span>
                      <input 
                        type="number" 
                        {...register(`rules.${index}.priority`, { valueAsNumber: true })} 
                        className="w-16 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-sm text-white text-center focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => remove(index)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/50 space-y-3">
                    <h5 className="text-xs font-semibold text-zinc-400 uppercase">If Conditions Match:</h5>
                    {/* Hacky render of conditions since we didn't set up a nested field array for simplicity */}
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <div className="px-3 py-1.5 bg-zinc-800 rounded-md text-sky-300 font-mono">
                        {watch(`rules.${index}.conditions.0.type`)}
                      </div>
                      <span className="text-zinc-500">is</span>
                      <div className="px-3 py-1.5 bg-zinc-800 rounded-md text-emerald-300 font-mono">
                        {watch(`rules.${index}.conditions.0.operator`)}
                      </div>
                      <input 
                        {...register(`rules.${index}.conditions.0.value`)} 
                        className="bg-zinc-950 border border-zinc-700 rounded-md px-3 py-1.5 text-white outline-none w-48 font-mono text-sm"
                      />
                    </div>
                    <button type="button" className="text-xs font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1 mt-2">
                      <Plus className="w-3 h-3" /> Add AND condition
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-zinc-500 font-medium">➔ Redirect To</span>
                    <input 
                      {...register(`rules.${index}.destinationUrl`)} 
                      placeholder="https://..." 
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-sky-500 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}

            {fields.length === 0 && (
              <div className="text-center p-8 border border-dashed border-zinc-800 rounded-xl text-zinc-500">
                No global routing rules defined. Links will resolve to their individual target URLs.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-zinc-800">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Deploy Routing Config
          </button>
        </div>
      </form>
    </div>
  );
}
