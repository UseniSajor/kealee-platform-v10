// packages/ui/src/components/PageHeader.tsx
// Kealee Platform Page Header Component - Enterprise Navigation

'use client';

import React from 'react';
import { cn } from '../lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  badge?: {
    label: string;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  };
  backHref?: string;
  onBack?: () => void;
}

const BackIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const ChevronRight = () => (
  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  actions,
  badge,
  backHref,
  onBack,
  className,
  ...props
}) => {
  const badgeVariants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className={cn('pb-6 mb-6 border-b border-gray-200', className)} {...props}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 mb-4 text-sm">
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight />}
              {item.href ? (
                <a
                  href={item.href}
                  className="text-gray-500 hover:text-gray-900 transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <span className="text-gray-900 font-medium">{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Back button */}
          {(backHref || onBack) && (
            <button
              onClick={onBack}
              className={cn(
                'p-2 rounded-lg text-gray-500 hover:text-gray-900',
                'hover:bg-gray-100 transition-colors',
                '-ml-2 mt-0.5'
              )}
            >
              <BackIcon />
            </button>
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {title}
              </h1>
              {badge && (
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium',
                    badgeVariants[badge.variant || 'default']
                  )}
                >
                  {badge.label}
                </span>
              )}
            </div>
            {description && (
              <p className="text-gray-500 text-sm max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

PageHeader.displayName = 'PageHeader';

export { PageHeader };
export default PageHeader;
