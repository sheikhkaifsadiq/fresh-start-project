'use client'

import React from 'react'
import { Bell, Mail, MessageSquare, Webhook } from 'lucide-react'

export default function NotificationSettings() {
  return (
    <div className="space-y-6">
      <div className="liquid-glass border border-white/5 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-400" />
            <h3 className="font-medium text-white">Email Notifications</h3>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {[
            { id: 'weekly', title: 'Weekly Digest', desc: 'Summary of your link performance and traffic.' },
            { id: 'security', title: 'Security Alerts', desc: 'Get notified of massive bot attacks or credential stuffing.' },
            { id: 'limits', title: 'Usage Limits', desc: 'Alert when approaching plan limits.' },
          ].map(item => (
            <div key={item.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="text-xs text-white/40">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked={item.id !== 'limits'} />
                <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="liquid-glass border border-white/5 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Webhook className="w-5 h-5 text-emerald-400" />
            <h3 className="font-medium text-white">Webhooks</h3>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-white/40 mb-4">Send real-time alerts to your own infrastructure.</p>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60">Webhook URL</label>
            <input type="url" placeholder="https://your-domain.com/webhook" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60">Secret Token (optional)</label>
            <input type="password" placeholder="wh_sec_..." className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors" />
          </div>
          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-all mt-2">
            Save Webhook
          </button>
        </div>
      </div>
    </div>
  )
}
