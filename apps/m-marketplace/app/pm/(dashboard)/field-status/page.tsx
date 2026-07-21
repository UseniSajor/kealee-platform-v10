'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Users,
  Clock,
  AlertTriangle,
  RefreshCw,
  List,
  Map,
  ChevronRight,
  HardHat,
  CheckCircle,
  XCircle,
  Activity,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface CrewMember {
  userId: string;
  userName: string;
  role: string;
  checkInAt: string;
  hoursOnSite: number;
}

interface ProjectSite {
  projectId: string;
  projectName: string;
  address: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'empty' | 'overdue';
  crew: CrewMember[];
  crewCount: number;
  totalHours: number;
  clientId?: string;
}

interface FleetResponse {
  projects: ProjectSite[];
}

type ViewMode = 'list' | 'map';

// ============================================================================
// CONSTANTS
// ============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const POLL_INTERVAL_SEC = 30;

const STATUS_CONFIG: Record<
  ProjectSite['status'],
  { label: string; dotClass: string; badgeBg: string; badgeText: string; pinColor: string }
> = {
  active: {
    label: 'Active',
    dotClass: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    pinColor: 'bg-emerald-500',
  },
  empty: {
    label: 'Empty',
    dotClass: 'bg-gray-400',
    badgeBg: 'bg-gray-50',
    badgeText: 'text-gray-600',
    pinColor: 'bg-gray-400',
  },
  overdue: {
    label: 'Overdue',
    dotClass: 'bg-red-500',
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-700',
    pinColor: 'bg-red-500',
  },
};

// ============================================================================
// MOCK DATA
// ============================================================================

function generateMockData(): ProjectSite[] {
  const now = Date.now();
  return [
    {
      projectId: 'proj-001',
      projectName: 'Riverside Condos Phase 2',
      address: '1450 River Rd, Arlington, VA 22209',
      latitude: 38.8951,
      longitude: -77.0364,
      status: 'active',
      clientId: 'client-01',
      crewCount: 6,
      totalHours: 38.5,
      crew: [
        { userId: 'u1', userName: 'Mike Torres', role: 'Foreman', checkInAt: new Date(now - 6 * 3600000).toISOString(), hoursOnSite: 6.0 },
        { userId: 'u2', userName: 'Sarah Chen', role: 'Electrician', checkInAt: new Date(now - 5 * 3600000).toISOString(), hoursOnSite: 5.0 },
        { userId: 'u3', userName: 'James Okafor', role: 'Plumber', checkInAt: new Date(now - 4.5 * 3600000).toISOString(), hoursOnSite: 4.5 },
        { userId: 'u4', userName: 'Ana Reyes', role: 'Carpenter', checkInAt: new Date(now - 7 * 3600000).toISOString(), hoursOnSite: 7.0 },
        { userId: 'u5', userName: 'Derek Williams', role: 'Laborer', checkInAt: new Date(now - 8 * 3600000).toISOString(), hoursOnSite: 8.0 },
        { userId: 'u6', userName: 'Li Wei', role: 'Laborer', checkInAt: new Date(now - 8 * 3600000).toISOString(), hoursOnSite: 8.0 },
      ],
    },
    {
      projectId: 'proj-002',
      projectName: 'Georgetown Office Renovation',
      address: '3200 M St NW, Washington, DC 20007',
      latitude: 38.9053,
      longitude: -77.0609,
      status: 'active',
      clientId: 'client-02',
      crewCount: 3,
      totalHours: 14.0,
      crew: [
        { userId: 'u7', userName: 'Tom Bradley', role: 'Foreman', checkInAt: new Date(now - 5 * 3600000).toISOString(), hoursOnSite: 5.0 },
        { userId: 'u8', userName: 'Rosa Martinez', role: 'Painter', checkInAt: new Date(now - 4 * 3600000).toISOString(), hoursOnSite: 4.0 },
        { userId: 'u9', userName: 'Kevin Pham', role: 'HVAC Tech', checkInAt: new Date(now - 5 * 3600000).toISOString(), hoursOnSite: 5.0 },
      ],
    },
    {
      projectId: 'proj-003',
      projectName: 'Capitol Hill Townhomes',
      address: '615 East Capitol St SE, Washington, DC 20003',
      latitude: 38.8899,
      longitude: -76.9996,
      status: 'overdue',
      clientId: 'client-03',
      crewCount: 2,
      totalHours: 23.0,
      crew: [
        { userId: 'u10', userName: 'Brian Hughes', role: 'Foreman', checkInAt: new Date(now - 11 * 3600000).toISOString(), hoursOnSite: 11.0 },
        { userId: 'u11', userName: 'Carla Diaz', role: 'Mason', checkInAt: new Date(now - 12 * 3600000).toISOString(), hoursOnSite: 12.0 },
      ],
    },
    {
      projectId: 'proj-004',
      projectName: 'Silver Spring Medical Center',
      address: '8901 Georgia Ave, Silver Spring, MD 20910',
      latitude: 38.9940,
      longitude: -77.0261,
      status: 'empty',
      clientId: 'client-04',
      crewCount: 0,
      totalHours: 0,
      crew: [],
    },
    {
      projectId: 'proj-005',
      projectName: 'Bethesda Luxury Apartments',
      address: '4800 Hampden Ln, Bethesda, MD 20814',
      latitude: 38.9807,
      longitude: -77.0956,
      status: 'active',
      clientId: 'client-05',
      crewCount: 4,
      totalHours: 20.0,
      crew: [
        { userId: 'u12', userName: 'Marcus Green', role: 'Foreman', checkInAt: new Date(now - 5 * 3600000).toISOString(), hoursOnSite: 5.0 },
        { userId: 'u13', userName: 'Yuki Tanaka', role: 'Electrician', checkInAt: new Date(now - 5 * 3600000).toISOString(), hoursOnSite: 5.0 },
        { userId: 'u14', userName: 'Omar Hassan', role: 'Plumber', checkInAt: new Date(now - 5 * 3600000).toISOString(), hoursOnSite: 5.0 },
        { userId: 'u15', userName: 'Pat O\'Brien', role: 'Laborer', checkInAt: new Date(now - 5 * 3600000).toISOString(), hoursOnSite: 5.0 },
      ],
    },
    {
      projectId: 'proj-006',
      projectName: 'Alexandria Waterfront Hotel',
      address: '220 S Union St, Alexandria, VA 22314',
      latitude: 38.8026,
      longitude: -77.0430,
      status: 'empty',
      clientId: 'client-06',
      crewCount: 0,
      totalHours: 0,
      crew: [],
    },
  ];
}

