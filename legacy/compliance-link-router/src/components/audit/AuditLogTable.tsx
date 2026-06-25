'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Download, ChevronDown, ChevronRight, Cpu, Globe, Link2, Key, ShieldAlert } from 'lucide-react'

export interface Log {
  id: string
  created_at: string
  action: string
  details: Record<string, any>
  ip_address: string | null
  user_agent: string | null
  bot_probability_score: number | null
  links?: { slug: string }
}

interface Props {
  logs: Log[]
}

const PAGE_SIZE = 50

export default function AuditLogTable({ logs }: Props) {
  const [search, setSearch] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)

  const toggleRow = (id: string) => {
    const next = new Set(expandedRows)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedRows(next)
  }

  const filtered = logs.filter(l => 
    l.action?.toLowerCase().includes(search.toLowerCase()) || 
    l.ip_address?.includes(search) ||
    l.links?.slug?.toLowerCase().includes(search.toLowerCase())
  )

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  function getActionIcon(action: string) {
    if (action === 'BLOCKED') return <ShieldAlert className="w-4 h-4 text-red-400" />
    if (action === 'REDIRECTED') return <Link2 className="w-4 h-4 text-emerald-400" />
    if (action.includes('AUTH') || action.includes('LOGIN')) return <Key className="w-4 h-4 text-indigo-400" />
    return <Cpu className="w-4 h-4 text-white/50" />
  }

  function getActionColor(action: string) {
    if (action === 'BLOCKED') return 'text-red-400 bg-red-400/10 border-red-400/20'
    if (action === 'REDIRECTED') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
    return 'text-white/70 bg-white/5 border-white/10'
  }

  return (
    <div className="liquid-glass border border-white/5 rounded-2xl shadow-2xl flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-white/5 flex flex-wrap items-center gap-4 bg-white/[0.02]">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search by IP, Action, or Slug..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white/80 transition-all">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white/80 transition-all">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left relative">
          <thead className="bg-black/60 backdrop-blur-xl text-white/40 text-xs uppercase tracking-wider sticky top-0 z-10 shadow-md border-b border-white/5">
            <tr>
              <th className="w-10 px-4 py-3"></th>
              <th className="px-4 py-3 font-medium">Timestamp</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">IP Address</th>
              <th className="px-4 py-3 font-medium">Target</th>
              <th className="px-4 py-3 font-medium">ML Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {paginated.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-white/30">
                  No logs found.
                </td>
              </tr>
            )}
            {paginated.map((log) => {
              const expanded = expandedRows.has(log.id)
              return (
                <React.Fragment key={log.id}>
                  <tr 
                    className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${expanded ? 'bg-white/[0.02]' : ''}`}
                    onClick={() => toggleRow(log.id)}
                  >
                    <td className="px-4 py-3 text-center">
                      <button className="text-white/30 hover:text-white">
                        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-white/60 text-xs">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium border uppercase tracking-wider ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-mono text-white/80">
                        <Globe className="w-3.5 h-3.5 text-white/30" />
                        {log.ip_address || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {log.links?.slug ? (
                        <span className="font-mono text-indigo-300">/{log.links.slug}</span>
                      ) : (
                        <span className="text-white/30">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {log.bot_probability_score !== null ? (
                        <span className={`font-mono ${log.bot_probability_score > 0.5 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {(log.bot_probability_score * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-white/30">-</span>
                      )}
                    </td>
                  </tr>
                  
                  {/* Expanded JSON view */}
                  <AnimatePresence>
                    {expanded && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <td colSpan={6} className="px-4 py-3 bg-black/40 border-b border-white/5">
                          <div className="p-4 rounded-xl bg-[#0a0a0a] border border-white/10 font-mono text-xs overflow-x-auto text-white/70">
                            <pre>{JSON.stringify({
                              id: log.id,
                              user_agent: log.user_agent,
                              details: log.details,
                            }, null, 2)}</pre>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
        <span className="text-xs text-white/40">
          Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} entries
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 rounded-lg text-xs text-white transition-all"
          >
            Previous
          </button>
          <span className="text-xs text-white/60 font-medium px-2">
            Page {page} of {totalPages || 1}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 rounded-lg text-xs text-white transition-all"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
