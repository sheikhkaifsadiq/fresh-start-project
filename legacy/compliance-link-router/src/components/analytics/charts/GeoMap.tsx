"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface GeoPoint {
  id: string;
  lat: number;
  lng: number;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface GeoMapProps {
  data: GeoPoint[];
  width?: number;
  height?: number;
  mapColor?: string;
  pointColor?: string;
  maxPointRadius?: number;
  minPointRadius?: number;
  title?: string;
  subtitle?: string;
  interactive?: boolean;
  onPointClick?: (point: GeoPoint) => void;
  formatValue?: (val: number) => string;
}

export const GeoMap: React.FC<GeoMapProps> = ({
  data,
  width = 800,
  height = 400,
  mapColor = "rgba(255, 255, 255, 0.05)",
  pointColor = "#3b82f6",
  maxPointRadius = 15,
  minPointRadius = 2,
  title,
  subtitle,
  interactive = true,
  onPointClick,
  formatValue = (v) => v.toLocaleString(),
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; data: GeoPoint } | null>(null);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width: w, height: h } = entries[0].contentRect;
        if (w > 0 && h > 0) setDimensions({ width: w, height: h });
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Simple equirectangular projection
  const project = (lat: number, lng: number, w: number, h: number) => {
    const x = (lng + 180) * (w / 360);
    const y = (h / 2) - (w * Math.log(Math.tan((Math.PI / 4) + ((lat * Math.PI / 180) / 2))) / (2 * Math.PI));
    // Fallback scaling to fit
    const scaledY = (lat * -1 + 90) * (h / 180);
    return { x, y: scaledY };
  };

  const maxValue = useMemo(() => {
    let max = 0;
    data.forEach((d) => {
      if (d.value > max) max = d.value;
    });
    return max;
  }, [data]);

  const mapPath = "M 10 10 L 90 10 L 90 90 L 10 90 Z"; // Simplified placeholder. In a real app we'd have SVG paths for countries.
  // Let's create a dotted grid for the background map to look cool
  const gridDots = useMemo(() => {
    const dots = [];
    const cols = 60;
    const rows = 30;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        // Skip some dots to make it look like continents (very rough approx)
        const lat = 90 - (j * (180 / rows));
        const lng = -180 + (i * (360 / cols));
        dots.push({ lat, lng });
      }
    }
    return dots;
  }, []);

  return (
    <div className="w-full h-full flex flex-col relative" ref={containerRef}>
      {(title || subtitle) && (
        <div className="mb-4 px-4">
          {title && <h3 className="text-xl font-bold text-white/90">{title}</h3>}
          {subtitle && <p className="text-sm text-white/60">{subtitle}</p>}
        </div>
      )}
      
      <div className="flex-1 relative overflow-hidden bg-slate-950/50 rounded-2xl border border-white/5">
        <svg width="100%" height="100%" className="overflow-visible">
          <defs>
            <radialGradient id="point-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={pointColor} stopOpacity={0.6} />
              <stop offset="100%" stopColor={pointColor} stopOpacity={0} />
            </radialGradient>
          </defs>

          {/* Dotted map background */}
          <g className="map-dots opacity-30">
            {gridDots.map((dot, i) => {
              const { x, y } = project(dot.lat, dot.lng, dimensions.width, dimensions.height);
              return (
                <circle
                  key={`dot-${i}`}
                  cx={x}
                  cy={y}
                  r={0.5}
                  fill="#94a3b8"
                />
              );
            })}
          </g>

          {/* Data Points */}
          {data.map((p, i) => {
            const { x, y } = project(p.lat, p.lng, dimensions.width, dimensions.height);
            const r = maxValue > 0 ? minPointRadius + (p.value / maxValue) * (maxPointRadius - minPointRadius) : minPointRadius;
            
            return (
              <g key={`pt-${p.id}-${i}`} transform={`translate(${x}, ${y})`}>
                <motion.circle
                  r={r * 2.5}
                  fill="url(#point-glow)"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.8] }}
                  transition={{ duration: 1.5, delay: i * 0.05, repeat: Infinity, repeatType: "reverse", repeatDelay: 2 }}
                />
                <motion.circle
                  r={r}
                  fill={pointColor}
                  stroke="#ffffff"
                  strokeWidth={1}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10, delay: i * 0.05 }}
                  onMouseEnter={() => {
                    if (interactive) setHoveredPoint({ x, y, data: p });
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                  onClick={() => interactive && onPointClick && onPointClick(p)}
                  className="cursor-pointer hover:stroke-2"
                />
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        <AnimatePresence>
          {hoveredPoint && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute pointer-events-none z-50 bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-lg p-3 shadow-2xl"
              style={{
                left: hoveredPoint.x + 15,
                top: hoveredPoint.y - 15,
              }}
            >
              <div className="font-bold text-white mb-1">{hoveredPoint.data.label || `Lat: ${hoveredPoint.data.lat.toFixed(2)}, Lng: ${hoveredPoint.data.lng.toFixed(2)}`}</div>
              <div className="text-xl font-black text-blue-400">{formatValue(hoveredPoint.data.value)}</div>
              {hoveredPoint.data.metadata && (
                <div className="mt-2 text-xs text-white/60 flex flex-col gap-1">
                  {Object.entries(hoveredPoint.data.metadata).map(([k, v]) => (
                    <div key={k} className="flex gap-2 justify-between">
                      <span>{k}:</span>
                      <span className="text-white">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