// ============================================================================
// HELPERS
// ============================================================================

function formatHours(h: number): string {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function formatCheckInTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function sortProjects(projects: ProjectSite[]): ProjectSite[] {
  const statusOrder: Record<string, number> = { active: 0, overdue: 1, empty: 2 };
  return [...projects].sort((a, b) => {
    const orderDiff = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
    if (orderDiff !== 0) return orderDiff;
    return b.crewCount - a.crewCount;
  });
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-4 flex items-center gap-4">
      <div className={`flex-shrink-0 rounded-lg p-2.5 ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold text-gray-900 leading-tight">{value}</p>
        <p className="text-sm text-gray-500 truncate">{label}</p>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: ProjectSite['status'] }) {
  const cfg = STATUS_CONFIG[status];
  const shouldPulse = status === 'active' || status === 'overdue';
  return (
    <span className="relative flex h-2.5 w-2.5">
      {shouldPulse && (
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${cfg.dotClass}`}
        />
      )}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${cfg.dotClass}`} />
    </span>
  );
}

function StatusBadge({ status }: { status: ProjectSite['status'] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.badgeBg} ${cfg.badgeText}`}
    >
      <StatusDot status={status} />
      {cfg.label}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-48 bg-gray-200 rounded" />
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
      </div>
      <div className="h-4 w-64 bg-gray-100 rounded mb-4" />
      <div className="space-y-3">
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-3/4 bg-gray-100 rounded" />
        <div className="h-4 w-1/2 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

function SkeletonStatCard() {
  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-4 flex items-center gap-4 animate-pulse">
      <div className="h-10 w-10 bg-gray-200 rounded-lg" />
      <div className="space-y-2">
        <div className="h-6 w-12 bg-gray-200 rounded" />
        <div className="h-3 w-20 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

function CrewRow({ member }: { member: CrewMember }) {
  const isLong = member.hoursOnSite > 10;
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex-shrink-0 h-7 w-7 rounded-full bg-blue-50 flex items-center justify-center">
          <HardHat className="h-3.5 w-3.5 text-blue-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{member.userName}</p>
          <p className="text-xs text-gray-500">{member.role}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-xs text-gray-400">in at {formatCheckInTime(member.checkInAt)}</span>
        <span
          className={`text-xs font-medium tabular-nums ${
            isLong ? 'text-red-600' : 'text-gray-700'
          }`}
        >
          {formatHours(member.hoursOnSite)}
        </span>
      </div>
    </div>
  );
}

