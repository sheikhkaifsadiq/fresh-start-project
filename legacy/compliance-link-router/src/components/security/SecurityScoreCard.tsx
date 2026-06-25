'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Activity, AlertTriangle } from 'lucide-react'

interface Props {
  score: number
  blockRate: number
}

export default function SecurityScoreCard({ score, blockRate }: Props) {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = `${(score / 100) * circumference} ${circumference}`

  return (
    <div className="liquid-glass border border-white/5 rounded-2xl shadow-2xl p-6 h-full flex flex-col items-center justify-between">
      <div className="w-full flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">System Health</h3>
        <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full font-medium flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> SECURE
        </span>
      </div>

      <div className="relative flex items-center justify-center my-6">
        <svg className="w-40 h-40 transform -rotate-90">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
          <motion.circle
            cx="80" cy="80" r={radius}
            fill="none" stroke="#10b981" strokeWidth="12" strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{ filter: 'drop-shadow(0 0 10px rgba(16,185,129,0.5))' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-white tracking-tighter">{score}</span>
          <span className="text-[10px] text-white/40 uppercase tracking-widest mt-1">/ 100</span>
        </div>
      </div>

      <div className="w-full space-y-3">
        <div className="flex items-center justify-between bg-white/[0.02] p-3 rounded-xl border border-white/5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-white/60">Block Rate</span>
          </div>
          <span className="text-sm font-semibold text-white">{(blockRate * 100).toFixed(1)}%</span>
        </div>
        <div className="flex items-center justify-between bg-white/[0.02] p-3 rounded-xl border border-white/5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-white/60">False Positives</span>
          </div>
          <span className="text-sm font-semibold text-white">0.1%</span>
        </div>
      </div>
    </div>
  )
}
