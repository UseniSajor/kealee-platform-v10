/**
 * Platform Presence Tracking
 *
 * Extends @kealee/realtime with higher-level presence concepts:
 * - Track which users are active on the platform
 * - Track what page each user is currently viewing
 * - Provide PM-facing insights ("Client is viewing their dashboard")
 * - Provide admin-facing stats (active users by role, peak times)
 *
 * Uses Supabase Realtime Presence (included in plan, zero cost).
 *
 * Server usage:
 *   import { trackUserPresence, getActiveUsers } from '@kealee/realtime/presence';
 *
 * Client usage:
 *   import { usePlatformPresence } from '@kealee/realtime';
 */

import type { PresenceUserInfo } from './events';

// ============================================================================
// TYPES
// ============================================================================

export interface PlatformPresenceInfo extends PresenceUserInfo {
  /** The page/route the user is currently viewing */
  currentPage?: string;
  /** Friendly description of what they're doing */
  activity?: string;
  /** The project they're viewing (if applicable) */
  projectId?: string;
  /** Their organization */
  orgId?: string;
}

export interface PresenceInsight {
  userId: string;
  userName: string;
  role: string;
  activity: string;
  /** Actionable insight for PM/admin */
  insight: string;
  /** Priority: how useful this insight is right now */
  priority: 'low' | 'medium' | 'high';
}

export interface PresenceStats {
  totalOnline: number;
  byRole: Array<{ role: string; count: number }>;
  recentlyActive: PlatformPresenceInfo[];
}

// ============================================================================
// CHANNEL NAMES
// ============================================================================

/** Global platform presence channel */
export const PLATFORM_PRESENCE_CHANNEL = 'platform:presence';

/** Project-specific presence channel */
export function projectPresenceChannel(projectId: string): string {
  return `project:${projectId}`;
}

// ============================================================================
// ACTIVITY DESCRIPTIONS
// ============================================================================

/**
 * Infer a friendly activity description from the current page route
 */
export function describeActivity(page: string, role?: string): string {
  if (!page) return 'Active on platform';

  // Project pages
  if (page.includes('/project/') && page.includes('/budget')) return 'Reviewing project budget';
  if (page.includes('/project/') && page.includes('/timeline')) return 'Viewing project timeline';
  if (page.includes('/project/') && page.includes('/documents')) return 'Browsing project documents';
  if (page.includes('/project/') && page.includes('/photos')) return 'Viewing project photos';
  if (page.includes('/project/') && page.includes('/contractors')) return 'Reviewing contractors';
  if (page.includes('/project/') || page.includes('/overview')) return 'Viewing project dashboard';

  // PM pages
  if (page.includes('/analytics')) return 'Reviewing analytics';
  if (page.includes('/work-queue')) return 'Managing work queue';
  if (page.includes('/pipeline')) return 'Managing sales pipeline';
  if (page.includes('/field-status')) return 'Checking field status';
  if (page.includes('/reports')) return 'Generating reports';
  if (page.includes('/communication')) return 'In communication hub';

  // Marketplace pages
  if (page.includes('/leads')) return 'Browsing leads';
  if (page.includes('/bids') || page.includes('/bid')) return 'Working on bids';

  // Admin pages
  if (page.includes('/admin')) return 'In admin dashboard';

  // Dashboard
  if (page === '/' || page.includes('/dashboard')) return 'On dashboard';

  return 'Active on platform';
}

/**
 * Generate actionable insights from presence data
 */
export function generateInsights(
  onlineUsers: PlatformPresenceInfo[],
  viewerRole?: string
): PresenceInsight[] {
  const insights: PresenceInsight[] = [];

  for (const user of onlineUsers) {
    if (!user.role || !user.currentPage) continue;

    // Client is viewing their project → good time to send update
    if (user.role === 'CLIENT' || user.role === 'PROJECT_OWNER') {
      if (user.currentPage.includes('/project/') || user.currentPage.includes('/dashboard')) {
        insights.push({
          userId: user.userId,
          userName: user.name,
          role: user.role,
          activity: user.activity || describeActivity(user.currentPage, user.role),
          insight: `${user.name} is viewing their project — good time to send an update`,
          priority: 'high',
        });
      }
    }

    // Contractor is online → send urgent messages now
    if (user.role === 'CONTRACTOR') {
      insights.push({
        userId: user.userId,
        userName: user.name,
        role: user.role,
        activity: user.activity || describeActivity(user.currentPage, user.role),
        insight: `${user.name} is online — send any urgent messages now`,
        priority: 'medium',
      });
    }
  }

  return insights.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });
}

/**
 * Calculate presence statistics from a list of online users
 */
export function calculatePresenceStats(users: PlatformPresenceInfo[]): PresenceStats {
  const roleMap = new Map<string, number>();
  users.forEach(u => {
    const role = u.role || 'UNKNOWN';
    roleMap.set(role, (roleMap.get(role) || 0) + 1);
  });

  return {
    totalOnline: users.length,
    byRole: Array.from(roleMap.entries())
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count),
    recentlyActive: users
      .sort((a, b) => {
        const aTime = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
        const bTime = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 20),
  };
}
