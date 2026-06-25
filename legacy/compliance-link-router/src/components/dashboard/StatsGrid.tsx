'use client'

import React, { useState, useEffect, useRef } from 'react'
import { TrendingUp, TrendingDown, Activity, Link2, Shield, Zap } from 'lucide-react'
import type { DashboardStats } from '@/app/(dashboard)/dashboard/page'

interface StatCardProps {
  label: string
  value: string
  change: number
  icon: React.ReactNode
  color: string
  sparkData: number[]
  delay: number
}

function SparkLine({ data, color }: { data: number[]; color: string }) {
  const nonZero = data.filter(v => v > 0)
  const displayData = nonZero.length > 1 ? data : Array.from({ length: 12 }, (_, i) => i + 1)

  const max = Math.max(...displayData)
  const min = Math.min(...displayData)
  const range = max - min || 1
  const w = 80, h = 28
  const step = w / (displayData.length - 1)
  const points = displayData
    .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
    .join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${h} ${points} ${(displayData.length - 1) * step},${h}`}
        fill={`url(#spark-${color.replace('#', '')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter: `drop-shadow(0 0 4px ${color})`,
          strokeDasharray: 200,
          strokeDashoffset: 200,
          animation: 'draw-path 1.2s ease forwards',
        }}
      />
    </svg>
  )
}

function AnimatedCounter({ target }: { target: string }) {
  const [display, setDisplay] = useState('0')
  const ref = useRef<number | null>(null)

  useEffect(() => {
    const raw = target.replace(/[^0-9.]/g, '')
    const numeric = parseFloat(raw) || 0
    const suffix = target.replace(/[0-9.,]/g, '').replace(/^[\s]+/, '')
    const start = performance.now()
    const duration = 1400

    const tick = (now: number) => {
      const elapsed = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - elapsed, 3)
      const current = numeric * ease
      const formatted = target.includes('.')
        ? current.toFixed(1)
        : Math.round(current).toLocaleString()
      setDisplay(formatted + suffix)
      if (elapsed < 1) ref.current = requestAnimationFrame(tick)
    }
    ref.current = requestAnimationFrame(tick)
    return () => { if (ref.current) cancelAnimationFrame(ref.current) }
  }, [target])

  return <span>{display}</span>
}

function StatCard({ label, value, change, icon, color, sparkData, delay }: StatCardProps) {
  const isUp = change >= 0
  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden group hover-lift liquid-glass border border-white/5"
      style={{
        animation: `slide-in-up 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`,
        boxShadow: `0 0 30px ${color}08`,
        borderColor: `${color}20`,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = `0 20px 40px rgba(0,0,0,0.4), 0 0 30px ${color}30`
        el.style.borderColor = `${color}40`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = `0 0 30px ${color}08`
        el.style.borderColor = `${color}20`
      }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(circle at top right, ${color}12, transparent 60%)` }}
      />

      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/40 mb-1">
            {label}
          </p>
          <h3
            className="text-2xl font-bold tracking-tight"
            style={{ color }}
          >
            <AnimatedCounter target={value} />
          </h3>
        </div>

        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${color}30, ${color}10)`,
            border: `1px solid ${color}25`,
          }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-1.5">
          {isUp
            ? <TrendingUp className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
            : <TrendingDown className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />}
          <span
            className="text-xs font-semibold"
            style={{ color: isUp ? '#10b981' : '#ef4444' }}
          >
            {isUp ? '+' : ''}{change}%
          </span>
          <span className="text-xs text-white/30">vs last hr</span>
        </div>
        <SparkLine data={sparkData} color={color} />
      </div>
    </div>
  )
}

interface Props {
  stats: DashboardStats
}

export default function StatsGrid({ stats }: Props) {
  const { totalRequests, botsBlocked, activeRoutes, avgMlScore, trafficChange, humanBuckets, botBuckets } = stats

  // Build spark data from last 12 hours of chart buckets
  const now = new Date().getHours()
  const last12 = Array.from({ length: 12 }, (_, i) => (now - 11 + i + 24) % 24)
  const humanSpark = last12.map(h => humanBuckets[h])
  const botSpark   = last12.map(h => botBuckets[h])

  const statCards = [
    {
      label: 'Total Requests',
      value: totalRequests.toLocaleString(),
      change: trafficChange,
      icon: <Activity className="w-5 h-5" />,
      color: '#a78bfa',
      sparkData: humanSpark.map((v, i) => v + botSpark[i]),
    },
    {
      label: 'Bot Traffic Blocked',
      value: botsBlocked.toLocaleString(),
      change: trafficChange > 0 ? -trafficChange : trafficChange,
      icon: <Shield className="w-5 h-5" />,
      color: '#f87171',
      sparkData: botSpark,
    },
    {
      label: 'Active Routes',
      value: activeRoutes.toLocaleString(),
      change: 0,
      icon: <Link2 className="w-5 h-5" />,
      color: '#67e8f9',
      sparkData: Array.from({ length: 12 }, (_, i) => activeRoutes > 0 ? activeRoutes - i * 0.1 : i + 1),
    },
    {
      label: 'Avg ML Bot Score',
      value: `${avgMlScore}`,
      change: avgMlScore > 30 ? -5 : 2,
      icon: <Zap className="w-5 h-5" />,
      color: '#fbbf24',
      sparkData: last12.map(h => {
        const total = humanBuckets[h] + botBuckets[h]
        return total > 0 ? Math.round((botBuckets[h] / total) * 100) : 0
      }),
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {statCards.map((stat, i) => (
        <StatCard key={stat.label} {...stat} delay={i * 80} />
      ))}
    </div>
  )
}
