'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Breadcrumb Item
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * PageHeader Props
 */
export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  icon?: LucideIcon;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  tabs?: React.ReactNode;
  className?: string;
}

/**
 * PageHeader Component
 * Page title with breadcrumbs, actions, and optional tabs
 *
 * Usage:
 * ```tsx
 * <PageHeader
 *   title="Projects"
 *   description="Manage all your construction projects"
 *   breadcrumbs={[
 *     { label: 'Dashboard', href: '/dashboard' },
 *     { label: 'Projects' }
 *   ]}
 *   actions={
 *     <Button>New Project</Button>
 *   }
 * />
 * ```
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  icon: Icon,
  actions,
  badge,
  tabs,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center gap-1">
                {index > 0 && (
                  <ChevronRight size={14} className="text-gray-400" />
                )}
                {crumb.href && index < breadcrumbs.length - 1 ? (
                  <Link
                    href={crumb.href}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={cn(
                    index === breadcrumbs.length - 1
                      ? 'text-gray-900 dark:text-white font-medium'
                      : 'text-gray-500 dark:text-gray-400'
                  )}>
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Header content */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30">
              <Icon size={24} className="text-primary-600 dark:text-primary-400" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
              {badge}
            </div>
            {description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* Tabs */}
      {tabs && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          {tabs}
        </div>
      )}
    </div>
  );
}

/**
 * PageHeaderTab Props
 */
export interface PageHeaderTabProps {
  children: React.ReactNode;
  href: string;
  active?: boolean;
  badge?: string | number;
}

/**
 * PageHeaderTab Component
 */
export function PageHeaderTab({
  children,
  href,
  active = false,
  badge,
}: PageHeaderTabProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-3 -mb-px border-b-2 text-sm font-medium transition-colors',
        active
          ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
      )}
    >
      {children}
      {badge !== undefined && (
        <span className={cn(
          'px-2 py-0.5 text-xs font-semibold rounded-full',
          active
            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
        )}>
          {badge}
        </span>
      )}
    </Link>
  );
}

/**
 * PageHeaderTabs Container
 */
export function PageHeaderTabs({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {children}
    </div>
  );
}

export default PageHeader;
