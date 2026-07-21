'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  MapPin,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Calendar,
  ChevronRight,
  HardHat,
  Activity,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface CrewMember {
  id: string;
  name: string;
  trade: string;
  avatarUrl?: string;
  checkedInAt: string;
  checkedOutAt?: string;
}

interface OnSiteData {
  crewOnSite: CrewMember[];
  lastUpdate: string;
}

interface TodayActivity {
  entries: CrewMember[];
  crewCount: number;
  totalHoursWorked: number;
}

interface WeeklyDay {
  day: string;
  label: string;
  hours: number;
  isToday: boolean;
}

interface WeeklyAttendance {
  days: WeeklyDay[];
  averageHoursPerDay: number;
}

interface Milestone {
  id: string;
  name: string;
  date: string;
  completed: boolean;
}

interface ProjectOverview {
  name: string;
  address: string;
  progressPercent: number;
  currentPhase: string;
  nextMilestone: Milestone | null;
  milestones: Milestone[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// ============================================================================
// HELPERS
// ============================================================================

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function calculateDuration(checkedIn: string, checkedOut: string): string {
  const diffMs = new Date(checkedOut).getTime() - new Date(checkedIn).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
        {/* Status bar skeleton */}
        <div className="h-16 bg-gray-200 rounded-xl" />

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="h-64 bg-gray-200 rounded-xl" />
            <div className="h-72 bg-gray-200 rounded-xl" />
          </div>
          <div>
            <div className="h-80 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorFallback({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md w-full text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Something went wrong
        </h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

function AvatarPlaceholder({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-semibold text-blue-700">{initials}</span>
    </div>
  );
}

function LiveDot() {
  return (
    <span className="relative flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
    </span>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.id as string;

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  const [onSite, setOnSite] = useState<OnSiteData | null>(null);
  const [todayActivity, setTodayActivity] = useState<TodayActivity | null>(null);
  const [weeklyAttendance, setWeeklyAttendance] = useState<WeeklyAttendance | null>(null);
  const [projectOverview, setProjectOverview] = useState<ProjectOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // DATA FETCHING
  // ---------------------------------------------------------------------------
  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    try {
      const [onSiteRes, todayRes, weeklyRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/check-in/on-site/${projectId}`, { credentials: 'include' }),
        fetch(`${API_BASE}/api/v1/check-in/today/${projectId}`, { credentials: 'include' }),
        fetch(`${API_BASE}/api/v1/check-in/weekly/${projectId}`, { credentials: 'include' }),
      ]);

      if (!onSiteRes.ok || !todayRes.ok || !weeklyRes.ok) {
        throw new Error('Failed to load project data. Please check your connection and try again.');
      }

      const [onSiteJson, todayJson, weeklyJson] = await Promise.all([
        onSiteRes.json(),
        todayRes.json(),
        weeklyRes.json(),
      ]);

      setOnSite(onSiteJson.data || onSiteJson);
      setTodayActivity(todayJson.data || todayJson);
      setWeeklyAttendance(weeklyJson.data || weeklyJson);

      // Project overview can come from any of these or a separate call
      if (onSiteJson.project || todayJson.project) {
        setProjectOverview(onSiteJson.project || todayJson.project);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------------------------------------------------------------------------
  // SUPABASE REALTIME SUBSCRIPTION
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!projectId || !SUPABASE_URL || !SUPABASE_ANON_KEY) return;

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const channel = supabase.channel(`project:${projectId}`);

    channel
      .on('broadcast', { event: 'crew.arrived' }, (payload) => {
        const member = payload.payload as CrewMember;
        setOnSite((prev) => {
          if (!prev) {
            return {
              crewOnSite: [member],
              lastUpdate: new Date().toISOString(),
            };
          }
          // Avoid duplicates
          const exists = prev.crewOnSite.some((c) => c.id === member.id);
          if (exists) return prev;
          return {
            crewOnSite: [...prev.crewOnSite, member],
            lastUpdate: new Date().toISOString(),
          };
        });
        // Also update today's activity
        setTodayActivity((prev) => {
          if (!prev) {
            return {
              entries: [member],
              crewCount: 1,
              totalHoursWorked: 0,
            };
          }
          const exists = prev.entries.some(
            (e) => e.id === member.id && !e.checkedOutAt
          );
          if (exists) return prev;
          return {
            ...prev,
            entries: [...prev.entries, member],
            crewCount: prev.crewCount + 1,
          };
        });
      })
      .on('broadcast', { event: 'crew.departed' }, (payload) => {
        const member = payload.payload as CrewMember;
        setOnSite((prev) => {
          if (!prev) return prev;
          return {
            crewOnSite: prev.crewOnSite.filter((c) => c.id !== member.id),
            lastUpdate: new Date().toISOString(),
          };
        });
        // Update today's activity with checkout time
        setTodayActivity((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            entries: prev.entries.map((e) =>
              e.id === member.id && !e.checkedOutAt
                ? { ...e, checkedOutAt: member.checkedOutAt || new Date().toISOString() }
                : e
            ),
          };
        });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [projectId]);

  // ---------------------------------------------------------------------------
  // DERIVED STATE
  // ---------------------------------------------------------------------------
  const crewOnSite = onSite?.crewOnSite || [];
  const isCrewOnSite = crewOnSite.length > 0;
  const primaryCrew = crewOnSite[0];

  const todayEntries = todayActivity?.entries || [];
  const crewCountToday = todayActivity?.crewCount || todayEntries.length;
  const totalHoursToday = todayActivity?.totalHoursWorked || 0;

  const weekDays = weeklyAttendance?.days || [];
  const maxWeeklyHours = Math.max(...weekDays.map((d) => d.hours), 1);
  const avgHoursPerDay = weeklyAttendance?.averageHoursPerDay || 0;

  const progress = projectOverview?.progressPercent || 0;

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorFallback message={error} onRetry={fetchData} />;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ================================================================ */}
        {/* LIVE STATUS BAR                                                  */}
        {/* ================================================================ */}
        <div
          className={`rounded-xl px-5 py-4 flex items-center justify-between transition-colors ${
            isCrewOnSite
              ? 'bg-green-50 border border-green-200'
              : 'bg-gray-100 border border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {isCrewOnSite ? (
              <>
                <LiveDot />
                <HardHat className="w-5 h-5 text-green-700" />
                <div>
                  <span className="text-sm font-semibold text-green-800">
                    {primaryCrew.name} on site
                  </span>
                  {crewOnSite.length > 1 && (
                    <span className="text-sm text-green-600 ml-1">
                      +{crewOnSite.length - 1} more
                    </span>
                  )}
                  <span className="text-xs text-green-600 block sm:inline sm:ml-2">
                    arrived at {formatTime(primaryCrew.checkedInAt)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <MapPin className="w-5 h-5 text-gray-500" />
                <div>
                  <span className="text-sm font-medium text-gray-600">
                    No crew on site
                  </span>
                  <span className="text-xs text-gray-500 block sm:inline sm:ml-2">
                    work resumes tomorrow at 8:00 AM
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
            <Activity className="w-3.5 h-3.5" />
            <span>Live</span>
          </div>
        </div>

        {/* ================================================================ */}
        {/* MAIN CONTENT GRID                                                */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* -------------------------------------------------------------- */}
          {/* LEFT COLUMN                                                     */}
          {/* -------------------------------------------------------------- */}
          <div className="space-y-6">

            {/* TODAY'S ACTIVITY */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <h2 className="text-base font-semibold text-gray-900">
                    Today&apos;s Activity
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                    <Users className="w-3 h-3" />
                    {crewCountToday} crew member{crewCountToday !== 1 ? 's' : ''} today
                  </span>
                </div>
              </div>

              <div className="divide-y divide-gray-50">
                {todayEntries.length === 0 ? (
                  <div className="py-12 text-center">
                    <Clock className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No check-ins today yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Crew activity will appear here in real time
                    </p>
                  </div>
                ) : (
                  todayEntries.map((entry) => (
                    <div
                      key={`${entry.id}-${entry.checkedInAt}`}
                      className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                    >
                      <AvatarPlaceholder name={entry.name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {entry.name}
                        </p>
                        <p className="text-xs text-gray-500">{entry.trade}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {entry.checkedOutAt ? (
                          <>
                            <p className="text-xs text-gray-700">
                              Checked out at {formatTime(entry.checkedOutAt)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {calculateDuration(entry.checkedInAt, entry.checkedOutAt)}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-green-600 font-medium">
                            Checked in at {formatTime(entry.checkedInAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total hours footer */}
              {todayEntries.length > 0 && (
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 rounded-b-xl flex items-center justify-between">
                  <span className="text-xs text-gray-500">Total hours worked today</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {totalHoursToday.toFixed(1)}h
                  </span>
                </div>
              )}
            </div>

            {/* WEEKLY ATTENDANCE */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <h2 className="text-base font-semibold text-gray-900">
                    Weekly Attendance
                  </h2>
                </div>
                <span className="text-xs text-gray-500">
                  Avg {avgHoursPerDay.toFixed(1)}h/day
                </span>
              </div>

              <div className="px-5 py-6">
                {weekDays.length === 0 ? (
                  <div className="py-8 text-center">
                    <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No weekly data yet</p>
                  </div>
                ) : (
                  <div className="flex items-end justify-between gap-2 h-40">
                    {weekDays.map((day) => {
                      const heightPercent =
                        maxWeeklyHours > 0
                          ? Math.max((day.hours / maxWeeklyHours) * 100, 4)
                          : 4;

                      return (
                        <div
                          key={day.day}
                          className="flex-1 flex flex-col items-center gap-1"
                        >
                          {/* Hours label */}
                          <span className="text-xs text-gray-500 font-medium">
                            {day.hours > 0 ? `${day.hours.toFixed(1)}h` : '-'}
                          </span>

                          {/* Bar */}
                          <div className="w-full flex justify-center" style={{ height: '120px' }}>
                            <div className="w-full max-w-[40px] flex items-end h-full">
                              <div
                                className={`w-full rounded-t-md transition-all duration-500 ${
                                  day.isToday
                                    ? 'bg-blue-600'
                                    : day.hours > 0
                                    ? 'bg-blue-200'
                                    : 'bg-gray-100'
                                }`}
                                style={{ height: `${heightPercent}%` }}
                              />
                            </div>
                          </div>

                          {/* Day label */}
                          <span
                            className={`text-xs font-medium ${
                              day.isToday ? 'text-blue-700' : 'text-gray-500'
                            }`}
                          >
                            {day.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Weekly summary */}
              {weekDays.length > 0 && (
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 rounded-b-xl grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {weekDays.reduce((sum, d) => sum + d.hours, 0).toFixed(1)}h
                    </p>
                    <p className="text-xs text-gray-500">Total hours</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {weekDays.filter((d) => d.hours > 0).length}
                    </p>
                    <p className="text-xs text-gray-500">Active days</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {avgHoursPerDay.toFixed(1)}h
                    </p>
                    <p className="text-xs text-gray-500">Avg/day</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* -------------------------------------------------------------- */}
          {/* RIGHT COLUMN                                                    */}
          {/* -------------------------------------------------------------- */}
          <div className="space-y-6">

            {/* PROJECT OVERVIEW */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-gray-500" />
                <h2 className="text-base font-semibold text-gray-900">
                  Project Overview
                </h2>
              </div>

              <div className="p-5 space-y-5">
                {/* Project name and address */}
                {projectOverview && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {projectOverview.name}
                    </h3>
                    {projectOverview.address && (
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <p className="text-sm text-gray-500">{projectOverview.address}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Overall progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Overall Progress</span>
                    <span className="text-sm font-bold text-gray-900">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        progress >= 75
                          ? 'bg-green-500'
                          : progress >= 40
                          ? 'bg-blue-600'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Current phase */}
                {projectOverview?.currentPhase && (
                  <div className="bg-blue-50 rounded-lg px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-600 font-medium">Current Phase</p>
                      <p className="text-sm font-semibold text-blue-900 mt-0.5">
                        {projectOverview.currentPhase}
                      </p>
                    </div>
                    <HardHat className="w-5 h-5 text-blue-400" />
                  </div>
                )}

                {/* Next milestone */}
                {projectOverview?.nextMilestone && (
                  <div className="bg-amber-50 rounded-lg px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-amber-600 font-medium">Next Milestone</p>
                      <p className="text-sm font-semibold text-amber-900 mt-0.5">
                        {projectOverview.nextMilestone.name}
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        {formatDateShort(projectOverview.nextMilestone.date)}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-amber-400" />
                  </div>
                )}

                {/* Milestones list */}
                {projectOverview?.milestones && projectOverview.milestones.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Milestones</h4>
                    <div className="space-y-2">
                      {projectOverview.milestones.map((milestone) => (
                        <div
                          key={milestone.id}
                          className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {milestone.completed ? (
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm truncate ${
                                milestone.completed
                                  ? 'text-gray-500 line-through'
                                  : 'text-gray-900 font-medium'
                              }`}
                            >
                              {milestone.name}
                            </p>
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {formatDateShort(milestone.date)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state when no project overview data */}
                {!projectOverview && (
                  <div className="py-8 text-center">
                    <Activity className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">
                      Project details will appear here once set up
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Your PM will configure phases and milestones
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* QUICK STATS */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-gray-500">Crew Today</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{crewCountToday}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {isCrewOnSite
                    ? `${crewOnSite.length} currently on site`
                    : 'No one on site now'}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-gray-500">Hours Today</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {totalHoursToday.toFixed(1)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {crewCountToday > 0
                    ? `${(totalHoursToday / crewCountToday).toFixed(1)}h avg per person`
                    : 'No hours logged'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
