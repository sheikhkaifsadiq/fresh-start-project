'use client'

import React, { useState, useRef } from 'react'

const W = 600
const H = 250
const PAD = { top: 20, right: 20, bottom: 30, left: 40 }
const CHART_W = W - PAD.left - PAD.right
const CHART_H = H - PAD.top - PAD.bottom

export default function ModelPerformanceChart() {
  const [metric, setMetric] = useState<'loss' | 'accuracy'>('accuracy')
  const svgRef = useRef<SVGSVGElement>(null)

  // Dummy training data for premium UI
  const epochs = Array.from({ length: 50 }, (_, i) => i)
  const lossData = epochs.map(e => 0.8 * Math.exp(-e / 10) + 0.05 + Math.random() * 0.05)
  const valLossData = epochs.map(e => 0.8 * Math.exp(-e / 10) + 0.08 + Math.random() * 0.08)
  
  const accData = epochs.map(e => 1 - 0.5 * Math.exp(-e / 15) - Math.random() * 0.02)
  const valAccData = epochs.map(e => 1 - 0.5 * Math.exp(-e / 15) - Math.random() * 0.04)

  const data1 = metric === 'loss' ? lossData : accData
  const data2 = metric === 'loss' ? valLossData : valAccData
  
  const minVal = metric === 'loss' ? 0 : 0.4
  const maxVal = metric === 'loss' ? 1.0 : 1.0
  const range = maxVal - minVal

  function getCoords(data: number[]) {
    return data.map((v, i) => {
      const x = PAD.left + (i / (epochs.length - 1)) * CHART_W
      const y = PAD.top + CHART_H - ((v - minVal) / range) * CHART_H
      return `${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' L ')
  }

  const path1 = `M ${getCoords(data1)}`
  const path2 = `M ${getCoords(data2)}`

  return (
    <div className="liquid-glass border border-white/5 rounded-2xl shadow-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-white">Training Metrics (Epochs 0-50)</h3>
        <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-1">
          <button onClick={() => setMetric('accuracy')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${metric === 'accuracy' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>Accuracy</button>
          <button onClick={() => setMetric('loss')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${metric === 'loss' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>Loss</button>
        </div>
      </div>

      <div className="w-full">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          {/* Y Axis */}
          {[0, 0.25, 0.5, 0.75, 1].map(pct => {
            const y = PAD.top + CHART_H - pct * CHART_H
            const val = minVal + pct * range
            return (
              <g key={pct}>
                <line x1={PAD.left} y1={y} x2={PAD.left + CHART_W} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
                <text x={PAD.left - 10} y={y + 4} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.4)" fontFamily="sans-serif">
                  {val.toFixed(2)}
                </text>
              </g>
            )
          })}

          {/* X Axis */}
          {[0, 10, 20, 30, 40, 50].map(epoch => {
            const x = PAD.left + (epoch / 50) * CHART_W
            return (
              <text key={epoch} x={x} y={PAD.top + CHART_H + 20} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.4)" fontFamily="sans-serif">
                Ep {epoch}
              </text>
            )
          })}

          {/* Lines */}
          <path d={path1} fill="none" stroke="#818cf8" strokeWidth="2.5" style={{ filter: 'drop-shadow(0 0 6px rgba(129,140,248,0.5))' }} />
          <path d={path2} fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeDasharray="6 6" style={{ filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.5))' }} />
        </svg>

        <div className="flex justify-center gap-6 mt-2">
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-[#818cf8]" />
            <span className="text-xs text-white/50">Training {metric === 'loss' ? 'Loss' : 'Accuracy'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-[#fbbf24] border border-dashed border-[#fbbf24]" />
            <span className="text-xs text-white/50">Validation {metric === 'loss' ? 'Loss' : 'Accuracy'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
