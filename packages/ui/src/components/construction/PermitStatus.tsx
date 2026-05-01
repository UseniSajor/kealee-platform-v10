// packages/ui/src/components/construction/PermitStatus.tsx
// Permit Status Tracker — step-progress component for permit workflow

import React from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle, Clock, FileText, AlertCircle } from 'lucide-react';

export type PermitStep =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'PLAN_CHECK'
  | 'CORRECTIONS_REQUIRED'
  | 'APPROVED'
  | 'ISSUED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'REJECTED';

export interface PermitStatusProps {
  permitNumber: string;
  jurisdiction: string;
  projectDescription: string;
  currentStatus: PermitStep;
  submittedAt?: Date | string;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
  className?: string;
}

const WORKFLOW_STEPS: Array<{ key: PermitStep; label: string }> = [
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'UNDER_REVIEW', label: 'Review' },
  { key: 'PLAN_CHECK', label: 'Plan Check' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'ISSUED', label: 'Issued' },
];

const STATUS_ORDER: Record<PermitStep, number> = {
  DRAFT: -1,
  SUBMITTED: 0,
  UNDER_REVIEW: 1,
  PLAN_CHECK: 2,
  CORRECTIONS_REQUIRED: 2,
  APPROVED: 3,
  ISSUED: 4,
  ACTIVE: 4,
  COMPLETED: 5,
  EXPIRED: 5,
  REJECTED: -2,
};

const STATUS_COLORS: Partial<Record<PermitStep, string>> = {
  CORRECTIONS_REQUIRED: 'text-warning-600 bg-warning-50 border-warning-200',
  EXPIRED: 'text-error-600 bg-error-50 border-error-200',
  REJECTED: 'text-error-600 bg-error-50 border-error-200',
  COMPLETED: 'text-success-600 bg-success-50 border-success-200',
};

const STATUS_LABELS: Record<PermitStep, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  PLAN_CHECK: 'Plan Check',
  CORRECTIONS_REQUIRED: 'Corrections Required',
  APPROVED: 'Approved',
  ISSUED: 'Issued',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  EXPIRED: 'Expired',
  REJECTED: 'Rejected',
};

export function PermitStatus({
  permitNumber,
  jurisdiction,
  projectDescription,
  currentStatus,
  submittedAt,
  actions,
  className,
}: PermitStatusProps) {
  const currentOrder = STATUS_ORDER[currentStatus] ?? 0;
  const isSpecialStatus = ['CORRECTIONS_REQUIRED', 'EXPIRED', 'REJECTED'].includes(currentStatus);
  const isCompleted = currentStatus === 'COMPLETED';

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 shadow-sm p-6', className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">{jurisdiction}</p>
          <h3 className="font-semibold text-gray-900 text-lg mt-0.5">{permitNumber}</h3>
          <p className="text-sm text-gray-600 mt-0.5">{projectDescription}</p>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
            STATUS_COLORS[currentStatus] ?? 'text-primary-700 bg-primary-50 border-primary-200'
          )}
        >
          {isSpecialStatus && <AlertCircle className="w-3 h-3" />}
          {isCompleted && <CheckCircle className="w-3 h-3" />}
          {STATUS_LABELS[currentStatus]}
        </span>
      </div>

      {/* Step Progress */}
      <div className="mb-4">
        <div className="flex items-center">
          {WORKFLOW_STEPS.map((step, index) => {
            const stepOrder = STATUS_ORDER[step.key];
            const isDone = currentOrder > stepOrder;
            const isActive = currentOrder === stepOrder && !isSpecialStatus;
            const isPending = currentOrder < stepOrder;

            return (
              <React.Fragment key={step.key}>
                {/* Circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors',
                      isDone && 'bg-success-500 border-success-500 text-white',
                      isActive && 'bg-primary-600 border-primary-600 text-white',
                      isPending && 'bg-white border-gray-300 text-gray-400',
                      isSpecialStatus && index === currentOrder && 'bg-warning-500 border-warning-500 text-white'
                    )}
                  >
                    {isDone ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : isActive ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-medium">{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-xs mt-1 font-medium whitespace-nowrap',
                      isDone && 'text-success-600',
                      isActive && 'text-primary-700',
                      isPending && 'text-gray-400'
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector line */}
                {index < WORKFLOW_STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-1 mb-4',
                      currentOrder > stepOrder ? 'bg-success-400' : 'bg-gray-200'
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Status info box */}
      {submittedAt && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-50 border border-primary-200 mb-4">
          <FileText className="w-4 h-4 text-primary-600 shrink-0" />
          <p className="text-xs text-primary-700">
            Submitted{' '}
            {typeof submittedAt === 'string'
              ? submittedAt
              : submittedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      )}

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className="text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-1.5 rounded-md transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
