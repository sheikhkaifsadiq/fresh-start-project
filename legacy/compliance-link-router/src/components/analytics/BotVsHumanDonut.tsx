'use client'

import React from 'react'

interface Props {
  human: number
  bot: number
}

export default function BotVsHumanDonut({ human, bot }: Props) {
  const total = human + bot
  const humanPct = total > 0 ? (human / total) * 100 : 0
  const botPct = total > 0 ? (bot / total) * 100 : 0

  const radius = 60
  const circumference = 2 * Math.PI * radius
  const botDash = (botPct / 100) * circumference
  const humanDash = (humanPct / 100) * circumference

  return (
    <div className="liquid-glass border border-white/5 rounded-2xl shadow-2xl p-6 h-full flex flex-col items-center justify-center">
      <h3 className="font-semibold text-white w-full text-left mb-4">Traffic Quality</h3>
      
      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="96" cy="96" r={radius}
            fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16"
          />
          {/* Human Arc */}
          <circle
            cx="96" cy="96" r={radius}
            fill="none" stroke="#818cf8" strokeWidth="16"
            strokeDasharray={`${humanDash} ${circumference}`}
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 8px rgba(129,140,248,0.5))', transition: 'all 1s ease-out' }}
          />
          {/* Bot Arc (offset by human arc) */}
          <circle
            cx="96" cy="96" r={radius}
            fill="none" stroke="#fbbf24" strokeWidth="16"
            strokeDasharray={`${botDash} ${circumference}`}
            strokeDashoffset={-humanDash}
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.5))', transition: 'all 1s ease-out' }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white tracking-tighter">{humanPct.toFixed(0)}%</span>
          <span className="text-xs text-indigo-300/70 font-medium uppercase tracking-widest mt-1">Human</span>
        </div>
      </div>

      <div className="flex gap-6 mt-6 w-full justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]" />
          <span className="text-sm text-white/60">Human ({human.toLocaleString()})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
          <span className="text-sm text-white/60">Bot ({bot.toLocaleString()})</span>
        </div>
      </div>
    </div>
  )
}
