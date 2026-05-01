// packages/ui/src/components/modals/Sheet.tsx
// Side sheet / slide-over panel

import React, { useEffect } from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  side?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  showClose?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const SIDE_CLASS = {
  right: 'right-0 top-0 bottom-0 translate-x-full data-[open=true]:translate-x-0',
  left: 'left-0 top-0 bottom-0 -translate-x-full data-[open=true]:translate-x-0',
};

const SIZE_CLASS = {
  sm: 'w-80',
  md: 'w-96',
  lg: 'w-[520px]',
};

export function Sheet({
  open,
  onClose,
  title,
  description,
  side = 'right',
  size = 'md',
  showClose = true,
  children,
  footer,
  className,
}: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <div
      className={cn('fixed inset-0 z-50', !open && 'pointer-events-none')}
      aria-modal={open}
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/50 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        data-open={open}
        className={cn(
          'absolute bg-white shadow-2xl flex flex-col',
          'transition-transform duration-300 ease-in-out',
          SIDE_CLASS[side],
          SIZE_CLASS[size],
          !open && (side === 'right' ? 'translate-x-full' : '-translate-x-full'),
          open && 'translate-x-0',
          className
        )}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-100 shrink-0">
            <div>
              {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
              {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
            </div>
            {showClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 px-6 py-4 overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
