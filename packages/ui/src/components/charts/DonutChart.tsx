// packages/ui/src/components/charts/DonutChart.tsx
// SVG donut chart — no external deps

import React from 'react';
import { cn } from '../../lib/utils';

export interface DonutSegment {
  label: string;
  value: number;
  color: string; // Hex or Tailwind fill color
}

export interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSubLabel?: string;
  showLegend?: boolean;
  className?: string;
}

export function DonutChart({
  segments,
  size = 140,
  strokeWidth = 24,
  centerLabel,
  centerSubLabel,
  showLegend = true,
  className,
}: DonutChartProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  let offset = 0;

  const arcs = segments.map((seg) => {
    const pct = total > 0 ? seg.value / total : 0;
    const dashArray = `${circumference * pct} ${circumference * (1 - pct)}`;
    const dashOffset = -offset * circumference;
    offset += pct;
    return { ...seg, dashArray, dashOffset, pct };
  });

  return (
    <div className={cn('inline-flex flex-col items-center gap-4', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />
          {/* Segments */}
          {arcs.map((arc, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeDasharray={arc.dashArray}
              strokeDashoffset={arc.dashOffset}
              strokeLinecap="butt"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          ))}
        </svg>

        {/* Center label */}
        {(centerLabel || centerSubLabel) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {centerLabel && (
              <p className="text-lg font-bold text-gray-900 leading-none">{centerLabel}</p>
            )}
            {centerSubLabel && (
              <p className="text-xs text-gray-500 mt-0.5">{centerSubLabel}</p>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-col gap-1.5 w-full">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-xs text-gray-600">{seg.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-900">{seg.value.toLocaleString()}</span>
                <span className="text-xs text-gray-400">
                  ({total > 0 ? ((seg.value / total) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
