'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, Cpu, Globe, Crosshair } from 'lucide-react'

export interface AuditLog {
  id: string
  ip_address: string | null
  user_agent: string | null
  bot_probability_score: number | null
  action: string | null
  created_at: string
}

interface Props {
  logs: AuditLog[]
}

function truncateUA(ua: string | null) {
  if (!ua) return 'Unknown Client'
  if (ua.length > 30) return ua.substring(0, 30) + '...'
  return ua
}

export default function ThreatIntelFeed({ logs }: Props) {
  const [displayLogs, setDisplayLogs] = useState<AuditLog[]>([])

  // Simulate a live feed by slowly adding logs to the view if they were all loaded at once
  useEffect(() => {
    if (logs.length === 0) return
    setDisplayLogs(logs.slice(0, 5))
    let idx = 5
    const interval = setInterval(() => {
      if (idx < logs.length) {
        setDisplayLogs(prev => [logs[idx], ...prev].slice(0, 10))
        idx++
      } else {
        clearInterval(interval)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [logs])

  const isEmpty = displayLogs.length === 0

  return (
    <div className="liquid-glass border border-white/5 rounded-2xl shadow-2xl overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-400" />
          <h3 className="font-semibold text-white">Live Threat Feed</h3>
        </div>
        <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          Monitoring
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-white/30 text-sm">
            <Crosshair className="w-8 h-8 mb-2 opacity-50" />
            <p>No active threats detected.</p>
          </div>
        ) : (
          <AnimatePresence>
            {displayLogs.map((log) => {
              const score = log.bot_probability_score ?? 0
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 to-amber-500" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-white/40" />
                      <span className="font-mono text-sm text-white/90">{log.ip_address || 'Unknown IP'}</span>
                    </div>
                    <span className="text-xs text-white/40 font-mono">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-white/50 flex items-center gap-1.5 truncate max-w-[200px]">
                      <Cpu className="w-3.5 h-3.5" />
                      {truncateUA(log.user_agent)}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs font-mono text-red-400">
                      ML Score: {(score * 100).toFixed(1)}%
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
