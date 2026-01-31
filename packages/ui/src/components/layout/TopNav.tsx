'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppShell } from './AppShell';

/**
 * User Info
 */
export interface UserInfo {
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

/**
 * Notification
 */
export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  href?: string;
}

/**
 * TopNav Props
 */
export interface TopNavProps {
  user?: UserInfo | null;
  notifications?: Notification[];
  showSearch?: boolean;
  logo?: React.ReactNode;
  actions?: React.ReactNode;
  onSearch?: (query: string) => void;
  onLogout?: () => void;
  className?: string;
}

/**
 * TopNav Component
 * Header navigation with search, notifications, and user menu
 *
 * Usage:
 * ```tsx
 * <TopNav
 *   user={{ name: 'John Doe', email: 'john@example.com' }}
 *   notifications={[]}
 *   showSearch
 *   onSearch={(q) => console.log(q)}
 * />
 * ```
 */
export function TopNav({
  user,
  notifications = [],
  showSearch = false,
  logo,
  actions,
  onSearch,
  onLogout,
  className,
}: TopNavProps) {
  const { setSidebarOpen, theme } = useAppShell();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-30 h-16',
        'flex items-center justify-between px-4',
        'bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800',
        className
      )}
    >
      {/* Left section */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <Menu size={24} />
        </button>

        {/* Logo */}
        {logo}

        {/* Search (desktop) */}
        {showSearch && (
          <form
            onSubmit={handleSearch}
            className="hidden md:flex items-center"
          >
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'w-64 pl-10 pr-4 py-2 rounded-lg',
                  'bg-gray-100 dark:bg-gray-800',
                  'border border-transparent focus:border-primary-500',
                  'text-sm text-gray-700 dark:text-gray-300',
                  'placeholder-gray-400 dark:placeholder-gray-500',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500/20'
                )}
              />
            </div>
          </form>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Custom actions */}
        {actions}

        {/* Mobile search toggle */}
        {showSearch && (
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="md:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Search size={20} />
          </button>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={cn(
              'relative p-2 rounded-lg',
              'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
              'dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800',
              'transition-colors'
            )}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500">
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))
                )}
              </div>
              <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href="/notifications"
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg',
                'text-gray-700 hover:bg-gray-100',
                'dark:text-gray-300 dark:hover:bg-gray-800',
                'transition-colors'
              )}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <User size={18} className="text-primary-600 dark:text-primary-400" />
                </div>
              )}
              <span className="hidden md:block text-sm font-medium">{user.name}</span>
              <ChevronDown size={16} className="hidden md:block" />
            </button>

            {/* User dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  {user.role && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 rounded">
                      {user.role}
                    </span>
                  )}
                </div>
                <div className="py-1">
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Settings size={16} />
                    Settings
                  </Link>
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <LogOut size={16} />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile search bar */}
      {showSearch && searchOpen && (
        <div className="absolute inset-x-0 top-full md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full pl-10 pr-4 py-2 rounded-lg',
                  'bg-gray-100 dark:bg-gray-800',
                  'border border-transparent focus:border-primary-500',
                  'text-sm text-gray-700 dark:text-gray-300',
                  'placeholder-gray-400 dark:placeholder-gray-500',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500/20'
                )}
                autoFocus
              />
            </div>
          </form>
        </div>
      )}
    </header>
  );
}

/**
 * NotificationItem Component
 */
function NotificationItem({ notification }: { notification: Notification }) {
  const content = (
    <div
      className={cn(
        'px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer',
        !notification.read && 'bg-primary-50/50 dark:bg-primary-900/10'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-2 h-2 mt-2 rounded-full flex-shrink-0',
          notification.read ? 'bg-gray-300' : 'bg-primary-500'
        )} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {notification.title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {notification.timestamp.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );

  return notification.href ? (
    <Link href={notification.href}>{content}</Link>
  ) : (
    content
  );
}

export default TopNav;
