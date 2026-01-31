// packages/ui/src/components/data-display/MetricCard.tsx
// Metric card component for displaying KPIs and statistics

'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUp,
  ArrowDown,
  Info,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../utils';

export type TrendDirection = 'up' | 'down' | 'neutral';
export type TrendSentiment = 'positive' | 'negative' | 'neutral';

export interface MetricCardProps {
  title: string;
  value: string | number;
  previousValue?: string | number;
  change?: number;
  changeLabel?: string;
  trend?: TrendDirection;
  trendSentiment?: TrendSentiment;
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  description?: string;
  tooltip?: string;
  sparklineData?: number[];
  footer?: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'compact' | 'detailed';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function formatNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

function Sparkline({ data, color = '#3B82F6' }: { data: number[]; color?: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 32;
  const width = 80;
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const sizeConfig = {
  sm: {
    padding: 'p-3',
    titleSize: 'text-xs',
    valueSize: 'text-xl',
    iconSize: 'w-8 h-8',
    iconInner: 'w-4 h-4',
  },
  md: {
    padding: 'p-4',
    titleSize: 'text-sm',
    valueSize: 'text-2xl',
    iconSize: 'w-10 h-10',
    iconInner: 'w-5 h-5',
  },
  lg: {
    padding: 'p-5',
    titleSize: 'text-base',
    valueSize: 'text-3xl',
    iconSize: 'w-12 h-12',
    iconInner: 'w-6 h-6',
  },
};

export function MetricCard({
  title,
  value,
  previousValue,
  change,
  changeLabel,
  trend,
  trendSentiment,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-100',
  description,
  tooltip,
  sparklineData,
  footer,
  loading = false,
  onClick,
  href,
  variant = 'default',
  size = 'md',
  className,
}: MetricCardProps) {
  const sizeStyles = sizeConfig[size];

  // Determine trend direction and sentiment
  const trendDirection = trend || (change !== undefined ? (change > 0 ? 'up' : change < 0 ? 'down' : 'neutral') : 'neutral');
  const sentiment = trendSentiment || (trendDirection === 'neutral' ? 'neutral' : trendDirection === 'up' ? 'positive' : 'negative');

  const TrendIcon = trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : Minus;

  const trendColorClass =
    sentiment === 'positive'
      ? 'text-green-600 bg-green-100'
      : sentiment === 'negative'
        ? 'text-red-600 bg-red-100'
        : 'text-gray-600 bg-gray-100';

  const sparklineColor =
    sentiment === 'positive' ? '#10B981' : sentiment === 'negative' ? '#EF4444' : '#6B7280';

  const CardWrapper = href ? 'a' : onClick ? 'button' : 'div';
  const cardProps = href
    ? { href }
    : onClick
      ? { onClick, type: 'button' as const }
      : {};

  // Compact variant
  if (variant === 'compact') {
    return (
      <CardWrapper
        {...cardProps}
        className={cn(
          'flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-3',
          (onClick || href) && 'hover:shadow-md hover:border-gray-300 transition-all cursor-pointer',
          className
        )}
      >
        {Icon && (
          <div
            className={cn(
              'flex items-center justify-center rounded-lg',
              sizeStyles.iconSize,
              iconBgColor
            )}
          >
            <Icon className={cn('w-5 h-5', iconColor)} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-500 truncate">{title}</div>
          <div className="text-lg font-bold text-gray-900">
            {loading ? (
              <div className="h-6 w-16 bg-gray-200 animate-pulse rounded" />
            ) : typeof value === 'number' ? (
              formatNumber(value)
            ) : (
              value
            )}
          </div>
        </div>

        {change !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
              trendColorClass
            )}
          >
            {trendDirection === 'up' ? (
              <ArrowUp className="w-3 h-3" />
            ) : trendDirection === 'down' ? (
              <ArrowDown className="w-3 h-3" />
            ) : null}
            {Math.abs(change)}%
          </div>
        )}
      </CardWrapper>
    );
  }

  // Detailed variant
  if (variant === 'detailed') {
    return (
      <CardWrapper
        {...cardProps}
        className={cn(
          'bg-white rounded-xl border border-gray-200 overflow-hidden',
          (onClick || href) && 'hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer',
          className
        )}
      >
        <div className={sizeStyles.padding}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {Icon && (
                <div
                  className={cn(
                    'flex items-center justify-center rounded-lg',
                    sizeStyles.iconSize,
                    iconBgColor
                  )}
                >
                  <Icon className={cn(sizeStyles.iconInner, iconColor)} />
                </div>
              )}
              <div>
                <div className="flex items-center gap-1">
                  <h3 className={cn('font-medium text-gray-700', sizeStyles.titleSize)}>
                    {title}
                  </h3>
                  {tooltip && (
                    <div className="group relative">
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {tooltip}
                      </div>
                    </div>
                  )}
                </div>
                {description && (
                  <p className="text-xs text-gray-500">{description}</p>
                )}
              </div>
            </div>

            {sparklineData && sparklineData.length > 0 && (
              <Sparkline data={sparklineData} color={sparklineColor} />
            )}
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div className={cn('font-bold text-gray-900', sizeStyles.valueSize)}>
                {loading ? (
                  <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
                ) : typeof value === 'number' ? (
                  formatNumber(value)
                ) : (
                  value
                )}
              </div>
              {previousValue !== undefined && (
                <div className="text-xs text-gray-500 mt-1">
                  vs {typeof previousValue === 'number' ? formatNumber(previousValue) : previousValue}
                </div>
              )}
            </div>

            {change !== undefined && (
              <div
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
                  trendColorClass
                )}
              >
                <TrendIcon className="w-4 h-4" />
                <span>{change > 0 ? '+' : ''}{change}%</span>
                {changeLabel && (
                  <span className="text-xs opacity-75">{changeLabel}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {footer && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-600">
            {footer}
          </div>
        )}
      </CardWrapper>
    );
  }

  // Default variant
  return (
    <CardWrapper
      {...cardProps}
      className={cn(
        'bg-white rounded-xl border border-gray-200',
        sizeStyles.padding,
        (onClick || href) && 'hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className={cn('font-medium text-gray-600', sizeStyles.titleSize)}>
            {title}
          </h3>
          {tooltip && (
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {tooltip}
              </div>
            </div>
          )}
        </div>

        {Icon && (
          <div
            className={cn(
              'flex items-center justify-center rounded-lg',
              sizeStyles.iconSize,
              iconBgColor
            )}
          >
            <Icon className={cn(sizeStyles.iconInner, iconColor)} />
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className={cn('font-bold text-gray-900', sizeStyles.valueSize)}>
            {loading ? (
              <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
            ) : typeof value === 'number' ? (
              formatNumber(value)
            ) : (
              value
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          {change !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                trendColorClass
              )}
            >
              {trendDirection === 'up' ? (
                <ArrowUp className="w-3 h-3" />
              ) : trendDirection === 'down' ? (
                <ArrowDown className="w-3 h-3" />
              ) : null}
              {change > 0 ? '+' : ''}{change}%
            </div>
          )}
          {sparklineData && sparklineData.length > 0 && (
            <Sparkline data={sparklineData} color={sparklineColor} />
          )}
        </div>
      </div>

      {footer && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
          {footer}
        </div>
      )}
    </CardWrapper>
  );
}

export default MetricCard;
