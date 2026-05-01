// packages/ui/src/components/construction/InspectionBadge.tsx
// Inspection status badge with result indicator

import React from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle, XCircle, Clock, AlertTriangle, Calendar } from 'lucide-react';

export type InspectionResult = 'PASSED' | 'FAILED' | 'PARTIAL_PASS' | 'PENDING' | 'SCHEDULED' | 'CANCELLED';

export interface InspectionBadgeProps {
  result: InspectionResult;
  inspectionType?: string;
  scheduledDate?: Date | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const RESULT_CONFIG: Record<
  InspectionResult,
  { label: string; icon: React.ElementType; bg: string; text: string; border: string }
> = {
  PASSED: {
    label: 'Passed',
    icon: CheckCircle,
    bg: 'bg-success-50',
    text: 'text-success-700',
    border: 'border-success-200',
  },
  FAILED: {
    label: 'Failed',
    icon: XCircle,
    bg: 'bg-error-50',
    text: 'text-error-700',
    border: 'border-error-200',
  },
  PARTIAL_PASS: {
    label: 'Partial Pass',
    icon: AlertTriangle,
    bg: 'bg-warning-50',
    text: 'text-warning-700',
    border: 'border-warning-200',
  },
  PENDING: {
    label: 'Pending',
    icon: Clock,
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    border: 'border-gray-200',
  },
  SCHEDULED: {
    label: 'Scheduled',
    icon: Calendar,
    bg: 'bg-primary-50',
    text: 'text-primary-700',
    border: 'border-primary-200',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    border: 'border-gray-200',
  },
};

const SIZE_CONFIG = {
  sm: { badge: 'px-2 py-0.5 text-xs', icon: 'w-3 h-3' },
  md: { badge: 'px-2.5 py-1 text-xs', icon: 'w-3.5 h-3.5' },
  lg: { badge: 'px-3 py-1.5 text-sm', icon: 'w-4 h-4' },
};

export function InspectionBadge({
  result,
  inspectionType,
  scheduledDate,
  size = 'md',
  showIcon = true,
  className,
}: InspectionBadgeProps) {
  const config = RESULT_CONFIG[result];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  const dateStr =
    scheduledDate
      ? typeof scheduledDate === 'string'
        ? scheduledDate
        : scheduledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.bg,
        config.text,
        config.border,
        sizeConfig.badge,
        className
      )}
    >
      {showIcon && <Icon className={cn(sizeConfig.icon, 'shrink-0')} />}
      {inspectionType ? `${inspectionType}: ${config.label}` : config.label}
      {dateStr && result === 'SCHEDULED' && (
        <span className="opacity-75">· {dateStr}</span>
      )}
    </span>
  );
}
