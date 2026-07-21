// packages/ui/src/components/ProgressBar.tsx
// Kealee Platform Progress Bar Component

import React from 'react';
import { cn } from '../lib/utils';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0-100
  max?: number;
  showLabel?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      className,
      value,
      max = 100,
      showLabel = false,
      variant = 'default',
      size = 'md',
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    
    const baseStyles = 'w-full bg-gray-200 rounded-full overflow-hidden';
    
    const sizes = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    };
    
    const variants = {
      default: 'bg-primary-600',
      success: 'bg-green-600',
      warning: 'bg-yellow-600',
      error: 'bg-red-600',
    };
    
    return (
      <div className={cn('w-full', className)} {...props}>
        {showLabel && (
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-medium text-gray-700">{Math.round(percentage)}%</span>
          </div>
        )}
        <div ref={ref} className={cn(baseStyles, sizes[size])}>
          <div
            className={cn(
              'h-full transition-all duration-500 ease-out',
              variants[variant]
            )}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
          />
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar;
