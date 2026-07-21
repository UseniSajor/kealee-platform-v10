// packages/ui/src/components/feedback/LoadingState.tsx
// Loading state component for displaying loading indicators

'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils';

export type LoadingVariant =
  | 'spinner'
  | 'dots'
  | 'pulse'
  | 'skeleton'
  | 'bars';

export type LoadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface LoadingStateProps {
  variant?: LoadingVariant;
  size?: LoadingSize;
  text?: string;
  subtext?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  className?: string;
}

const sizeConfig = {
  xs: { spinner: 'w-4 h-4', text: 'text-xs', gap: 'gap-1' },
  sm: { spinner: 'w-5 h-5', text: 'text-sm', gap: 'gap-2' },
  md: { spinner: 'w-8 h-8', text: 'text-base', gap: 'gap-3' },
  lg: { spinner: 'w-12 h-12', text: 'text-lg', gap: 'gap-4' },
  xl: { spinner: 'w-16 h-16', text: 'text-xl', gap: 'gap-5' },
};

function Spinner({ size }: { size: LoadingSize }) {
  const sizeStyles = sizeConfig[size];
  return (
    <Loader2
      className={cn(sizeStyles.spinner, 'animate-spin text-blue-600')}
    />
  );
}

function Dots({ size }: { size: LoadingSize }) {
  const dotSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
  };

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            dotSizes[size],
            'rounded-full bg-blue-600 animate-bounce'
          )}
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}

function Pulse({ size }: { size: LoadingSize }) {
  const sizeStyles = sizeConfig[size];
  return (
    <div className="relative">
      <div
        className={cn(
          sizeStyles.spinner,
          'rounded-full bg-blue-600 animate-ping absolute'
        )}
      />
      <div
        className={cn(
          sizeStyles.spinner,
          'rounded-full bg-blue-600 opacity-75'
        )}
      />
    </div>
  );
}

function Bars({ size }: { size: LoadingSize }) {
  const barSizes = {
    xs: 'w-1 h-4',
    sm: 'w-1.5 h-6',
    md: 'w-2 h-8',
    lg: 'w-2.5 h-10',
    xl: 'w-3 h-12',
  };

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={cn(barSizes[size], 'bg-blue-600 rounded-full animate-pulse')}
          style={{
            animationDelay: `${i * 100}ms`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  );
}

export function LoadingState({
  variant = 'spinner',
  size = 'md',
  text,
  subtext,
  fullScreen = false,
  overlay = false,
  className,
}: LoadingStateProps) {
  const sizeStyles = sizeConfig[size];

  const LoadingIndicator = () => {
    switch (variant) {
      case 'dots':
        return <Dots size={size} />;
      case 'pulse':
        return <Pulse size={size} />;
      case 'bars':
        return <Bars size={size} />;
      default:
        return <Spinner size={size} />;
    }
  };

  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        sizeStyles.gap,
        className
      )}
    >
      <LoadingIndicator />
      {text && (
        <div className="text-center">
          <p className={cn('font-medium text-gray-700', sizeStyles.text)}>
            {text}
          </p>
          {subtext && (
            <p className="text-sm text-gray-500 mt-1">{subtext}</p>
          )}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center',
          overlay ? 'bg-white/80 backdrop-blur-sm' : 'bg-white'
        )}
      >
        {content}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg">
        {content}
      </div>
    );
  }

  return content;
}

// Skeleton loading component
export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 1,
  className,
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200 animate-pulse';

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg',
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(baseClasses, variantClasses.text)}
            style={{
              width: i === lines - 1 ? '60%' : '100%',
              height,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={{ width, height }}
    />
  );
}

// Card skeleton for loading cards
export interface CardSkeletonProps {
  showImage?: boolean;
  showAvatar?: boolean;
  lines?: number;
  className?: string;
}

export function CardSkeleton({
  showImage = false,
  showAvatar = false,
  lines = 3,
  className,
}: CardSkeletonProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 p-5',
        className
      )}
    >
      {showImage && (
        <Skeleton variant="rounded" width="100%" height={160} className="mb-4" />
      )}

      <div className="flex items-start gap-3 mb-4">
        {showAvatar && (
          <Skeleton variant="circular" width={48} height={48} />
        )}
        <div className="flex-1">
          <Skeleton variant="text" width="60%" className="mb-2" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>

      <Skeleton variant="text" lines={lines} className="mb-4" />

      <div className="flex items-center gap-3">
        <Skeleton variant="rounded" width={80} height={24} />
        <Skeleton variant="rounded" width={60} height={24} />
      </div>
    </div>
  );
}

// Table skeleton for loading tables
export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  className,
}: TableSkeletonProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 overflow-hidden',
        className
      )}
    >
      {showHeader && (
        <div className="bg-gray-50 px-4 py-3 flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={i}
              variant="text"
              width={i === 0 ? '30%' : '20%'}
              className="h-3"
            />
          ))}
        </div>
      )}

      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-4 py-3 flex gap-4 items-center">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                variant="text"
                width={colIndex === 0 ? '30%' : '20%'}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default LoadingState;
