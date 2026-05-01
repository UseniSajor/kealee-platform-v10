// packages/ui/src/components/modals/ConfirmDialog.tsx
// Confirm/Destructive action dialog

import React from 'react';
import { cn } from '../../lib/utils';
import { Dialog } from './Dialog';
import { AlertTriangle, Trash2, Info } from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const VARIANT_CONFIG = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-error-50',
    iconColor: 'text-error-600',
    confirmClass: 'bg-error-600 hover:bg-error-700 text-white',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-warning-50',
    iconColor: 'text-warning-600',
    confirmClass: 'bg-warning-600 hover:bg-warning-700 text-white',
  },
  info: {
    icon: Info,
    iconBg: 'bg-primary-50',
    iconColor: 'text-primary-600',
    confirmClass: 'bg-primary-600 hover:bg-primary-700 text-white',
  },
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      showClose={false}
      footer={
        <>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2',
              config.confirmClass
            )}
          >
            {isLoading && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-4 py-2">
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', config.iconBg)}>
          <Icon className={cn('w-5 h-5', config.iconColor)} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
    </Dialog>
  );
}
