'use client'

import React, { useEffect, useRef, useState } from 'react'

const W = 700
const H = 200
const PAD = { top: 20, right: 20, bottom: 30, left: 45 }
const CHART_W = W - PAD.left - PAD.right
const CHART_H = H - PAD.top - PAD.bottom

function buildPath(data: number[], maxVal: number): string {
  const coords = data
    .map((v, i) => {
      const x = PAD.left + (i / (data.length - 1)) * CHART_W
      const y = PAD.top + CHART_H - (v / maxVal) * CHART_H
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' L ')
  return `M ${coords}`
}

function buildArea(data: number[], maxVal: number): string {
  const coords = data
    .map((v, i) => {
      const x = PAD.left + (i / (data.length - 1)) * CHART_W
      const y = PAD.top + CHART_H - (v / maxVal) * CHART_H
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' L ')
  const last = PAD.left + CHART_W
  const first = PAD.left
  const bottom = PAD.top + CHART_H
  return `M ${first},${bottom} L ${coords} L ${last},${bottom} Z`
}

interface Props {
  humanData: number[]
  botData: number[]
}

export default function TrafficChart({ humanData, botData }: Props) {
  const [cursor, setCursor] = useState<{ x: number; hVal: number; bVal: number; hour: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const hasData = humanData.some(v => v > 0) || botData.some(v => v > 0)

  // Fallback shape data if no traffic yet
  const displayHuman = hasData ? humanData : Array.from({ length: 24 }, (_, i) => Math.sin(i / 3) * 5 + 8)
  const displayBot   = hasData ? botData   : Array.from({ length: 24 }, (_, i) => Math.cos(i / 4) * 3 + 4)

  const maxVal = Math.max(...displayHuman, ...displayBot, 1)

  const humanPath = buildPath(displayHuman, maxVal)
  const botPath   = buildPath(displayBot, maxVal)

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const relX = e.clientX - rect.left
    const ratio = rect.width / W
    const svgX = relX / ratio
    const idx = Math.round(((svgX - PAD.left) / CHART_W) * (displayHuman.length - 1))
    const clamped = Math.max(0, Math.min(displayHuman.length - 1, idx))
    const x = PAD.left + (clamped / (displayHuman.length - 1)) * CHART_W
    setCursor({ x, hVal: displayHuman[clamped], bVal: displayBot[clamped], hour: clamped })
  }

  const ySteps = [0, Math.round(maxVal * 0.25), Math.round(maxVal * 0.5), Math.round(maxVal * 0.75), maxVal]

  return (
    <div className="rounded-2xl p-5 overflow-hidden liquid-glass border border-white/5 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white text-sm">Traffic Overview</h3>
          <p className="text-xs text-foreground/40 mt-0.5">
            {hasData ? 'Human vs Bot — last 24 hours (live)' : 'Human vs Bot — awaiting traffic data'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full inline-block bg-indigo-400 drop-shadow-[0_0_6px_rgba(129,140,248,0.5)]" />
            <span className="text-xs text-foreground/50">Human</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full inline-block bg-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
            <span className="text-xs text-foreground/50">Bot</span>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="w-full overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: '220px' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setCursor(null)}
        >
          <defs>
            <linearGradient id="humanGradLive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#818cf8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="botGradLive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#fbbf24" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
            </linearGradient>
            <filter id="glow-indigo">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-amber">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          {ySteps.map((v) => {
            const y = PAD.top + CHART_H - (v / maxVal) * CHART_H
            return (
              <g key={v}>
                <line x1={PAD.left} y1={y} x2={PAD.left + CHART_W} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.3)" fontFamily="JetBrains Mono, monospace">
                  {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                </text>
              </g>
            )
          })}

          {/* X axis labels (hours) */}
          {[0, 6, 12, 18, 23].map(h => {
            const x = PAD.left + (h / (displayHuman.length - 1)) * CHART_W
            return (
              <text key={h} x={x} y={PAD.top + CHART_H + 16} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)" fontFamily="JetBrains Mono, monospace">
                {`${String(h).padStart(2, '0')}:00`}
              </text>
            )
          })}

          {/* Human area */}
          <path d={buildArea(displayHuman, maxVal)} fill="url(#humanGradLive)" />
          {/* Bot area */}
          <path d={buildArea(displayBot, maxVal)} fill="url(#botGradLive)" />

          {/* Human line */}
          <path
            d={humanPath}
            fill="none" stroke="#818cf8" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            filter="url(#glow-indigo)"
            style={{ strokeDasharray: 2000, strokeDashoffset: 2000, animation: 'draw-path 2s ease forwards' }}
          />
          {/* Bot line */}
          <path
            d={botPath}
            fill="none" stroke="#fbbf24" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            filter="url(#glow-amber)"
            style={{ strokeDasharray: 2000, strokeDashoffset: 2000, animation: 'draw-path 2.2s ease 0.2s forwards' }}
          />

          {/* Cursor */}
          {cursor && (
            <g>
              <line x1={cursor.x} y1={PAD.top} x2={cursor.x} y2={PAD.top + CHART_H} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx={cursor.x} cy={PAD.top + CHART_H - (cursor.hVal / maxVal) * CHART_H} r="4" fill="#818cf8" style={{ filter: 'drop-shadow(0 0 6px #818cf8)' }} />
              <circle cx={cursor.x} cy={PAD.top + CHART_H - (cursor.bVal / maxVal) * CHART_H} r="4" fill="#fbbf24" style={{ filter: 'drop-shadow(0 0 6px #fbbf24)' }} />
              <foreignObject x={cursor.x > W - 120 ? cursor.x - 115 : cursor.x + 8} y={PAD.top} width="105" height="65">
                <div style={{ background: 'rgba(6,4,20,0.95)', border: '1px solid rgba(124,58,237,0.35)', borderRadius: '8px', padding: '6px 8px', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: 'white' }}>
                  <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '3px' }}>{`${String(cursor.hour).padStart(2, '0')}:00`}</div>
                  <div style={{ color: '#818cf8' }}>Human: {cursor.hVal}</div>
                  <div style={{ color: '#fbbf24' }}>Bot: {cursor.bVal}</div>
                </div>
              </foreignObject>
            </g>
          )}
        </svg>
      </div>
    </div>
  )
}
