'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitBranch, Plus, Shield, Globe, Clock, Zap, Settings2, Trash2 } from 'lucide-react'

const initialRules = [
  { id: 1, name: 'Block Tor Exit Nodes', type: 'Security', status: 'active', action: 'Block', priority: 1, icon: Shield, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { id: 2, name: 'EU GDPR Compliance', type: 'Geo-Routing', status: 'active', action: 'Redirect', priority: 2, icon: Globe, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  { id: 3, name: 'Rate Limit API (1k/s)', type: 'Rate Limiting', status: 'active', action: 'Throttle', priority: 3, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 4, name: 'Maintenance Window', type: 'Time-Based', status: 'inactive', action: 'Bypass', priority: 4, icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/10' },
]

export default function RulesPage() {
  const [rules, setRules] = useState(initialRules)

  return (
    <div className="w-full h-full max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-pink-500/10 rounded-xl">
              <GitBranch className="w-8 h-8 text-pink-500" />
            </div>
            Edge Routing Rules
          </h1>
          <p className="text-foreground/60 mt-2">Define advanced A/B testing, geographic overrides, and custom firewall logic at the Edge.</p>
        </div>
        <button className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)]">
          <Plus className="w-5 h-5" />
          Create Rule
        </button>
      </motion.div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <AnimatePresence>
          {rules.map((rule, idx) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ delay: idx * 0.1, duration: 0.3 }}
              className="group relative bg-background/50 border border-white/5 rounded-2xl p-6 hover:border-pink-500/30 hover:bg-white/[0.02] transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${rule.bg}`}>
                  <rule.icon className={`w-6 h-6 ${rule.color}`} />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    rule.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                  }`}>
                    {rule.status.toUpperCase()}
                  </span>
                  <button className="p-2 text-foreground/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                    <Settings2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-1">{rule.name}</h3>
              <p className="text-sm text-foreground/50 mb-4">{rule.type}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs text-foreground/40">Action</span>
                  <span className="text-sm font-medium text-white">{rule.action}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs text-foreground/40">Priority</span>
                  <span className="text-sm font-medium text-white">{rule.priority}</span>
                </div>
              </div>
              
              <div className="absolute inset-0 border-2 border-pink-500/0 rounded-2xl group-hover:border-pink-500/20 transition-all duration-500 pointer-events-none" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
