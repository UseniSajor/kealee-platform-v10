'use client';

/**
 * OnlineIndicator — Shows who's currently online
 *
 * A small pulsing dot with a hover tooltip listing online users.
 * Designed for embedding in project headers, sidebars, or
 * anywhere presence awareness is needed.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils';

// ── Types ────────────────────────────────────────────────────

export interface OnlineUser {
  userId: string;
  name: string;
  avatar?: string;
  role?: string;
  status?: 'online' | 'on-site' | 'away';
}

export interface OnlineIndicatorProps {
  /** List of currently online users */
  users: OnlineUser[];
  /** Max number of user avatars/names to display in tooltip (default: 5) */
  maxDisplay?: number;
  /** Dot size */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show the count next to the dot */
  showCount?: boolean;
  /** Whether to show user names inline (not in tooltip) */
  showNames?: boolean;
  className?: string;
}

// ── Size Config ──────────────────────────────────────────────

const DOT_SIZE: Record<string, string> = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
};

const PULSE_SIZE: Record<string, string> = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
};

const STATUS_COLORS: Record<string, string> = {
  online: 'bg-green-500',
  'on-site': 'bg-blue-500',
  away: 'bg-yellow-500',
};

const STATUS_LABELS: Record<string, string> = {
  online: 'Online',
  'on-site': 'On-site',
  away: 'Away',
};

// ── Component ────────────────────────────────────────────────

export function OnlineIndicator({
  users,
  maxDisplay = 5,
  size = 'md',
  showCount = false,
  showNames = false,
  className,
}: OnlineIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const hasUsers = users.length > 0;
  const visibleUsers = users.slice(0, maxDisplay);
  const remainingCount = Math.max(0, users.length - maxDisplay);

  return (
    <div
      className={cn('relative inline-flex items-center gap-1.5', className)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Dot */}
      <span className="relative inline-flex">
        <span
          className={cn(
            'rounded-full',
            DOT_SIZE[size],
            hasUsers ? 'bg-green-500' : 'bg-gray-300'
          )}
        />
        {/* Pulse animation when users are online */}
        {hasUsers && (
          <span
            className={cn(
              'absolute inline-flex rounded-full bg-green-400 opacity-75 animate-ping',
              PULSE_SIZE[size]
            )}
          />
        )}
      </span>

      {/* Count */}
      {showCount && hasUsers && (
        <span className="text-xs font-medium text-gray-600">{users.length}</span>
      )}

      {/* Inline names */}
      {showNames && hasUsers && (
        <span className="text-xs text-gray-600">
          {visibleUsers.map((u) => u.name.split(' ')[0]).join(', ')}
          {remainingCount > 0 && ` +${remainingCount}`}
        </span>
      )}

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && hasUsers && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50"
          >
            <div className="bg-gray-900 text-white rounded-lg shadow-lg px-3 py-2 min-w-[180px] max-w-[260px]">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                {users.length} online
              </p>

              <div className="space-y-1.5">
                {visibleUsers.map((user) => (
                  <div key={user.userId} className="flex items-center gap-2">
                    {/* Avatar or initials */}
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-gray-700 flex items-center justify-center text-[9px] font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Name */}
                    <span className="text-xs font-medium flex-1 truncate">
                      {user.name}
                    </span>

                    {/* Role */}
                    {user.role && (
                      <span className="text-[10px] text-gray-400">{user.role}</span>
                    )}

                    {/* Status badge */}
                    {user.status && user.status !== 'online' && (
                      <span
                        className={cn(
                          'text-[9px] font-medium px-1 rounded',
                          user.status === 'on-site'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-yellow-500/20 text-yellow-300'
                        )}
                      >
                        {STATUS_LABELS[user.status]}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {remainingCount > 0 && (
                <p className="text-[10px] text-gray-400 mt-1.5">
                  +{remainingCount} more
                </p>
              )}

              {/* Tooltip arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state tooltip */}
      <AnimatePresence>
        {showTooltip && !hasUsers && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50"
          >
            <div className="bg-gray-900 text-white rounded-lg shadow-lg px-3 py-2 whitespace-nowrap">
              <span className="text-xs">No one else online</span>
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