function ProjectCard({ site }: { site: ProjectSite }) {
  const clientId = site.clientId || 'unknown';
  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-base font-semibold text-gray-900 leading-snug pr-3">
          {site.projectName}
        </h3>
        <StatusBadge status={site.status} />
      </div>

      {/* Address */}
      <div className="flex items-center gap-1.5 mb-4">
        <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
        <p className="text-sm text-gray-500 truncate">{site.address}</p>
      </div>

      {/* Crew summary */}
      <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
        <span className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-gray-400" />
          {site.crewCount} crew
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-gray-400" />
          {formatHours(site.totalHours)} total
        </span>
      </div>

      {/* Crew list */}
      {site.crew.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4 max-h-52 overflow-y-auto">
          {site.crew.map((member) => (
            <CrewRow key={member.userId} member={member} />
          ))}
        </div>
      )}

      {site.crew.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
          <XCircle className="h-5 w-5 text-gray-300 mx-auto mb-1" />
          <p className="text-sm text-gray-400">No crew on site</p>
        </div>
      )}

      {/* Footer action */}
      <Link
        href={`/pm/clients/${clientId}/pm/projects/${site.projectId}/overview`}
        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
      >
        View Details
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-full bg-gray-100 p-4 mb-4">
        <MapPin className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">No projects found</h3>
      <p className="text-sm text-gray-500 max-w-sm">
        There are no active projects to display. Projects with crew check-ins will appear here
        automatically.
      </p>
    </div>
  );
}

// ============================================================================
// MAP VIEW
// ============================================================================

