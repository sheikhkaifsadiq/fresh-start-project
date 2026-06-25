'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { RecentLog } from '@/app/(dashboard)/dashboard/page'

function getCountryFlag(ip: string | null): string {
  // Very lightweight mapping for common ranges — real geo would need an API
  if (!ip) return '🌐'
  const first = parseInt(ip.split('.')[0])
  if (first >= 1 && first <= 9) return '🇺🇸'
  if (first >= 13 && first <= 13) return '🇺🇸'
  if (first >= 35 && first <= 35) return '🇺🇸'
  if (first >= 52 && first <= 54) return '🇺🇸'
  if (first >= 66 && first <= 67) return '🇨🇦'
  if (first >= 72 && first <= 74) return '🇬🇧'
  if (first >= 77 && first <= 80) return '🇩🇪'
  if (first >= 81 && first <= 95) return '🇷🇺'
  if (first >= 103 && first <= 104) return '🇸🇬'
  if (first >= 178 && first <= 195) return '🇳🇱'
  if (first >= 110 && first <= 125) return '🇨🇳'
  return '🌐'
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function truncateUA(ua: string | null): string {
  if (!ua) return '—'
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari')) return 'Safari'
  if (ua.includes('curl')) return 'curl'
  if (ua.includes('python')) return 'Python'
  if (ua.includes('bot') || ua.includes('Bot')) return 'Bot UA'
  return ua.slice(0, 20) + '…'
}

interface Props {
  logs: RecentLog[]
}

export default function RecentActivity({ logs }: Props) {
  const isEmpty = logs.length === 0

  return (
    <div className="rounded-2xl overflow-hidden liquid-glass border border-white/5 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div>
          <h3 className="font-semibold text-white text-sm">Recent Activity</h3>
          <p className="text-xs text-foreground/40 mt-0.5">
            {isEmpty ? 'No routing events yet' : 'Live routing events from Supabase'}
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
          style={{
            background: isEmpty ? 'rgba(100,116,139,0.1)' : 'rgba(16,185,129,0.1)',
            border: `1px solid ${isEmpty ? 'rgba(100,116,139,0.2)' : 'rgba(16,185,129,0.2)'}`,
            color: isEmpty ? '#94a3b8' : '#10b981',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 6, height: 6,
              borderRadius: '50%',
              background: isEmpty ? '#94a3b8' : '#10b981',
              boxShadow: isEmpty ? 'none' : '0 0 6px rgba(16,185,129,0.8)',
            }}
          />
          {isEmpty ? 'Idle' : 'Live'}
        </div>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-white/60 text-sm font-medium">No routing events yet</p>
          <p className="text-white/30 text-xs mt-1">Create a link and share it to see live ML classifications appear here.</p>
        </div>
      )}

      {/* Table */}
      {!isEmpty && (
        <div className="overflow-auto max-h-80">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5">
                {['IP', 'Browser', 'Status', 'ML Score', 'Country', 'Time'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold uppercase tracking-wider text-white/30 text-[10px]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => {
                const isBlocked = log.action === 'BLOCKED'
                const score = log.bot_probability_score ?? 0
                return (
                  <tr
                    key={log.id}
                    className="border-b border-white/[0.03] hover:bg-violet-500/5 transition-colors duration-150"
                    style={{ animation: `slide-in-left 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 60}ms both` }}
                  >
                    <td className="px-4 py-2.5 font-mono text-violet-300 font-medium">
                      {log.ip_address ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-white/50">
                      {truncateUA(log.user_agent)}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={isBlocked ? 'glow-red' : 'glow-green'}>
                        {isBlocked ? '✗ Blocked' : '✓ Allowed'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={score * 100}
                          color={score > 0.7 ? 'red' : score > 0.4 ? 'amber' : 'green'}
                          className="w-16 h-1.5"
                          showShimmer={false}
                        />
                        <span
                          className="font-mono w-8"
                          style={{ color: score > 0.7 ? '#f87171' : score > 0.4 ? '#fbbf24' : '#10b981' }}
                        >
                          {score.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-base">
                      {getCountryFlag(log.ip_address)}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-white/40">
                      {formatTime(log.created_at)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
