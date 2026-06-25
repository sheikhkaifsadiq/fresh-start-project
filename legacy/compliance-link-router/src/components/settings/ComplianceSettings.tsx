"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, FileKey, Server, Globe, CheckCircle2, AlertTriangle, Eye, EyeOff, Save, Loader2, Database, Download, FileText } from "lucide-react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const complianceSchema = z.object({
  dataResidency: z.enum(["us-east", "us-west", "eu-central", "ap-northeast"]),
  dataRetentionDays: z.number().min(30).max(3650),
  enforceMfa: z.boolean(),
  allowExport: z.boolean(),
  gdprComplianceMode: z.boolean(),
  hipaaComplianceMode: z.boolean(),
  auditLogRetention: z.enum(["90d", "1y", "7y"]),
});

type ComplianceFormValues = z.infer<typeof complianceSchema>;

export default function ComplianceSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { control, handleSubmit, watch } = useForm<ComplianceFormValues>({
    resolver: zodResolver(complianceSchema),
    defaultValues: {
      dataResidency: "us-east",
      dataRetentionDays: 365,
      enforceMfa: true,
      allowExport: false,
      gdprComplianceMode: true,
      hipaaComplianceMode: false,
      auditLogRetention: "1y"
    }
  });

  const isGdpr = watch("gdprComplianceMode");
  const isHipaa = watch("hipaaComplianceMode");

  const onSubmit = async (data: ComplianceFormValues) => {
    setIsSaving(true);
    setSuccessMsg(null);
    try {
      await new Promise(r => setTimeout(r, 1500));
      setSuccessMsg("Compliance settings updated successfully. Policies will apply to new data immediately.");
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 3000));
      // Mock download trigger
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 p-6">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Shield className="w-8 h-8 text-emerald-500" />
          Compliance & Data Security
        </h2>
        <p className="text-zinc-400 mt-2 text-lg">
          Configure stringent data policies, region pinning, and compliance frameworks to meet enterprise regulatory requirements.
        </p>
      </div>

      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-400"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">{successMsg}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Frameworks */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
            <FileText className="w-6 h-6 text-emerald-500" />
            <h3 className="text-xl font-semibold text-white">Regulatory Frameworks</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Controller
              name="gdprComplianceMode"
              control={control}
              render={({ field }) => (
                <div className={`p-5 rounded-xl border transition-colors ${field.value ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-zinc-950/50 border-zinc-800'}`}>
                  <label className="flex items-start gap-4 cursor-pointer">
                    <div className="relative mt-1">
                      <input type="checkbox" className="sr-only" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                      <div className={`w-11 h-6 rounded-full transition-colors ${field.value ? 'bg-emerald-500' : 'bg-zinc-700'}`}></div>
                      <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${field.value ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                    <div>
                      <h4 className="text-white font-medium flex items-center gap-2">
                        GDPR Strict Mode
                        {field.value && <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Active</span>}
                      </h4>
                      <p className="text-sm text-zinc-400 mt-1">Automatically anonymizes IP addresses before storage and enables one-click user data deletion requests.</p>
                    </div>
                  </label>
                </div>
              )}
            />

            <Controller
              name="hipaaComplianceMode"
              control={control}
              render={({ field }) => (
                <div className={`p-5 rounded-xl border transition-colors ${field.value ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-zinc-950/50 border-zinc-800'}`}>
                  <label className="flex items-start gap-4 cursor-pointer">
                    <div className="relative mt-1">
                      <input type="checkbox" className="sr-only" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                      <div className={`w-11 h-6 rounded-full transition-colors ${field.value ? 'bg-emerald-500' : 'bg-zinc-700'}`}></div>
                      <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${field.value ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                    <div>
                      <h4 className="text-white font-medium flex items-center gap-2">
                        HIPAA Compliance
                        {field.value && <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Active</span>}
                      </h4>
                      <p className="text-sm text-zinc-400 mt-1">Enforces BAA requirements, strict audit logging of all access, and AES-256-GCM encryption at rest.</p>
                    </div>
                  </label>
                </div>
              )}
            />
          </div>

          {(isGdpr || isHipaa) && (
            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-200">
                <strong>Important:</strong> Enabling regulatory frameworks limits certain analytical capabilities (e.g. raw IP visibility) globally across your workspace to ensure compliance.
              </div>
            </div>
          )}
        </div>

        {/* Data Residency & Retention */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
            <Server className="w-6 h-6 text-emerald-500" />
            <h3 className="text-xl font-semibold text-white">Data Residency & Retention</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Primary Data Region</label>
                <Controller
                  name="dataResidency"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <select {...field} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer">
                        <option value="us-east">US East (N. Virginia)</option>
                        <option value="us-west">US West (Oregon)</option>
                        <option value="eu-central">EU Central (Frankfurt) - GDPR Recommended</option>
                        <option value="ap-northeast">AP Northeast (Tokyo)</option>
                      </select>
                    </div>
                  )}
                />
                <p className="text-xs text-zinc-500 mt-1">All link metadata, analytics, and audit logs will be physically stored in this region.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Analytics Retention (Days)</label>
                <Controller
                  name="dataRetentionDays"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="30" 
                        max="3650" 
                        step="30"
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                      <span className="bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg text-white font-mono text-sm w-20 text-center">
                        {field.value}
                      </span>
                    </div>
                  )}
                />
                <p className="text-xs text-zinc-500 mt-1">Click streams older than this will be automatically purged.</p>
              </div>
            </div>

            <div className="space-y-4">
               <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Audit Log Retention</label>
                <Controller
                  name="auditLogRetention"
                  control={control}
                  render={({ field }) => (
                    <div className="flex gap-2">
                      {[
                        { value: '90d', label: '90 Days' },
                        { value: '1y', label: '1 Year' },
                        { value: '7y', label: '7 Years (HIPAA)' }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => field.onChange(opt.value)}
                          className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${field.value === opt.value ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>

              <div className="space-y-4 mt-6 p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl">
                <Controller
                  name="enforceMfa"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-sm font-medium text-white block">Enforce Org-Wide MFA</span>
                        <span className="text-xs text-zinc-500">Require 2FA for all team members</span>
                      </div>
                      <div className="relative">
                        <input type="checkbox" className="sr-only" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                        <div className={`w-10 h-6 rounded-full transition-colors ${field.value ? 'bg-emerald-500' : 'bg-zinc-700'}`}></div>
                        <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${field.value ? 'translate-x-4' : 'translate-x-0'}`}></div>
                      </div>
                    </label>
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Data Export & Takeout */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-semibold text-white flex items-center gap-3 mb-2">
                <Database className="w-6 h-6 text-emerald-500" />
                Data Takeout
              </h3>
              <p className="text-sm text-zinc-400 max-w-xl">
                Generate a comprehensive archive of all your workspace data, including links, click streams, and audit logs.
              </p>
            </div>
            
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2 border border-zinc-700 w-full md:w-auto justify-center disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {isExporting ? 'Generating Archive...' : 'Request Data Export'}
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-zinc-800">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Compliance Policies
          </button>
        </div>
      </form>
    </div>
  );
}
