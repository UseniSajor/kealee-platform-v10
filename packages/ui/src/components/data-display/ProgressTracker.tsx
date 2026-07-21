// packages/ui/src/components/data-display/ProgressTracker.tsx
// Progress tracker component for displaying multi-step progress

'use client';

import React from 'react';
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../utils';

export type StepStatus =
  | 'completed'
  | 'current'
  | 'upcoming'
  | 'error'
  | 'loading';

export interface ProgressStep {
  id: string;
  title: string;
  description?: string;
  status: StepStatus;
  icon?: LucideIcon;
  metadata?: Record<string, any>;
}

export interface ProgressTrackerProps {
  steps: ProgressStep[];
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'simple' | 'detailed';
  size?: 'sm' | 'md' | 'lg';
  showNumbers?: boolean;
  showDescriptions?: boolean;
  clickable?: boolean;
  onStepClick?: (step: ProgressStep, index: number) => void;
  className?: string;
}

const statusConfig: Record<
  StepStatus,
  { icon: LucideIcon; color: string; bgColor: string; borderColor: string }
> = {
  completed: {
    icon: CheckCircle2,
    color: 'text-white',
    bgColor: 'bg-green-500',
    borderColor: 'border-green-500',
  },
  current: {
    icon: Circle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-500',
  },
  upcoming: {
    icon: Circle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
  },
  error: {
    icon: AlertCircle,
    color: 'text-white',
    bgColor: 'bg-red-500',
    borderColor: 'border-red-500',
  },
  loading: {
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-500',
  },
};

const sizeConfig = {
  sm: {
    icon: 'w-6 h-6',
    iconInner: 'w-3 h-3',
    text: 'text-xs',
    descText: 'text-xs',
    gap: 'gap-2',
    connectorHeight: 'h-6',
    connectorWidth: 'w-12',
  },
  md: {
    icon: 'w-8 h-8',
    iconInner: 'w-4 h-4',
    text: 'text-sm',
    descText: 'text-xs',
    gap: 'gap-3',
    connectorHeight: 'h-8',
    connectorWidth: 'w-16',
  },
  lg: {
    icon: 'w-10 h-10',
    iconInner: 'w-5 h-5',
    text: 'text-base',
    descText: 'text-sm',
    gap: 'gap-4',
    connectorHeight: 'h-10',
    connectorWidth: 'w-20',
  },
};

