// packages/ui/src/components/charts/BudgetChart.tsx
// Stacked bar chart for budget breakdown — pure SVG, no deps

import React from 'react';
import { cn } from '../../lib/utils';

export interface BudgetChartDataPoint {
  label: string; // e.g. "Jan", "Feb", month/week label
  segments: Array<{
    key: string;
    value: number;
    color: string; // hex
  }>;
}

export interface BudgetChartProps {
  data: BudgetChartDataPoint[];
  legendKeys?: Array<{ key: string; label: string; color: string }>;
  height?: number;
  formatValue?: (v: number) => string;
  className?: string;
}

function formatDefault(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

export function BudgetChart({
  data,
  legendKeys,
  height = 200,
  formatValue = formatDefault,
  className,
}: BudgetChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.segments.reduce((s, seg) => s + seg.value, 0)), 1);
  const barWidth = Math.max(12, Math.min(40, (100 / data.length) * 0.6));
  const gap = (100 / data.length) * 0.4 / 2;

  return (
    <div className={cn('w-full', className)}>
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="w-full overflow-visible"
        style={{ height }}
      >
        {/* Y-axis gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1={0}
            y1={height - pct * height}
            x2={100}
            y2={height - pct * height}
            stroke="#E5E7EB"
            strokeWidth={0.3}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* Bars */}
        {data.map((point, pointIdx) => {
          const x = (pointIdx / data.length) * 100 + gap;
          let stackY = height;

          return (
            <g key={pointIdx}>
              {point.segments.map((seg, segIdx) => {
                const segHeight = (seg.value / maxValue) * height;
                stackY -= segHeight;
                return (
                  <rect
                    key={segIdx}
                    x={x}
                    y={stackY}
                    width={barWidth}
                    height={segHeight}
                    fill={seg.color}
                    rx={segIdx === point.segments.length - 1 ? 2 : 0}
                  />
                );
              })}

              {/* Label */}
              <text
                x={x + barWidth / 2}
                y={height + 10}
                textAnchor="middle"
                fontSize={4}
                fill="#6B7280"
              >
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Y-axis labels */}
      <div className="flex justify-between text-xs text-gray-400 mt-1 px-0">
        <span>{formatValue(0)}</span>
        <span>{formatValue(maxValue / 2)}</span>
        <span>{formatValue(maxValue)}</span>
      </div>

      {/* Legend */}
      {legendKeys && legendKeys.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
          {legendKeys.map((l) => (
            <div key={l.key} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
              <span className="text-xs text-gray-500">{l.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
