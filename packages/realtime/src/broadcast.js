"use strict";
/**
 * Server-Side Broadcast Functions
 *
 * Uses the Supabase admin client (SERVICE_ROLE_KEY) to send real-time
 * messages to channels. All broadcasts are fire-and-forget — callers
 * should wrap in .catch() to avoid blocking core operations.
 *
 * Pattern: create channel → send broadcast → remove channel (stateless).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastToUser = broadcastToUser;
exports.broadcastToProject = broadcastToProject;
exports.broadcastToOrg = broadcastToOrg;
exports.broadcastSystemAlert = broadcastSystemAlert;
const supabase_js_1 = require("@supabase/supabase-js");
// ── Admin Client Singleton ───────────────────────────────────
let adminClient = null;
function getAdminClient() {
    if (adminClient)
        return adminClient;
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for realtime broadcasts. ' +
            'Set these environment variables in your server configuration.');
    }
    adminClient = (0, supabase_js_1.createClient)(url, key);
    return adminClient;
}
// ── Internal Broadcast ───────────────────────────────────────
async function broadcast(channelName, event) {
    try {
        const client = getAdminClient();
        const channel = client.channel(channelName);
        await channel.send({
            type: 'broadcast',
            event: event.event,
            payload: {
                ...event,
                timestamp: event.timestamp || new Date().toISOString(),
            },
        });
        // Remove the channel immediately — server only sends, doesn't listen
        await client.removeChannel(channel);
    }
    catch (err) {
        // Log but don't throw — broadcasts should never crash callers
        console.error(`[Realtime] Broadcast to ${channelName} failed:`, err);
    }
}
// ── Public Broadcast Functions ───────────────────────────────
/**
 * Send a real-time event to a specific user.
 * Channel: `user:{userId}`
 *
 * Use for: job completions, order assignments, personal notifications,
 * decision-needed alerts, payout confirmations.
 */
async function broadcastToUser(userId, event) {
    if (!userId)
        return;
    await broadcast(`user:${userId}`, event);
}
/**
 * Send a real-time event to all subscribers of a project.
 * Channel: `project:{projectId}`
 *
 * Use for: estimate updates, bid events, budget changes, milestone completions,
 * photo uploads, task completions, QA issues, schedule updates.
 *
 * @param options.excludeUserId - Don't trigger handlers for this user
 *   (prevents the actor from receiving their own event).
 */
async function broadcastToProject(projectId, event, options) {
    if (!projectId)
        return;
    const enriched = {
        ...event,
        payload: {
            ...event.payload,
            _excludeUserId: options?.excludeUserId,
        },
    };
    await broadcast(`project:${projectId}`, enriched);
}
/**
 * Send a real-time event to all members of an organization.
 * Channel: `org:{orgId}`
 *
 * Use for: new estimates created, bid sync complete, org-wide announcements,
 * config changes, new member joined.
 */
async function broadcastToOrg(orgId, event) {
    if (!orgId)
        return;
    await broadcast(`org:${orgId}`, event);
}
/**
 * Send a system-wide alert to all admin subscribers.
 * Channel: `system:alerts`
 *
 * Use for: maintenance windows, system degradation, circuit breaker events,
 * platform announcements.
 */
async function broadcastSystemAlert(event) {
    await broadcast('system:alerts', event);
}
