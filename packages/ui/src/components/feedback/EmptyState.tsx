// packages/ui/src/components/feedback/EmptyState.tsx
// Empty state component for displaying when no data is available

'use client';

import React from 'react';
import NextLink from 'next/link';

// Type-safe wrapper to handle React version mismatches in monorepo
const Link = NextLink as any;
import {
  Inbox,
  FileText,
  Search,
  Users,
  Folder,
  Calendar,
  Plus,
  ArrowRight,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../utils';

export type EmptyStateType =
  | 'no-data'
  | 'no-results'
  | 'no-access'
  | 'error'
  | 'coming-soon'
  | 'custom';

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary' | 'link';
  icon?: LucideIcon;
}

export interface EmptyStateProps {
  type?: EmptyStateType;
  icon?: LucideIcon;
  iconColor?: string;
  title: string;
  description?: string;
  actions?: EmptyStateAction[];
  illustration?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const typeConfig: Record<
  EmptyStateType,
  { icon: LucideIcon; iconColor: string }
> = {
  'no-data': { icon: Inbox, iconColor: 'text-gray-400' },
  'no-results': { icon: Search, iconColor: 'text-gray-400' },
  'no-access': { icon: Users, iconColor: 'text-amber-500' },
  error: { icon: RefreshCw, iconColor: 'text-red-500' },
  'coming-soon': { icon: Calendar, iconColor: 'text-blue-500' },
  custom: { icon: FileText, iconColor: 'text-gray-400' },
};

const sizeConfig = {
  sm: {
    container: 'py-8 px-4',
    iconSize: 'w-10 h-10',
    iconWrapper: 'w-16 h-16',
    titleSize: 'text-base',
    descSize: 'text-sm',
    gap: 'gap-3',
  },
  md: {
    container: 'py-12 px-6',
    iconSize: 'w-12 h-12',
    iconWrapper: 'w-20 h-20',
    titleSize: 'text-lg',
    descSize: 'text-base',
    gap: 'gap-4',
  },
  lg: {
    container: 'py-16 px-8',
    iconSize: 'w-16 h-16',
    iconWrapper: 'w-24 h-24',
    titleSize: 'text-xl',
    descSize: 'text-base',
    gap: 'gap-5',
  },
};

function ActionButton({ action }: { action: EmptyStateAction }) {
  const Icon = action.icon;
  const baseClasses =
    'inline-flex items-center gap-2 font-medium transition-colors';

  const variantClasses = {
    primary:
      'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg',
    secondary:
      'px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg',
    link: 'text-blue-600 hover:text-blue-700',
  };

  const content = (
    <>
      {Icon && <Icon className="w-4 h-4" />}
      {action.label}
      {action.variant === 'link' && <ArrowRight className="w-4 h-4" />}
    </>
  );

  if (action.href) {
    return (
      <Link
        href={action.href}
        className={cn(baseClasses, variantClasses[action.variant || 'primary'])}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={action.onClick}
      className={cn(baseClasses, variantClasses[action.variant || 'primary'])}
    >
      {content}
    </button>
  );
}

export function EmptyState({
  type = 'no-data',
  icon,
  iconColor,
  title,
  description,
  actions,
  illustration,
  size = 'md',
  className,
}: EmptyStateProps) {
  const config = typeConfig[type];
  const sizeStyles = sizeConfig[size];
  const Icon = icon || config.icon;
  const finalIconColor = iconColor || config.iconColor;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizeStyles.container,
        sizeStyles.gap,
        className
      )}
    >
      {illustration ? (
        <div className="mb-2">{illustration}</div>
      ) : (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-gray-100',
            sizeStyles.iconWrapper
          )}
        >
          <Icon className={cn(sizeStyles.iconSize, finalIconColor)} />
        </div>
      )}

      <div className="max-w-md">
        <h3 className={cn('font-semibold text-gray-900', sizeStyles.titleSize)}>
          {title}
        </h3>
        {description && (
          <p className={cn('text-gray-500 mt-1', sizeStyles.descSize)}>
            {description}
          </p>
        )}
      </div>

      {actions && actions.length > 0 && (
        <div className="flex items-center gap-3 mt-2">
          {actions.map((action, index) => (
            <ActionButton key={index} action={action} />
          ))}
        </div>
      )}
    </div>
  );
}

// Preset empty states for common scenarios

export interface PresetEmptyStateProps {
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export function EmptyProjects({ onAction, actionHref, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={Folder}
      title="No projects yet"
      description="Get started by creating your first project. We'll guide you through the setup process."
      actions={[
        {
          label: 'Create Project',
          onClick: onAction,
          href: actionHref,
          icon: Plus,
          variant: 'primary',
        },
      ]}
      className={className}
    />
  );
}

export function EmptySearchResults({
  query,
  onClear,
  className,
}: PresetEmptyStateProps & { query?: string; onClear?: () => void }) {
  return (
    <EmptyState
      type="no-results"
      title="No results found"
      description={
        query
          ? `We couldn't find anything matching "${query}". Try adjusting your search or filters.`
          : 'Try adjusting your search or filters to find what you\'re looking for.'
      }
      actions={
        onClear
          ? [{ label: 'Clear search', onClick: onClear, variant: 'secondary' }]
          : undefined
      }
      className={className}
    />
  );
}

export function EmptyTasks({ onAction, actionHref, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={Inbox}
      iconColor="text-green-500"
      title="All caught up!"
      description="You have no pending tasks. New tasks will appear here when assigned to you."
      actions={
        onAction || actionHref
          ? [
              {
                label: 'Create Task',
                onClick: onAction,
                href: actionHref,
                icon: Plus,
                variant: 'primary',
              },
            ]
          : undefined
      }
      className={className}
    />
  );
}

export function EmptyNotifications({ className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={Inbox}
      size="sm"
      title="No notifications"
      description="You're all caught up. New notifications will appear here."
      className={className}
    />
  );
}

export function ErrorState({
  onRetry,
  message,
  className,
}: PresetEmptyStateProps & { message?: string; onRetry?: () => void }) {
  return (
    <EmptyState
      type="error"
      title="Something went wrong"
      description={message || 'An error occurred while loading. Please try again.'}
      actions={
        onRetry
          ? [
              {
                label: 'Try Again',
                onClick: onRetry,
                icon: RefreshCw,
                variant: 'primary',
              },
            ]
          : undefined
      }
      className={className}
    />
  );
}

export function ComingSoon({ feature, className }: PresetEmptyStateProps & { feature?: string }) {
  return (
    <EmptyState
      type="coming-soon"
      title="Coming Soon"
      description={
        feature
          ? `${feature} is currently under development. Check back soon for updates!`
          : 'This feature is coming soon. Check back later for updates!'
      }
      className={className}
    />
  );
}

export default EmptyState;
