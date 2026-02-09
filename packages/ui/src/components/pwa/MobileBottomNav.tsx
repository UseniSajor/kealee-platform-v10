'use client';

/**
 * MobileBottomNav — Bottom tab bar for mobile PWA navigation
 *
 * Shows on screens < 768px (md breakpoint). Hidden on desktop.
 * Supports up to 5 tabs with icons, labels, and active state.
 * Provides safe-area padding for notched devices (iPhone X+).
 *
 * Usage:
 *   <MobileBottomNav
 *     tabs={[
 *       { href: '/', label: 'Home', icon: <Home />, match: 'exact' },
 *       { href: '/projects', label: 'Projects', icon: <FolderKanban /> },
 *     ]}
 *   />
 */

import React from 'react';
import { cn } from '../../utils';

// ============================================================================
// TYPES
// ============================================================================

export interface MobileNavTab {
  /** Route path */
  href: string;
  /** Tab label */
  label: string;
  /** Lucide icon component (rendered as JSX) */
  icon: React.ReactNode;
  /** URL matching strategy */
  match?: 'exact' | 'startsWith';
  /** Badge count (e.g., unread messages) */
  badge?: number;
}

export interface MobileBottomNavProps {
  /** Array of navigation tabs (max 5) */
  tabs: MobileNavTab[];
  /** Current pathname for active state detection */
  pathname: string;
  /** Additional CSS classes */
  className?: string;
  /** Custom link component (defaults to <a>) */
  LinkComponent?: React.ComponentType<{
    href: string;
    className?: string;
    children: React.ReactNode;
  }>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MobileBottomNav({
  tabs,
  pathname,
  className,
  LinkComponent,
}: MobileBottomNavProps) {
  const Link = LinkComponent || DefaultLink;

  return (
    <nav
      className={cn(
        // Only show on mobile
        'fixed inset-x-0 bottom-0 z-50 md:hidden',
        // Safe area for notched devices
        'pb-[env(safe-area-inset-bottom)]',
        // Visual styling
        'border-t border-gray-200 bg-white/95 backdrop-blur-lg',
        className
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-stretch justify-around">
        {tabs.slice(0, 5).map((tab) => {
          const isActive = tab.match === 'exact'
            ? pathname === tab.href
            : pathname.startsWith(tab.href) && (tab.href !== '/' || pathname === '/');

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                // Layout
                'relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 px-1',
                // Touch target (44px minimum per Apple HIG)
                'min-w-[44px]',
                // Transitions
                'transition-colors duration-150',
                // Active/inactive states
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 active:text-gray-700'
              )}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute -top-px left-3 right-3 h-0.5 rounded-full bg-blue-600" />
              )}

              {/* Icon */}
              <div className="relative flex h-6 w-6 items-center justify-center">
                {tab.icon}

                {/* Badge */}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-[10px] leading-tight',
                  isActive ? 'font-semibold' : 'font-medium'
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Default link component (plain <a> tag)
function DefaultLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

export default MobileBottomNav;
