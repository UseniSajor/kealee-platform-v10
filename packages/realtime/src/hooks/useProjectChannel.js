"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useProjectChannel = useProjectChannel;
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
const react_1 = require("react");
function useProjectChannel(supabaseClient, projectId, handlers, options) {
    // Store handlers in ref to avoid resubscribing when only handlers change
    const handlersRef = (0, react_1.useRef)(handlers);
    handlersRef.current = handlers;
    const userIdRef = (0, react_1.useRef)(options?.userId);
    userIdRef.current = options?.userId;
    (0, react_1.useEffect)(() => {
        if (!projectId || !supabaseClient)
            return;
        const channelName = `project:${projectId}`;
        const channel = supabaseClient
            .channel(channelName)
            .on('broadcast', { event: '*' }, (message) => {
            const { event, payload } = message;
            if (!event || !payload)
                return;
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
                case 'estimate.created':
                    h.onEstimateCreated?.(payload);
                    break;
                case 'estimate.updated':
                    h.onEstimateUpdated?.(payload);
                    break;
                case 'estimate.status_changed':
                    h.onEstimateStatusChanged?.(payload);
                    break;
                case 'estimate.calculated':
                    h.onEstimateCalculated?.(payload);
                    break;
                case 'estimate.locked':
                    h.onEstimateLocked?.(payload);
                    break;
                case 'estimate.unlocked':
                    h.onEstimateUnlocked?.(payload);
                    break;
                // Orders
                case 'order.created':
                    h.onOrderCreated?.(payload);
                    break;
                case 'order.assigned':
                    h.onOrderAssigned?.(payload);
                    break;
                case 'order.started':
                    h.onOrderStarted?.(payload);
                    break;
                case 'order.completed':
                    h.onOrderCompleted?.(payload);
                    break;
                // Bids
                case 'bid.submitted':
                    h.onBidSubmitted?.(payload);
                    break;
                case 'bid.received':
                    h.onBidReceived?.(payload);
                    break;
                case 'bid.accepted':
                    h.onBidAccepted?.(payload);
                    break;
                case 'bid.sync_complete':
                    h.onBidSyncComplete?.(payload);
                    break;
                // Budget
                case 'budget.updated':
                    h.onBudgetUpdated?.(payload);
                    break;
                case 'budget.threshold_warning':
                    h.onBudgetAlert?.(payload);
                    break;
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
                case 'qa.issue_found':
                    h.onQAIssue?.(payload);
                    break;
                case 'qa.inspection_passed':
                    h.onInspectionPassed?.(payload);
                    break;
                // Payments
                case 'payment.received':
                    h.onPaymentReceived?.(payload);
                    break;
                case 'escrow.funded':
                    h.onEscrowFunded?.(payload);
                    break;
                // Schedule
                case 'visit.scheduled':
                    h.onVisitScheduled?.(payload);
                    break;
                case 'visit.complete':
                    h.onVisitComplete?.(payload);
                    break;
                // Decisions
                case 'decision.resolved':
                    h.onDecisionResolved?.(payload);
                    break;
            }
        })
            .subscribe();
        return () => {
            supabaseClient.removeChannel(channel);
        };
    }, [supabaseClient, projectId]);
}
