'use client'

import React from 'react'

const features = [
  { name: 'Request Rate / Min', importance: 0.85, type: 'velocity' },
  { name: 'UA Entropy', importance: 0.72, type: 'payload' },
  { name: 'Bot Pattern in UA', importance: 0.68, type: 'payload' },
  { name: 'Geo Mismatch', importance: 0.55, type: 'network' },
  { name: 'ASN Type (Datacenter)', importance: 0.49, type: 'network' },
  { name: 'Sec-Fetch-* Missing', importance: 0.42, type: 'headers' },
  { name: 'Velocity Score', importance: 0.38, type: 'velocity' },
  { name: 'Headless Browser Fingerprint', importance: 0.31, type: 'payload' },
]

export default function FeatureImportanceBar() {
  const max = Math.max(...features.map(f => f.importance))

  return (
    <div className="liquid-glass border border-white/5 rounded-2xl shadow-2xl p-6">
      <h3 className="font-semibold text-white mb-2">Feature Importance (SHAP values)</h3>
      <p className="text-xs text-white/40 mb-6">Which signals drive the neural network decisions?</p>

      <div className="space-y-4">
        {features.map((feat, i) => {
          const pct = (feat.importance / max) * 100
          
          let color = '#818cf8' // default
          if (feat.type === 'velocity') color = '#ef4444' // red
          if (feat.type === 'payload') color = '#fbbf24' // amber
          if (feat.type === 'network') color = '#38bdf8' // light blue

          return (
            <div key={feat.name} className="relative">
              <div className="flex justify-between items-end mb-1">
                <span className="text-xs font-medium text-white/80">{feat.name}</span>
                <span className="text-[10px] font-mono text-white/40">{feat.importance.toFixed(2)}</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: color,
                    boxShadow: `0 0 8px ${color}80`
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-center gap-4 mt-6 border-t border-white/5 pt-4">
        {[
          { label: 'Velocity', color: 'bg-red-400 shadow-red-400' },
          { label: 'Payload', color: 'bg-amber-400 shadow-amber-400' },
          { label: 'Network', color: 'bg-sky-400 shadow-sky-400' },
          { label: 'Headers', color: 'bg-indigo-400 shadow-indigo-400' }
        ].map(legend => (
          <div key={legend.label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${legend.color}`} style={{ boxShadow: '0 0 6px currentColor' }} />
            <span className="text-[10px] text-white/50 uppercase">{legend.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
