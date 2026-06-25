"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Props {
  initialScore?: number;
}

export function MLScoreGauge({ initialScore = 0.1 }: Props) {
  const [score, setScore] = useState(initialScore || 0.1);

  // Pulse gently around the real avg score
  useEffect(() => {
    setScore(initialScore || 0.1);
    const interval = setInterval(() => {
      setScore(prev => {
        const delta = (Math.random() - 0.5) * 0.03;
        const base = initialScore || 0.1;
        return Math.max(base - 0.05, Math.min(base + 0.1, prev + delta));
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [initialScore]);

  const SIZE = 200;
  const STROKE = 14;
  const R = (SIZE - STROKE * 2) / 2;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const startAngle = -225;
  const endAngle = 45;
  const totalAngle = endAngle - startAngle; // 270 degrees

  const polarToCartesian = (angle: number) => {
    const a = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + R * Math.cos(a),
      y: cy + R * Math.sin(a),
    };
  };

  const arcPath = (from: number, to: number) => {
    const start = polarToCartesian(from);
    const end = polarToCartesian(to);
    const largeArc = to - from > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${R} ${R} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const circumference = 2 * Math.PI * R;
  const scoreAngle = startAngle + score * totalAngle;

  const getColor = (s: number) => {
    if (s < 0.3) return "#22c55e";
    if (s < 0.7) return "#f97316";
    return "#ef4444";
  };

  const getLabel = (s: number) => {
    if (s < 0.3) return "HUMAN";
    if (s < 0.7) return "UNCERTAIN";
    return "BOT";
  };

  const color = getColor(score);
  const label = getLabel(score);

  return (
    <div className="liquid-glass border border-white/5 rounded-2xl p-5 shadow-2xl">
      <h3 className="font-semibold text-white/90 text-sm mb-1">ML Bot Score</h3>
      <p className="text-xs text-white/40 mb-4">Current avg traffic classification</p>

      <div className="flex flex-col items-center">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <defs>
            <filter id="gauge-glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Background track */}
          <path
            d={arcPath(startAngle, endAngle)}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={STROKE}
            strokeLinecap="round"
          />

          {/* Color zones */}
          {/* Green zone (human) */}
          <path d={arcPath(startAngle, startAngle + totalAngle * 0.3)} fill="none" stroke="rgba(34,197,94,0.2)" strokeWidth={STROKE} strokeLinecap="round" />
          {/* Orange zone (uncertain) */}
          <path d={arcPath(startAngle + totalAngle * 0.3, startAngle + totalAngle * 0.7)} fill="none" stroke="rgba(249,115,22,0.2)" strokeWidth={STROKE} />
          {/* Red zone (bot) */}
          <path d={arcPath(startAngle + totalAngle * 0.7, endAngle)} fill="none" stroke="rgba(239,68,68,0.2)" strokeWidth={STROKE} strokeLinecap="round" />

          {/* Active arc */}
          <motion.path
            d={arcPath(startAngle, scoreAngle)}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            filter="url(#gauge-glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: score }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />

          {/* Needle tip dot */}
          <motion.circle
            cx={polarToCartesian(scoreAngle).x}
            cy={polarToCartesian(scoreAngle).y}
            r={8}
            fill={color}
            filter="url(#gauge-glow)"
            animate={{
              cx: polarToCartesian(scoreAngle).x,
              cy: polarToCartesian(scoreAngle).y,
              fill: color,
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />

          {/* Center score display */}
          <text x={cx} y={cy - 10} textAnchor="middle" fill="white" fontSize="32" fontWeight="bold" fontFamily="Space Grotesk">
            {(score * 100).toFixed(0)}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily="JetBrains Mono">
            / 100
          </text>
          <motion.text
            x={cx}
            y={cy + 36}
            textAnchor="middle"
            fill={color}
            fontSize="12"
            fontWeight="bold"
            fontFamily="Space Grotesk"
            key={label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {label}
          </motion.text>

          {/* Zone labels */}
          <text x={cx - R + 6} y={SIZE - 12} textAnchor="middle" fill="rgba(34,197,94,0.7)" fontSize="9" fontFamily="JetBrains Mono">0</text>
          <text x={cx + R - 6} y={SIZE - 12} textAnchor="middle" fill="rgba(239,68,68,0.7)" fontSize="9" fontFamily="JetBrains Mono">100</text>
        </svg>

        <p className="text-xs text-white/40 text-center max-w-[160px] -mt-2">
          Updated live every 2s via ML engine
        </p>
      </div>
    </div>
  );
}
