'use client';

/**
 * LiveProjectFeed — Real-time activity feed
 *
 * A scrollable list of project activity items that updates live.
 * New items animate in from the top. Each item shows an icon,
 * actor, action description, and relative timestamp.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  ClipboardList,
  Gavel,
  DollarSign,
  Camera,
  CheckCircle2,
  Flag,
  MessageSquare,
  Activity,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../utils';

// ── Types ────────────────────────────────────────────────────

export interface FeedItem {
  id: string;
  actorName: string;
  actorAvatar?: string;
  action: string;
  description: string;
  resourceType: string;
  resourceId: string;
  timestamp: string;
  type: 'estimate' | 'order' | 'bid' | 'budget' | 'photo' | 'task' | 'milestone' | 'message' | 'activity' | 'system';
}

export interface LiveProjectFeedProps {
  items: FeedItem[];
  onItemClick?: (item: FeedItem) => void;
  maxItems?: number;
  compact?: boolean;
  showAvatar?: boolean;
  emptyMessage?: string;
  className?: string;
}

// ── Icon & Color Mapping ─────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  estimate: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
  order: { icon: ClipboardList, color: 'text-purple-600', bg: 'bg-purple-100' },
  bid: { icon: Gavel, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  budget: { icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
  photo: { icon: Camera, color: 'text-pink-600', bg: 'bg-pink-100' },
  task: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  milestone: { icon: Flag, color: 'text-amber-600', bg: 'bg-amber-100' },
  message: { icon: MessageSquare, color: 'text-sky-600', bg: 'bg-sky-100' },
  activity: { icon: Activity, color: 'text-gray-600', bg: 'bg-gray-100' },
  system: { icon: Zap, color: 'text-orange-600', bg: 'bg-orange-100' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ── Component ────────────────────────────────────────────────

export function LiveProjectFeed({
  items,
  onItemClick,
  maxItems = 50,
  compact = false,
  showAvatar = true,
  emptyMessage = 'No activity yet',
  className,
}: LiveProjectFeedProps) {
  const visibleItems = items.slice(0, maxItems);

  if (visibleItems.length === 0) {
    return (
      <div className={cn('py-8 text-center', className)}>
        <Activity className="mx-auto h-8 w-8 text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('overflow-y-auto', className)}>
      <AnimatePresence initial={false}>
        {visibleItems.map((item, index) => {
          const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.activity;
          const Icon = config.icon;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
              transition={{ duration: 0.2, delay: index === 0 ? 0 : 0 }}
              className={cn(
                'flex items-start gap-3 border-b border-gray-50 transition-colors',
                compact ? 'px-3 py-2' : 'px-4 py-3',
                onItemClick && 'cursor-pointer hover:bg-gray-50'
              )}
              onClick={() => onItemClick?.(item)}
            >
              {/* Avatar or Type Icon */}
              {showAvatar && item.actorAvatar ? (
                <img
                  src={item.actorAvatar}
                  alt={item.actorName}
                  className={cn(
                    'rounded-full object-cover flex-shrink-0',
                    compact ? 'h-6 w-6' : 'h-8 w-8'
                  )}
                />
              ) : (
                <div
                  className={cn(
                    'flex-shrink-0 rounded-full flex items-center justify-center',
                    config.bg,
                    compact ? 'h-6 w-6' : 'h-8 w-8'
                  )}
                >
                  <Icon className={cn(config.color, compact ? 'h-3 w-3' : 'h-4 w-4')} />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={cn('text-gray-900 leading-snug', compact ? 'text-xs' : 'text-sm')}>
                  <span className="font-medium">{item.actorName}</span>{' '}
                  <span className="text-gray-600">{item.action}</span>
                </p>
                {!compact && item.description && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
                )}
              </div>

              {/* Timestamp */}
              <span className={cn('flex-shrink-0 text-gray-400', compact ? 'text-[10px]' : 'text-xs')}>
                {timeAgo(item.timestamp)}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
