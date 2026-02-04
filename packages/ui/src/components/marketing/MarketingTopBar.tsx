// packages/ui/src/components/marketing/MarketingTopBar.tsx
// Horizontal top bar with breadcrumb, search, and auth buttons

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { cn } from '../../lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface MarketingTopBarProps {
  breadcrumbs?: BreadcrumbItem[];
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  notificationCount?: number;
  isAuthenticated?: boolean;
  className?: string;
}

export const MarketingTopBar: React.FC<MarketingTopBarProps> = ({
  breadcrumbs = [{ label: 'Home', href: '/' }],
  showSearch = true,
  searchPlaceholder = 'Search services, professionals, or features...',
  onSearch,
  notificationCount = 0,
  isAuthenticated = false,
  className,
}) => {
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchValue);
  };

  return (
    <header
      className={cn(
        'h-16 bg-white border-b border-gray-200 flex items-center px-4 md:px-6 gap-4',
        className
      )}
    >
      {/* Breadcrumb - Hidden on mobile */}
      <nav className="hidden md:flex items-center text-sm min-w-0 flex-shrink-0">
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <svg
                className="w-4 h-4 mx-2 text-gray-300 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="text-gray-500 hover:text-[#2ABFBF] transition-colors truncate"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-[#1A2B4A] font-medium truncate">{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Search Bar */}
      {showSearch && (
        <form onSubmit={handleSearch} className="flex-grow max-w-xl mx-auto">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2ABFBF]/20 focus:border-[#2ABFBF] transition-colors"
            />
          </div>
        </form>
      )}

      {/* Right Side Actions */}
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        {/* Notifications */}
        {isAuthenticated && (
          <button
            className="relative p-2 text-gray-500 hover:text-[#1A2B4A] hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#E8793A] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>
        )}

        {/* Auth Buttons */}
        {isAuthenticated ? (
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 bg-[#E8793A] text-white rounded-lg font-semibold text-sm hover:bg-[#d16a2f] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="px-4 py-2 text-[#1A2B4A] font-medium text-sm hover:bg-gray-100 rounded-lg transition-colors hidden sm:block"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-[#E8793A] text-white rounded-lg font-semibold text-sm hover:bg-[#d16a2f] transition-colors"
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default MarketingTopBar;
