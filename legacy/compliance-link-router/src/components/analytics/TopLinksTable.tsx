'use client'

import React from 'react'
import { ExternalLink, ShieldAlert } from 'lucide-react'

interface TopLink {
  id: string
  slug: string
  destination_url: string
  clicks: number
  bot_rate: number
  avg_ml_score: number
}

interface Props {
  links: TopLink[]
}

export default function TopLinksTable({ links }: Props) {
  // Use dummy data if empty to show the premium UI
  const displayLinks = links.length > 0 ? links : [
    { id: '1', slug: 'summer-sale', destination_url: 'https://store.com/sale', clicks: 4521, bot_rate: 0.12, avg_ml_score: 0.08 },
    { id: '2', slug: 'docs-api', destination_url: 'https://docs.aegisroute.io/v1', clicks: 3102, bot_rate: 0.05, avg_ml_score: 0.02 },
    { id: '3', slug: 'partner-portal', destination_url: 'https://partners.com/login', clicks: 1840, bot_rate: 0.45, avg_ml_score: 0.51 },
    { id: '4', slug: 'webinar-signup', destination_url: 'https://zoom.us/w/123', clicks: 950, bot_rate: 0.82, avg_ml_score: 0.88 },
    { id: '5', slug: 'app-download', destination_url: 'https://appstore.com/aegis', clicks: 620, bot_rate: 0.02, avg_ml_score: 0.01 },
  ]

  return (
    <div className="liquid-glass border border-white/5 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <h3 className="font-semibold text-white">Top Performing Links</h3>
        <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-md">Last 30 Days</span>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="bg-white/[0.02] text-white/40 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-medium">Link</th>
              <th className="px-6 py-4 font-medium text-right">Clicks</th>
              <th className="px-6 py-4 font-medium text-right">Bot Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {displayLinks.map((link, i) => (
              <tr key={link.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/5 text-white/50 text-xs font-bold font-mono">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-mono text-indigo-300 font-medium">/{link.slug}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-white/30 truncate max-w-[200px]">
                        <ExternalLink className="w-3 h-3" />
                        {link.destination_url.replace(/^https?:\/\//, '')}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-semibold text-white">{link.clicks.toLocaleString()}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-col items-end gap-1">
                    <span className={`font-mono text-xs font-medium ${link.bot_rate > 0.5 ? 'text-red-400' : link.bot_rate > 0.2 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {(link.bot_rate * 100).toFixed(1)}%
                    </span>
                    {link.bot_rate > 0.5 && <ShieldAlert className="w-3.5 h-3.5 text-red-400/50" />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
