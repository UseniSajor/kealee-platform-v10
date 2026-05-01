// packages/ui/src/components/forms/Select.tsx
// Select dropdown — matches Input design spec

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  className?: string;
  onChange?: (value: string) => void;
}

export function Select({
  options,
  value: controlledValue,
  defaultValue,
  placeholder = 'Select an option',
  label,
  helperText,
  error,
  disabled = false,
  required,
  id,
  name,
  className,
  onChange,
}: SelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const selectedOption = options.find((o) => o.value === value);

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;
    if (controlledValue === undefined) setInternalValue(option.value);
    onChange?.(option.value);
    setOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const triggerId = id ?? name;

  return (
    <div className={cn('w-full', className)} ref={containerRef}>
      {label && (
        <label htmlFor={triggerId} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Trigger */}
        <button
          type="button"
          id={triggerId}
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            'w-full h-11 px-4 flex items-center justify-between gap-2 rounded-lg border bg-white text-sm transition-all',
            'focus:outline-none focus:ring-2 focus:ring-primary-100',
            error
              ? 'border-error-500 focus:border-error-500'
              : open
              ? 'border-primary-500'
              : 'border-gray-300 hover:border-gray-400',
            disabled && 'bg-gray-50 opacity-60 cursor-not-allowed',
            !selectedOption && 'text-gray-400'
          )}
        >
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn('w-4 h-4 text-gray-400 shrink-0 transition-transform', open && 'rotate-180')}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <ul
            role="listbox"
            className="absolute z-50 left-0 right-0 mt-1 max-h-72 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1"
          >
            {options.map((option) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                aria-disabled={option.disabled}
                onClick={() => handleSelect(option)}
                className={cn(
                  'flex items-center justify-between px-4 py-3 text-sm cursor-pointer transition-colors',
                  option.value === value
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50',
                  option.disabled && 'opacity-40 cursor-not-allowed'
                )}
              >
                {option.label}
                {option.value === value && <Check className="w-4 h-4 text-primary-600" />}
              </li>
            ))}
            {options.length === 0 && (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">No options available</li>
            )}
          </ul>
        )}
      </div>

      {/* Helper / error */}
      {(error || helperText) && (
        <p className={cn('text-xs mt-1.5', error ? 'text-error-600' : 'text-gray-500')}>
          {error ?? helperText}
        </p>
      )}
    </div>
  );
}
