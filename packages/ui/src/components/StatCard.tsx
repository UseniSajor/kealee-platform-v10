// packages/ui/src/components/StatCard.tsx
// Kealee Platform Stat Card Component - Enterprise Dashboard Metrics

'use client';

import React from 'react';
import { cn } from '../lib/utils';

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: React.ReactNode;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
  variant?: 'default' | 'gradient' | 'minimal' | 'outlined';
}

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'neutral' }) => {
  if (trend === 'up') {
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
      </svg>
    );
  }
  if (trend === 'down') {
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
    </svg>
  );
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  description,
  trend,
  loading = false,
  variant = 'default',
  className,
  ...props
}) => {
  const variants = {
    default: 'bg-white border border-gray-200 shadow-sm',
    gradient: 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100',
    minimal: 'bg-gray-50 border-0',
    outlined: 'bg-white border-2 border-gray-300',
  };

  const changeColors = {
    increase: 'text-emerald-600 bg-emerald-50',
    decrease: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-100',
  };

  if (loading) {
    return (
      <div
        className={cn(
          'rounded-xl p-6 animate-pulse',
          variants[variant],
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-10 w-10 bg-gray-200 rounded-lg" />
        </div>
        <div className="h-8 w-20 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-16 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl p-6 transition-all duration-200 hover:shadow-md',
        variants[variant],
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">
            {value}
          </p>
        </div>
        {icon && (
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            {icon}
          </div>
        )}
      </div>

      {(change || description) && (
        <div className="mt-4 flex items-center gap-2">
          {change && (
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                changeColors[change.type]
              )}
            >
              <TrendIcon trend={change.type === 'increase' ? 'up' : change.type === 'decrease' ? 'down' : 'neutral'} />
              {change.value > 0 ? '+' : ''}{change.value}%
            </span>
          )}
          {description && (
            <span className="text-sm text-gray-500">{description}</span>
          )}
        </div>
      )}
    </div>
  );
};

StatCard.displayName = 'StatCard';

export { StatCard };
export default StatCard;
