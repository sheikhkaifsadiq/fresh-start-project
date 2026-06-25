"use client";

import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface ScatterPoint {
  id: string;
  x: number;
  y: number;
  z?: number; // For bubble size
  category?: string;
  label?: string;
  metadata?: Record<string, any>;
}

export interface ScatterPlotProps {
  data: ScatterPoint[];
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  colors?: string[];
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  animate?: boolean;
  xAxisFormatter?: (val: number) => string;
  yAxisFormatter?: (val: number) => string;
  zAxisFormatter?: (val: number) => string;
  title?: string;
  subtitle?: string;
  xLabel?: string;
  yLabel?: string;
  interactive?: boolean;
  onPointClick?: (point: ScatterPoint) => void;
  minBubbleSize?: number;
  maxBubbleSize?: number;
}

export const ScatterPlot: React.FC<ScatterPlotProps> = ({
  data,
  width = 800,
  height = 500,
  margin = { top: 40, right: 40, bottom: 60, left: 60 },
  colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"],
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  animate = true,
  xAxisFormatter = (val) => val.toLocaleString(),
  yAxisFormatter = (val) => val.toLocaleString(),
  zAxisFormatter = (val) => val.toLocaleString(),
  title,
  subtitle,
  xLabel,
  yLabel,
  interactive = true,
  onPointClick,
  minBubbleSize = 4,
  maxBubbleSize = 24,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });
  const [hoveredPoint, setHoveredPoint] = useState<{ cx: number; cy: number; data: ScatterPoint; color: string } | null>(
    null
  );
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width: w, height: h } = entries[0].contentRect;
        if (w > 0 && h > 0) {
          setDimensions({ width: w, height: h });
        }
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const innerWidth = Math.max(0, dimensions.width - margin.left - margin.right);
  const innerHeight = Math.max(0, dimensions.height - margin.top - margin.bottom);

  const { minX, maxX, minY, maxY, minZ, maxZ, categories } = useMemo(() => {
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity,
      minZ = Infinity,
      maxZ = -Infinity;
    const catSet = new Set<string>();

    data.forEach((d) => {
      if (d.x < minX) minX = d.x;
      if (d.x > maxX) maxX = d.x;
      if (d.y < minY) minY = d.y;
      if (d.y > maxY) maxY = d.y;
      if (d.z !== undefined) {
        if (d.z < minZ) minZ = d.z;
        if (d.z > maxZ) maxZ = d.z;
      }
      catSet.add(d.category || "Default");
    });

    // Add padding to axes
    const xPadding = (maxX - minX) * 0.1 || 1;
    const yPadding = (maxY - minY) * 0.1 || 1;

    return {
      minX: minX - xPadding,
      maxX: maxX + xPadding,
      minY: minY - yPadding,
      maxY: maxY + yPadding,
      minZ: minZ === Infinity ? 0 : minZ,
      maxZ: maxZ === -Infinity ? 100 : maxZ,
      categories: Array.from(catSet).sort(),
    };
  }, [data]);

  const scaleX = useCallback(
    (x: number) => {
      if (maxX === minX) return innerWidth / 2;
      return ((x - minX) / (maxX - minX)) * innerWidth;
    },
    [minX, maxX, innerWidth]
  );

  const scaleY = useCallback(
    (y: number) => {
      if (maxY === minY) return innerHeight / 2;
      return innerHeight - ((y - minY) / (maxY - minY)) * innerHeight;
    },
    [minY, maxY, innerHeight]
  );

  const scaleZ = useCallback(
    (z?: number) => {
      if (z === undefined) return minBubbleSize;
      if (maxZ === minZ) return minBubbleSize;
      return minBubbleSize + ((z - minZ) / (maxZ - minZ)) * (maxBubbleSize - minBubbleSize);
    },
    [minZ, maxZ, minBubbleSize, maxBubbleSize]
  );

  const yTicks = useMemo(() => {
    const ticks = [];
    const count = 5;
    for (let i = 0; i <= count; i++) {
      ticks.push(minY + (maxY - minY) * (i / count));
    }
    return ticks;
  }, [minY, maxY]);

  const xTicks = useMemo(() => {
    const ticks = [];
    const count = 5;
    for (let i = 0; i <= count; i++) {
      ticks.push(minX + (maxX - minX) * (i / count));
    }
    return ticks;
  }, [minX, maxX]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive || !showTooltip) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - margin.left;
    const y = e.clientY - rect.top - margin.top;

    let closestDist = Infinity;
    let closestPoint: { cx: number; cy: number; data: ScatterPoint; color: string } | null = null;

    data.forEach((p) => {
      const cat = p.category || "Default";
      if (activeCategory && activeCategory !== cat) return;
      const px = scaleX(p.x);
      const py = scaleY(p.y);
      const dist = Math.sqrt(Math.pow(px - x, 2) + Math.pow(py - y, 2));
      const radius = scaleZ(p.z);
      
      if (dist < closestDist && dist < radius + 10) {
        closestDist = dist;
        closestPoint = {
          cx: px,
          cy: py,
          data: p,
          color: colors[categories.indexOf(cat) % colors.length],
        };
      }
    });

    setHoveredPoint(closestPoint);
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div className="w-full h-full flex flex-col relative" ref={containerRef}>
      {(title || subtitle) && (
        <div className="mb-4 px-4">
          {title && <h3 className="text-xl font-bold text-white/90">{title}</h3>}
          {subtitle && <p className="text-sm text-white/60">{subtitle}</p>}
        </div>
      )}

      <div className="flex-1 relative">
        <svg
          width="100%"
          height="100%"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="overflow-visible"
        >
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Grid */}
            {showGrid && (
              <g className="grid text-white/10">
                {yTicks.map((t, i) => (
                  <line
                    key={`grid-y-${i}`}
                    x1={0}
                    x2={innerWidth}
                    y1={scaleY(t)}
                    y2={scaleY(t)}
                    stroke="currentColor"
                    strokeDasharray="4 4"
                  />
                ))}
                {xTicks.map((t, i) => (
                  <line
                    key={`grid-x-${i}`}
                    x1={scaleX(t)}
                    x2={scaleX(t)}
                    y1={0}
                    y2={innerHeight}
                    stroke="currentColor"
                    strokeDasharray="4 4"
                  />
                ))}
              </g>
            )}

            {/* Axes */}
            <line x1={0} x2={innerWidth} y1={scaleY(0) || innerHeight} y2={scaleY(0) || innerHeight} stroke="rgba(255,255,255,0.3)" />
            <line x1={scaleX(0) || 0} x2={scaleX(0) || 0} y1={0} y2={innerHeight} stroke="rgba(255,255,255,0.3)" />

            {/* Y Axis Labels */}
            <g className="y-axis text-xs fill-white/50 text-right">
              {yTicks.map((t, i) => (
                <text key={`ytick-${i}`} x={-10} y={scaleY(t)} dy="0.32em" textAnchor="end">
                  {yAxisFormatter(t)}
                </text>
              ))}
              {yLabel && (
                <text
                  x={-innerHeight / 2}
                  y={-margin.left + 20}
                  transform="rotate(-90)"
                  textAnchor="middle"
                  className="fill-white/40 font-bold uppercase tracking-widest text-sm"
                >
                  {yLabel}
                </text>
              )}
            </g>

            {/* X Axis Labels */}
            <g className="x-axis text-xs fill-white/50 text-center">
              {xTicks.map((t, i) => (
                <text key={`xtick-${i}`} x={scaleX(t)} y={innerHeight + 20} textAnchor="middle">
                  {xAxisFormatter(t)}
                </text>
              ))}
              {xLabel && (
                <text
                  x={innerWidth / 2}
                  y={innerHeight + margin.bottom - 10}
                  textAnchor="middle"
                  className="fill-white/40 font-bold uppercase tracking-widest text-sm"
                >
                  {xLabel}
                </text>
              )}
            </g>

            {/* Scatter Points */}
            {data.map((p, i) => {
              const cat = p.category || "Default";
              if (activeCategory && activeCategory !== cat) return null;
              
              const cx = scaleX(p.x);
              const cy = scaleY(p.y);
              const r = scaleZ(p.z);
              const color = colors[categories.indexOf(cat) % colors.length];

              return (
                <motion.circle
                  key={`point-${p.id}`}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={color}
                  fillOpacity={0.6}
                  stroke={color}
                  strokeWidth={2}
                  initial={animate ? { scale: 0, opacity: 0 } : false}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.005, type: "spring", stiffness: 100 }}
                  onClick={() => interactive && onPointClick && onPointClick(p)}
                  className={interactive ? "cursor-pointer hover:fill-opacity-100 transition-all" : ""}
                />
              );
            })}
          </g>
        </svg>

        {/* Tooltip */}
        <AnimatePresence>
          {hoveredPoint && showTooltip && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute pointer-events-none z-50 bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl flex flex-col gap-2 min-w-[200px]"
              style={{
                left: margin.left + hoveredPoint.cx + 20,
                top: margin.top + hoveredPoint.cy - 20,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: hoveredPoint.color }} />
                <span className="font-bold text-white text-base">
                  {hoveredPoint.data.label || hoveredPoint.data.category || "Data Point"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex flex-col">
                  <span className="text-white/50 text-xs uppercase">{xLabel || "X"}</span>
                  <span className="font-mono text-white">{xAxisFormatter(hoveredPoint.data.x)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-white/50 text-xs uppercase">{yLabel || "Y"}</span>
                  <span className="font-mono text-white">{yAxisFormatter(hoveredPoint.data.y)}</span>
                </div>
                {hoveredPoint.data.z !== undefined && (
                  <div className="flex flex-col col-span-2 mt-1">
                    <span className="text-white/50 text-xs uppercase">Size / Z</span>
                    <span className="font-mono text-white">{zAxisFormatter(hoveredPoint.data.z)}</span>
                  </div>
                )}
              </div>
              {hoveredPoint.data.metadata && Object.keys(hoveredPoint.data.metadata).length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/10 text-xs flex flex-col gap-1 text-white/70">
                  {Object.entries(hoveredPoint.data.metadata).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <span>{k}:</span>
                      <span className="font-mono">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showLegend && categories.length > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 px-4 pb-2">
          {categories.map((cat, i) => (
            <button
              key={`legend-${cat}`}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`flex items-center gap-2 text-sm transition-all ${
                activeCategory && activeCategory !== cat ? "opacity-40 grayscale" : "opacity-100 hover:opacity-80"
              }`}
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[i % colors.length] }}
              />
              <span className="text-white/80 font-medium">{cat}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
