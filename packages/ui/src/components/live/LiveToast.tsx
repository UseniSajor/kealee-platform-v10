'use client';

/**
 * LiveToast — Real-time event toast container
 *
 * Displays toast notifications for real-time events. Toasts slide in
 * from the corner, auto-dismiss after a configurable duration, and
 * support click-through actions (e.g., navigate to detail page).
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../utils';

// ── Types ────────────────────────────────────────────────────

export interface LiveToastEvent {
  id: string;
  title: string;
  message?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  source?: string;
  actionUrl?: string;
  actionLabel?: string;
  duration?: number;
  timestamp: string;
}

export interface LiveToastProps {
  events: LiveToastEvent[];
  onDismiss?: (id: string) => void;
  onAction?: (event: LiveToastEvent) => void;
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  maxVisible?: number;
  className?: string;
}

// ── Config ───────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: LucideIcon; color: string; border: string; bg: string }> = {
  info: { icon: Info, color: 'text-blue-500', border: 'border-blue-200', bg: 'bg-blue-50' },
  success: { icon: CheckCircle2, color: 'text-green-500', border: 'border-green-200', bg: 'bg-green-50' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', border: 'border-amber-200', bg: 'bg-amber-50' },
  error: { icon: AlertCircle, color: 'text-red-500', border: 'border-red-200', bg: 'bg-red-50' },
};

const POSITION_CLASSES: Record<string, string> = {
  'top-right': 'top-4 right-4',
  'bottom-right': 'bottom-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-left': 'bottom-4 left-4',
};

const SLIDE_ORIGIN: Record<string, { initial: Record<string, number>; exit: Record<string, number> }> = {
  'top-right': { initial: { x: 100, opacity: 0 }, exit: { x: 100, opacity: 0 } },
  'bottom-right': { initial: { x: 100, opacity: 0 }, exit: { x: 100, opacity: 0 } },
  'top-left': { initial: { x: -100, opacity: 0 }, exit: { x: -100, opacity: 0 } },
  'bottom-left': { initial: { x: -100, opacity: 0 }, exit: { x: -100, opacity: 0 } },
};

const DEFAULT_DURATION = 5000;

// ── Auto-Dismiss Hook ────────────────────────────────────────

function useAutoDismiss(
  events: LiveToastEvent[],
  onDismiss?: (id: string) => void
) {
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (!onDismiss) return;

    for (const event of events) {
      const duration = event.duration ?? DEFAULT_DURATION;
      if (duration <= 0) continue;

      if (!timersRef.current.has(event.id)) {
        const timer = setTimeout(() => {
          onDismiss(event.id);
          timersRef.current.delete(event.id);
        }, duration);
        timersRef.current.set(event.id, timer);
      }
    }

    // Cleanup timers for removed events
    const currentIds = new Set(events.map((e) => e.id));
    for (const [id, timer] of timersRef.current) {
      if (!currentIds.has(id)) {
        clearTimeout(timer);
        timersRef.current.delete(id);
      }
    }

    return () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer);
      }
      timersRef.current.clear();
    };
  }, [events, onDismiss]);
}

// ── Component ────────────────────────────────────────────────

export function LiveToast({
  events,
  onDismiss,
  onAction,
  position = 'bottom-right',
  maxVisible = 5,
  className,
}: LiveToastProps) {
  useAutoDismiss(events, onDismiss);

  const visibleEvents = events.slice(0, maxVisible);
  const slideConfig = SLIDE_ORIGIN[position] || SLIDE_ORIGIN['bottom-right'];
  const isBottom = position.startsWith('bottom');

  return (
    <div
      className={cn(
        'fixed z-[100] flex flex-col gap-2 pointer-events-none w-96 max-w-[calc(100vw-2rem)]',
        POSITION_CLASSES[position],
        isBottom ? 'flex-col-reverse' : 'flex-col',
        className
      )}
    >
      <AnimatePresence initial={false}>
        {visibleEvents.map((event) => {
          const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.info;
          const Icon = config.icon;

          return (
            <motion.div
              key={event.id}
              layout
              initial={slideConfig.initial}
              animate={{ x: 0, opacity: 1 }}
              exit={slideConfig.exit}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={cn(
                'pointer-events-auto rounded-xl border bg-white shadow-lg overflow-hidden',
                config.border
              )}
            >
              <div className="flex items-start gap-3 p-3">
                {/* Icon */}
                <div className={cn('flex-shrink-0 mt-0.5 rounded-full p-1', config.bg)}>
                  <Icon className={cn('h-4 w-4', config.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 leading-snug">
                    {event.title}
                  </p>
                  {event.message && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {event.message}
                    </p>
                  )}

                  {/* Footer: source + action */}
                  <div className="flex items-center gap-2 mt-1.5">
                    {event.source && (
                      <span className="text-[10px] text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
                        {event.source}
                      </span>
                    )}
                    {(event.actionUrl || event.actionLabel) && onAction && (
                      <button
                        onClick={() => onAction(event)}
                        className="inline-flex items-center gap-0.5 text-[11px] font-medium text-blue-600 hover:text-blue-800"
                      >
                        {event.actionLabel || 'View'}
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Dismiss button */}
                {onDismiss && (
                  <button
                    onClick={() => onDismiss(event.id)}
                    className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Dismiss"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Auto-dismiss progress bar */}
              {event.duration !== 0 && (
                <motion.div
                  className={cn('h-0.5', config.color.replace('text-', 'bg-'))}
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{
                    duration: (event.duration ?? DEFAULT_DURATION) / 1000,
                    ease: 'linear',
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
