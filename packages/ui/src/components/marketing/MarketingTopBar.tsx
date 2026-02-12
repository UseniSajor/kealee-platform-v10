'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Bell, ChevronRight, ShoppingCart } from 'lucide-react';
import { brand } from './brand';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface MarketingTopBarProps {
  breadcrumbs?: BreadcrumbItem[];
  showSearch?: boolean;
  showNotifications?: boolean;
  className?: string;
}

export function MarketingTopBar({
  breadcrumbs = [{ label: 'Home', href: '/' }],
  showSearch = true,
  showNotifications = true,
  className = '',
}: MarketingTopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header
      className={`h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 ${className}`}
    >
      {/* Breadcrumbs */}
      <nav className="hidden md:flex items-center gap-1 text-sm" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, index) => (
          <span key={crumb.label} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                className="text-gray-900 font-medium"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      {/* Search */}
      {showSearch && (
        <div className="flex-1 max-w-md mx-4 lg:mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services, professionals, or features..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        {showNotifications && (
          <button
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        )}
        <button id="cart-trigger" className="relative text-gray-700 hover:text-blue-600 transition" aria-label="Cart">
          <ShoppingCart className="h-5 w-5" />
        </button>
        <Link
          href="/login"
          className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
          Log In
        </Link>
        <Link
          href="/get-started"
          className="inline-flex px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors hover:opacity-90"
          style={{ backgroundColor: brand.orange, fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
          Get Started
        </Link>
      </div>
    </header>
  );
}
