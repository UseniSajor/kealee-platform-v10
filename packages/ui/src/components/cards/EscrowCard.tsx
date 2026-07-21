// packages/ui/src/components/cards/EscrowCard.tsx
// Escrow status card for displaying financial escrow information

'use client';

import React from 'react';
import NextLink from 'next/link';

// Type-safe wrapper to handle React version mismatches in monorepo
const Link = NextLink as any;
import {
  Shield,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Lock,
  Unlock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../utils';

export type EscrowStatus =
  | 'pending_deposit'
  | 'funded'
  | 'partially_released'
  | 'fully_released'
  | 'disputed'
  | 'refunded'
  | 'cancelled';

export type EscrowTransactionType =
  | 'deposit'
  | 'release'
  | 'refund'
  | 'hold';

export interface EscrowTransaction {
  id: string;
  type: EscrowTransactionType;
  amount: number;
  date: Date | string;
  description?: string;
  recipient?: string;
}

export interface EscrowMilestone {
  id: string;
  name: string;
  amount: number;
  status: 'pending' | 'funded' | 'released' | 'disputed';
  releaseDate?: Date | string;
}

export interface EscrowCardProps {
  id: string;
  projectName: string;
  contractorName?: string;
  status: EscrowStatus;
  totalAmount: number;
  fundedAmount: number;
  releasedAmount: number;
  heldAmount?: number;
  createdAt?: Date | string;
  lastActivityAt?: Date | string;
  expectedReleaseDate?: Date | string;
  transactions?: EscrowTransaction[];
  milestones?: EscrowMilestone[];
  disputeReason?: string;
  escrowAgent?: string;
  href?: string;
  onClick?: () => void;
  onDeposit?: () => void;
  onRelease?: () => void;
  onDispute?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

const statusConfig: Record<
  EscrowStatus,
  { label: string; color: string; bgColor: string; icon: LucideIcon }
> = {
  pending_deposit: {
    label: 'Pending Deposit',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    icon: Clock,
  },
  funded: {
    label: 'Funded',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: Lock,
  },
  partially_released: {
    label: 'Partially Released',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: Unlock,
  },
  fully_released: {
    label: 'Fully Released',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: CheckCircle2,
  },
  disputed: {
    label: 'Disputed',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: AlertCircle,
  },
  refunded: {
    label: 'Refunded',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: RefreshCw,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    icon: XCircle,
  },
};

const transactionTypeConfig: Record<
  EscrowTransactionType,
  { label: string; color: string; icon: LucideIcon }
> = {
  deposit: {
    label: 'Deposit',
    color: 'text-green-600',
    icon: ArrowDownRight,
  },
  release: {
    label: 'Release',
    color: 'text-blue-600',
    icon: ArrowUpRight,
  },
  refund: {
    label: 'Refund',
    color: 'text-amber-600',
    icon: RefreshCw,
  },
  hold: {
    label: 'Hold',
    color: 'text-gray-600',
    icon: Lock,
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

export function EscrowCard({
  id,
  projectName,
  contractorName,
  status,
  totalAmount,
  fundedAmount,
  releasedAmount,
  heldAmount,
  createdAt,
  lastActivityAt,
  expectedReleaseDate,
  transactions,
  milestones,
  disputeReason,
  escrowAgent,
  href,
  onClick,
  onDeposit,
  onRelease,
  onDispute,
  variant = 'default',
  className,
}: EscrowCardProps) {
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;

  const fundingProgress = totalAmount > 0 ? (fundedAmount / totalAmount) * 100 : 0;
  const releaseProgress = fundedAmount > 0 ? (releasedAmount / fundedAmount) * 100 : 0;
  const availableAmount = fundedAmount - releasedAmount - (heldAmount || 0);

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
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white">
          <Shield className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{projectName}</h3>
          {contractorName && (
            <p className="text-sm text-gray-500 truncate">{contractorName}</p>
          )}
        </div>

        <div className="text-right">
          <div className="font-bold text-gray-900">{formatCurrency(fundedAmount)}</div>
          <div className="text-xs text-gray-500">
            of {formatCurrency(totalAmount)}
          </div>
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
          status === 'disputed' && 'ring-2 ring-red-200',
          className
        )}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{projectName}</h3>
                {contractorName && (
                  <p className="text-sm text-gray-500">{contractorName}</p>
                )}
              </div>
            </div>
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

          {/* Dispute banner */}
          {status === 'disputed' && disputeReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-red-800">Dispute Active</div>
                  <p className="text-sm text-red-600">{disputeReason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Amount summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-500 mb-1">Total</div>
              <div className="text-xl font-bold text-gray-900">{formatCurrency(totalAmount)}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-sm text-green-600 mb-1">Funded</div>
              <div className="text-xl font-bold text-green-700">{formatCurrency(fundedAmount)}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-sm text-blue-600 mb-1">Available</div>
              <div className="text-xl font-bold text-blue-700">{formatCurrency(availableAmount)}</div>
            </div>
          </div>
        </div>

        {/* Progress bars */}
        <div className="p-5 border-b border-gray-100">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Funding Progress</span>
                <span className="font-medium text-gray-900">
                  {Math.round(fundingProgress)}%
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${fundingProgress}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Release Progress</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(releasedAmount)} released
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${releaseProgress}%` }}
                />
              </div>
            </div>

            {heldAmount !== undefined && heldAmount > 0 && (
              <div className="flex items-center justify-between text-sm bg-amber-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span className="text-amber-700">Held Amount</span>
                </div>
                <span className="font-medium text-amber-700">
                  {formatCurrency(heldAmount)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Milestones */}
        {milestones && milestones.length > 0 && (
          <div className="p-5 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Milestones</h4>
            <div className="space-y-3">
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {milestone.status === 'released' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : milestone.status === 'funded' ? (
                      <Lock className="w-5 h-5 text-blue-500" />
                    ) : milestone.status === 'disputed' ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{milestone.name}</div>
                      {milestone.releaseDate && (
                        <div className="text-xs text-gray-500">
                          {formatDate(milestone.releaseDate)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {formatCurrency(milestone.amount)}
                    </div>
                    <div
                      className={cn(
                        'text-xs',
                        milestone.status === 'released'
                          ? 'text-green-600'
                          : milestone.status === 'funded'
                            ? 'text-blue-600'
                            : milestone.status === 'disputed'
                              ? 'text-red-600'
                              : 'text-gray-500'
                      )}
                    >
                      {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent transactions */}
        {transactions && transactions.length > 0 && (
          <div className="p-5 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h4>
            <div className="space-y-2">
              {transactions.slice(0, 5).map((tx) => {
                const txConfig = transactionTypeConfig[tx.type];
                const TxIcon = txConfig.icon;
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center',
                          tx.type === 'deposit' && 'bg-green-100',
                          tx.type === 'release' && 'bg-blue-100',
                          tx.type === 'refund' && 'bg-amber-100',
                          tx.type === 'hold' && 'bg-gray-100'
                        )}
                      >
                        <TxIcon className={cn('w-4 h-4', txConfig.color)} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {txConfig.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(tx.date)}
                          {tx.recipient && ` • ${tx.recipient}`}
                        </div>
                      </div>
                    </div>
                    <div
                      className={cn(
                        'font-medium',
                        tx.type === 'deposit' ? 'text-green-600' : 'text-gray-900'
                      )}
                    >
                      {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-4 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              {escrowAgent && (
                <span>Agent: {escrowAgent}</span>
              )}
              {createdAt && (
                <span>Created {formatDate(createdAt)}</span>
              )}
            </div>
            {expectedReleaseDate && (
              <span>Expected release: {formatDate(expectedReleaseDate)}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        {(onDeposit || onRelease || onDispute) && (
          <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
            {onDeposit && status === 'pending_deposit' && (
              <button
                onClick={onDeposit}
                className="flex-1 py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                Make Deposit
              </button>
            )}
            {onRelease && (status === 'funded' || status === 'partially_released') && (
              <button
                onClick={onRelease}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Release Funds
              </button>
            )}
            {onDispute && status !== 'disputed' && status !== 'fully_released' && (
              <button
                onClick={onDispute}
                className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Raise Dispute
              </button>
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
        status === 'disputed' && 'ring-2 ring-red-200',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{projectName}</h3>
            {contractorName && (
              <p className="text-sm text-gray-500">{contractorName}</p>
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

      {/* Amount display */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500">Funded</div>
            <div className="text-xl font-bold text-gray-900">{formatCurrency(fundedAmount)}</div>
            <div className="text-xs text-gray-500">of {formatCurrency(totalAmount)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Available</div>
            <div className="text-xl font-bold text-green-600">{formatCurrency(availableAmount)}</div>
            <div className="text-xs text-gray-500">
              {formatCurrency(releasedAmount)} released
            </div>
          </div>
        </div>
      </div>

      {/* Progress bars */}
      <div className="space-y-3 mb-4">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">Funding</span>
            <span className="text-gray-700">{Math.round(fundingProgress)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${fundingProgress}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">Released</span>
            <span className="text-gray-700">{Math.round(releaseProgress)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${releaseProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Dispute warning */}
      {status === 'disputed' && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg mb-4">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700">Active dispute</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-sm text-gray-500">
        <div className="flex items-center gap-4">
          {lastActivityAt && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDate(lastActivityAt)}
            </div>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </CardWrapper>
  );
}

export default EscrowCard;
