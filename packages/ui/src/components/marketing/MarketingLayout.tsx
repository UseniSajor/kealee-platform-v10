// packages/ui/src/components/marketing/MarketingLayout.tsx
// Main layout wrapper for marketing pages

'use client';

import React from 'react';
import { cn } from '../../lib/utils';
import { MarketingSidebar, MarketingSidebarProvider, useSidebar } from './MarketingSidebar';
import { MarketingTopBar, BreadcrumbItem } from './MarketingTopBar';
import { MarketingFooter, FooterColumn } from './MarketingFooter';

export interface MarketingLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  isAuthenticated?: boolean;
  notificationCount?: number;
  showSidebar?: boolean;
  showFooter?: boolean;
  footerColumns?: FooterColumn[];
  showNewsletter?: boolean;
  className?: string;
}

const LayoutContent: React.FC<MarketingLayoutProps> = ({
  children,
  breadcrumbs,
  showSearch = true,
  searchPlaceholder,
  onSearch,
  isAuthenticated = false,
  notificationCount = 0,
  showSidebar = true,
  showFooter = true,
  footerColumns,
  showNewsletter = true,
  className,
}) => {
  const { setIsOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      {showSidebar && <MarketingSidebar />}

      {/* Main Content Area */}
      <div className={cn(showSidebar && 'lg:ml-[280px]')}>
        {/* Top Bar */}
        <MarketingTopBar
          breadcrumbs={breadcrumbs}
          showSearch={showSearch}
          searchPlaceholder={searchPlaceholder}
          onSearch={onSearch}
          isAuthenticated={isAuthenticated}
          notificationCount={notificationCount}
          className={cn(showSidebar && 'lg:pl-4')}
        />

        {/* Page Content */}
        <main className={cn('min-h-[calc(100vh-4rem)]', className)}>
          {children}
        </main>

        {/* Footer */}
        {showFooter && (
          <MarketingFooter
            columns={footerColumns}
            showNewsletter={showNewsletter}
          />
        )}
      </div>
    </div>
  );
};

export const MarketingLayout: React.FC<MarketingLayoutProps> = (props) => {
  return (
    <MarketingSidebarProvider>
      <LayoutContent {...props} />
    </MarketingSidebarProvider>
  );
};

export default MarketingLayout;
