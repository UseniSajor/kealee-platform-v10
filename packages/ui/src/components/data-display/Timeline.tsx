// packages/ui/src/components/data-display/Timeline.tsx
// Timeline component for displaying project milestones and events

'use client';

import React from 'react';
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  Flag,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../utils';

export type TimelineItemStatus =
  | 'completed'
  | 'current'
  | 'upcoming'
  | 'overdue'
  | 'blocked';

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  date?: Date | string;
  endDate?: Date | string;
  status: TimelineItemStatus;
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  metadata?: Record<string, any>;
  children?: React.ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  orientation?: 'vertical' | 'horizontal';
  showConnectors?: boolean;
  showDates?: boolean;
  dateFormat?: 'relative' | 'absolute' | 'short';
  alternating?: boolean;
  compact?: boolean;
  className?: string;
  itemClassName?: string;
  onItemClick?: (item: TimelineItem) => void;
}

const statusConfig: Record<
  TimelineItemStatus,
  { icon: LucideIcon; color: string; bgColor: string; lineColor: string }
> = {
  completed: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    lineColor: 'bg-green-500',
  },
  current: {
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    lineColor: 'bg-blue-500',
  },
  upcoming: {
    icon: Circle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-100',
    lineColor: 'bg-gray-200',
  },
  overdue: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    lineColor: 'bg-red-500',
  },
  blocked: {
    icon: Flag,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    lineColor: 'bg-amber-500',
  },
};

function formatDate(
  date: Date | string,
  format: 'relative' | 'absolute' | 'short'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  if (format === 'relative') {
    const diff = d.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days === -1) return 'Yesterday';
    if (days > 0 && days < 7) return `In ${days} days`;
    if (days < 0 && days > -7) return `${Math.abs(days)} days ago`;
  }

  if (format === 'short') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function Timeline({
  items,
  orientation = 'vertical',
  showConnectors = true,
  showDates = true,
  dateFormat = 'short',
  alternating = false,
  compact = false,
  className,
  itemClassName,
  onItemClick,
}: TimelineProps) {
  if (orientation === 'horizontal') {
    return (
      <div className={cn('flex overflow-x-auto pb-4', className)}>
        {items.map((item, index) => {
          const config = statusConfig[item.status];
          const Icon = item.icon || config.icon;
          const isLast = index === items.length - 1;

          return (
            <div
              key={item.id}
              className={cn(
                'flex flex-col items-center min-w-[120px]',
                onItemClick && 'cursor-pointer',
                itemClassName
              )}
              onClick={() => onItemClick?.(item)}
            >
              {/* Date */}
              {showDates && item.date && (
                <div className="text-xs text-gray-500 mb-2">
                  {formatDate(item.date, dateFormat)}
                </div>
              )}

              {/* Icon and connector */}
              <div className="flex items-center w-full">
                {/* Left connector */}
                {showConnectors && index > 0 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5',
                      statusConfig[items[index - 1].status].lineColor
                    )}
                  />
                )}

                {/* Icon */}
                <div
                  className={cn(
                    'flex items-center justify-center rounded-full z-10',
                    compact ? 'w-8 h-8' : 'w-10 h-10',
                    item.iconBgColor || config.bgColor
                  )}
                >
                  <Icon
                    className={cn(
                      compact ? 'w-4 h-4' : 'w-5 h-5',
                      item.iconColor || config.color
                    )}
                  />
                </div>

                {/* Right connector */}
                {showConnectors && !isLast && (
                  <div className={cn('flex-1 h-0.5', config.lineColor)} />
                )}
              </div>

              {/* Content */}
              <div className={cn('mt-3 text-center', compact ? 'px-2' : 'px-4')}>
                <h4
                  className={cn(
                    'font-medium text-gray-900',
                    compact ? 'text-xs' : 'text-sm'
                  )}
                >
                  {item.title}
                </h4>
                {item.description && !compact && (
                  <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Vertical timeline
  return (
    <div className={cn('relative', className)}>
      {items.map((item, index) => {
        const config = statusConfig[item.status];
        const Icon = item.icon || config.icon;
        const isLast = index === items.length - 1;
        const isAlternate = alternating && index % 2 === 1;

        return (
          <div
            key={item.id}
            className={cn(
              'relative flex',
              alternating ? 'justify-center' : '',
              compact ? 'pb-4' : 'pb-8',
              onItemClick && 'cursor-pointer',
              itemClassName
            )}
            onClick={() => onItemClick?.(item)}
          >
            {/* Alternating left content */}
            {alternating && (
              <div
                className={cn(
                  'flex-1 pr-8',
                  !isAlternate && 'opacity-0 pointer-events-none'
                )}
              >
                {isAlternate && (
                  <div className="text-right">
                    {showDates && item.date && (
                      <div className="text-xs text-gray-500 mb-1">
                        {formatDate(item.date, dateFormat)}
                      </div>
                    )}
                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                    {item.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {item.description}
                      </p>
                    )}
                    {item.children && <div className="mt-2">{item.children}</div>}
                  </div>
                )}
              </div>
            )}

            {/* Timeline line and icon */}
            <div className="relative flex flex-col items-center">
              {/* Icon */}
              <div
                className={cn(
                  'flex items-center justify-center rounded-full z-10 border-4 border-white',
                  compact ? 'w-8 h-8' : 'w-10 h-10',
                  item.iconBgColor || config.bgColor
                )}
              >
                <Icon
                  className={cn(
                    compact ? 'w-4 h-4' : 'w-5 h-5',
                    item.iconColor || config.color
                  )}
                />
              </div>

              {/* Connector line */}
              {showConnectors && !isLast && (
                <div
                  className={cn(
                    'absolute top-10 w-0.5 h-full',
                    compact ? 'top-8' : 'top-10',
                    config.lineColor
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div
              className={cn(
                alternating ? 'flex-1 pl-8' : 'flex-1 ml-4',
                alternating && isAlternate && 'opacity-0 pointer-events-none'
              )}
            >
              {(!alternating || !isAlternate) && (
                <div>
                  {showDates && item.date && (
                    <div className="text-xs text-gray-500 mb-1">
                      {formatDate(item.date, dateFormat)}
                      {item.endDate && (
                        <span> - {formatDate(item.endDate, dateFormat)}</span>
                      )}
                    </div>
                  )}
                  <h4
                    className={cn(
                      'font-medium text-gray-900',
                      compact && 'text-sm'
                    )}
                  >
                    {item.title}
                  </h4>
                  {item.description && (
                    <p
                      className={cn(
                        'text-gray-500 mt-1',
                        compact ? 'text-xs' : 'text-sm'
                      )}
                    >
                      {item.description}
                    </p>
                  )}
                  {item.children && (
                    <div className={cn('mt-2', compact && 'mt-1')}>
                      {item.children}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Timeline;
