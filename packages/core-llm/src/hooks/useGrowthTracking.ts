/**
 * GROWTH TRACKING HOOK
 * React hook for integrating growth tracking into UI flows
 */

import { useEffect, useCallback } from 'react';
import { GrowthTracker } from '../analytics/growth-tracker';
import type { AcquisitionSource, ConversionEventType } from '@kealee/database';

interface TrackingOptions {
  source?: AcquisitionSource;
  campaign?: string;
  metadata?: Record<string, any>;
}

/**
 * Hook for tracking user acquisition
 */
export function useTrackAcquisition() {
  return useCallback(
    async (userId: string, source: AcquisitionSource, options?: TrackingOptions) => {
      try {
        // Get URL parameters for attribution
        const params = new URLSearchParams(window.location.search);
        const gclid = params.get('gclid') || undefined;
        const fbclid = params.get('fbclid') || undefined;
        const utmSource = params.get('utm_source') || undefined;
        const utmMedium = params.get('utm_medium') || undefined;
        const utmCampaign = params.get('utm_campaign') || undefined;
        const utmContent = params.get('utm_content') || undefined;

        await GrowthTracker.trackUserAcquisition(userId, source, {
          campaign: options?.campaign,
          gclid,
          fbclid,
          utmSource,
          utmMedium,
          utmCampaign,
          utmContent,
          metadata: {
            ...options?.metadata,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
          },
        });
      } catch (error) {
        console.error('Failed to track acquisition:', error);
      }
    },
    []
  );
}

/**
 * Hook for tracking conversion events
 */
export function useTrackConversion() {
  return useCallback(
    async (
      userId: string,
      eventType: ConversionEventType,
      projectId?: string,
      projectValue?: number,
      metadata?: Record<string, any>
    ) => {
      try {
        await GrowthTracker.trackConversionEvent(
          userId,
          eventType,
          projectId,
          projectValue,
          {
            ...metadata,
            timestamp: new Date().toISOString(),
          }
        );
      } catch (error) {
        console.error('Failed to track conversion:', error);
      }
    },
    []
  );
}

/**
 * Hook for automatic page view tracking
 */
export function useTrackPageView(userId?: string, source?: AcquisitionSource) {
  useEffect(() => {
    if (!userId || !source) return;

    // Track on mount (first page view)
    const trackAcquisition = useTrackAcquisition();
    trackAcquisition(userId, source);
  }, [userId, source]);
}

export default useTrackAcquisition;
