// packages/ui/src/components/Card.tsx
// Kealee Platform Card Component

import React from 'react';
import { cn } from '../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'elevated';
  hover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, children, ...props }, ref) => {
    const baseStyles = 'bg-white rounded-xl border p-6';
    
    const variants = {
      default: 'border-gray-200 shadow-sm',
      interactive: 'border-2 border-gray-200 hover:border-primary-500 shadow-sm hover:shadow-lg cursor-pointer transition-all duration-200',
      elevated: 'border-gray-200 shadow-md',
    };
    
    const hoverStyles = hover ? 'hover:shadow-md transition-shadow duration-200' : '';
    
    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          hoverStyles,
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

export default Card;
