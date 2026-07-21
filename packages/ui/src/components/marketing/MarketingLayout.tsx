'use client';

import { MarketingSidebar } from './MarketingSidebar';
import { MarketingTopBar, BreadcrumbItem } from './MarketingTopBar';
import { MarketingFooter } from './MarketingFooter';

export interface MarketingLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  activeSection?: string;
  showSidebar?: boolean;
  showTopBar?: boolean;
  showFooter?: boolean;
  className?: string;
}

export function MarketingLayout({
  children,
  breadcrumbs,
  activeSection,
  showSidebar = true,
  showTopBar = true,
  showFooter = true,
  className = '',
}: MarketingLayoutProps) {
  return (
    <div className="min-h-screen flex bg-white">
      {/* Sidebar */}
      {showSidebar && <MarketingSidebar activeSection={activeSection} />}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        {showTopBar && <MarketingTopBar breadcrumbs={breadcrumbs} />}

        {/* Page Content */}
        <main className={`flex-1 ${className}`}>{children}</main>

        {/* Footer */}
        {showFooter && <MarketingFooter />}
      </div>
    </div>
  );
}
