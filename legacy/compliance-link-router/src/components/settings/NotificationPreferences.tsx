"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Mail, Smartphone, Slack, CheckCircle2, ShieldAlert, Zap, Globe, Link, RefreshCw, Database, Shield, AlertCircle, Clock, Activity, Info, CreditCard } from 'lucide-react';
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const notificationSchema = z.object({
  emailAlerts: z.boolean(),
  slackAlerts: z.boolean(),
  smsAlerts: z.boolean(),
  
  securityBotDetected: z.boolean(),
  securityPhishingFlag: z.boolean(),
  securityNewDevice: z.boolean(),
  
  billingUsageWarning: z.boolean(),
  billingInvoicePaid: z.boolean(),
  
  systemEngineDisconnect: z.boolean(),
  systemSyncFailure: z.boolean(),

  slackWebhookUrl: z.string().url().optional().or(z.literal('')),
  smsPhoneNumber: z.string().optional().or(z.literal(''))
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

export default function NotificationPreferences() {
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { control, handleSubmit, watch } = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailAlerts: true,
      slackAlerts: false,
      smsAlerts: false,
      
      securityBotDetected: true,
      securityPhishingFlag: true,
      securityNewDevice: true,
      
      billingUsageWarning: true,
      billingInvoicePaid: false,
      
      systemEngineDisconnect: true,
      systemSyncFailure: true,

      slackWebhookUrl: "",
      smsPhoneNumber: ""
    }
  });

  const slackEnabled = watch("slackAlerts");
  const smsEnabled = watch("smsAlerts");

  const onSubmit = async (data: NotificationFormValues) => {
    setIsSaving(true);
    setSuccessMsg(null);
    try {
      await new Promise(r => setTimeout(r, 1000));
      setSuccessMsg("Notification preferences updated.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const Toggle = ({ field, label, desc }: any) => (
    <label className="flex items-start gap-4 cursor-pointer p-4 hover:bg-zinc-800/30 rounded-xl transition-colors">
      <div className="relative mt-1 flex-shrink-0">
        <input type="checkbox" className="sr-only" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
        <div className={`w-10 h-6 rounded-full transition-colors ${field.value ? 'bg-indigo-500' : 'bg-zinc-700'}`}></div>
        <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${field.value ? 'translate-x-4' : 'translate-x-0'}`}></div>
      </div>
      <div>
        <h4 className="text-white font-medium text-sm">{label}</h4>
        {desc && <p className="text-xs text-zinc-400 mt-1">{desc}</p>}
      </div>
    </label>
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 p-6">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Bell className="w-8 h-8 text-indigo-500" />
          Notification Preferences
        </h2>
        <p className="text-zinc-400 mt-2 text-lg">
          Configure how and when you want to be alerted about critical workspace events.
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
        {/* Delivery Channels */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8 backdrop-blur-xl">
          <h3 className="text-xl font-semibold text-white mb-6">Delivery Channels</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <Controller
                name="emailAlerts"
                control={control}
                render={({ field }) => (
                  <div className={`p-4 rounded-xl border transition-colors ${field.value ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-zinc-950 border-zinc-800'}`}>
                    <div className="flex justify-between items-center mb-3">
                      <Mail className={`w-6 h-6 ${field.value ? 'text-indigo-400' : 'text-zinc-500'}`} />
                      <div className="relative">
                        <input type="checkbox" className="sr-only" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                        <div className={`w-8 h-5 rounded-full transition-colors ${field.value ? 'bg-indigo-500' : 'bg-zinc-700'}`}></div>
                        <div className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${field.value ? 'translate-x-3' : 'translate-x-0'}`}></div>
                      </div>
                    </div>
                    <h4 className="font-semibold text-white">Email</h4>
                    <p className="text-xs text-zinc-400 mt-1">Sent to admin@acme.com</p>
                  </div>
                )}
              />
            </div>

            <div className="space-y-4">
              <Controller
                name="slackAlerts"
                control={control}
                render={({ field }) => (
                  <div className={`p-4 rounded-xl border transition-colors ${field.value ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-zinc-950 border-zinc-800'}`}>
                    <div className="flex justify-between items-center mb-3">
                      <Slack className={`w-6 h-6 ${field.value ? 'text-indigo-400' : 'text-zinc-500'}`} />
                      <div className="relative">
                        <input type="checkbox" className="sr-only" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                        <div className={`w-8 h-5 rounded-full transition-colors ${field.value ? 'bg-indigo-500' : 'bg-zinc-700'}`}></div>
                        <div className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${field.value ? 'translate-x-3' : 'translate-x-0'}`}></div>
                      </div>
                    </div>
                    <h4 className="font-semibold text-white">Slack</h4>
                    <p className="text-xs text-zinc-400 mt-1">Direct to your channel</p>
                  </div>
                )}
              />
              {slackEnabled && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <Controller
                    name="slackWebhookUrl"
                    control={control}
                    render={({ field }) => (
                      <input {...field} placeholder="Slack Webhook URL" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono" />
                    )}
                  />
                </motion.div>
              )}
            </div>

            <div className="space-y-4">
              <Controller
                name="smsAlerts"
                control={control}
                render={({ field }) => (
                  <div className={`p-4 rounded-xl border transition-colors ${field.value ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-zinc-950 border-zinc-800'}`}>
                    <div className="flex justify-between items-center mb-3">
                      <Smartphone className={`w-6 h-6 ${field.value ? 'text-indigo-400' : 'text-zinc-500'}`} />
                      <div className="relative">
                        <input type="checkbox" className="sr-only" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                        <div className={`w-8 h-5 rounded-full transition-colors ${field.value ? 'bg-indigo-500' : 'bg-zinc-700'}`}></div>
                        <div className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${field.value ? 'translate-x-3' : 'translate-x-0'}`}></div>
                      </div>
                    </div>
                    <h4 className="font-semibold text-white">SMS Alerts</h4>
                    <p className="text-xs text-zinc-400 mt-1">For critical events only</p>
                  </div>
                )}
              />
              {smsEnabled && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <Controller
                    name="smsPhoneNumber"
                    control={control}
                    render={({ field }) => (
                      <input {...field} placeholder="+1 (555) 000-0000" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono" />
                    )}
                  />
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Event Subscriptions */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8 backdrop-blur-xl">
          <h3 className="text-xl font-semibold text-white mb-6">Event Subscriptions</h3>
          
          <div className="space-y-6">
            <div className="border border-zinc-800 rounded-xl overflow-hidden">
              <div className="bg-zinc-800/30 px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h4 className="font-semibold text-white text-sm">Security & Compliance</h4>
              </div>
              <div className="divide-y divide-zinc-800/50">
                <Controller name="securityBotDetected" control={control} render={({ field }) => <Toggle field={field} label="High-Confidence Bot Detected" desc="Alert when the ML engine blocks a severe bot attack." />} />
                <Controller name="securityPhishingFlag" control={control} render={({ field }) => <Toggle field={field} label="Phishing URL Flagged" desc="Alert when a destination URL is flagged for malware/phishing." />} />
                <Controller name="securityNewDevice" control={control} render={({ field }) => <Toggle field={field} label="New Device Login" desc="Alert when your account is accessed from an unrecognized device." />} />
              </div>
            </div>

            <div className="border border-zinc-800 rounded-xl overflow-hidden">
              <div className="bg-zinc-800/30 px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-400" />
                <h4 className="font-semibold text-white text-sm">System & Infrastructure</h4>
              </div>
              <div className="divide-y divide-zinc-800/50">
                <Controller name="systemEngineDisconnect" control={control} render={({ field }) => <Toggle field={field} label="Oracle ML Engine Disconnected" desc="CRITICAL: Alert when Next.js loses connection to the ARM64 cluster." />} />
                <Controller name="systemSyncFailure" control={control} render={({ field }) => <Toggle field={field} label="Model Weights Sync Failure" desc="Alert when background sync from Supabase ml_models table fails." />} />
              </div>
            </div>

            <div className="border border-zinc-800 rounded-xl overflow-hidden">
              <div className="bg-zinc-800/30 px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <h4 className="font-semibold text-white text-sm">Billing & Usage</h4>
              </div>
              <div className="divide-y divide-zinc-800/50">
                <Controller name="billingUsageWarning" control={control} render={({ field }) => <Toggle field={field} label="Usage Limit Approaching" desc="Alert when you reach 80% and 100% of your tier limits." />} />
                <Controller name="billingInvoicePaid" control={control} render={({ field }) => <Toggle field={field} label="Invoice Paid" desc="Receive a receipt when your monthly subscription renews." />} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Bell className="w-5 h-5" />}
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
