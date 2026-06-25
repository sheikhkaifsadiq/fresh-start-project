'use client'

import React, { useState } from 'react'
import { Ban, Search, ShieldAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { AuditLog } from './ThreatIntelFeed'

interface Props {
  logs: AuditLog[]
}

export default function BlockedIPTable({ logs }: Props) {
  const [search, setSearch] = useState('')

  // Aggregate blocks by IP
  const blockedIPs: Record<string, { count: number; last_seen: string; max_score: number }> = {}
  logs.forEach(log => {
    if (!log.ip_address) return
    if (!blockedIPs[log.ip_address]) {
      blockedIPs[log.ip_address] = { count: 0, last_seen: log.created_at, max_score: log.bot_probability_score || 0 }
    }
    blockedIPs[log.ip_address].count++
    if (log.created_at > blockedIPs[log.ip_address].last_seen) {
      blockedIPs[log.ip_address].last_seen = log.created_at
    }
    if ((log.bot_probability_score || 0) > blockedIPs[log.ip_address].max_score) {
      blockedIPs[log.ip_address].max_score = log.bot_probability_score || 0
    }
  })

  const data = Object.entries(blockedIPs).map(([ip, stats]) => ({
    ip,
    ...stats
  })).sort((a, b) => b.last_seen.localeCompare(a.last_seen))

  const filtered = search ? data.filter(d => d.ip.includes(search)) : data

  return (
    <div className="liquid-glass border border-white/5 rounded-2xl shadow-2xl overflow-hidden">
      <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Ban className="w-5 h-5 text-white/50" />
          <h3 className="font-semibold text-white">Blocked IP Registry</h3>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search IPs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>

      <div className="overflow-x-auto max-h-[400px]">
        <table className="w-full text-sm text-left">
          <thead className="bg-white/[0.02] text-white/40 text-xs uppercase tracking-wider sticky top-0 backdrop-blur-md">
            <tr>
              <th className="px-6 py-4 font-medium">IP Address</th>
              <th className="px-6 py-4 font-medium text-right">Block Count</th>
              <th className="px-6 py-4 font-medium text-right">Max Risk Score</th>
              <th className="px-6 py-4 font-medium text-right">Last Seen</th>
              <th className="px-6 py-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-white/30">
                  {search ? 'No IPs match your search.' : 'No blocked IPs in the registry.'}
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.ip} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-mono text-white/80">{item.ip}</td>
                  <td className="px-6 py-4 text-right">
                    <Badge variant="glow-red">{item.count}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-mono text-red-400">{(item.max_score * 100).toFixed(1)}%</span>
                  </td>
                  <td className="px-6 py-4 text-right text-white/40 font-mono text-xs">
                    {new Date(item.last_seen).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/70 transition-colors">
                      Unblock
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
