'use client'

import React, { useRef, useState, useEffect } from 'react'

interface Props {
  dates: string[]
  humanSeries: number[]
  botSeries: number[]
}

const W = 800
const H = 300
const PAD = { top: 20, right: 20, bottom: 40, left: 50 }
const CHART_W = W - PAD.left - PAD.right
const CHART_H = H - PAD.top - PAD.bottom

function buildPath(data: number[], maxVal: number): string {
  if (data.length === 0) return ''
  if (data.length === 1) return `M ${PAD.left},${PAD.top + CHART_H - (data[0] / maxVal) * CHART_H} L ${PAD.left + CHART_W},${PAD.top + CHART_H - (data[0] / maxVal) * CHART_H}`
  
  const coords = data
    .map((v, i) => {
      const x = PAD.left + (i / (data.length - 1)) * CHART_W
      const y = PAD.top + CHART_H - (v / maxVal) * CHART_H
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' L ')
  return `M ${coords}`
}

export default function ClicksOverTimeChart({ dates, humanSeries, botSeries }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [cursor, setCursor] = useState<{ x: number; hVal: number; bVal: number; date: string } | null>(null)

  // Use dummy data if no real data to ensure the chart looks premium
  const hasData = dates.length > 0
  const displayDates = hasData ? dates : Array.from({ length: 30 }, (_, i) => `2026-06-${String(i + 1).padStart(2, '0')}`)
  const displayHuman = hasData ? humanSeries : Array.from({ length: 30 }, (_, i) => Math.floor(Math.sin(i / 5) * 50 + 100))
  const displayBot = hasData ? botSeries : Array.from({ length: 30 }, (_, i) => Math.floor(Math.cos(i / 3) * 20 + 30))

  const maxVal = Math.max(...displayHuman, ...displayBot, 10)
  const humanPath = buildPath(displayHuman, maxVal)
  const botPath = buildPath(displayBot, maxVal)

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const relX = e.clientX - rect.left
    const ratio = rect.width / W
    const svgX = relX / ratio
    const idx = Math.round(((svgX - PAD.left) / CHART_W) * (displayHuman.length - 1))
    const clamped = Math.max(0, Math.min(displayHuman.length - 1, idx))
    const x = PAD.left + (clamped / (displayHuman.length - 1)) * CHART_W
    setCursor({ x, hVal: displayHuman[clamped], bVal: displayBot[clamped], date: displayDates[clamped] })
  }

  const ySteps = [0, Math.round(maxVal * 0.33), Math.round(maxVal * 0.66), maxVal]

  return (
    <div className="liquid-glass border border-white/5 rounded-2xl p-6 shadow-2xl">
      <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        Traffic Volume {hasData ? '' : '(Demo Data)'}
      </h3>
      
      <div className="w-full overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setCursor(null)}
        >
          <defs>
            <filter id="glow-h">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-b">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Y Axis Grid */}
          {ySteps.map((v) => {
            const y = PAD.top + CHART_H - (v / maxVal) * CHART_H
            return (
              <g key={v}>
                <line x1={PAD.left} y1={y} x2={PAD.left + CHART_W} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
                <text x={PAD.left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="rgba(255,255,255,0.4)" fontFamily="sans-serif">
                  {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                </text>
              </g>
            )
          })}

          {/* X Axis Labels (every 7 days) */}
          {displayDates.map((d, i) => {
            if (i % Math.ceil(displayDates.length / 5) !== 0 && i !== displayDates.length - 1) return null
            const x = PAD.left + (i / (displayDates.length - 1)) * CHART_W
            return (
              <text key={i} x={x} y={PAD.top + CHART_H + 20} textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.4)" fontFamily="sans-serif">
                {new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </text>
            )
          })}

          {/* Lines */}
          <path d={humanPath} fill="none" stroke="#818cf8" strokeWidth="3" filter="url(#glow-h)" style={{ animation: 'draw-path 1.5s ease-out forwards', strokeDasharray: 3000, strokeDashoffset: 3000 }} />
          <path d={botPath} fill="none" stroke="#fbbf24" strokeWidth="3" filter="url(#glow-b)" style={{ animation: 'draw-path 1.5s ease-out 0.2s forwards', strokeDasharray: 3000, strokeDashoffset: 3000 }} />

          {/* Interactive Cursor Tooltip */}
          {cursor && (
            <g>
              <line x1={cursor.x} y1={PAD.top} x2={cursor.x} y2={PAD.top + CHART_H} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              <circle cx={cursor.x} cy={PAD.top + CHART_H - (cursor.hVal / maxVal) * CHART_H} r="5" fill="#818cf8" />
              <circle cx={cursor.x} cy={PAD.top + CHART_H - (cursor.bVal / maxVal) * CHART_H} r="5" fill="#fbbf24" />
              <foreignObject x={cursor.x > W - 140 ? cursor.x - 130 : cursor.x + 10} y={PAD.top} width="120" height="80">
                <div className="bg-black/80 backdrop-blur border border-white/10 rounded-lg p-3 text-xs shadow-xl">
                  <p className="text-white/50 mb-2 font-medium">{new Date(cursor.date).toLocaleDateString()}</p>
                  <p className="text-indigo-400 font-bold flex justify-between"><span>Human:</span> <span>{cursor.hVal}</span></p>
                  <p className="text-amber-400 font-bold flex justify-between mt-1"><span>Bot:</span> <span>{cursor.bVal}</span></p>
                </div>
              </foreignObject>
            </g>
          )}
        </svg>
      </div>
    </div>
  )
}
