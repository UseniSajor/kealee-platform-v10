// packages/ui/src/components/navigation/Breadcrumbs.tsx

import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  onNavigate?: (href: string) => void;
  className?: string;
}

export function Breadcrumbs({ items, showHome = false, onNavigate, className }: BreadcrumbsProps) {
  const allItems = showHome ? [{ label: 'Home', href: '/', icon: <Home className="w-3.5 h-3.5" /> }, ...items] : items;

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center', className)}>
      <ol className="flex items-center gap-1 flex-wrap">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;

          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden="true" />
              )}

              {isLast ? (
                <span
                  className="flex items-center gap-1 text-sm text-gray-900 font-medium"
                  aria-current="page"
                >
                  {item.icon}
                  {item.label}
                </span>
              ) : item.href ? (
                <a
                  href={item.href}
                  onClick={(e) => {
                    if (onNavigate && item.href) {
                      e.preventDefault();
                      onNavigate(item.href);
                    }
                  }}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  {item.icon}
                  {item.label}
                </a>
              ) : (
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  {item.icon}
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
