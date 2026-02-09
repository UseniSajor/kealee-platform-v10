'use client';

/**
 * useProjectChannel — Subscribe to real-time project events
 *
 * Connects to the `project:{projectId}` Supabase Broadcast channel
 * and routes events to typed handler callbacks.
 *
 * Usage:
 *   import { supabase } from '@kealee/auth';
 *   import { useProjectChannel } from '@kealee/realtime';
 *
 *   useProjectChannel(supabase, projectId, {
 *     onEstimateCreated: (data) => refetchEstimates(),
 *     onBudgetUpdated: (data) => setBudget(data.currentSpend),
 *     onAnyEvent: (event, payload) => addToFeed(event, payload),
 *   }, { userId: currentUser.id });
 */

import { useEffect, useRef } from 'react';
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type {
  EstimateEventPayload,
  OrderEventPayload,
  BidEventPayload,
  BudgetEventPayload,
  ActivityEventPayload,
  QAEventPayload,
  PaymentEventPayload,
  ScheduleEventPayload,
  CommunicationEventPayload,
} from '../events';

export interface ProjectChannelHandlers {
  // Estimate events
  onEstimateCreated?: (payload: EstimateEventPayload) => void;
  onEstimateUpdated?: (payload: EstimateEventPayload) => void;
  onEstimateStatusChanged?: (payload: EstimateEventPayload) => void;
  onEstimateCalculated?: (payload: EstimateEventPayload) => void;
  onEstimateLocked?: (payload: EstimateEventPayload) => void;
  onEstimateUnlocked?: (payload: EstimateEventPayload) => void;

  // Order events
  onOrderCreated?: (payload: OrderEventPayload) => void;
  onOrderAssigned?: (payload: OrderEventPayload) => void;
  onOrderStarted?: (payload: OrderEventPayload) => void;
  onOrderCompleted?: (payload: OrderEventPayload) => void;

  // Bid events
  onBidSubmitted?: (payload: BidEventPayload) => void;
  onBidReceived?: (payload: BidEventPayload) => void;
  onBidAccepted?: (payload: BidEventPayload) => void;
  onBidSyncComplete?: (payload: BidEventPayload) => void;

  // Budget events
  onBudgetUpdated?: (payload: BudgetEventPayload) => void;
  onBudgetAlert?: (payload: BudgetEventPayload) => void;

  // Activity events
  onActivity?: (payload: ActivityEventPayload) => void;
  onMilestoneComplete?: (payload: ActivityEventPayload) => void;
  onTaskComplete?: (payload: ActivityEventPayload) => void;
  onPhotoUploaded?: (payload: ActivityEventPayload) => void;

  // QA events
  onQAIssue?: (payload: QAEventPayload) => void;
  onInspectionPassed?: (payload: QAEventPayload) => void;

  // Payment events
  onPaymentReceived?: (payload: PaymentEventPayload) => void;
  onEscrowFunded?: (payload: PaymentEventPayload) => void;

  // Schedule events
  onVisitScheduled?: (payload: ScheduleEventPayload) => void;
  onVisitComplete?: (payload: ScheduleEventPayload) => void;

  // Decision events
  onDecisionResolved?: (payload: CommunicationEventPayload) => void;

  // Catch-all handler
  onAnyEvent?: (event: string, payload: unknown) => void;
}

export function useProjectChannel(
  supabaseClient: SupabaseClient,
  projectId: string | null | undefined,
  handlers: ProjectChannelHandlers,
  options?: { userId?: string }
): void {
  // Store handlers in ref to avoid resubscribing when only handlers change
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const userIdRef = useRef(options?.userId);
  userIdRef.current = options?.userId;

  useEffect(() => {
    if (!projectId || !supabaseClient) return;

    const channelName = `project:${projectId}`;

    const channel: RealtimeChannel = supabaseClient
      .channel(channelName)
      .on('broadcast', { event: '*' }, (message) => {
        const { event, payload } = message as unknown as { event: string; payload: any };
        if (!event || !payload) return;

        // Filter out self-triggered events
        if (userIdRef.current && payload._excludeUserId === userIdRef.current) {
          return;
        }

        const h = handlersRef.current;

        // Always call the catch-all handler
        h.onAnyEvent?.(event, payload);

        // Route to specific handlers
        switch (event) {
          // Estimates
          case 'estimate.created': h.onEstimateCreated?.(payload); break;
          case 'estimate.updated': h.onEstimateUpdated?.(payload); break;
          case 'estimate.status_changed': h.onEstimateStatusChanged?.(payload); break;
          case 'estimate.calculated': h.onEstimateCalculated?.(payload); break;
          case 'estimate.locked': h.onEstimateLocked?.(payload); break;
          case 'estimate.unlocked': h.onEstimateUnlocked?.(payload); break;

          // Orders
          case 'order.created': h.onOrderCreated?.(payload); break;
          case 'order.assigned': h.onOrderAssigned?.(payload); break;
          case 'order.started': h.onOrderStarted?.(payload); break;
          case 'order.completed': h.onOrderCompleted?.(payload); break;

          // Bids
          case 'bid.submitted': h.onBidSubmitted?.(payload); break;
          case 'bid.received': h.onBidReceived?.(payload); break;
          case 'bid.accepted': h.onBidAccepted?.(payload); break;
          case 'bid.sync_complete': h.onBidSyncComplete?.(payload); break;

          // Budget
          case 'budget.updated': h.onBudgetUpdated?.(payload); break;
          case 'budget.threshold_warning': h.onBudgetAlert?.(payload); break;

          // Activity
          case 'activity.comment':
          case 'activity.file_upload':
          case 'activity.status_change':
            h.onActivity?.(payload);
            break;
          case 'activity.milestone':
            h.onMilestoneComplete?.(payload);
            h.onActivity?.(payload);
            break;
          case 'activity.task_complete':
            h.onTaskComplete?.(payload);
            h.onActivity?.(payload);
            break;
          case 'activity.photo_uploaded':
            h.onPhotoUploaded?.(payload);
            h.onActivity?.(payload);
            break;

          // QA
          case 'qa.issue_found': h.onQAIssue?.(payload); break;
          case 'qa.inspection_passed': h.onInspectionPassed?.(payload); break;

          // Payments
          case 'payment.received': h.onPaymentReceived?.(payload); break;
          case 'escrow.funded': h.onEscrowFunded?.(payload); break;

          // Schedule
          case 'visit.scheduled': h.onVisitScheduled?.(payload); break;
          case 'visit.complete': h.onVisitComplete?.(payload); break;

          // Decisions
          case 'decision.resolved': h.onDecisionResolved?.(payload); break;
        }
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [supabaseClient, projectId]);
}
