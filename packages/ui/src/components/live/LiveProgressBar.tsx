'use client';

/**
 * LiveProgressBar — Animated project completion bar
 *
 * A progress bar that smoothly animates between values.
 * Shows percentage label and supports size/color variants.
 * Updates instantly when tasks are completed in real-time.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils';

// ── Types ────────────────────────────────────────────────────

export interface LiveProgressBarProps {
  /** Current percentage (0-100) */
  percentage: number;
  /** Main label above the bar */
  label?: string;
  /** Secondary label (e.g., "12/45 tasks") */
  sublabel?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Bar color, or 'auto' to pick based on percentage */
  color?: 'blue' | 'green' | 'amber' | 'red' | 'indigo' | 'auto';
  /** Show the percentage number */
  showPercentage?: boolean;
  /** Enable smooth animation (default: true) */
  animated?: boolean;
  className?: string;
}

// ── Color Config ─────────────────────────────────────────────

const COLOR_MAP: Record<string, { bar: string; bg: string; text: string }> = {
  blue: { bar: 'bg-blue-500', bg: 'bg-blue-100', text: 'text-blue-600' },
  green: { bar: 'bg-green-500', bg: 'bg-green-100', text: 'text-green-600' },
  amber: { bar: 'bg-amber-500', bg: 'bg-amber-100', text: 'text-amber-600' },
  red: { bar: 'bg-red-500', bg: 'bg-red-100', text: 'text-red-600' },
  indigo: { bar: 'bg-indigo-500', bg: 'bg-indigo-100', text: 'text-indigo-600' },
};

const SIZE_MAP: Record<string, { bar: string; label: string; percentage: string }> = {
  sm: { bar: 'h-1.5', label: 'text-xs', percentage: 'text-xs' },
  md: { bar: 'h-2.5', label: 'text-sm', percentage: 'text-sm' },
  lg: { bar: 'h-4', label: 'text-base', percentage: 'text-base' },
};

function getAutoColor(percentage: number): string {
  if (percentage >= 90) return 'green';
  if (percentage >= 50) return 'blue';
  if (percentage >= 25) return 'amber';
  return 'red';
}

// ── Component ────────────────────────────────────────────────

export function LiveProgressBar({
  percentage,
  label,
  sublabel,
  size = 'md',
  color = 'auto',
  showPercentage = true,
  animated = true,
  className,
}: LiveProgressBarProps) {
  const clampedPct = Math.min(Math.max(percentage, 0), 100);
  const resolvedColor = color === 'auto' ? getAutoColor(clampedPct) : color;
  const colors = COLOR_MAP[resolvedColor] || COLOR_MAP.blue;
  const sizes = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div className={cn('w-full', className)}>
      {/* Labels row */}
      {(label || showPercentage) && (
        <div className="flex items-baseline justify-between mb-1.5">
          <div className="flex items-baseline gap-2">
            {label && (
              <span className={cn('font-medium text-gray-900', sizes.label)}>
                {label}
              </span>
            )}
            {sublabel && (
              <span className={cn('text-gray-500', sizes.percentage)}>
                {sublabel}
              </span>
            )}
          </div>
          {showPercentage && (
            <motion.span
              className={cn('font-semibold tabular-nums', colors.text, sizes.percentage)}
              key={clampedPct}
              initial={animated ? { scale: 1.2 } : false}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {clampedPct.toFixed(0)}%
            </motion.span>
          )}
        </div>
      )}

      {/* Bar track */}
      <div className={cn('w-full rounded-full bg-gray-200 overflow-hidden', sizes.bar)}>
        <motion.div
          className={cn('h-full rounded-full', colors.bar)}
          initial={animated ? { width: 0 } : { width: `${clampedPct}%` }}
          animate={{ width: `${clampedPct}%` }}
          transition={animated ? { duration: 0.6, ease: 'easeOut' } : { duration: 0 }}
        />
      </div>
    </div>
  );
}
