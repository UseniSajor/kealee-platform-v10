'use client';

/**
 * usePullToRefresh — Touch-based pull-to-refresh for mobile PWA pages
 *
 * Detects pull-down gesture on touch devices and triggers a refresh callback.
 * Shows a visual indicator during the pull and refresh phases.
 *
 * Usage:
 *   const { isRefreshing, pullProgress } = usePullToRefresh({
 *     onRefresh: async () => {
 *       await fetchData();
 *     },
 *   });
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UsePullToRefreshOptions {
  /** Callback when pull-to-refresh is triggered */
  onRefresh: () => Promise<void>;
  /** Pull distance threshold in pixels (default 80) */
  threshold?: number;
  /** Maximum pull distance in pixels (default 150) */
  maxPull?: number;
  /** Element to attach touch listeners to (default document) */
  containerRef?: React.RefObject<HTMLElement>;
  /** Disable pull-to-refresh */
  disabled?: boolean;
}

export interface UsePullToRefreshReturn {
  /** Whether refresh is in progress */
  isRefreshing: boolean;
  /** Pull progress (0 to 1) */
  pullProgress: number;
  /** Current pull distance in pixels */
  pullDistance: number;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 150,
  containerRef,
  disabled = false,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const pullingRef = useRef(false);
  const refreshingRef = useRef(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled || refreshingRef.current) return;

      // Only trigger if scrolled to top
      const scrollTop = containerRef?.current?.scrollTop ?? window.scrollY;
      if (scrollTop > 5) return;

      startYRef.current = e.touches[0].clientY;
      pullingRef.current = true;
    },
    [disabled, containerRef]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!pullingRef.current || disabled || refreshingRef.current) return;

      currentYRef.current = e.touches[0].clientY;
      const distance = Math.max(0, currentYRef.current - startYRef.current);

      if (distance > 0) {
        // Apply resistance (logarithmic)
        const dampedDistance = Math.min(
          maxPull,
          distance * 0.5
        );
        setPullDistance(dampedDistance);

        // Prevent default scrolling when pulling down
        if (dampedDistance > 10) {
          e.preventDefault();
        }
      }
    },
    [disabled, maxPull]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pullingRef.current || disabled) return;

    pullingRef.current = false;

    if (pullDistance >= threshold && !refreshingRef.current) {
      // Trigger refresh
      refreshingRef.current = true;
      setIsRefreshing(true);
      setPullDistance(threshold * 0.5); // Shrink to loading indicator size

      try {
        await onRefresh();
      } finally {
        refreshingRef.current = false;
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Spring back
      setPullDistance(0);
    }
  }, [pullDistance, threshold, disabled, onRefresh]);

  useEffect(() => {
    if (typeof window === 'undefined' || disabled) return;

    const container = containerRef?.current ?? document;
    const options: AddEventListenerOptions = { passive: false };

    container.addEventListener('touchstart', handleTouchStart as EventListener, options);
    container.addEventListener('touchmove', handleTouchMove as EventListener, options);
    container.addEventListener('touchend', handleTouchEnd as EventListener);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart as EventListener);
      container.removeEventListener('touchmove', handleTouchMove as EventListener);
      container.removeEventListener('touchend', handleTouchEnd as EventListener);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, containerRef, disabled]);

  return {
    isRefreshing,
    pullProgress: Math.min(1, pullDistance / threshold),
    pullDistance,
  };
}

export default usePullToRefresh;
