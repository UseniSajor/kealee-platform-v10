// packages/ui/src/components/forms/Radio.tsx

import React from 'react';
import { cn } from '../../lib/utils';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  name: string;
  label?: string;
  error?: string;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
  onChange?: (value: string) => void;
}

export function RadioGroup({
  options,
  value: controlledValue,
  defaultValue,
  name,
  label,
  error,
  orientation = 'vertical',
  className,
  onChange,
}: RadioGroupProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? '');
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = (v: string) => {
    if (controlledValue === undefined) setInternalValue(v);
    onChange?.(v);
  };

  return (
    <fieldset className={cn('', className)}>
      {label && (
        <legend className="text-sm font-medium text-gray-700 mb-2">{label}</legend>
      )}

      <div className={cn('flex gap-3', orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap')}>
        {options.map((option) => {
          const inputId = `${name}-${option.value}`;
          const isSelected = value === option.value;

          return (
            <label
              key={option.value}
              htmlFor={inputId}
              className={cn(
                'flex items-start gap-3 cursor-pointer',
                option.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {/* Radio circle */}
              <div className="relative mt-0.5">
                <input
                  type="radio"
                  id={inputId}
                  name={name}
                  value={option.value}
                  checked={isSelected}
                  disabled={option.disabled}
                  onChange={() => !option.disabled && handleChange(option.value)}
                  className="sr-only peer"
                />
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                    'peer-focus:ring-2 peer-focus:ring-offset-1 peer-focus:ring-primary-200',
                    isSelected ? 'border-primary-600' : error ? 'border-error-400' : 'border-gray-300',
                    !option.disabled && !isSelected && 'hover:border-primary-400'
                  )}
                >
                  {isSelected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                  )}
                </div>
              </div>

              {/* Label + description */}
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">{option.label}</span>
                {option.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {error && (
        <p className="text-xs text-error-600 mt-1.5">{error}</p>
      )}
    </fieldset>
  );
}
