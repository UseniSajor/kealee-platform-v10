'use client';

/**
 * SiteCheckIn — Mobile-friendly GPS check-in/check-out component
 *
 * When the user taps "Check In":
 *  1. Requests GPS coordinates via navigator.geolocation
 *  2. Compares to project site coordinates
 *  3. If within 200m → marks as verified
 *  4. If outside 200m → shows override prompt
 *  5. Posts check-in to API
 *
 * When checked in, shows a "Check Out" button and time on site.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '../../utils';

// ============================================================================
// TYPES
// ============================================================================

export interface SiteCheckInProps {
  /** Project identifier */
  projectId: string;
  /** User identifier */
  userId: string;
  /** User's display name */
  userName: string;
  /** User's role (CONTRACTOR, PM, INSPECTOR, etc.) */
  role?: string;
  /** Project site latitude */
  siteLatitude?: number;
  /** Project site longitude */
  siteLongitude?: number;
  /** API base URL */
  apiBase?: string;
  /** Called after successful check-in */
  onCheckIn?: (checkIn: CheckInRecord) => void;
  /** Called after successful check-out */
  onCheckOut?: (checkIn: CheckInRecord) => void;
  /** CSS class */
  className?: string;
}

export interface CheckInRecord {
  id: string;
  userId: string;
  projectId: string;
  checkInAt: string;
  checkOutAt?: string;
  latitude?: number;
  longitude?: number;
  verified: boolean;
  distanceMeters?: number;
  manualOverride: boolean;
  overrideNote?: string;
  minutesOnSite?: number;
}

type CheckInState = 'idle' | 'locating' | 'confirm-override' | 'checking-in' | 'checked-in' | 'checking-out';

// ============================================================================
// HELPERS
// ============================================================================

const VERIFY_RADIUS_METERS = 200;

