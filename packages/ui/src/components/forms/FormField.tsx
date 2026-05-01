// packages/ui/src/components/forms/FormField.tsx
// Generic form field wrapper with label, helper text, and error

import React from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle } from 'lucide-react';

export interface FormFieldProps {
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  helperText,
  error,
  required,
  htmlFor,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-error-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      {children}

      {error ? (
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-error-500 shrink-0" />
          <p className="text-xs text-error-600">{error}</p>
        </div>
      ) : helperText ? (
        <p className="text-xs text-gray-500">{helperText}</p>
      ) : null}
    </div>
  );
}
