// packages/ui/src/components/forms/Checkbox.tsx

import React from 'react';
import { cn } from '../../lib/utils';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
  indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, indeterminate, className, id, disabled, ...props }, ref) => {
    const inputId = id ?? `checkbox-${Math.random().toString(36).slice(2, 7)}`;

    return (
      <div className={cn('flex items-start gap-3', className)}>
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            type="checkbox"
            ref={ref}
            id={inputId}
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />
          <label
            htmlFor={inputId}
            className={cn(
              'w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all',
              'peer-focus:ring-2 peer-focus:ring-offset-1 peer-focus:ring-primary-200',
              'peer-checked:bg-primary-600 peer-checked:border-primary-600',
              'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
              error ? 'border-error-500' : 'border-gray-300',
              !props.checked && !props.defaultChecked && 'hover:border-primary-400',
            )}
          >
            <Check
              className={cn(
                'w-3 h-3 text-white transition-opacity',
                (props.checked || props.defaultChecked) ? 'opacity-100' : 'opacity-0'
              )}
              strokeWidth={3}
            />
            {indeterminate && (
              <span className="w-2.5 h-0.5 bg-white rounded-full block" />
            )}
          </label>
        </div>

        {(label || description) && (
          <div>
            {label && (
              <label
                htmlFor={inputId}
                className={cn(
                  'text-sm font-medium cursor-pointer leading-none',
                  disabled ? 'text-gray-400' : 'text-gray-900'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            )}
            {error && (
              <p className="text-xs text-error-600 mt-0.5">{error}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
