'use client'

import React from 'react'
import { Globe2 } from 'lucide-react'

export default function GeoDistributionMap() {
  const regions = [
    { name: 'North America', value: 45, color: '#818cf8' },
    { name: 'Europe', value: 30, color: '#c084fc' },
    { name: 'Asia', value: 15, color: '#38bdf8' },
    { name: 'South America', value: 7, color: '#f472b6' },
    { name: 'Africa & Others', value: 3, color: '#fbbf24' },
  ]

  return (
    <div className="liquid-glass border border-white/5 rounded-2xl shadow-2xl p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <Globe2 className="w-5 h-5 text-indigo-400" />
        <h3 className="font-semibold text-white">Geo Distribution</h3>
      </div>

      <div className="flex-1 flex items-center justify-center relative min-h-[200px]">
        {/* Decorative Map SVG - Premium abstract representation */}
        <svg viewBox="0 0 400 200" className="w-full h-full absolute inset-0 opacity-20">
          <path d="M50 80 Q 100 50 150 100 T 250 120 T 350 70" fill="none" stroke="white" strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="50" cy="80" r="4" fill="#818cf8" />
          <circle cx="150" cy="100" r="6" fill="#c084fc" />
          <circle cx="250" cy="120" r="3" fill="#38bdf8" />
          <circle cx="350" cy="70" r="8" fill="#f472b6" />
        </svg>

        <div className="w-full max-w-sm space-y-4 z-10">
          {regions.map((region, i) => (
            <div key={region.name} className="relative">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/70 font-medium">{region.name}</span>
                <span className="text-white/40">{region.value}%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: `${region.value}%`, 
                    backgroundColor: region.color,
                    boxShadow: `0 0 10px ${region.color}80`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
