'use client';

/**
 * LiveNotificationBell — Real-time notification bell with dropdown
 *
 * Shows an unread count badge that updates instantly. Clicking opens
 * a dropdown with recent notifications that slide in with animation.
 * Fully presentation-only — accepts data and callbacks as props.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Check,
  CheckCheck,
  X,
  FileText,
  ClipboardList,
  Gavel,
  DollarSign,
  AlertTriangle,
  MessageSquare,
  Info,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../utils';

// ── Types ────────────────────────────────────────────────────

export interface LiveNotification {
  id: string;
  title: string;
  message?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  source?: string;
  eventType?: string;
}

export interface LiveNotificationBellProps {
  notifications: LiveNotification[];
  unreadCount: number;
  onNotificationClick?: (notification: LiveNotification) => void;
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onClearAll?: () => void;
  maxVisible?: number;
  className?: string;
}

// ── Icon Mapping ─────────────────────────────────────────────

const TYPE_ICONS: Record<string, LucideIcon> = {
  info: Info,
  success: Check,
  warning: AlertTriangle,
  error: X,
};

const EVENT_ICONS: Record<string, LucideIcon> = {
  estimate: FileText,
  order: ClipboardList,
  bid: Gavel,
  budget: DollarSign,
  message: MessageSquare,
  decision: AlertTriangle,
};

const TYPE_COLORS: Record<string, string> = {
  info: 'bg-blue-100 text-blue-600',
  success: 'bg-green-100 text-green-600',
  warning: 'bg-yellow-100 text-yellow-600',
  error: 'bg-red-100 text-red-600',
};

// ── Helpers ──────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function getIcon(notification: LiveNotification): LucideIcon {
  if (notification.eventType) {
    const prefix = notification.eventType.split('.')[0];
    if (EVENT_ICONS[prefix]) return EVENT_ICONS[prefix];
  }
  return TYPE_ICONS[notification.type] || Bell;
}

// ── Component ────────────────────────────────────────────────

export function LiveNotificationBell({
  notifications,
  unreadCount,
  onNotificationClick,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  maxVisible = 8,
  className,
}: LiveNotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const visibleNotifications = notifications.slice(0, maxVisible);

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-5 w-5 text-gray-600" />

        {/* Unread badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-96 max-h-[480px] rounded-xl bg-white shadow-xl border border-gray-200 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && onMarkAllRead && (
                  <button
                    onClick={onMarkAllRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <CheckCheck className="h-3.5 w-3.5 inline mr-1" />
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto max-h-[380px]">
              {visibleNotifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No notifications</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {visibleNotifications.map((notification, index) => {
                    const Icon = getIcon(notification);

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={cn(
                          'flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-gray-50 hover:bg-gray-50 transition-colors',
                          !notification.read && 'bg-blue-50/40'
                        )}
                        onClick={() => onNotificationClick?.(notification)}
                      >
                        {/* Icon */}
                        <div className={cn('flex-shrink-0 mt-0.5 rounded-full p-1.5', TYPE_COLORS[notification.type])}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm text-gray-900 leading-snug', !notification.read && 'font-medium')}>
                            {notification.title}
                          </p>
                          {notification.message && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-gray-400">
                              {timeAgo(notification.timestamp)}
                            </span>
                            {notification.source && (
                              <span className="text-[10px] text-gray-400 bg-gray-100 rounded px-1">
                                {notification.source}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Unread dot + mark-read */}
                        <div className="flex-shrink-0 flex items-center gap-1">
                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                          )}
                          {!notification.read && onMarkRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkRead(notification.id);
                              }}
                              className="p-1 rounded hover:bg-gray-200 text-gray-400"
                              aria-label="Mark as read"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {notifications.length > maxVisible && (
              <div className="px-4 py-2 border-t border-gray-100 text-center">
                <span className="text-xs text-gray-500">
                  {notifications.length - maxVisible} more notifications
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