function MapPin3D({
  site,
  style,
}: {
  site: ProjectSite;
  style: React.CSSProperties;
}) {
  const [hovered, setHovered] = useState(false);
  const cfg = STATUS_CONFIG[site.status];
  const shouldPulse = site.status === 'active' || site.status === 'overdue';

  return (
    <div
      className="absolute"
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Pin */}
      <div className="relative flex flex-col items-center cursor-pointer">
        <div className={`relative h-5 w-5 rounded-full ${cfg.pinColor} shadow-md border-2 border-white`}>
          {shouldPulse && (
            <span
              className={`absolute inset-0 rounded-full animate-ping opacity-40 ${cfg.pinColor}`}
            />
          )}
        </div>
        {/* Pin stem */}
        <div className={`h-2 w-0.5 ${cfg.pinColor} opacity-60`} />
      </div>

      {/* Tooltip */}
      {hovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none">
          <div className="bg-gray-900 text-white rounded-lg px-3 py-2 shadow-lg text-xs whitespace-nowrap">
            <p className="font-semibold mb-0.5">{site.projectName}</p>
            <p className="text-gray-300">
              {site.crewCount} crew &middot; {formatHours(site.totalHours)}
            </p>
            <p className="text-gray-400 mt-0.5">{site.address}</p>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
}

function MapView({ projects }: { projects: ProjectSite[] }) {
  // Calculate positions by normalizing lat/long values across the set
  const positions = useMemo(() => {
    if (projects.length === 0) return [];

    const lats = projects.map((p) => p.latitude);
    const lngs = projects.map((p) => p.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latRange = maxLat - minLat || 0.01;
    const lngRange = maxLng - minLng || 0.01;

    // Pad by 15% so pins don't sit on edges
    const pad = 0.15;

    return projects.map((p) => {
      const xPct = pad + ((p.longitude - minLng) / lngRange) * (1 - 2 * pad);
      // Invert y because lat increases upward but screen y increases downward
      const yPct = pad + ((maxLat - p.latitude) / latRange) * (1 - 2 * pad);
      return {
        site: p,
        style: {
          left: `${(xPct * 100).toFixed(1)}%`,
          top: `${(yPct * 100).toFixed(1)}%`,
        } as React.CSSProperties,
      };
    });
  }, [projects]);

  return (
    <div className="space-y-3">
      {/* Map area */}
      <div
        className="relative w-full rounded-xl border border-gray-200 overflow-hidden bg-gradient-to-br from-blue-50 via-green-50 to-emerald-50"
        style={{ minHeight: '480px' }}
      >
        {/* Background grid to simulate map */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#6b7280" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#map-grid)" />
        </svg>

        {/* Decorative "road" lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <line x1="10%" y1="30%" x2="90%" y2="45%" stroke="#6b7280" strokeWidth="3" />
          <line x1="20%" y1="10%" x2="40%" y2="85%" stroke="#6b7280" strokeWidth="2" />
          <line x1="60%" y1="15%" x2="75%" y2="80%" stroke="#6b7280" strokeWidth="2" />
          <line x1="5%" y1="65%" x2="95%" y2="55%" stroke="#6b7280" strokeWidth="2.5" />
        </svg>

        {/* Project pins */}
        {positions.map(({ site, style }) => (
          <MapPin3D key={site.projectId} site={site} style={style} />
        ))}

        {/* Legend */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Active
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
              Empty
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              Overdue
            </span>
          </div>
        </div>

        {/* Project count label */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm border border-gray-100">
          <span className="text-xs font-medium text-gray-700">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Map footer note */}
      <p className="text-xs text-gray-400 text-center italic">
        Full map integration coming soon &mdash; requires Google Maps API key
      </p>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FieldStatusPage() {
  const [projects, setProjects] = useState<ProjectSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [countdown, setCountdown] = useState(POLL_INTERVAL_SEC);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // ---------- Data fetching ----------
  const fetchFleet = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/check-in/fleet`, {
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        // Backend returns { success: true, data: [...] }
        const rawProjects = json.data || json.projects || json || [];
        const mapped: ProjectSite[] = rawProjects.map((p: any) => {
          const crew = (p.crewOnSite || p.crew || []).map((c: any) => ({
            userId: c.userId,
            userName: c.userName,
            role: c.role || 'Crew',
            checkInAt: c.arrivedAt || c.checkInAt,
            hoursOnSite: c.hoursOnSite ?? (
              c.arrivedAt
                ? (Date.now() - new Date(c.arrivedAt).getTime()) / 3600000
                : 0
            ),
          }));
          // Map backend status 'on-site' to frontend 'active'
          let status: 'active' | 'empty' | 'overdue' = 'empty';
          if (p.status === 'on-site' || p.status === 'active') status = 'active';
          else if (p.status === 'overdue') status = 'overdue';
          else if (p.status === 'empty') status = 'empty';

          return {
            projectId: p.projectId,
            projectName: p.projectName,
            address: p.address || '',
            latitude: p.latitude ?? 0,
            longitude: p.longitude ?? 0,
            status,
            crew,
            crewCount: crew.length,
            totalHours: crew.reduce((sum: number, c: any) => sum + (c.hoursOnSite || 0), 0),
            clientId: p.clientId,
          };
        });
        setProjects(mapped);
      } else {
        // Fallback to mock data on error
        setProjects(generateMockData());
      }
    } catch {
      // Use mock data when API is unavailable
      setProjects(generateMockData());
    } finally {
      setLoading(false);
      setLastRefreshed(new Date());
      setCountdown(POLL_INTERVAL_SEC);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchFleet();
  }, [fetchFleet]);

  // Auto-refresh polling
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchFleet();
          return POLL_INTERVAL_SEC;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [fetchFleet]);

  // ---------- Derived stats ----------
  const sorted = useMemo(() => sortProjects(projects), [projects]);

  const stats = useMemo(() => {
    const activeSites = projects.filter((p) => p.status === 'active').length;
    const emptySites = projects.filter((p) => p.status === 'empty').length;
    const overdue = projects.filter((p) => p.status === 'overdue').length;
    const totalCrew = projects.reduce((sum, p) => sum + p.crewCount, 0);
    return { activeSites, emptySites, totalCrew, overdue };
  }, [projects]);

  // ---------- Manual refresh ----------
  const handleRefresh = () => {
    setLoading(true);
    fetchFleet();
  };

  // ---------- Render ----------
  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Field Status</h1>
          <p className="text-sm text-gray-500 mt-1">Live crew tracking across all projects</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Countdown */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Activity className="h-3.5 w-3.5" />
            <span className="tabular-nums">
              Refresh in {countdown}s
            </span>
          </div>

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ---- Summary Stats ---- */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={CheckCircle}
            label="Active Sites"
            value={stats.activeSites}
            accent="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            icon={XCircle}
            label="Empty Sites"
            value={stats.emptySites}
            accent="bg-gray-100 text-gray-500"
          />
          <StatCard
            icon={Users}
            label="Total Crew"
            value={stats.totalCrew}
            accent="bg-blue-50 text-blue-600"
          />
          <StatCard
            icon={AlertTriangle}
            label="Overdue"
            value={stats.overdue}
            accent="bg-red-50 text-red-600"
          />
        </div>
      )}

      {/* ---- View toggle ---- */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List className="h-4 w-4" />
            List View
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === 'map'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Map className="h-4 w-4" />
            Map View
          </button>
        </div>

        {lastRefreshed && (
          <span className="text-xs text-gray-400 hidden sm:inline">
            Last updated {lastRefreshed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
          </span>
        )}
      </div>

      {/* ---- Content ---- */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState />
      ) : viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {sorted.map((site) => (
            <ProjectCard key={site.projectId} site={site} />
          ))}
        </div>
      ) : (
        <MapView projects={sorted} />
      )}
    </div>
  );
}
