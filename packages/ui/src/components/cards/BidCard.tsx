// packages/ui/src/components/cards/BidCard.tsx
// Bid comparison card for displaying contractor bids

'use client';

import React from 'react';
import Link from 'next/link';
import {
  Star,
  Clock,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../utils';

export type BidStatus =
  | 'pending'
  | 'submitted'
  | 'under_review'
  | 'shortlisted'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export interface BidCardProps {
  id: string;
  contractorName: string;
  contractorAvatar?: string;
  companyName?: string;
  amount: number;
  originalEstimate?: number;
  status: BidStatus;
  submittedAt?: Date | string;
  responseTime?: number; // in hours
  rating?: number;
  reviewCount?: number;
  completedProjects?: number;
  timeline?: string;
  isRecommended?: boolean;
  isLowest?: boolean;
  variance?: number; // percentage difference from average
  highlights?: string[];
  href?: string;
  onClick?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  variant?: 'default' | 'compact' | 'comparison';
  className?: string;
}

const statusConfig: Record<
  BidStatus,
  { label: string; color: string; bgColor: string; icon: LucideIcon }
> = {
  pending: {
    label: 'Pending',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: Clock,
  },
  submitted: {
    label: 'Submitted',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: CheckCircle2,
  },
  under_review: {
    label: 'Under Review',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: Clock,
  },
  shortlisted: {
    label: 'Shortlisted',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    icon: Star,
  },
  accepted: {
    label: 'Accepted',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: XCircle,
  },
  withdrawn: {
    label: 'Withdrawn',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    icon: XCircle,
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
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function BidCard({
  id,
  contractorName,
  contractorAvatar,
  companyName,
  amount,
  originalEstimate,
  status,
  submittedAt,
  responseTime,
  rating,
  reviewCount,
  completedProjects,
  timeline,
  isRecommended,
  isLowest,
  variance,
  highlights,
  href,
  onClick,
  onAccept,
  onReject,
  variant = 'default',
  className,
}: BidCardProps) {
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;

  const VarianceIcon =
    variance && variance > 0 ? TrendingUp : variance && variance < 0 ? TrendingDown : Minus;

  const CardWrapper = href ? Link : 'div';
  const cardProps = href
    ? { href }
    : onClick
      ? { onClick, role: 'button', tabIndex: 0 }
      : {};

  if (variant === 'compact') {
    return (
      <CardWrapper
        {...(cardProps as any)}
        className={cn(
          'flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200',
          'hover:shadow-md hover:border-gray-300 transition-all cursor-pointer',
          isRecommended && 'ring-2 ring-purple-500 ring-offset-2',
          className
        )}
      >
        {contractorAvatar ? (
          <img
            src={contractorAvatar}
            alt={contractorName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {contractorName.charAt(0)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{contractorName}</h3>
            {isRecommended && (
              <Award className="w-4 h-4 text-purple-500" />
            )}
          </div>
          {companyName && (
            <p className="text-sm text-gray-500 truncate">{companyName}</p>
          )}
        </div>

        <div className="text-right">
          <div className="font-bold text-gray-900">{formatCurrency(amount)}</div>
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

  if (variant === 'comparison') {
    return (
      <div
        className={cn(
          'bg-white rounded-xl border border-gray-200 overflow-hidden',
          isRecommended && 'ring-2 ring-purple-500',
          isLowest && 'ring-2 ring-green-500',
          className
        )}
      >
        {/* Header */}
        {(isRecommended || isLowest) && (
          <div
            className={cn(
              'px-4 py-2 text-sm font-medium text-white',
              isRecommended ? 'bg-purple-500' : 'bg-green-500'
            )}
          >
            {isRecommended ? (
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                Recommended
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Lowest Bid
              </div>
            )}
          </div>
        )}

        <div className="p-5">
          {/* Contractor info */}
          <div className="flex items-start gap-3 mb-4">
            {contractorAvatar ? (
              <img
                src={contractorAvatar}
                alt={contractorName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {contractorName.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{contractorName}</h3>
              {companyName && (
                <p className="text-sm text-gray-500">{companyName}</p>
              )}
              {rating !== undefined && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
                  {reviewCount !== undefined && (
                    <span className="text-sm text-gray-500">({reviewCount})</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
            <div className="text-3xl font-bold text-gray-900">{formatCurrency(amount)}</div>
            {originalEstimate && (
              <div className="text-sm text-gray-500 mt-1">
                Est: {formatCurrency(originalEstimate)}
                {variance !== undefined && (
                  <span
                    className={cn(
                      'ml-2',
                      variance > 0 ? 'text-red-600' : variance < 0 ? 'text-green-600' : ''
                    )}
                  >
                    ({variance > 0 ? '+' : ''}{variance}%)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {timeline && (
              <div className="bg-gray-50 rounded-lg p-3">
                <Calendar className="w-4 h-4 text-gray-400 mb-1" />
                <div className="text-xs text-gray-500">Timeline</div>
                <div className="text-sm font-semibold text-gray-900">{timeline}</div>
              </div>
            )}
            {completedProjects !== undefined && (
              <div className="bg-gray-50 rounded-lg p-3">
                <CheckCircle2 className="w-4 h-4 text-gray-400 mb-1" />
                <div className="text-xs text-gray-500">Completed</div>
                <div className="text-sm font-semibold text-gray-900">{completedProjects} projects</div>
              </div>
            )}
            {responseTime !== undefined && (
              <div className="bg-gray-50 rounded-lg p-3">
                <Clock className="w-4 h-4 text-gray-400 mb-1" />
                <div className="text-xs text-gray-500">Response</div>
                <div className="text-sm font-semibold text-gray-900">{responseTime}h</div>
              </div>
            )}
          </div>

          {/* Highlights */}
          {highlights && highlights.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-2">Highlights</div>
              <ul className="space-y-1">
                {highlights.slice(0, 3).map((highlight, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          {(onAccept || onReject) && status !== 'accepted' && status !== 'rejected' && (
            <div className="flex gap-2">
              {onAccept && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAccept();
                  }}
                  className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  Accept
                </button>
              )}
              {onReject && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onReject();
                  }}
                  className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  Decline
                </button>
              )}
            </div>
          )}

          {/* Status badge for accepted/rejected */}
          {(status === 'accepted' || status === 'rejected') && (
            <div
              className={cn(
                'flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium',
                statusInfo.bgColor,
                statusInfo.color
              )}
            >
              <StatusIcon className="w-4 h-4" />
              {statusInfo.label}
            </div>
          )}
        </div>
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
        isRecommended && 'ring-2 ring-purple-500 ring-offset-2',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {contractorAvatar ? (
            <img
              src={contractorAvatar}
              alt={contractorName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {contractorName.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{contractorName}</h3>
              {isRecommended && (
                <Award className="w-4 h-4 text-purple-500" />
              )}
              {isLowest && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  Lowest
                </span>
              )}
            </div>
            {companyName && (
              <p className="text-sm text-gray-500">{companyName}</p>
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

      {/* Rating */}
      {rating !== undefined && (
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'w-4 h-4',
                  i < Math.floor(rating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-300'
                )}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
          {reviewCount !== undefined && (
            <span className="text-sm text-gray-500">({reviewCount} reviews)</span>
          )}
        </div>
      )}

      {/* Amount */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Bid Amount</div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(amount)}</div>
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

      {/* Info grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {timeline && (
          <div className="text-center">
            <Calendar className="w-4 h-4 text-gray-400 mx-auto mb-1" />
            <div className="text-xs text-gray-500">Timeline</div>
            <div className="text-sm font-semibold text-gray-900">{timeline}</div>
          </div>
        )}
        {responseTime !== undefined && (
          <div className="text-center">
            <Clock className="w-4 h-4 text-gray-400 mx-auto mb-1" />
            <div className="text-xs text-gray-500">Response</div>
            <div className="text-sm font-semibold text-gray-900">{responseTime}h</div>
          </div>
        )}
        {completedProjects !== undefined && (
          <div className="text-center">
            <CheckCircle2 className="w-4 h-4 text-gray-400 mx-auto mb-1" />
            <div className="text-xs text-gray-500">Projects</div>
            <div className="text-sm font-semibold text-gray-900">{completedProjects}</div>
          </div>
        )}
      </div>

      {/* Submitted date */}
      {submittedAt && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-sm text-gray-500">
          <span>Submitted {formatDate(submittedAt)}</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      )}
    </CardWrapper>
  );
}

export default BidCard;
