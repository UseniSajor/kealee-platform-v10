'use client';

/**
 * useUserChannel — Subscribe to personal real-time events
 *
 * Connects to the `user:{userId}` Supabase Broadcast channel.
 * Powers: notification bell, job progress, personal alerts.
 *
 * Usage:
 *   import { supabase } from '@kealee/auth';
 *   import { useUserChannel } from '@kealee/realtime';
 *
 *   useUserChannel(supabase, currentUser.id, {
 *     onNotification: (data) => addNotification(data),
 *     onJobCompleted: (data) => toast.success(`Job ${data.jobType} done!`),
 *     onDecisionNeeded: (data) => showDecisionCard(data),
 *   });
 */

import { useEffect, useRef } from 'react';
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type {
  OrderEventPayload,
  JobEventPayload,
  CommunicationEventPayload,
  PaymentEventPayload,
  SystemEventPayload,
} from '../events';

export interface UserChannelHandlers {
  // Order assigned to this user
  onOrderAssigned?: (payload: OrderEventPayload) => void;

  // Job events (for jobs this user triggered)
  onJobCompleted?: (payload: JobEventPayload) => void;
  onJobFailed?: (payload: JobEventPayload) => void;
  onJobProgress?: (payload: JobEventPayload) => void;

  // Messages / decisions directed at this user
  onMessageReceived?: (payload: CommunicationEventPayload) => void;
  onDecisionNeeded?: (payload: CommunicationEventPayload) => void;

  // Payment events for this user (e.g. contractor payouts)
  onPayoutSent?: (payload: PaymentEventPayload) => void;

  // System-wide alerts (maintenance, etc.)
  onSystemAlert?: (payload: SystemEventPayload) => void;

  // Catch-all — useful for generic notification handling
  onAnyEvent?: (event: string, payload: unknown) => void;
}

export function useUserChannel(
  supabaseClient: SupabaseClient,
  userId: string | null | undefined,
  handlers: UserChannelHandlers
): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!userId || !supabaseClient) return;

    const channelName = `user:${userId}`;

    const channel: RealtimeChannel = supabaseClient
      .channel(channelName)
      .on('broadcast', { event: '*' }, (message) => {
        const { event, payload } = message as unknown as { event: string; payload: any };
        if (!event || !payload) return;

        const h = handlersRef.current;

        // Always call catch-all
        h.onAnyEvent?.(event, payload);

        // Route to specific handlers
        switch (event) {
          case 'order.assigned':
            h.onOrderAssigned?.(payload);
            break;
          case 'job.completed':
            h.onJobCompleted?.(payload);
            break;
          case 'job.failed':
            h.onJobFailed?.(payload);
            break;
          case 'job.progress':
            h.onJobProgress?.(payload);
            break;
          case 'message.received':
            h.onMessageReceived?.(payload);
            break;
          case 'decision.needed':
            h.onDecisionNeeded?.(payload);
            break;
          case 'payout.sent':
            h.onPayoutSent?.(payload);
            break;
          case 'system.maintenance':
          case 'system.announcement':
          case 'system.alert':
            h.onSystemAlert?.(payload);
            break;
        }
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [supabaseClient, userId]);
}