export function ProgressTracker({
  steps,
  orientation = 'horizontal',
  variant = 'default',
  size = 'md',
  showNumbers = false,
  showDescriptions = true,
  clickable = false,
  onStepClick,
  className,
}: ProgressTrackerProps) {
  const sizeStyles = sizeConfig[size];

  // Simple variant - just dots connected by lines
  if (variant === 'simple') {
    return (
      <div
        className={cn(
          'flex items-center',
          orientation === 'vertical' ? 'flex-col' : 'flex-row',
          className
        )}
      >
        {steps.map((step, index) => {
          const config = statusConfig[step.status];
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.id}>
              <div
                className={cn(
                  'flex items-center justify-center rounded-full',
                  sizeStyles.icon,
                  config.bgColor,
                  clickable && 'cursor-pointer hover:opacity-80',
                  step.status === 'current' && 'ring-2 ring-blue-500 ring-offset-2'
                )}
                onClick={() => clickable && onStepClick?.(step, index)}
                title={step.title}
              >
                {showNumbers ? (
                  <span
                    className={cn(
                      'font-semibold',
                      sizeStyles.text,
                      step.status === 'completed' || step.status === 'error'
                        ? 'text-white'
                        : config.color
                    )}
                  >
                    {index + 1}
                  </span>
                ) : step.status === 'loading' ? (
                  <Loader2
                    className={cn(sizeStyles.iconInner, config.color, 'animate-spin')}
                  />
                ) : step.status === 'completed' ? (
                  <CheckCircle2 className={cn(sizeStyles.iconInner, config.color)} />
                ) : null}
              </div>

              {!isLast && (
                <div
                  className={cn(
                    orientation === 'vertical'
                      ? cn('w-0.5', sizeStyles.connectorHeight)
                      : cn('h-0.5', sizeStyles.connectorWidth),
                    step.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // Vertical orientation
  if (orientation === 'vertical') {
    return (
      <div className={cn('space-y-0', className)}>
        {steps.map((step, index) => {
          const config = statusConfig[step.status];
          const Icon = step.icon || config.icon;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="relative flex">
              {/* Icon and connector */}
              <div className="flex flex-col items-center mr-4">
                <div
                  className={cn(
                    'flex items-center justify-center rounded-full border-2',
                    sizeStyles.icon,
                    config.bgColor,
                    config.borderColor,
                    clickable && 'cursor-pointer hover:opacity-80',
                    step.status === 'current' && 'ring-2 ring-blue-500 ring-offset-2'
                  )}
                  onClick={() => clickable && onStepClick?.(step, index)}
                >
                  {showNumbers ? (
                    <span
                      className={cn(
                        'font-semibold',
                        sizeStyles.text,
                        step.status === 'completed' || step.status === 'error'
                          ? 'text-white'
                          : config.color
                      )}
                    >
                      {index + 1}
                    </span>
                  ) : step.status === 'loading' ? (
                    <Loader2
                      className={cn(sizeStyles.iconInner, config.color, 'animate-spin')}
                    />
                  ) : (
                    <Icon className={cn(sizeStyles.iconInner, config.color)} />
                  )}
                </div>

                {!isLast && (
                  <div
                    className={cn(
                      'w-0.5 flex-1 min-h-[32px] my-1',
                      step.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>

              {/* Content */}
              <div className={cn('flex-1 pb-8', isLast && 'pb-0')}>
                <h4
                  className={cn(
                    'font-medium',
                    sizeStyles.text,
                    step.status === 'upcoming' ? 'text-gray-500' : 'text-gray-900'
                  )}
                >
                  {step.title}
                </h4>
                {showDescriptions && step.description && (
                  <p className={cn('text-gray-500 mt-1', sizeStyles.descText)}>
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal (default) orientation
  return (
    <div className={cn('flex items-start', className)}>
      {steps.map((step, index) => {
        const config = statusConfig[step.status];
        const Icon = step.icon || config.icon;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            <div
              className={cn(
                'flex flex-col items-center',
                sizeStyles.gap,
                clickable && 'cursor-pointer'
              )}
              onClick={() => clickable && onStepClick?.(step, index)}
            >
              {/* Icon */}
              <div
                className={cn(
                  'flex items-center justify-center rounded-full border-2 transition-all',
                  sizeStyles.icon,
                  config.bgColor,
                  config.borderColor,
                  clickable && 'hover:opacity-80',
                  step.status === 'current' && 'ring-2 ring-blue-500 ring-offset-2'
                )}
              >
                {showNumbers ? (
                  <span
                    className={cn(
                      'font-semibold',
                      sizeStyles.text,
                      step.status === 'completed' || step.status === 'error'
                        ? 'text-white'
                        : config.color
                    )}
                  >
                    {index + 1}
                  </span>
                ) : step.status === 'loading' ? (
                  <Loader2
                    className={cn(sizeStyles.iconInner, config.color, 'animate-spin')}
                  />
                ) : (
                  <Icon className={cn(sizeStyles.iconInner, config.color)} />
                )}
              </div>

              {/* Text */}
              <div className="text-center max-w-[120px]">
                <h4
                  className={cn(
                    'font-medium leading-tight',
                    sizeStyles.text,
                    step.status === 'upcoming' ? 'text-gray-500' : 'text-gray-900'
                  )}
                >
                  {step.title}
                </h4>
                {showDescriptions && step.description && variant === 'detailed' && (
                  <p className={cn('text-gray-500 mt-1', sizeStyles.descText)}>
                    {step.description}
                  </p>
                )}
              </div>
            </div>

            {/* Connector */}
            {!isLast && (
              <div
                className={cn(
                  'flex-1 h-0.5 mt-4 mx-2',
                  step.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                )}
                style={{ minWidth: '40px' }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default ProgressTracker;
