// packages/ui/src/components/Progress.tsx
// Kealee Platform Progress Component (Enhanced version of ProgressBar)

import React from 'react';
import { cn } from '../lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Current progress value (0-100)
   */
  value: number;
  /**
   * Maximum value (default: 100)
   */
  max?: number;
  /**
   * Show label with percentage
   */
  showLabel?: boolean;
  /**
   * Variant color
   */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  /**
   * Size of the progress bar
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Show animated indicator
   */
  animated?: boolean;
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2.5',
  lg: 'h-4',
};

const colorClasses = {
  default: 'bg-gray-300',
  primary: 'bg-primary-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
};

/**
 * Progress component for displaying progress indicators
 * 
 * @example
 * ```tsx
 * <Progress value={50} />
 * <Progress value={75} variant="success" showLabel />
 * <Progress value={30} size="lg" animated />
 * ```
 */
const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value,
      max = 100,
      showLabel = false,
      variant = 'default',
      size = 'md',
      animated = false,
      className,
      ...props
    },
    ref
  ) => {
    const progress = Math.max(0, Math.min(100, (value / max) * 100));

    return (
      <div
        ref={ref}
        className={cn('w-full bg-gray-200 rounded-full relative', sizeClasses[size], className)}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`Progress: ${Math.round(progress)}%`}
        {...props}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            colorClasses[variant],
            animated && 'animate-pulse'
          )}
          style={{ width: `${progress}%` }}
        >
          {showLabel && (
            <span
              className={cn(
                'absolute right-0 top-1/2 -translate-y-1/2 text-xs font-medium text-white pr-1',
                progress < 10 && 'text-gray-700 left-full pl-1'
              )}
            >
              {Math.round(progress)}%
            </span>
          )}
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress };
