"use client";

import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface HeatmapDataPoint {
  x: string | number;
  y: string | number;
  value: number;
  metadata?: Record<string, any>;
}

export interface HeatmapProps {
  data: HeatmapDataPoint[];
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  colorScale?: [string, string];
  emptyColor?: string;
  showTooltip?: boolean;
  title?: string;
  subtitle?: string;
  xLabel?: string;
  yLabel?: string;
  cellRadius?: number;
  cellGap?: number;
  interactive?: boolean;
  onCellClick?: (point: HeatmapDataPoint) => void;
  formatValue?: (val: number) => string;
}

export const Heatmap: React.FC<HeatmapProps> = ({
  data,
  width = 800,
  height = 500,
  margin = { top: 60, right: 60, bottom: 80, left: 100 },
  colorScale = ["#1e293b", "#3b82f6"],
  emptyColor = "#0f172a",
  showTooltip = true,
  title,
  subtitle,
  xLabel,
  yLabel,
  cellRadius = 4,
  cellGap = 2,
  interactive = true,
  onCellClick,
  formatValue = (v) => v.toFixed(2),
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });
  const [hoveredCell, setHoveredCell] = useState<{
    rect: DOMRect;
    data: HeatmapDataPoint;
    color: string;
  } | null>(null);

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

  const { xKeys, yKeys, grid, minValue, maxValue } = useMemo(() => {
    const xSet = new Set<string>();
    const ySet = new Set<string>();
    let min = Infinity;
    let max = -Infinity;

    data.forEach((d) => {
      xSet.add(String(d.x));
      ySet.add(String(d.y));
      if (d.value < min) min = d.value;
      if (d.value > max) max = d.value;
    });

    const xKeys = Array.from(xSet).sort();
    const yKeys = Array.from(ySet).sort();

    const grid = new Map<string, HeatmapDataPoint>();
    data.forEach((d) => {
      grid.set(`${d.x}-${d.y}`, d);
    });

    if (min === Infinity) min = 0;
    if (max === -Infinity) max = 100;
    if (min === max) {
      min = 0;
    }

    return { xKeys, yKeys, grid, minValue: min, maxValue: max };
  }, [data]);

  const cellWidth = xKeys.length > 0 ? innerWidth / xKeys.length : 0;
  const cellHeight = yKeys.length > 0 ? innerHeight / yKeys.length : 0;

  // Simple color interpolation from RGB hex strings
  const interpolateColor = useCallback(
    (val: number) => {
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
            }
          : { r: 0, g: 0, b: 0 };
      };

      const c1 = hexToRgb(colorScale[0]);
      const c2 = hexToRgb(colorScale[1]);

      let ratio = (val - minValue) / (maxValue - minValue);
      if (ratio < 0) ratio = 0;
      if (ratio > 1) ratio = 1;
      if (isNaN(ratio)) ratio = 0;

      const r = Math.round(c1.r + (c2.r - c1.r) * ratio);
      const g = Math.round(c1.g + (c2.g - c1.g) * ratio);
      const b = Math.round(c1.b + (c2.b - c1.b) * ratio);

      return `rgb(${r},${g},${b})`;
    },
    [colorScale, minValue, maxValue]
  );

  return (
    <div className="w-full h-full flex flex-col relative" ref={containerRef}>
      {(title || subtitle) && (
        <div className="mb-4 px-4">
          {title && <h3 className="text-xl font-bold text-white/90">{title}</h3>}
          {subtitle && <p className="text-sm text-white/60">{subtitle}</p>}
        </div>
      )}

      <div className="flex-1 relative">
        <svg width="100%" height="100%" className="overflow-visible">
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Y Axis Labels */}
            {yKeys.map((y, i) => (
              <text
                key={`y-label-${y}`}
                x={-10}
                y={i * cellHeight + cellHeight / 2}
                dy="0.32em"
                textAnchor="end"
                className="text-xs fill-white/60 font-medium"
              >
                {y}
              </text>
            ))}

            {/* X Axis Labels */}
            {xKeys.map((x, j) => (
              <g key={`x-label-${x}`} transform={`translate(${j * cellWidth + cellWidth / 2}, ${innerHeight + 20})`}>
                <text
                  transform="rotate(-45)"
                  textAnchor="end"
                  className="text-xs fill-white/60 font-medium"
                >
                  {x}
                </text>
              </g>
            ))}

            {/* Axis Titles */}
            {yLabel && (
              <text
                x={-margin.left + 20}
                y={innerHeight / 2}
                transform={`rotate(-90, ${-margin.left + 20}, ${innerHeight / 2})`}
                textAnchor="middle"
                className="text-sm fill-white/40 font-bold tracking-widest uppercase"
              >
                {yLabel}
              </text>
            )}
            {xLabel && (
              <text
                x={innerWidth / 2}
                y={innerHeight + margin.bottom - 10}
                textAnchor="middle"
                className="text-sm fill-white/40 font-bold tracking-widest uppercase"
              >
                {xLabel}
              </text>
            )}

            {/* Heatmap Cells */}
            {yKeys.map((y, i) =>
              xKeys.map((x, j) => {
                const key = `${x}-${y}`;
                const d = grid.get(key);
                const color = d ? interpolateColor(d.value) : emptyColor;
                const finalCellWidth = Math.max(1, cellWidth - cellGap);
                const finalCellHeight = Math.max(1, cellHeight - cellGap);

                return (
                  <motion.rect
                    key={key}
                    x={j * cellWidth + cellGap / 2}
                    y={i * cellHeight + cellGap / 2}
                    width={finalCellWidth}
                    height={finalCellHeight}
                    rx={cellRadius}
                    fill={color}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      duration: 0.5,
                      delay: (i * xKeys.length + j) * 0.002,
                      ease: "backOut",
                    }}
                    onMouseEnter={(e) => {
                      if (d && showTooltip && interactive) {
                        setHoveredCell({
                          rect: e.currentTarget.getBoundingClientRect(),
                          data: d,
                          color,
                        });
                      }
                    }}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => d && interactive && onCellClick && onCellClick(d)}
                    className={d && interactive ? "cursor-pointer hover:stroke-white hover:stroke-2 transition-all" : ""}
                  />
                );
              })
            )}
          </g>
        </svg>

        {/* Legend */}
        <div className="absolute top-0 right-4 flex flex-col items-center gap-2">
          <span className="text-[10px] text-white/50">{formatValue(maxValue)}</span>
          <div
            className="w-3 h-32 rounded-full shadow-inner border border-white/10"
            style={{
              background: `linear-gradient(to bottom, ${colorScale[1]}, ${colorScale[0]})`,
            }}
          />
          <span className="text-[10px] text-white/50">{formatValue(minValue)}</span>
        </div>

        {/* Tooltip */}
        <AnimatePresence>
          {hoveredCell && showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed pointer-events-none z-50 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl min-w-[200px]"
              style={{
                left: hoveredCell.rect.right + 10,
                top: hoveredCell.rect.top - 20,
              }}
            >
              <div className="flex items-center gap-3 mb-2 border-b border-white/10 pb-2">
                <div
                  className="w-4 h-4 rounded-md shadow-inner border border-white/20"
                  style={{ backgroundColor: hoveredCell.color }}
                />
                <div>
                  <div className="text-xs text-white/50">Value</div>
                  <div className="text-lg font-bold text-white">
                    {formatValue(hoveredCell.data.value)}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1 text-sm text-white/80">
                <div className="flex justify-between">
                  <span className="text-white/50">{xLabel || "X"}:</span>
                  <span className="font-medium">{hoveredCell.data.x}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">{yLabel || "Y"}:</span>
                  <span className="font-medium">{hoveredCell.data.y}</span>
                </div>
              </div>
              {hoveredCell.data.metadata && Object.keys(hoveredCell.data.metadata).length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10 text-xs flex flex-col gap-1.5">
                  {Object.entries(hoveredCell.data.metadata).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <span className="text-white/40">{k}:</span>
                      <span className="font-mono text-white/80">{String(v)}</span>
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
