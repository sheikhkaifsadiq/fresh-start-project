'use client'

import React, { useState } from 'react'
import { Calendar, Download, TrendingUp, Users, ShieldAlert } from 'lucide-react'

interface Props {
  totalClicks: number
  totalHumans: number
  totalBots: number
}

export default function AnalyticsHeader({ totalClicks, totalHumans, totalBots }: Props) {
  const [range, setRange] = useState('30d')

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white/[0.02] p-6 rounded-2xl border border-white/5 shadow-xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Analytics Overview</h1>
        <p className="text-sm text-white/40 mt-1">Real-time traffic and ML classification insights</p>
        
        <div className="flex items-center gap-6 mt-6">
          <div>
            <p className="text-xs text-white/30 font-medium uppercase tracking-wider mb-1">Total Requests</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{totalClicks.toLocaleString()}</span>
              <span className="text-xs text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded font-medium">+12%</span>
            </div>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div>
            <p className="text-xs text-indigo-300/50 font-medium uppercase tracking-wider mb-1">Human Traffic</p>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span className="text-xl font-bold text-indigo-100">{totalHumans.toLocaleString()}</span>
            </div>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div>
            <p className="text-xs text-amber-300/50 font-medium uppercase tracking-wider mb-1">Bots Blocked</p>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span className="text-xl font-bold text-amber-100">{totalBots.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-4">
        <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-1">
          {['7d', '30d', '90d'].map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${range === r ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            >
              {r}
            </button>
          ))}
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white/80 transition-all">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>
    </div>
  )
}
