'use client';

/**
 * LiveBudgetTicker — Animated spend vs budget display
 *
 * Shows current spend and total budget with a colored progress bar.
 * Numbers animate smoothly when the spend changes (e.g., after a
 * receipt is processed). Color shifts from green to amber to red
 * based on configurable thresholds.
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils';

// ── Types ────────────────────────────────────────────────────

export interface LiveBudgetTickerProps {
  currentSpend: number;
  totalBudget: number;
  percentUsed: number;
  /** Percentage threshold for yellow/warning state (default: 75) */
  warningThreshold?: number;
  /** Percentage threshold for red/critical state (default: 90) */
  criticalThreshold?: number;
  /** Custom currency formatter (default: $X,XXX format) */
  formatCurrency?: (n: number) => string;
  /** Show the variance amount */
  showVariance?: boolean;
  /** Compact mode for smaller spaces */
  compact?: boolean;
  className?: string;
}

// ── Default Formatter ────────────────────────────────────────

function defaultFormatCurrency(n: number): string {
  if (Math.abs(n) >= 1_000_000) {
    return `$${(n / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(n) >= 1_000) {
    return `$${(n / 1_000).toFixed(0)}K`;
  }
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ── Animated Number ──────────────────────────────────────────

function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const spring = useSpring(value, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (v) => format(Math.round(v)));
  const [displayValue, setDisplayValue] = useState(format(value));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => setDisplayValue(v));
    return unsubscribe;
  }, [display]);

  return <span className={className}>{displayValue}</span>;
}

// ── Component ────────────────────────────────────────────────

export function LiveBudgetTicker({
  currentSpend,
  totalBudget,
  percentUsed,
  warningThreshold = 75,
  criticalThreshold = 90,
  formatCurrency = defaultFormatCurrency,
  showVariance = true,
  compact = false,
  className,
}: LiveBudgetTickerProps) {
  const clampedPercent = Math.min(Math.max(percentUsed, 0), 100);
  const variance = totalBudget - currentSpend;
  const isOverBudget = currentSpend > totalBudget;

  // Color based on threshold
  const barColor =
    clampedPercent >= criticalThreshold || isOverBudget
      ? 'bg-red-500'
      : clampedPercent >= warningThreshold
        ? 'bg-amber-500'
        : 'bg-green-500';

  const textColor =
    clampedPercent >= criticalThreshold || isOverBudget
      ? 'text-red-600'
      : clampedPercent >= warningThreshold
        ? 'text-amber-600'
        : 'text-green-600';

  const StatusIcon = isOverBudget ? AlertTriangle : clampedPercent >= warningThreshold ? TrendingUp : DollarSign;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <StatusIcon className={cn('h-4 w-4 flex-shrink-0', textColor)} />
        <div className="flex-1">
          <div className="flex items-baseline gap-1">
            <AnimatedNumber value={currentSpend} format={formatCurrency} className={cn('text-sm font-bold', textColor)} />
            <span className="text-xs text-gray-400"> / {formatCurrency(totalBudget)}</span>
          </div>
          {/* Progress bar */}
          <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
            <motion.div
              className={cn('h-full rounded-full', barColor)}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(clampedPercent, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
        <span className={cn('text-xs font-semibold', textColor)}>
          {clampedPercent.toFixed(0)}%
        </span>
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn('rounded-full p-1.5', textColor === 'text-red-600' ? 'bg-red-100' : textColor === 'text-amber-600' ? 'bg-amber-100' : 'bg-green-100')}>
            <StatusIcon className={cn('h-4 w-4', textColor)} />
          </div>
          <span className="text-sm font-medium text-gray-700">Budget</span>
        </div>
        <span className={cn('text-sm font-bold', textColor)}>
          {clampedPercent.toFixed(0)}% used
        </span>
      </div>

      {/* Amounts */}
      <div className="flex items-baseline gap-2 mb-3">
        <AnimatedNumber
          value={currentSpend}
          format={formatCurrency}
          className={cn('text-2xl font-bold', textColor)}
        />
        <span className="text-sm text-gray-400">
          / {formatCurrency(totalBudget)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2.5 w-full rounded-full bg-gray-200 overflow-hidden mb-2">
        <motion.div
          className={cn('h-full rounded-full', barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(clampedPercent, 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Variance */}
      {showVariance && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">
            {isOverBudget ? 'Over budget by' : 'Remaining'}
          </span>
          <AnimatedNumber
            value={Math.abs(variance)}
            format={formatCurrency}
            className={cn('font-medium', isOverBudget ? 'text-red-600' : 'text-green-600')}
          />
        </div>
      )}
    </div>
  );
}
