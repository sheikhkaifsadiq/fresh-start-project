"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Webhook,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Activity,
  Code,
  Shield,
  Loader2,
  Send,
  AlertTriangle,
  FileJson
} from "lucide-react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const webhookSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  url: z.string().url("Must be a valid HTTPS URL").startsWith("https://", "Webhook URLs must use HTTPS for security"),
  secret: z.string().optional(),
  events: z.array(z.string()).min(1, "Select at least one event to subscribe to"),
  active: z.boolean().default(true)
});

type WebhookFormValues = z.infer<typeof webhookSchema>;

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  last_triggered: string | null;
  last_status: number | null;
  secret_hint: string;
}

const AVAILABLE_EVENTS = [
  { id: "link.created", label: "Link Created", category: "Links" },
  { id: "link.updated", label: "Link Updated", category: "Links" },
  { id: "link.deleted", label: "Link Deleted", category: "Links" },
  { id: "click.recorded", label: "Click Recorded", category: "Analytics" },
  { id: "bot.detected", label: "Bot Detected", category: "Security" },
  { id: "compliance.flagged", label: "Compliance Flagged", category: "Security" }
];

export default function WebhookSettings() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([
    {
      id: "wh_12345",
      name: "Slack Notifications",
      url: "https://hooks.slack.com/services/T000/B000/XXX",
      events: ["bot.detected", "compliance.flagged"],
      active: true,
      last_triggered: new Date().toISOString(),
      last_status: 200,
      secret_hint: "whsec_...8f9a"
    },
    {
      id: "wh_67890",
      name: "Internal Analytics DB",
      url: "https://api.acmecorp.com/webhooks/aegis",
      events: ["link.created", "click.recorded"],
      active: false,
      last_triggered: new Date(Date.now() - 86400000).toISOString(),
      last_status: 500,
      secret_hint: "whsec_...2b1c"
    }
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testPayloadModal, setTestPayloadModal] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const { control, handleSubmit, reset, formState: { errors } } = useForm<WebhookFormValues>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      name: "",
      url: "",
      secret: "",
      events: [],
      active: true
    }
  });

  const onSubmit = async (data: WebhookFormValues) => {
    // Simulate API save
    await new Promise(r => setTimeout(r, 1000));
    
    if (editingId) {
      setWebhooks(prev => prev.map(wh => wh.id === editingId ? {
        ...wh,
        name: data.name,
        url: data.url,
        events: data.events,
        active: data.active
      } : wh));
    } else {
      setWebhooks(prev => [...prev, {
        id: `wh_${Math.random().toString(36).substr(2, 9)}`,
        name: data.name,
        url: data.url,
        events: data.events,
        active: data.active,
        last_triggered: null,
        last_status: null,
        secret_hint: `whsec_...${Math.random().toString(36).substr(2, 4)}`
      }]);
    }
    
    setIsCreating(false);
    setEditingId(null);
    reset();
  };

  const handleEdit = (webhook: WebhookConfig) => {
    setEditingId(webhook.id);
    reset({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      active: webhook.active,
      secret: "" // Never populate secret
    });
    setIsCreating(true);
  };

  const handleDelete = (id: string) => {
    setWebhooks(prev => prev.filter(wh => wh.id !== id));
  };

  const handleTest = async (id: string) => {
    setTestStatus('loading');
    await new Promise(r => setTimeout(r, 1500));
    setTestStatus(Math.random() > 0.2 ? 'success' : 'error');
    setTimeout(() => {
      setTestStatus('idle');
      setTestPayloadModal(null);
    }, 2000);
  };

  const getStatusColor = (status: number | null) => {
    if (status === null) return "text-zinc-500 bg-zinc-500/10";
    if (status >= 200 && status < 300) return "text-emerald-500 bg-emerald-500/10";
    if (status >= 400) return "text-red-500 bg-red-500/10";
    return "text-amber-500 bg-amber-500/10";
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Webhook className="w-8 h-8 text-fuchsia-500" />
            Webhooks
          </h2>
          <p className="text-zinc-400 mt-2 text-lg">
            Receive real-time HTTP requests to your servers when events happen in Aegis Route.
          </p>
        </div>
        {!isCreating && (
          <button
            onClick={() => { reset(); setIsCreating(true); setEditingId(null); }}
            className="px-5 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-fuchsia-500/20"
          >
            <Plus className="w-5 h-5" />
            Add Endpoint
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isCreating ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 md:p-8 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-semibold text-white">
                {editingId ? "Edit Endpoint" : "New Endpoint"}
              </h3>
              <button 
                onClick={() => setIsCreating(false)}
                className="p-2 text-zinc-400 hover:text-white bg-zinc-800/50 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Endpoint Name</label>
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => (
                        <input {...field} placeholder="e.g. Analytics Ingestion" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-fuchsia-500 outline-none" />
                      )}
                    />
                    {errors.name && <p className="text-red-400 text-sm">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Endpoint URL</label>
                    <Controller
                      name="url"
                      control={control}
                      render={({ field }) => (
                        <input {...field} placeholder="https://api.yourdomain.com/webhook" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-fuchsia-500 outline-none font-mono text-sm" />
                      )}
                    />
                    {errors.url && <p className="text-red-400 text-sm">{errors.url.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300 flex justify-between">
                      Signing Secret
                      <span className="text-xs text-zinc-500 font-normal">Optional</span>
                    </label>
                    <Controller
                      name="secret"
                      control={control}
                      render={({ field }) => (
                        <div className="relative">
                          <Shield className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                          <input type="password" {...field} placeholder={editingId ? "Leave blank to keep existing secret" : "Leave blank to auto-generate"} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-fuchsia-500 outline-none font-mono text-sm" />
                        </div>
                      )}
                    />
                    <p className="text-xs text-zinc-500">Used to verify that webhook requests are coming from Aegis Route.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-medium text-zinc-300">Events to send</label>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {Array.from(new Set(AVAILABLE_EVENTS.map(e => e.category))).map(category => (
                      <div key={category} className="space-y-2">
                        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{category}</h4>
                        {AVAILABLE_EVENTS.filter(e => e.category === category).map(event => (
                          <Controller
                            key={event.id}
                            name="events"
                            control={control}
                            render={({ field }) => (
                              <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-900 cursor-pointer transition-colors group">
                                <input
                                  type="checkbox"
                                  className="rounded bg-zinc-900 border-zinc-700 text-fuchsia-500 focus:ring-fuchsia-500/20"
                                  checked={field.value.includes(event.id)}
                                  onChange={(e) => {
                                    const newValue = e.target.checked
                                      ? [...field.value, event.id]
                                      : field.value.filter(val => val !== event.id);
                                    field.onChange(newValue);
                                  }}
                                />
                                <span className="text-sm text-zinc-300 group-hover:text-white transition-colors font-mono">{event.id}</span>
                              </label>
                            )}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                  {errors.events && <p className="text-red-400 text-sm">{errors.events.message}</p>}
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
                <Controller
                  name="active"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" className="sr-only" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                        <div className={`w-10 h-6 rounded-full transition-colors ${field.value ? 'bg-fuchsia-500' : 'bg-zinc-700'}`}></div>
                        <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${field.value ? 'translate-x-4' : 'translate-x-0'}`}></div>
                      </div>
                      <span className="text-sm text-zinc-300 font-medium">Endpoint Active</span>
                    </label>
                  )}
                />
                
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsCreating(false)} className="px-5 py-2.5 text-zinc-300 hover:text-white font-medium transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-fuchsia-500/20">
                    Save Endpoint
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {webhooks.length === 0 ? (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
                  <Webhook className="w-8 h-8 text-zinc-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No Webhooks Configured</h3>
                <p className="text-zinc-400 max-w-md mx-auto mb-6">
                  Set up webhooks to automatically push events to your servers when they happen. Useful for custom analytics or immediate notifications.
                </p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
                >
                  Create your first webhook
                </button>
              </div>
            ) : (
              webhooks.map((webhook) => (
                <div key={webhook.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl group hover:border-zinc-700 transition-colors">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-semibold text-white">{webhook.name}</h3>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${webhook.active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                          {webhook.active ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-zinc-400 font-mono text-sm bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-800/50 w-max max-w-full overflow-hidden">
                        <Code className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{webhook.url}</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {webhook.events.map(event => (
                          <span key={event} className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 text-xs font-mono">
                            {event}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-4 w-full md:w-auto">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex flex-col items-end">
                          <span className="text-zinc-500 text-xs mb-1">Last Triggered</span>
                          <span className="text-zinc-300">{webhook.last_triggered ? new Date(webhook.last_triggered).toLocaleString() : 'Never'}</span>
                        </div>
                        <div className="h-8 w-px bg-zinc-800"></div>
                        <div className="flex flex-col items-end">
                          <span className="text-zinc-500 text-xs mb-1">Status</span>
                          <span className={`font-mono font-medium px-2 py-0.5 rounded ${getStatusColor(webhook.last_status)}`}>
                            {webhook.last_status || '---'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full justify-end pt-2 border-t border-zinc-800/50 md:border-none md:pt-0">
                        <button 
                          onClick={() => setTestPayloadModal(webhook.id)}
                          className="px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          Test
                        </button>
                        <button 
                          onClick={() => handleEdit(webhook)}
                          className="px-3 py-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(webhook.id)}
                          className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {testPayloadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                    <Send className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Test Webhook Delivery</h3>
                    <p className="text-sm text-zinc-400">Send a mock ping event to verify connectivity.</p>
                  </div>
                </div>
                <button onClick={() => setTestPayloadModal(null)} className="text-zinc-500 hover:text-zinc-300">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 mb-6 custom-scrollbar">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                    <FileJson className="w-4 h-4" />
                    Request Payload
                  </h4>
                  <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-mono text-fuchsia-300 overflow-x-auto">
{`{
  "event": "ping",
  "created_at": "${new Date().toISOString()}",
  "data": {
    "webhook_id": "${testPayloadModal}",
    "message": "This is a test event from Aegis Route."
  }
}`}
                  </pre>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-zinc-300">Headers</h4>
                  <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-mono text-zinc-400 overflow-x-auto">
{`Content-Type: application/json
User-Agent: AegisRoute-Webhook/1.0
X-Aegis-Signature: t=1612345678,v1=a1b2c3d4...`}
                  </pre>
                </div>

                {testStatus === 'success' && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <div>
                      <div className="font-medium">Delivery Successful</div>
                      <div className="text-xs mt-1">Endpoint responded with 200 OK.</div>
                    </div>
                  </div>
                )}

                {testStatus === 'error' && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                    <div>
                      <div className="font-medium">Delivery Failed</div>
                      <div className="text-xs mt-1">Endpoint responded with 500 Internal Server Error.</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-800">
                <button
                  onClick={() => handleTest(testPayloadModal)}
                  disabled={testStatus === 'loading'}
                  className="px-6 py-2.5 bg-white hover:bg-zinc-200 text-black font-medium rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {testStatus === 'loading' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Send Test Event</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
