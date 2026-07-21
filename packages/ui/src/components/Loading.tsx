// packages/ui/src/components/Loading.tsx
// Kealee Platform Loading Component

import React from 'react';
import { cn } from '../lib/utils';

export interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Size of the loading spinner
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Variant of the loading indicator
   */
  variant?: 'spinner' | 'dots' | 'pulse';
  /**
   * Loading text to display
   */
  text?: string;
  /**
   * Full screen overlay
   */
  fullScreen?: boolean;
}

/**
 * Loading component for displaying loading states
 * 
 * @example
 * ```tsx
 * <Loading />
 * <Loading size="lg" text="Loading..." />
 * <Loading variant="dots" />
 * <Loading fullScreen />
 * ```
 */
const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'spinner',
  text,
  fullScreen = false,
  className,
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const Spinner = () => (
    <div
      className={cn(
        'border-2 border-gray-200 border-t-primary-600',
        'rounded-full animate-spin',
        sizeClasses[size]
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );

  const Dots = () => (
    <div className="flex items-center gap-1.5" role="status" aria-label="Loading">
      <div
        className={cn(
          'bg-primary-600 rounded-full animate-pulse',
          size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3'
        )}
        style={{ animationDelay: '0ms' }}
      />
      <div
        className={cn(
          'bg-primary-600 rounded-full animate-pulse',
          size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3'
        )}
        style={{ animationDelay: '150ms' }}
      />
      <div
        className={cn(
          'bg-primary-600 rounded-full animate-pulse',
          size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3'
        )}
        style={{ animationDelay: '300ms' }}
      />
      <span className="sr-only">Loading...</span>
    </div>
  );

  const Pulse = () => (
    <div
      className={cn(
        'bg-primary-600 rounded-full animate-pulse',
        sizeClasses[size]
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return <Dots />;
      case 'pulse':
        return <Pulse />;
      default:
        return <Spinner />;
    }
  };

  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        className
      )}
      {...props}
    >
      {renderLoader()}
      {text && (
        <p className="text-sm text-gray-600 font-medium">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

Loading.displayName = 'Loading';

export { Loading };
