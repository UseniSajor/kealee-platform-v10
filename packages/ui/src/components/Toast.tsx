'use client';

// packages/ui/src/components/Toast.tsx
// Kealee Platform Toast Component

import React, { useEffect } from 'react';
import { cn } from '../lib/utils';

// Icon components (replace with lucide-react when available)
const XIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CheckCircleIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertCircleIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const AlertTriangleIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const InfoIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export interface ToastProps {
  id?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
  isVisible?: boolean;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type = 'info',
  title,
  message,
  duration = 5000,
  onClose,
  isVisible = true,
}) => {
  useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!isVisible) return null;

  const icons = {
    success: CheckCircleIcon,
    error: AlertCircleIcon,
    warning: AlertTriangleIcon,
    info: InfoIcon,
  };

  const colors = {
    success: {
      border: 'border-green-500',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    error: {
      border: 'border-red-500',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    warning: {
      border: 'border-yellow-500',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
    },
    info: {
      border: 'border-blue-500',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
  };

  const Icon = icons[type];
  const colorScheme = colors[type];

  return (
    <div
      id={id}
      className={cn(
        'flex items-center gap-3',
        'bg-white',
        `border-l-4 ${colorScheme.border}`,
        'rounded-lg',
        'p-4',
        'shadow-lg',
        'animate-in slide-in-from-right duration-300',
        'min-w-[300px] max-w-md'
      )}
      role="alert"
      aria-live="polite"
    >
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          colorScheme.iconBg,
          colorScheme.iconColor
        )}
      >
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900">{title}</p>
        {message && <p className="text-sm text-gray-600 mt-1">{message}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="
            text-gray-400 hover:text-gray-600
            flex-shrink-0
            transition-colors duration-200
          "
          aria-label="Close notification"
        >
          <XIcon size={20} />
        </button>
      )}
    </div>
  );
};

export default Toast;
