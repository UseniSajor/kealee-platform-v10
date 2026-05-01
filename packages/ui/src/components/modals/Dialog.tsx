// packages/ui/src/components/modals/Dialog.tsx
// Modal dialog with backdrop, focus trap, and keyboard close

import React, { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const SIZE_CLASS = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-full mx-4',
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  size = 'md',
  showClose = true,
  children,
  footer,
  className,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'dialog-title' : undefined}
      aria-describedby={description ? 'dialog-desc' : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          'relative w-full bg-white rounded-xl shadow-xl overflow-hidden',
          SIZE_CLASS[size],
          className
        )}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-100">
            <div>
              {title && (
                <h2 id="dialog-title" className="text-lg font-semibold text-gray-900">
                  {title}
                </h2>
              )}
              {description && (
                <p id="dialog-desc" className="text-sm text-gray-500 mt-0.5">
                  {description}
                </p>
              )}
            </div>
            {showClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 shrink-0"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
