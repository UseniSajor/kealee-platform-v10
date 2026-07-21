import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? 'span' : 'button';
    
    // If asChild is true, we render children directly with the className
    // The child component (like Link) will receive the className
    if (asChild) {
      return React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            ...child.props,
            className: cn(
              'inline-flex items-center justify-center rounded-md font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              'disabled:pointer-events-none disabled:opacity-50',
              {
                'bg-primary-500 text-white hover:bg-primary-600': variant === 'default',
                'border border-gray-300 bg-white hover:bg-gray-50': variant === 'outline',
                'hover:bg-gray-100': variant === 'ghost',
                'bg-red-500 text-white hover:bg-red-600': variant === 'destructive',
                'h-8 px-3 text-sm': size === 'sm',
                'h-10 px-4 text-base': size === 'md',
                'h-12 px-6 text-lg': size === 'lg',
              },
              className,
              child.props.className
            ) as string,
          } as any);
        }
        return child;
      }) as React.ReactElement;
    }
    
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary-500 text-white hover:bg-primary-600': variant === 'default',
            'border border-gray-300 bg-white hover:bg-gray-50': variant === 'outline',
            'hover:bg-gray-100': variant === 'ghost',
            'bg-red-500 text-white hover:bg-red-600': variant === 'destructive',
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-base': size === 'md',
            'h-12 px-6 text-lg': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
