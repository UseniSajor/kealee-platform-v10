'use client';

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

import { useEffect, useState, useRef, useMemo } from 'react';
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { PresenceUserInfo } from '../events';

export interface UsePresenceReturn {
  /** List of currently online users (includes self) */
  onlineUsers: PresenceUserInfo[];
  /** Whether the presence channel is connected */
  isConnected: boolean;
}

export function usePresence(
  supabaseClient: SupabaseClient,
  channelName: string | null | undefined,
  userInfo: PresenceUserInfo | null
): UsePresenceReturn {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUserInfo[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Memoize userInfo identity to prevent unnecessary resubscriptions
  const userInfoId = userInfo?.userId;

  useEffect(() => {
    if (!channelName || !userInfo || !supabaseClient) return;

    const presenceChannelName = `presence:${channelName}`;

    const channel = supabaseClient.channel(presenceChannelName, {
      config: {
        presence: { key: userInfo.userId },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: PresenceUserInfo[] = [];

        for (const key in state) {
          const presences = state[key];
          if (presences && presences.length > 0) {
            // Take the most recent presence for each user
            const presence = presences[0] as unknown as Record<string, unknown>;
            users.push({
              userId: (presence.userId as string) || key,
              name: (presence.name as string) || 'Unknown',
              avatar: presence.avatar as string | undefined,
              role: presence.role as string | undefined,
              lastSeen: (presence.lastSeen as string) || new Date().toISOString(),
              status: (presence.status as PresenceUserInfo['status']) || 'online',
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
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      channel.untrack().catch(() => {});
      supabaseClient.removeChannel(channel);
      channelRef.current = null;
      setIsConnected(false);
      setOnlineUsers([]);
    };
  }, [supabaseClient, channelName, userInfoId]);

  return useMemo(() => ({ onlineUsers, isConnected }), [onlineUsers, isConnected]);
}
