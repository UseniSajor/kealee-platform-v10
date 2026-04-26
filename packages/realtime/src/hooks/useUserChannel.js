"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUserChannel = useUserChannel;
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
const react_1 = require("react");
function useUserChannel(supabaseClient, userId, handlers) {
    const handlersRef = (0, react_1.useRef)(handlers);
    handlersRef.current = handlers;
    (0, react_1.useEffect)(() => {
        if (!userId || !supabaseClient)
            return;
        const channelName = `user:${userId}`;
        const channel = supabaseClient
            .channel(channelName)
            .on('broadcast', { event: '*' }, (message) => {
            const { event, payload } = message;
            if (!event || !payload)
                return;
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
