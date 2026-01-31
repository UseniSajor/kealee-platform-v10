// packages/ui/src/components/feedback/AlertBanner.tsx
// Alert banner component for displaying important messages

'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../utils';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertBannerProps {
  type: AlertType;
  title?: string;
  message: string;
  icon?: LucideIcon;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  link?: {
    label: string;
    href: string;
  };
  variant?: 'default' | 'filled' | 'outline' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const typeConfig: Record<
  AlertType,
  {
    icon: LucideIcon;
    default: { bg: string; border: string; icon: string; text: string };
    filled: { bg: string; border: string; icon: string; text: string };
    outline: { bg: string; border: string; icon: string; text: string };
    minimal: { bg: string; border: string; icon: string; text: string };
  }
> = {
  success: {
    icon: CheckCircle2,
    default: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-500',
      text: 'text-green-800',
    },
    filled: {
      bg: 'bg-green-500',
      border: 'border-green-500',
      icon: 'text-white',
      text: 'text-white',
    },
    outline: {
      bg: 'bg-white',
      border: 'border-green-500',
      icon: 'text-green-500',
      text: 'text-green-800',
    },
    minimal: {
      bg: 'bg-transparent',
      border: 'border-transparent',
      icon: 'text-green-500',
      text: 'text-green-800',
    },
  },
  error: {
    icon: AlertCircle,
    default: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-500',
      text: 'text-red-800',
    },
    filled: {
      bg: 'bg-red-500',
      border: 'border-red-500',
      icon: 'text-white',
      text: 'text-white',
    },
    outline: {
      bg: 'bg-white',
      border: 'border-red-500',
      icon: 'text-red-500',
      text: 'text-red-800',
    },
    minimal: {
      bg: 'bg-transparent',
      border: 'border-transparent',
      icon: 'text-red-500',
      text: 'text-red-800',
    },
  },
  warning: {
    icon: AlertTriangle,
    default: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'text-amber-500',
      text: 'text-amber-800',
    },
    filled: {
      bg: 'bg-amber-500',
      border: 'border-amber-500',
      icon: 'text-white',
      text: 'text-white',
    },
    outline: {
      bg: 'bg-white',
      border: 'border-amber-500',
      icon: 'text-amber-500',
      text: 'text-amber-800',
    },
    minimal: {
      bg: 'bg-transparent',
      border: 'border-transparent',
      icon: 'text-amber-500',
      text: 'text-amber-800',
    },
  },
  info: {
    icon: Info,
    default: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-500',
      text: 'text-blue-800',
    },
    filled: {
      bg: 'bg-blue-500',
      border: 'border-blue-500',
      icon: 'text-white',
      text: 'text-white',
    },
    outline: {
      bg: 'bg-white',
      border: 'border-blue-500',
      icon: 'text-blue-500',
      text: 'text-blue-800',
    },
    minimal: {
      bg: 'bg-transparent',
      border: 'border-transparent',
      icon: 'text-blue-500',
      text: 'text-blue-800',
    },
  },
};

const sizeConfig = {
  sm: {
    padding: 'p-3',
    iconSize: 'w-4 h-4',
    textSize: 'text-sm',
    titleSize: 'text-sm',
    gap: 'gap-2',
  },
  md: {
    padding: 'p-4',
    iconSize: 'w-5 h-5',
    textSize: 'text-sm',
    titleSize: 'text-base',
    gap: 'gap-3',
  },
  lg: {
    padding: 'p-5',
    iconSize: 'w-6 h-6',
    textSize: 'text-base',
    titleSize: 'text-lg',
    gap: 'gap-4',
  },
};

export function AlertBanner({
  type,
  title,
  message,
  icon,
  dismissible = false,
  onDismiss,
  action,
  link,
  variant = 'default',
  size = 'md',
  className,
}: AlertBannerProps) {
  const config = typeConfig[type];
  const sizeStyles = sizeConfig[size];
  const variantStyles = config[variant];
  const Icon = icon || config.icon;

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start rounded-lg border',
        sizeStyles.padding,
        sizeStyles.gap,
        variantStyles.bg,
        variantStyles.border,
        className
      )}
    >
      <Icon
        className={cn(
          'flex-shrink-0 mt-0.5',
          sizeStyles.iconSize,
          variantStyles.icon
        )}
      />

      <div className="flex-1 min-w-0">
        {title && (
          <h4
            className={cn(
              'font-semibold mb-1',
              sizeStyles.titleSize,
              variantStyles.text
            )}
          >
            {title}
          </h4>
        )}
        <p className={cn(sizeStyles.textSize, variantStyles.text, !title && 'leading-relaxed')}>
          {message}
        </p>

        {(action || link) && (
          <div className="flex items-center gap-4 mt-3">
            {action && (
              <button
                onClick={action.onClick}
                className={cn(
                  'font-medium underline hover:no-underline transition-all',
                  sizeStyles.textSize,
                  variantStyles.text
                )}
              >
                {action.label}
              </button>
            )}
            {link && (
              <a
                href={link.href}
                className={cn(
                  'inline-flex items-center gap-1 font-medium hover:underline',
                  sizeStyles.textSize,
                  variantStyles.text
                )}
              >
                {link.label}
                <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
        )}
      </div>

      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className={cn(
            'flex-shrink-0 p-1 rounded hover:bg-black/10 transition-colors',
            variantStyles.text
          )}
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default AlertBanner;
