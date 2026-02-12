'use client';

/**
 * CrewStatus — On-site crew indicator with GPS-verified check-in status.
 *
 * Compact mode: Shows "N on site" with pulsing green dot (like OnlineIndicator).
 * Full mode: Lists crew members with arrival time and hours on site.
 */

import React, { useEffect, useState } from 'react';
import { cn } from '../../utils';

// ============================================================================
// TYPES
// ============================================================================

interface OnSiteCrewMember {
  userId: string;
  userName: string;
  arrivedAt: string;
  hoursOnSite: number;
  verified: boolean;
}

interface CrewStatusProps {
  projectId: string;
  compact?: boolean;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatHours(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CrewStatus({ projectId, compact = false, className }: CrewStatusProps) {
  const [crew, setCrew] = useState<OnSiteCrewMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCrew() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/scheduler/projects/${projectId}/crew/on-site`);
        if (!res.ok) return;
        const json = await res.json();
        setCrew(json.onSite || []);
      } catch {
        // Silently fail — crew status is non-critical
      } finally {
        setLoading(false);
      }
    }

    if (projectId) {
      fetchCrew();
      // Poll every 60 seconds for updates
      const interval = setInterval(fetchCrew, 60_000);
      return () => clearInterval(interval);
    }
  }, [projectId]);

  const count = crew.length;
  const verifiedCount = crew.filter(c => c.verified).length;

  // ── Compact Mode ──
  if (compact) {
    return (
      <div className={cn('inline-flex items-center gap-1.5', className)}>
        {/* Pulsing dot (like OnlineIndicator) */}
        <span className="relative flex h-2.5 w-2.5">
          {count > 0 && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          )}
          <span
            className={cn(
              'relative inline-flex h-2.5 w-2.5 rounded-full',
              count > 0 ? 'bg-green-500' : 'bg-neutral-300'
            )}
          />
        </span>

        <span className="text-xs text-neutral-600">
          {loading ? '...' : count > 0 ? `${count} on site` : 'No crew on site'}
        </span>
      </div>
    );
  }

  // ── Full Mode ──
  return (
    <div className={cn('rounded-xl border bg-white', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            {count > 0 && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            )}
            <span
              className={cn(
                'relative inline-flex h-2.5 w-2.5 rounded-full',
                count > 0 ? 'bg-green-500' : 'bg-neutral-300'
              )}
            />
          </span>
          <h3 className="text-sm font-semibold text-neutral-900">Crew On Site</h3>
        </div>
        <span className="text-xs text-neutral-500">
          {count} member{count !== 1 ? 's' : ''}
          {verifiedCount > 0 && verifiedCount < count && ` (${verifiedCount} verified)`}
        </span>
      </div>

      {/* Crew List */}
      {loading ? (
        <div className="px-4 pb-3 space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-200" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-24 animate-pulse rounded bg-neutral-200" />
                <div className="h-2.5 w-16 animate-pulse rounded bg-neutral-200" />
              </div>
            </div>
          ))}
        </div>
      ) : count === 0 ? (
        <div className="px-4 pb-3">
          <p className="text-xs text-neutral-400">No crew members currently on site.</p>
        </div>
      ) : (
        <div className="px-4 pb-3 space-y-2">
          {crew.map((member) => (
            <div
              key={member.userId}
              className="flex items-center gap-3 rounded-lg border border-neutral-100 bg-neutral-50/50 px-3 py-2"
            >
              {/* Avatar */}
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium',
                  member.verified
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                )}
              >
                {getInitials(member.userName)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-neutral-900 truncate">
                    {member.userName}
                  </span>
                  {member.verified && (
                    <span className="text-[9px] bg-green-100 text-green-700 px-1 rounded font-medium">
                      GPS
                    </span>
                  )}
                  {!member.verified && (
                    <span className="text-[9px] bg-amber-100 text-amber-700 px-1 rounded font-medium">
                      Unverified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                  <span>Arrived {formatTime(member.arrivedAt)}</span>
                  <span className="text-neutral-300">|</span>
                  <span className="font-medium text-neutral-700">
                    {formatHours(member.hoursOnSite)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
