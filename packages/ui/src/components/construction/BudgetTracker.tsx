// packages/ui/src/components/construction/BudgetTracker.tsx
// Budget Meter — segmented progress bar with category breakdown

import React from 'react';
import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface BudgetCategory {
  label: string;
  amount: number;
  color: string; // Tailwind bg class
}

export interface BudgetStat {
  label: string;
  value: string;
  subLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface BudgetTrackerProps {
  totalBudget: number;
  spentAmount: number;
  categories?: BudgetCategory[];
  stats?: BudgetStat[];
  className?: string;
}

const DEFAULT_CATEGORIES: BudgetCategory[] = [
  { label: 'Labor', amount: 0, color: 'bg-primary-600' },
  { label: 'Materials', amount: 0, color: 'bg-primary-400' },
  { label: 'Permits', amount: 0, color: 'bg-primary-200' },
];

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

export function BudgetTracker({
  totalBudget,
  spentAmount,
  categories = DEFAULT_CATEGORIES,
  stats = [],
  className,
}: BudgetTrackerProps) {
  const pct = totalBudget > 0 ? Math.min(100, (spentAmount / totalBudget) * 100) : 0;
  const remaining = Math.max(0, totalBudget - spentAmount);
  const isOverBudget = spentAmount > totalBudget;

  // Normalize category widths relative to totalBudget
  const totalCategoryAmount = categories.reduce((s, c) => s + c.amount, 0);
  const hasCategoryData = totalCategoryAmount > 0;

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 shadow-sm p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Project Budget</h3>
        <span
          className={cn(
            'text-sm font-bold',
            isOverBudget ? 'text-error-600' : pct >= 80 ? 'text-warning-600' : 'text-gray-700'
          )}
        >
          {pct.toFixed(0)}%
        </span>
      </div>

      {/* Main amounts */}
      <div className="mb-3">
        <div className="flex items-baseline gap-1.5">
          <span className={cn('text-3xl font-bold', isOverBudget ? 'text-error-600' : 'text-gray-900')}>
            {formatCurrency(spentAmount)}
          </span>
          <span className="text-gray-400 text-sm">/ {formatCurrency(totalBudget)}</span>
        </div>
        {isOverBudget && (
          <p className="text-xs text-error-600 mt-0.5 font-medium">
            Over budget by {formatCurrency(spentAmount - totalBudget)}
          </p>
        )}
      </div>

      {/* Segmented progress bar */}
      <div className="mb-1">
        <div className="h-6 bg-gray-200 rounded-full overflow-hidden flex">
          {hasCategoryData ? (
            <>
              {categories.map((cat, i) => {
                const catPct = (cat.amount / totalBudget) * 100;
                return catPct > 0 ? (
                  <div
                    key={i}
                    className={cn('h-full', cat.color)}
                    style={{ width: `${catPct}%` }}
                    title={`${cat.label}: ${formatCurrency(cat.amount)}`}
                  />
                ) : null;
              })}
            </>
          ) : (
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700',
                isOverBudget ? 'bg-error-500' : pct >= 80 ? 'bg-warning-500' : 'bg-primary-600'
              )}
              style={{ width: `${pct}%` }}
            />
          )}
        </div>
      </div>

      {/* Category labels */}
      {hasCategoryData && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
          {categories.map((cat, i) => (
            cat.amount > 0 && (
              <div key={i} className="flex items-center gap-1.5">
                <div className={cn('w-2.5 h-2.5 rounded-sm', cat.color)} />
                <span className="text-xs text-gray-500">{cat.label}</span>
                <span className="text-xs font-medium text-gray-700">{formatCurrency(cat.amount)}</span>
              </div>
            )
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-gray-200" />
            <span className="text-xs text-gray-500">Remaining</span>
            <span className="text-xs font-medium text-gray-700">{formatCurrency(remaining)}</span>
          </div>
        </div>
      )}

      {/* Stats row */}
      {stats.length > 0 && (
        <div className={cn('grid gap-3 pt-4 border-t border-gray-100', `grid-cols-${Math.min(3, stats.length)}`)}>
          {stats.map((stat, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-0.5">{stat.label}</p>
              <p className="text-base font-bold text-gray-900">{stat.value}</p>
              {stat.subLabel && (
                <div className="flex items-center justify-center gap-0.5 mt-0.5">
                  {stat.trend === 'up' && <TrendingUp className="w-3 h-3 text-success-500" />}
                  {stat.trend === 'down' && <TrendingDown className="w-3 h-3 text-error-500" />}
                  {stat.trend === 'neutral' && <Minus className="w-3 h-3 text-gray-400" />}
                  <span
                    className={cn(
                      'text-xs',
                      stat.trend === 'up' && 'text-success-600',
                      stat.trend === 'down' && 'text-error-600',
                      (!stat.trend || stat.trend === 'neutral') && 'text-gray-500'
                    )}
                  >
                    {stat.subLabel}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
