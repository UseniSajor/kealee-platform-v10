// packages/ui/src/components/cards/ProjectCard.tsx
// Project summary card for displaying project overview

'use client';

import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  DollarSign,
  Users,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../utils';

export type ProjectStatus =
  | 'draft'
  | 'planning'
  | 'design'
  | 'permitting'
  | 'bidding'
  | 'construction'
  | 'inspection'
  | 'completed'
  | 'on_hold';

export interface ProjectCardProps {
  id: string;
  name: string;
  address?: string;
  status: ProjectStatus;
  phase?: string;
  budget?: number;
  spent?: number;
  startDate?: Date | string;
  endDate?: Date | string;
  progress?: number;
  teamCount?: number;
  thumbnail?: string;
  alerts?: number;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; color: string; bgColor: string; icon: LucideIcon }
> = {
  draft: {
    label: 'Draft',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: Clock,
  },
  planning: {
    label: 'Planning',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: Clock,
  },
  design: {
    label: 'Design',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    icon: Clock,
  },
  permitting: {
    label: 'Permitting',
    color: 'text-violet-600',
    bgColor: 'bg-violet-100',
    icon: Clock,
  },
  bidding: {
    label: 'Bidding',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: Clock,
  },
  construction: {
    label: 'Construction',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: Clock,
  },
  inspection: {
    label: 'Inspection',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    icon: Clock,
  },
  completed: {
    label: 'Completed',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: CheckCircle2,
  },
  on_hold: {
    label: 'On Hold',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    icon: AlertCircle,
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

export function ProjectCard({
  id,
  name,
  address,
  status,
  phase,
  budget,
  spent,
  startDate,
  endDate,
  progress = 0,
  teamCount,
  thumbnail,
  alerts,
  href,
  onClick,
  variant = 'default',
  className,
}: ProjectCardProps) {
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;
  const budgetUsage = budget && spent ? Math.round((spent / budget) * 100) : 0;

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
          className
        )}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={name}
            className="w-12 h-12 rounded-lg object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
            {name.charAt(0)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
          {address && (
            <p className="text-sm text-gray-500 truncate">{address}</p>
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

        <ChevronRight className="w-5 h-5 text-gray-400" />
      </CardWrapper>
    );
  }

  if (variant === 'detailed') {
    return (
      <CardWrapper
        {...(cardProps as any)}
        className={cn(
          'block bg-white rounded-xl border border-gray-200 overflow-hidden',
          'hover:shadow-lg hover:border-gray-300 transition-all',
          className
        )}
      >
        {/* Header with thumbnail */}
        <div className="relative h-40 bg-gradient-to-br from-blue-500 to-blue-600">
          {thumbnail && (
            <img
              src={thumbnail}
              alt={name}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
            {address && (
              <div className="flex items-center gap-1 text-white/80 text-sm">
                <MapPin className="w-4 h-4" />
                <span>{address}</span>
              </div>
            )}
          </div>
          {alerts && alerts > 0 && (
            <div className="absolute top-4 right-4 flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              <AlertCircle className="w-3 h-3" />
              {alerts} alerts
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Status and progress */}
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
                statusInfo.bgColor,
                statusInfo.color
              )}
            >
              <StatusIcon className="w-4 h-4" />
              {statusInfo.label}
            </span>
            {phase && (
              <span className="text-sm text-gray-500">{phase}</span>
            )}
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-gray-900">{progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Budget */}
          {budget && (
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Budget</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(spent || 0)} / {formatCurrency(budget)}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    budgetUsage > 90 ? 'bg-red-500' : budgetUsage > 75 ? 'bg-amber-500' : 'bg-green-500'
                  )}
                  style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer info */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {startDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(startDate)}</span>
                </div>
              )}
              {teamCount && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{teamCount}</span>
                </div>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </CardWrapper>
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
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
              {name.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{name}</h3>
            {address && (
              <div className="flex items-center gap-1 text-gray-500 text-sm">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[200px]">{address}</span>
              </div>
            )}
          </div>
        </div>

        {alerts && alerts > 0 && (
          <div className="flex items-center gap-1 bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            {alerts}
          </div>
        )}
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
            statusInfo.bgColor,
            statusInfo.color
          )}
        >
          <StatusIcon className="w-3 h-3" />
          {statusInfo.label}
        </span>
        {phase && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {phase}
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-500">Progress</span>
          <span className="font-medium text-gray-700">{progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        {budget && (
          <div className="bg-gray-50 rounded-lg p-2">
            <DollarSign className="w-4 h-4 text-gray-400 mx-auto mb-1" />
            <div className="text-xs text-gray-500">Budget</div>
            <div className="text-sm font-semibold text-gray-900">
              {formatCurrency(budget)}
            </div>
          </div>
        )}
        {startDate && (
          <div className="bg-gray-50 rounded-lg p-2">
            <Calendar className="w-4 h-4 text-gray-400 mx-auto mb-1" />
            <div className="text-xs text-gray-500">Start</div>
            <div className="text-sm font-semibold text-gray-900">
              {formatDate(startDate)}
            </div>
          </div>
        )}
        {teamCount !== undefined && (
          <div className="bg-gray-50 rounded-lg p-2">
            <Users className="w-4 h-4 text-gray-400 mx-auto mb-1" />
            <div className="text-xs text-gray-500">Team</div>
            <div className="text-sm font-semibold text-gray-900">{teamCount}</div>
          </div>
        )}
      </div>
    </CardWrapper>
  );
}

export default ProjectCard;
