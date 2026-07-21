'use client';

/**
 * OfflineBanner — Yellow/green banner showing offline/sync status
 *
 * Shows at the top of the viewport when:
 *  - Device is offline (yellow)
 *  - Syncing queued items (blue with progress)
 *  - Sync complete (green, fades after 3s)
 *
 * Usage:
 *   <OfflineBanner />
 */

import React from 'react';
import { useOfflineQueue } from '../../hooks/use-offline-queue';
import { cn } from '../../utils';

export interface OfflineBannerProps {
  className?: string;
}

export function OfflineBanner({ className }: OfflineBannerProps) {
  const { isOnline, pendingCount, syncStatus } = useOfflineQueue();

  // Don't render if online and no sync activity
  if (isOnline && syncStatus === 'idle' && pendingCount === 0) return null;

  return (
    <div
      className={cn(
        'fixed inset-x-0 top-0 z-[9998] flex items-center justify-center px-4 py-2 text-center text-sm font-medium transition-all duration-300',
        // Safe area for notched devices
        'pt-[max(8px,env(safe-area-inset-top))]',
        // Status-based colors
        !isOnline && 'bg-amber-400 text-amber-900',
        isOnline && syncStatus === 'syncing' && 'bg-blue-500 text-white',
        isOnline && syncStatus === 'complete' && 'bg-emerald-500 text-white',
        isOnline && syncStatus === 'error' && 'bg-red-500 text-white',
        isOnline && syncStatus === 'idle' && pendingCount > 0 && 'bg-amber-100 text-amber-800',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {!isOnline && (
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728" />
            <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
          </svg>
          <span>
            Offline — {pendingCount > 0
              ? `${pendingCount} change${pendingCount !== 1 ? 's' : ''} will sync when connected`
              : 'changes will sync when connected'}
          </span>
        </div>
      )}

      {isOnline && syncStatus === 'syncing' && (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <span>Syncing {pendingCount} item{pendingCount !== 1 ? 's' : ''}...</span>
        </div>
      )}

      {isOnline && syncStatus === 'complete' && (
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>All changes synced</span>
        </div>
      )}

      {isOnline && syncStatus === 'error' && (
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Sync failed — will retry automatically</span>
        </div>
      )}

      {isOnline && syncStatus === 'idle' && pendingCount > 0 && (
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{pendingCount} pending change{pendingCount !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}

export default OfflineBanner;
