// packages/ui/src/components/cards/EstimateCard.tsx
// Cost estimate card for displaying project estimates

'use client';

import React from 'react';
import Link from 'next/link';
import {
  DollarSign,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Download,
  Share2,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../utils';

export type EstimateStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'superseded';

export type EstimateConfidence = 'high' | 'medium' | 'low';

export interface EstimateCostBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface EstimateCardProps {
  id: string;
  name: string;
  projectName?: string;
  version?: number;
  status: EstimateStatus;
  totalAmount: number;
  laborCost?: number;
  materialCost?: number;
  equipmentCost?: number;
  overhead?: number;
  contingency?: number;
  margin?: number;
  originalAmount?: number;
  variance?: number;
  confidence?: EstimateConfidence;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  expiresAt?: Date | string;
  lineItemCount?: number;
  costBreakdown?: EstimateCostBreakdown[];
  createdBy?: string;
  href?: string;
  onClick?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

const statusConfig: Record<
  EstimateStatus,
  { label: string; color: string; bgColor: string; icon: LucideIcon }
> = {
  draft: {
    label: 'Draft',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: FileText,
  },
  pending_review: {
    label: 'Pending Review',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    icon: Clock,
  },
  approved: {
    label: 'Approved',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: AlertCircle,
  },
  expired: {
    label: 'Expired',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    icon: Clock,
  },
  superseded: {
    label: 'Superseded',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: FileText,
  },
};

const confidenceConfig: Record<
  EstimateConfidence,
  { label: string; color: string; bgColor: string }
> = {
  high: {
    label: 'High Confidence',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  medium: {
    label: 'Medium Confidence',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
  },
  low: {
    label: 'Low Confidence',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function EstimateCard({
  id,
  name,
  projectName,
  version,
  status,
  totalAmount,
  laborCost,
  materialCost,
  equipmentCost,
  overhead,
  contingency,
  margin,
  originalAmount,
  variance,
  confidence,
  createdAt,
  updatedAt,
  expiresAt,
  lineItemCount,
  costBreakdown,
  createdBy,
  href,
  onClick,
  onDownload,
  onShare,
  onApprove,
  onReject,
  variant = 'default',
  className,
}: EstimateCardProps) {
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;
  const confidenceInfo = confidence ? confidenceConfig[confidence] : null;

  const VarianceIcon =
    variance && variance > 0
      ? TrendingUp
      : variance && variance < 0
        ? TrendingDown
        : Minus;

  const CardWrapper = href ? Link : 'div';
  const cardProps = href
    ? { href }
    : onClick
      ? { onClick, role: 'button', tabIndex: 0 }
      : {};

  // Compact variant
  if (variant === 'compact') {
    return (
      <CardWrapper
        {...(cardProps as any)}
        className={cn(
          'flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200',
          'hover:shadow-md hover:border-gray-300 transition-all cursor-pointer',
          className
        )}
      >
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white">
          <DollarSign className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
            {version && (
              <span className="text-xs text-gray-400">v{version}</span>
            )}
          </div>
          {projectName && (
            <p className="text-sm text-gray-500 truncate">{projectName}</p>
          )}
        </div>

        <div className="text-right">
          <div className="font-bold text-gray-900">{formatCurrency(totalAmount)}</div>
          {variance !== undefined && (
            <div
              className={cn(
                'flex items-center justify-end gap-1 text-xs',
                variance > 0 ? 'text-red-600' : variance < 0 ? 'text-green-600' : 'text-gray-500'
              )}
            >
              <VarianceIcon className="w-3 h-3" />
              {Math.abs(variance)}%
            </div>
          )}
        </div>

        <span
          className={cn(
            'px-2 py-1 rounded-full text-xs font-medium',
            statusInfo.bgColor,
            statusInfo.color
          )}
        >
          {statusInfo.label}
        </span>
      </CardWrapper>
    );
  }

  // Detailed variant
  if (variant === 'detailed') {
    return (
      <div
        className={cn(
          'bg-white rounded-xl border border-gray-200 overflow-hidden',
          className
        )}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
                {version && (
                  <span className="text-sm text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                    v{version}
                  </span>
                )}
              </div>
              {projectName && (
                <p className="text-gray-500 mt-1">{projectName}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
                  statusInfo.bgColor,
                  statusInfo.color
                )}
              >
                <StatusIcon className="w-4 h-4" />
                {statusInfo.label}
              </span>
            </div>
          </div>

          {/* Total amount */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
            <div className="text-sm opacity-80 mb-1">Total Estimate</div>
            <div className="text-3xl font-bold mb-2">{formatCurrency(totalAmount)}</div>
            {originalAmount && variance !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <span className="opacity-80">Original: {formatCurrency(originalAmount)}</span>
                <span
                  className={cn(
                    'flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20',
                    variance > 0 ? 'text-red-200' : variance < 0 ? 'text-green-200' : ''
                  )}
                >
                  <VarianceIcon className="w-3 h-3" />
                  {variance > 0 ? '+' : ''}{variance}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Cost Breakdown</h4>
          <div className="space-y-3">
            {laborCost !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Labor</span>
                <span className="font-medium text-gray-900">{formatCurrency(laborCost)}</span>
              </div>
            )}
            {materialCost !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Materials</span>
                <span className="font-medium text-gray-900">{formatCurrency(materialCost)}</span>
              </div>
            )}
            {equipmentCost !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Equipment</span>
                <span className="font-medium text-gray-900">{formatCurrency(equipmentCost)}</span>
              </div>
            )}
            {overhead !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Overhead</span>
                <span className="font-medium text-gray-900">{formatCurrency(overhead)}</span>
              </div>
            )}
            {contingency !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Contingency</span>
                <span className="font-medium text-gray-900">{formatCurrency(contingency)}</span>
              </div>
            )}
            {margin !== undefined && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-gray-600">Margin</span>
                <span className="font-medium text-green-600">+{formatCurrency(margin)}</span>
              </div>
            )}
          </div>

          {/* Visual breakdown */}
          {costBreakdown && costBreakdown.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Distribution</h4>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
                {costBreakdown.map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-full',
                      i === 0 && 'bg-blue-500',
                      i === 1 && 'bg-green-500',
                      i === 2 && 'bg-amber-500',
                      i === 3 && 'bg-purple-500',
                      i > 3 && 'bg-gray-400'
                    )}
                    style={{ width: `${item.percentage}%` }}
                    title={`${item.category}: ${item.percentage}%`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-4 mt-2">
                {costBreakdown.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div
                      className={cn(
                        'w-3 h-3 rounded-full',
                        i === 0 && 'bg-blue-500',
                        i === 1 && 'bg-green-500',
                        i === 2 && 'bg-amber-500',
                        i === 3 && 'bg-purple-500',
                        i > 3 && 'bg-gray-400'
                      )}
                    />
                    <span className="text-gray-600">{item.category}</span>
                    <span className="font-medium text-gray-900">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Meta info */}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              {lineItemCount !== undefined && (
                <span>{lineItemCount} line items</span>
              )}
              {createdBy && (
                <span>by {createdBy}</span>
              )}
              {updatedAt && (
                <span>Updated {formatDate(updatedAt)}</span>
              )}
            </div>
            {confidenceInfo && (
              <span
                className={cn(
                  'px-2 py-1 rounded-full text-xs font-medium',
                  confidenceInfo.bgColor,
                  confidenceInfo.color
                )}
              >
                {confidenceInfo.label}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {(onDownload || onShare || onApprove || onReject) && (
          <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
            {onDownload && (
              <button
                onClick={onDownload}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            )}
            {onShare && (
              <button
                onClick={onShare}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            )}
            <div className="flex-1" />
            {status === 'pending_review' && (
              <>
                {onReject && (
                  <button
                    onClick={onReject}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                  >
                    Reject
                  </button>
                )}
                {onApprove && (
                  <button
                    onClick={onApprove}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Approve
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <CardWrapper
      {...(cardProps as any)}
      className={cn(
        'block bg-white rounded-xl border border-gray-200 p-5',
        'hover:shadow-lg hover:border-gray-300 transition-all',
        onClick || href ? 'cursor-pointer' : '',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{name}</h3>
              {version && (
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                  v{version}
                </span>
              )}
            </div>
            {projectName && (
              <p className="text-sm text-gray-500">{projectName}</p>
            )}
          </div>
        </div>

        <span
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
            statusInfo.bgColor,
            statusInfo.color
          )}
        >
          <StatusIcon className="w-3 h-3" />
          {statusInfo.label}
        </span>
      </div>

      {/* Amount */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Total Estimate</div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</div>
          </div>
          {variance !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
                variance > 0
                  ? 'bg-red-100 text-red-700'
                  : variance < 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
              )}
            >
              <VarianceIcon className="w-4 h-4" />
              {variance > 0 ? '+' : ''}{variance}%
            </div>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {laborCost !== undefined && (
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">Labor</div>
            <div className="text-sm font-semibold text-gray-900">
              {formatCurrency(laborCost)}
            </div>
          </div>
        )}
        {materialCost !== undefined && (
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">Materials</div>
            <div className="text-sm font-semibold text-gray-900">
              {formatCurrency(materialCost)}
            </div>
          </div>
        )}
        {lineItemCount !== undefined && (
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">Line Items</div>
            <div className="text-sm font-semibold text-gray-900">{lineItemCount}</div>
          </div>
        )}
      </div>

      {/* Confidence indicator */}
      {confidenceInfo && (
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-gray-400" />
          <span
            className={cn(
              'px-2 py-0.5 rounded text-xs font-medium',
              confidenceInfo.bgColor,
              confidenceInfo.color
            )}
          >
            {confidenceInfo.label}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-sm text-gray-500">
        <div className="flex items-center gap-4">
          {createdAt && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(createdAt)}
            </div>
          )}
          {expiresAt && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Expires {formatDate(expiresAt)}
            </div>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </CardWrapper>
  );
}

export default EstimateCard;
