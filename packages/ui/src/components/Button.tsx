// packages/ui/src/components/Button.tsx
// Kealee Platform Button Component - Enterprise Edition

'use client';

import React from 'react';
import { cn } from '../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning' | 'outline' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  rounded?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      rounded = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center font-semibold',
      'transition-all duration-200 ease-out',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'active:scale-[0.98] hover:scale-[1.01]',
      rounded ? 'rounded-full' : 'rounded-lg'
    );

    const variants = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg focus:ring-blue-500 border border-blue-600',
      secondary: 'border-2 border-gray-300 hover:border-blue-600 text-gray-700 hover:text-blue-600 bg-white focus:ring-blue-500',
      ghost: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 focus:ring-blue-500',
      danger: 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg focus:ring-red-500 border border-red-600',
      success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg focus:ring-emerald-500 border border-emerald-600',
      warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg focus:ring-amber-500 border border-amber-500',
      outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white focus:ring-blue-500 bg-transparent',
      gradient: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl focus:ring-blue-500 border-0',
    };

    const sizes = {
      xs: 'px-2.5 py-1.5 text-xs gap-1',
      sm: 'px-4 py-2 text-sm gap-1.5',
      md: 'px-5 py-2.5 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2',
      xl: 'px-8 py-4 text-lg gap-3',
    };
    
    const spinnerSizes = {
      xs: 'h-3 w-3',
      sm: 'h-3.5 w-3.5',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
      xl: 'h-6 w-6',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className={cn('animate-spin', spinnerSizes[size])}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
