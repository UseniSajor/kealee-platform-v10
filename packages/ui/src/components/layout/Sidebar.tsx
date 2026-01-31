'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppShell } from './AppShell';

/**
 * Sidebar Navigation Item
 */
export interface SidebarNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  children?: SidebarNavItem[];
}

/**
 * Sidebar Section
 */
export interface SidebarSection {
  title?: string;
  items: SidebarNavItem[];
}

/**
 * Sidebar Props
 */
export interface SidebarProps {
  sections: SidebarSection[];
  logo?: React.ReactNode;
  footer?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

/**
 * Sidebar Component
 * Navigation sidebar for all app layouts
 *
 * Usage:
 * ```tsx
 * <Sidebar
 *   logo={<Logo />}
 *   sections={[
 *     {
 *       title: 'Main',
 *       items: [
 *         { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
 *         { name: 'Projects', href: '/projects', icon: FolderOpen },
 *       ]
 *     }
 *   ]}
 * />
 * ```
 */
export function Sidebar({
  sections,
  logo,
  footer,
  compact = false,
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed, sidebarOpen, setSidebarOpen } = useAppShell();

  const isCollapsed = compact || sidebarCollapsed;

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:static inset-y-0 left-0 z-50',
          'flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800',
          'transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          className
        )}
      >
        {/* Logo */}
        {logo && (
          <div className={cn(
            'flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-800',
            isCollapsed && 'justify-center px-2'
          )}>
            {logo}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6">
              {section.title && !isCollapsed && (
                <h3 className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {section.title}
                </h3>
              )}
              <ul className="space-y-1 px-2">
                {section.items.map((item) => (
                  <SidebarNavItemComponent
                    key={item.href}
                    item={item}
                    isActive={pathname === item.href || pathname?.startsWith(item.href + '/')}
                    isCollapsed={isCollapsed}
                  />
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        {footer && (
          <div className={cn(
            'p-4 border-t border-gray-200 dark:border-gray-800',
            isCollapsed && 'p-2'
          )}>
            {footer}
          </div>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={cn(
            'hidden md:flex items-center justify-center',
            'h-10 border-t border-gray-200 dark:border-gray-800',
            'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
            'transition-colors'
          )}
        >
          {sidebarCollapsed ? (
            <ChevronRight size={20} />
          ) : (
            <ChevronLeft size={20} />
          )}
        </button>
      </aside>
    </>
  );
}

/**
 * SidebarNavItemComponent
 */
interface SidebarNavItemComponentProps {
  item: SidebarNavItem;
  isActive: boolean;
  isCollapsed: boolean;
}

function SidebarNavItemComponent({ item, isActive, isCollapsed }: SidebarNavItemComponentProps) {
  const Icon = item.icon;

  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
          'text-sm font-medium',
          isActive
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
          isCollapsed && 'justify-center px-2'
        )}
        title={isCollapsed ? item.name : undefined}
      >
        <Icon size={20} className="flex-shrink-0" />
        {!isCollapsed && (
          <>
            <span className="flex-1">{item.name}</span>
            {item.badge && (
              <span className={cn(
                'px-2 py-0.5 text-xs font-semibold rounded-full',
                isActive
                  ? 'bg-primary-200 text-primary-800'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              )}>
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    </li>
  );
}

export default Sidebar;
