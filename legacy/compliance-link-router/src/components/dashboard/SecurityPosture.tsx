'use client'

import React, { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

const checks = [
  { label: 'Input Bounds Validation',    status: true,  detail: 'All 12 endpoints validated' },
  { label: 'XSS / SQLi Protection',      status: true,  detail: 'WAF rules active (v3.2)' },
  { label: 'Row-Level Security (RLS)',    status: true,  detail: 'Supabase RLS enforced' },
  { label: 'Rate Limiting',              status: true,  detail: '5000 req/min per tenant' },
  { label: 'ML Engine',                  status: true,  detail: 'Model v2.4.1 — 99.2% acc.' },
  { label: 'Audit Logging',              status: true,  detail: 'All events captured' },
]

const R = 54
const STROKE = 8
const CIRCUMFERENCE = 2 * Math.PI * R
const SCORE = 97

export default function SecurityPosture() {
  const [animated, setAnimated] = useState(false)
  const [checkVisible, setCheckVisible] = useState<boolean[]>(Array(checks.length).fill(false))

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300)
    checks.forEach((_, i) => {
      setTimeout(() => {
        setCheckVisible(prev => {
          const next = [...prev]
          next[i] = true
          return next
        })
      }, 600 + i * 120)
    })
    return () => clearTimeout(t)
  }, [])

  const offset = CIRCUMFERENCE - (animated ? (SCORE / 100) * CIRCUMFERENCE : CIRCUMFERENCE)

  return (
    <div
      className="rounded-2xl p-5 h-full liquid-glass border border-white/5 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-white text-sm">Security Posture</h3>
          <p className="text-xs text-foreground/40 mt-0.5">Compliance score</p>
        </div>
      </div>

      {/* Gauge */}
      <div className="flex flex-col items-center mb-5">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <defs>
            <linearGradient id="score-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#7c3aed" />
              <stop offset="50%"  stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Track */}
          <circle
            cx="70" cy="70" r={R}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={STROKE}
          />

          {/* Score arc */}
          <circle
            cx="70" cy="70" r={R}
            fill="none"
            stroke="url(#score-grad)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform="rotate(-90 70 70)"
            style={{
              transition: 'stroke-dashoffset 1.8s cubic-bezier(0.22,1,0.36,1)',
              filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.5)) drop-shadow(0 0 20px rgba(6,182,212,0.3))',
            }}
          />

          {/* Center text */}
          <text x="70" y="64" textAnchor="middle" fontSize="28" fontWeight="700" fill="white" fontFamily="General Sans, sans-serif">
            {SCORE}
          </text>
          <text x="70" y="82" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.4)" fontFamily="Geist Sans, sans-serif">
            / 100
          </text>
          <text x="70" y="98" textAnchor="middle" fontSize="9" fill="#10b981" fontFamily="General Sans, sans-serif" fontWeight="600">
            EXCELLENT
          </text>
        </svg>
      </div>

      {/* Checks */}
      <div className="space-y-2">
        {checks.map((check, i) => (
          <div
            key={check.label}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 transition-all duration-300"
            style={{
              background: checkVisible[i] ? 'rgba(16,185,129,0.06)' : 'transparent',
              border: `1px solid ${checkVisible[i] ? 'rgba(16,185,129,0.15)' : 'transparent'}`,
              opacity: checkVisible[i] ? 1 : 0,
              transform: checkVisible[i] ? 'translateX(0)' : 'translateX(-10px)',
            }}
          >
            <CheckCircle2
              className="w-3.5 h-3.5 flex-shrink-0 transition-all duration-300"
              style={{
                color: checkVisible[i] ? '#10b981' : 'rgba(255,255,255,0.2)',
                filter: checkVisible[i] ? 'drop-shadow(0 0 4px rgba(16,185,129,0.6))' : 'none',
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[rgba(255,255,255,0.8)]">{check.label}</p>
              <p className="text-[10px] text-[rgba(255,255,255,0.35)] truncate">{check.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