/**
 * Haversine distance between two lat/lng points (meters)
 */
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SiteCheckIn({
  projectId,
  userId,
  userName,
  role = 'CONTRACTOR',
  siteLatitude,
  siteLongitude,
  apiBase = '',
  onCheckIn,
  onCheckOut,
  className,
}: SiteCheckInProps) {
  const [state, setState] = useState<CheckInState>('idle');
  const [activeCheckIn, setActiveCheckIn] = useState<CheckInRecord | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [overrideNote, setOverrideNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // Check for active check-in on mount
  useEffect(() => {
    async function fetchActive() {
      try {
        const res = await fetch(
          `${apiBase}/api/v1/check-in/active?userId=${userId}&projectId=${projectId}`,
          { credentials: 'include' }
        );
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setActiveCheckIn(json.data);
            setState('checked-in');
          }
        }
      } catch {
        // Silently fail — check-in is non-critical on mount
      }
    }
    fetchActive();
  }, [userId, projectId, apiBase]);

  // Update elapsed timer when checked in
  useEffect(() => {
    if (state !== 'checked-in' || !activeCheckIn) return;
    const update = () => {
      const elapsed = Math.floor(
        (Date.now() - new Date(activeCheckIn.checkInAt).getTime()) / 60000
      );
      setElapsedMinutes(elapsed);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [state, activeCheckIn]);

  // ── Check In Flow ──────────────────────────────────────────

  const handleCheckIn = useCallback(async () => {
    setError(null);
    setState('locating');

    // 1. Get GPS
    if (!navigator.geolocation) {
      setError('GPS is not available on this device.');
      setState('idle');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCurrentCoords({ lat, lng });

        // 2. Check distance
        let isVerified = false;
        let dist: number | undefined;

        if (siteLatitude != null && siteLongitude != null) {
          dist = Math.round(haversineMeters(lat, lng, siteLatitude, siteLongitude));
          setDistance(dist);
          isVerified = dist <= VERIFY_RADIUS_METERS;
        } else {
          // No site coordinates → treat as unverified
          isVerified = false;
        }

        if (!isVerified) {
          // 3. Show override prompt
          setState('confirm-override');
          return;
        }

        // 4. Auto check-in (verified)
        await submitCheckIn(lat, lng, true, dist);
      },
      (geoError) => {
        setError(`GPS error: ${geoError.message}. You can still check in manually.`);
        setState('confirm-override');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [siteLatitude, siteLongitude]);

  const submitCheckIn = async (
    lat: number | undefined,
    lng: number | undefined,
    verified: boolean,
    distanceMeters?: number,
    manualOverride = false,
    note?: string
  ) => {
    setState('checking-in');
    try {
      const res = await fetch(`${apiBase}/api/v1/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          userName,
          projectId,
          latitude: lat,
          longitude: lng,
          verified,
          distanceMeters,
          manualOverride,
          overrideNote: note,
          role,
        }),
      });

      if (!res.ok) throw new Error('Check-in failed');
      const json = await res.json();
      setActiveCheckIn(json.data);
      setState('checked-in');
      onCheckIn?.(json.data);
    } catch (err: any) {
      setError(err.message);
      setState('idle');
    }
  };

  const handleOverrideCheckIn = () => {
    submitCheckIn(
      currentCoords?.lat,
      currentCoords?.lng,
      false,
      distance ?? undefined,
      true,
      overrideNote || 'Manual check-in override'
    );
  };

  // ── Check Out Flow ─────────────────────────────────────────

  const handleCheckOut = async () => {
    if (!activeCheckIn) return;
    setState('checking-out');
    try {
      const res = await fetch(`${apiBase}/api/v1/check-in/${activeCheckIn.id}/check-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error('Check-out failed');
      const json = await res.json();
      const updated = json.data;
      setActiveCheckIn(null);
      setState('idle');
      setElapsedMinutes(0);
      onCheckOut?.(updated);
    } catch (err: any) {
      setError(err.message);
      setState('checked-in');
    }
  };

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className={cn('rounded-xl border bg-white shadow-sm', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            {state === 'checked-in' && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            )}
            <span
              className={cn(
                'relative inline-flex h-2.5 w-2.5 rounded-full',
                state === 'checked-in' ? 'bg-green-500' : 'bg-gray-300'
              )}
            />
          </span>
          <h3 className="text-sm font-semibold text-gray-900">Site Check-In</h3>
        </div>
        {state === 'checked-in' && activeCheckIn?.verified && (
          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
            GPS Verified
          </span>
        )}
        {state === 'checked-in' && !activeCheckIn?.verified && (
          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
            Manual
          </span>
        )}
      </div>

      <div className="px-4 py-3">
        {/* Error */}
        {error && (
          <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* IDLE — Show Check In button */}
        {state === 'idle' && (
          <button
            onClick={handleCheckIn}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
          >
            Check In
          </button>
        )}

        {/* LOCATING — Getting GPS */}
        {state === 'locating' && (
          <div className="flex items-center justify-center gap-2 py-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-r-transparent" />
            <span className="text-sm text-gray-600">Getting your location...</span>
          </div>
        )}

        {/* CONFIRM OVERRIDE — Not at site */}
        {state === 'confirm-override' && (
          <div className="space-y-3">
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
              <p className="text-sm font-medium text-amber-800">
                You don&apos;t appear to be at the site.
              </p>
              {distance != null && (
                <p className="text-xs text-amber-600 mt-1">
                  You&apos;re approximately {distance >= 1000 ? `${(distance / 1000).toFixed(1)}km` : `${distance}m`} away.
                </p>
              )}
            </div>
            <textarea
              value={overrideNote}
              onChange={(e) => setOverrideNote(e.target.value)}
              placeholder="Add a note (optional)..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setState('idle'); setError(null); }}
                className="flex-1 py-2 px-3 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleOverrideCheckIn}
                className="flex-1 py-2 px-3 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
              >
                Check In Anyway
              </button>
            </div>
          </div>
        )}

        {/* CHECKING IN — Submitting */}
        {state === 'checking-in' && (
          <div className="flex items-center justify-center gap-2 py-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-r-transparent" />
            <span className="text-sm text-gray-600">Checking in...</span>
          </div>
        )}

        {/* CHECKED IN — Show status + Check Out */}
        {state === 'checked-in' && activeCheckIn && (
          <div className="space-y-3">
            <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2">
              <p className="text-sm font-medium text-green-800">
                Checked in at {formatTime(activeCheckIn.checkInAt)} &#10003;
              </p>
              <p className="text-xs text-green-600 mt-1">
                Time on site: {formatDuration(elapsedMinutes)}
              </p>
            </div>
            <button
              onClick={handleCheckOut}
              className="w-full py-3 px-4 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 active:bg-red-700 transition-colors shadow-sm"
            >
              Check Out
            </button>
          </div>
        )}

        {/* CHECKING OUT — Submitting */}
        {state === 'checking-out' && (
          <div className="flex items-center justify-center gap-2 py-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-r-transparent" />
            <span className="text-sm text-gray-600">Checking out...</span>
          </div>
        )}
      </div>
    </div>
  );
}
