"use client";

import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export interface DataPoint {
  timestamp: string | number | Date;
  value: number;
  category?: string;
  metadata?: Record<string, any>;
}

export interface LineChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  colors?: string[];
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  animate?: boolean;
  curveType?: "linear" | "monotoneX" | "step";
  yAxisFormatter?: (val: number) => string;
  xAxisFormatter?: (val: Date | number | string) => string;
  title?: string;
  subtitle?: string;
  fillGradient?: boolean;
  interactive?: boolean;
  onPointClick?: (point: DataPoint) => void;
  crosshair?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  width = 800,
  height = 400,
  margin = { top: 40, right: 40, bottom: 60, left: 60 },
  colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  animate = true,
  curveType = "monotoneX",
  yAxisFormatter = (val) => val.toString(),
  xAxisFormatter = (val) => format(new Date(val), "MMM dd, HH:mm"),
  title,
  subtitle,
  fillGradient = true,
  interactive = true,
  onPointClick,
  crosshair = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; data: DataPoint; category: string } | null>(
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

  const groupedData = useMemo(() => {
    const groups: Record<string, DataPoint[]> = {};
    const defaultCat = "Default";
    data.forEach((d) => {
      const cat = d.category || defaultCat;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({
        ...d,
        timestamp: new Date(d.timestamp).getTime(),
      });
    });
    Object.values(groups).forEach((g) => g.sort((a, b) => (a.timestamp as number) - (b.timestamp as number)));
    return groups;
  }, [data]);

  const categories = Object.keys(groupedData);

  const { minX, maxX, minY, maxY } = useMemo(() => {
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    categories.forEach((cat) => {
      groupedData[cat].forEach((d) => {
        if ((d.timestamp as number) < minX) minX = d.timestamp as number;
        if ((d.timestamp as number) > maxX) maxX = d.timestamp as number;
        if (d.value < minY) minY = d.value;
        if (d.value > maxY) maxY = d.value;
      });
    });
    if (minY > 0) minY = 0;
    if (maxY === minY) maxY += 10;
    return { minX, maxX, minY, maxY };
  }, [groupedData, categories]);

  const scaleX = useCallback(
    (x: number) => {
      if (maxX === minX) return 0;
      return ((x - minX) / (maxX - minX)) * innerWidth;
    },
    [minX, maxX, innerWidth]
  );

  const scaleY = useCallback(
    (y: number) => {
      if (maxY === minY) return innerHeight;
      return innerHeight - ((y - minY) / (maxY - minY)) * innerHeight;
    },
    [minY, maxY, innerHeight]
  );

  const generatePath = useCallback(
    (points: DataPoint[]) => {
      if (points.length === 0) return "";
      if (points.length === 1) {
        const x = scaleX(points[0].timestamp as number);
        const y = scaleY(points[0].value);
        return `M ${x},${y} L ${x},${y}`;
      }

      if (curveType === "step") {
        let d = `M ${scaleX(points[0].timestamp as number)},${scaleY(points[0].value)}`;
        for (let i = 1; i < points.length; i++) {
          const prevX = scaleX(points[i - 1].timestamp as number);
          const currX = scaleX(points[i].timestamp as number);
          const currY = scaleY(points[i].value);
          d += ` L ${currX},${scaleY(points[i - 1].value)} L ${currX},${currY}`;
        }
        return d;
      }

      if (curveType === "monotoneX") {
        let d = `M ${scaleX(points[0].timestamp as number)},${scaleY(points[0].value)}`;
        for (let i = 0; i < points.length - 1; i++) {
          const x0 = scaleX(points[i].timestamp as number);
          const y0 = scaleY(points[i].value);
          const x1 = scaleX(points[i + 1].timestamp as number);
          const y1 = scaleY(points[i + 1].value);
          const cp1x = x0 + (x1 - x0) / 2;
          const cp1y = y0;
          const cp2x = x0 + (x1 - x0) / 2;
          const cp2y = y1;
          d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x1},${y1}`;
        }
        return d;
      }

      return `M ${points.map((p) => `${scaleX(p.timestamp as number)},${scaleY(p.value)}`).join(" L ")}`;
    },
    [scaleX, scaleY, curveType]
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
    if (x < 0 || x > innerWidth) {
      setHoveredPoint(null);
      return;
    }

    const timeAtCursor = minX + (x / innerWidth) * (maxX - minX);

    let closestDist = Infinity;
    let closestPoint: { x: number; y: number; data: DataPoint; category: string } | null = null;

    categories.forEach((cat) => {
      if (activeCategory && activeCategory !== cat) return;
      groupedData[cat].forEach((p) => {
        const px = scaleX(p.timestamp as number);
        const dist = Math.abs(px - x);
        if (dist < closestDist && dist < 50) {
          closestDist = dist;
          closestPoint = {
            x: px,
            y: scaleY(p.value),
            data: p,
            category: cat,
          };
        }
      });
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
          <defs>
            {categories.map((cat, i) => (
              <linearGradient key={`grad-${cat}`} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors[i % colors.length]} stopOpacity={0.3} />
                <stop offset="100%" stopColor={colors[i % colors.length]} stopOpacity={0} />
              </linearGradient>
            ))}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Grid & Axes */}
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

            {/* Y Axis Labels */}
            <g className="y-axis text-xs fill-white/50 text-right">
              {yTicks.map((t, i) => (
                <text key={`ytick-${i}`} x={-10} y={scaleY(t)} dy="0.32em" textAnchor="end">
                  {yAxisFormatter(t)}
                </text>
              ))}
            </g>

            {/* X Axis Labels */}
            <g className="x-axis text-xs fill-white/50 text-center">
              {xTicks.map((t, i) => (
                <text key={`xtick-${i}`} x={scaleX(t)} y={innerHeight + 20} textAnchor="middle">
                  {xAxisFormatter(t)}
                </text>
              ))}
            </g>

            {/* Data Lines & Areas */}
            {categories.map((cat, i) => {
              if (activeCategory && activeCategory !== cat) return null;
              const pts = groupedData[cat];
              const pathD = generatePath(pts);
              const areaD = `${pathD} L ${scaleX(pts[pts.length - 1].timestamp as number)},${innerHeight} L ${scaleX(
                pts[0].timestamp as number
              )},${innerHeight} Z`;

              return (
                <g key={`series-${cat}`}>
                  {fillGradient && (
                    <motion.path
                      d={areaD}
                      fill={`url(#grad-${i})`}
                      initial={animate ? { opacity: 0, y: 20 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  )}
                  <motion.path
                    d={pathD}
                    fill="none"
                    stroke={colors[i % colors.length]}
                    strokeWidth={2}
                    filter="url(#glow)"
                    initial={animate ? { pathLength: 0, opacity: 0 } : false}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                  />
                  {pts.map((p, j) => (
                    <circle
                      key={`pt-${cat}-${j}`}
                      cx={scaleX(p.timestamp as number)}
                      cy={scaleY(p.value)}
                      r={3}
                      fill={colors[i % colors.length]}
                      className="opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => onPointClick && onPointClick(p)}
                    />
                  ))}
                </g>
              );
            })}

            {/* Crosshair & Tooltip Indicator */}
            {hoveredPoint && crosshair && (
              <g className="crosshair pointer-events-none">
                <line
                  x1={hoveredPoint.x}
                  x2={hoveredPoint.x}
                  y1={0}
                  y2={innerHeight}
                  stroke="rgba(255,255,255,0.2)"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={hoveredPoint.x}
                  cy={hoveredPoint.y}
                  r={5}
                  fill={colors[categories.indexOf(hoveredPoint.category) % colors.length]}
                  stroke="#1e293b"
                  strokeWidth={2}
                />
              </g>
            )}
          </g>
        </svg>

        {/* HTML Tooltip */}
        <AnimatePresence>
          {hoveredPoint && showTooltip && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute pointer-events-none z-50 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl flex flex-col gap-1"
              style={{
                left: margin.left + hoveredPoint.x + 15,
                top: margin.top + hoveredPoint.y - 15,
              }}
            >
              <div className="text-xs font-medium text-white/60">
                {xAxisFormatter(hoveredPoint.data.timestamp)}
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: colors[categories.indexOf(hoveredPoint.category) % colors.length] }}
                />
                <span className="text-sm font-bold text-white">
                  {hoveredPoint.category}: {yAxisFormatter(hoveredPoint.data.value)}
                </span>
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

      {showLegend && (
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
                className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]"
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
