"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePresence = usePresence;
/**
 * usePresence — Track who's online in a channel
 *
 * Uses Supabase Realtime Presence to show which users are currently
 * viewing a project, page, or channel. Returns a live-updating list
 * of online users.
 *
 * Usage:
 *   import { supabase } from '@kealee/auth';
 *   import { usePresence } from '@kealee/realtime';
 *
 *   const { onlineUsers, isConnected } = usePresence(
 *     supabase,
 *     `project:${projectId}`,
 *     { userId: user.id, name: user.name, role: 'PM' }
 *   );
 *
 *   // onlineUsers: [{ userId, name, role, lastSeen, status }]
 */
const react_1 = require("react");
function usePresence(supabaseClient, channelName, userInfo) {
    const [onlineUsers, setOnlineUsers] = (0, react_1.useState)([]);
    const [isConnected, setIsConnected] = (0, react_1.useState)(false);
    const channelRef = (0, react_1.useRef)(null);
    // Memoize userInfo identity to prevent unnecessary resubscriptions
    const userInfoId = userInfo?.userId;
    (0, react_1.useEffect)(() => {
        if (!channelName || !userInfo || !supabaseClient)
            return;
        const presenceChannelName = `presence:${channelName}`;
        const channel = supabaseClient.channel(presenceChannelName, {
            config: {
                presence: { key: userInfo.userId },
            },
        });
        channel
            .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            const users = [];
            for (const key in state) {
                const presences = state[key];
                if (presences && presences.length > 0) {
                    // Take the most recent presence for each user
                    const presence = presences[0];
                    users.push({
                        userId: presence.userId || key,
                        name: presence.name || 'Unknown',
                        avatar: presence.avatar,
                        role: presence.role,
                        lastSeen: presence.lastSeen || new Date().toISOString(),
                        status: presence.status || 'online',
                    });
                }
            }
            setOnlineUsers(users);
        })
            .on('presence', { event: 'join' }, () => {
            // Sync event handles the state update
        })
            .on('presence', { event: 'leave' }, () => {
            // Sync event handles the state update
        })
            .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                setIsConnected(true);
                // Track this user's presence
                await channel.track({
                    userId: userInfo.userId,
                    name: userInfo.name,
                    avatar: userInfo.avatar,
                    role: userInfo.role,
                    status: userInfo.status || 'online',
                    lastSeen: new Date().toISOString(),
                });
            }
            else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                setIsConnected(false);
            }
        });
        channelRef.current = channel;
        return () => {
            channel.untrack().catch(() => { });
            supabaseClient.removeChannel(channel);
            channelRef.current = null;
            setIsConnected(false);
            setOnlineUsers([]);
        };
    }, [supabaseClient, channelName, userInfoId]);
    return (0, react_1.useMemo)(() => ({ onlineUsers, isConnected }), [onlineUsers, isConnected]);
}
