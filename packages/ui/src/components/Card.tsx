// packages/ui/src/components/Card.tsx
// Kealee Platform Card Component - Enterprise Edition

'use client';

import React from 'react';
import { cn } from '../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'elevated' | 'bordered' | 'gradient' | 'glass';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  noBorder?: boolean;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, padding = 'md', noBorder = false, children, ...props }, ref) => {
    const baseStyles = 'rounded-xl transition-all duration-200';

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const variants = {
      default: 'bg-white border border-gray-200 shadow-sm',
      interactive: cn(
        'bg-white border-2 border-gray-200',
        'hover:border-blue-500 hover:shadow-lg',
        'cursor-pointer',
        'active:scale-[0.99]'
      ),
      elevated: 'bg-white border border-gray-100 shadow-lg',
      bordered: 'bg-white border-2 border-gray-300',
      gradient: cn(
        'bg-gradient-to-br from-white to-gray-50',
        'border border-gray-200 shadow-md',
        'hover:shadow-lg'
      ),
      glass: cn(
        'bg-white/80 backdrop-blur-md',
        'border border-white/20 shadow-lg',
        'hover:bg-white/90'
      ),
    };

    const hoverStyles = hover ? 'hover:shadow-md hover:-translate-y-0.5' : '';

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          paddings[padding],
          hoverStyles,
          noBorder && 'border-0',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, description, action, children, ...props }, ref) => {
    if (children) {
      return (
        <div
          ref={ref}
          className={cn('flex items-start justify-between gap-4 pb-4', className)}
          {...props}
        >
          {children}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn('flex items-start justify-between gap-4 pb-4', className)}
        {...props}
      >
        <div className="space-y-1">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('', className)} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-4', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

export default Card;
export { Card, CardHeader, CardContent, CardFooter };
