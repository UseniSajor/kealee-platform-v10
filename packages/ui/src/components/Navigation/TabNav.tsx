// packages/ui/src/components/navigation/TabNav.tsx
// Horizontal tab navigation bar

import React from 'react';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
  disabled?: boolean;
}

export interface TabNavProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'underline' | 'pills' | 'boxed';
  size?: 'sm' | 'md';
  className?: string;
}

export function TabNav({
  tabs,
  activeTab,
  onTabChange,
  variant = 'underline',
  size = 'md',
  className,
}: TabNavProps) {
  const containerClass = {
    underline: 'border-b border-gray-200',
    pills: 'bg-gray-100 rounded-lg p-1',
    boxed: 'border border-gray-200 rounded-lg p-1 bg-gray-50',
  }[variant];

  const sizeClass = { sm: 'text-xs', md: 'text-sm' }[size];
  const paddingClass = { sm: 'px-3 py-1.5', md: 'px-4 py-2.5' }[size];

  return (
    <nav
      role="tablist"
      aria-orientation="horizontal"
      className={cn('flex items-center gap-0.5', containerClass, sizeClass, className)}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        const activeClass = {
          underline: isActive
            ? 'text-primary-700 border-b-2 border-primary-600 -mb-px'
            : 'text-gray-500 hover:text-gray-900 border-b-2 border-transparent -mb-px',
          pills: isActive
            ? 'bg-white text-primary-700 shadow-sm'
            : 'text-gray-500 hover:text-gray-900',
          boxed: isActive
            ? 'bg-white text-primary-700 shadow-sm'
            : 'text-gray-500 hover:text-gray-900',
        }[variant];

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-disabled={tab.disabled}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2 font-medium rounded-md transition-all whitespace-nowrap',
              paddingClass,
              activeClass,
              tab.disabled && 'opacity-40 cursor-not-allowed'
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-semibold',
                  isActive ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-600'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
