'use client';

/**
 * SensorWidget — IoT sensor monitoring cards for project dashboards
 *
 * Shows sensor cards with current value, today's min/max, 24-hour sparkline,
 * and alert status. Click to expand for full history chart.
 *
 * Usage:
 *   <SensorWidget projectId="proj_123" apiBase="http://localhost:3000" />
 */

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '../../utils';

// ============================================================================
// TYPES
// ============================================================================

export interface SensorWidgetProps {
  /** Project identifier */
  projectId: string;
  /** API base URL */
  apiBase?: string;
  /** Additional CSS classes */
  className?: string;
  /** Compact mode — shows only alert-state sensors */
  compact?: boolean;
  /** Refresh interval in ms (default 60000 = 1 minute) */
  refreshInterval?: number;
}

interface SensorDevice {
  id: string;
  type: string;
  name: string;
  location: string;
  deviceId: string;
  status: string;
  batteryLevel: number | null;
  lastReading: string | null;
  config: any;
  latestValue: number | null;
  latestUnit: string | null;
  todayMin: number | null;
  todayMax: number | null;
  alertCount: number;
}

interface SensorSummary {
  totalDevices: number;
  activeDevices: number;
  offlineDevices: number;
  lowBatteryDevices: number;
  activeAlerts: number;
  devices: SensorDevice[];
}

interface HistoryReading {
  timestamp: string;
  value: number;
  unit: string;
  alert: boolean;
}

interface AggregatedReading {
  timestamp: string;
  avg: number;
  min: number;
  max: number;
  count: number;
}

// ============================================================================
// ICONS (inline SVG to avoid dependency)
// ============================================================================

const SENSOR_ICONS: Record<string, string> = {
  temperature: '🌡️',
  humidity: '💧',
  vibration: '📳',
  noise: '🔊',
  water_leak: '🚰',
  air_quality: '🌬️',
  motion: '👁️',
};

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  offline: { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400' },
  low_battery: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  error: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

// ============================================================================
// HELPERS
// ============================================================================

function formatValue(value: number | null, unit: string | null): string {
  if (value === null) return '--';
  const rounded = Math.round(value * 10) / 10;
  return `${rounded}${unit || ''}`;
}

function formatTimeAgo(isoString: string | null): string {
  if (!isoString) return 'Never';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function isInAlert(device: SensorDevice): boolean {
  if (!device.config || device.latestValue === null) return false;
  const config = device.config;
  if (config.alertAbove !== undefined && device.latestValue > config.alertAbove) return true;
  if (config.alertBelow !== undefined && device.latestValue < config.alertBelow) return true;
  return false;
}

// ============================================================================
// SPARKLINE COMPONENT (Pure CSS/SVG)
// ============================================================================

function Sparkline({
  data,
  width = 120,
  height = 32,
  alertThresholdAbove,
  alertThresholdBelow,
  className,
}: {
  data: Array<{ value: number }>;
  width?: number;
  height?: number;
  alertThresholdAbove?: number;
  alertThresholdBelow?: number;
  className?: string;
}) {
  if (data.length < 2) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ width, height }}>
        <span className="text-xs text-gray-300">No data</span>
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padding = 2;

  const points = data
    .map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((d.value - min) / range) * (height - 2 * padding);
      return `${x},${y}`;
    })
    .join(' ');

  // Check if last point is in alert
  const lastValue = values[values.length - 1];
  const inAlert =
    (alertThresholdAbove !== undefined && lastValue > alertThresholdAbove) ||
    (alertThresholdBelow !== undefined && lastValue < alertThresholdBelow);

  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Threshold lines */}
      {alertThresholdAbove !== undefined && (
        <line
          x1={padding}
          y1={height - padding - ((alertThresholdAbove - min) / range) * (height - 2 * padding)}
          x2={width - padding}
          y2={height - padding - ((alertThresholdAbove - min) / range) * (height - 2 * padding)}
          stroke="#fca5a5"
          strokeWidth="1"
          strokeDasharray="3,3"
        />
      )}
      {alertThresholdBelow !== undefined && (
        <line
          x1={padding}
          y1={height - padding - ((alertThresholdBelow - min) / range) * (height - 2 * padding)}
          x2={width - padding}
          y2={height - padding - ((alertThresholdBelow - min) / range) * (height - 2 * padding)}
          stroke="#93c5fd"
          strokeWidth="1"
          strokeDasharray="3,3"
        />
      )}
      {/* Data line */}
      <polyline
        points={points}
        fill="none"
        stroke={inAlert ? '#ef4444' : '#3b82f6'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      {data.length > 0 && (() => {
        const lastX = padding + ((data.length - 1) / (data.length - 1)) * (width - 2 * padding);
        const lastY = height - padding - ((lastValue - min) / range) * (height - 2 * padding);
        return (
          <circle
            cx={lastX}
            cy={lastY}
            r="2.5"
            fill={inAlert ? '#ef4444' : '#3b82f6'}
          />
        );
      })()}
    </svg>
  );
}

// ============================================================================
// EXPANDED HISTORY VIEW
// ============================================================================

function ExpandedHistory({
  deviceId,
  deviceName,
  apiBase,
  onClose,
}: {
  deviceId: string;
  deviceName: string;
  apiBase: string;
  onClose: () => void;
}) {
  const [readings, setReadings] = useState<AggregatedReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'1h' | '6h' | '24h' | '7d'>('24h');

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      try {
        const now = new Date();
        const intervals: Record<string, { from: Date; interval: string }> = {
          '1h': { from: new Date(now.getTime() - 60 * 60 * 1000), interval: '1m' },
          '6h': { from: new Date(now.getTime() - 6 * 60 * 60 * 1000), interval: '5m' },
          '24h': { from: new Date(now.getTime() - 24 * 60 * 60 * 1000), interval: '15m' },
          '7d': { from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), interval: '1h' },
        };

        const { from, interval } = intervals[period];
        const params = new URLSearchParams({
          from: from.toISOString(),
          to: now.toISOString(),
          interval,
        });

        const res = await fetch(`${apiBase}/api/v1/sensors/${deviceId}/history?${params}`);
        if (res.ok) {
          const data = await res.json();
          setReadings(data.aggregated || data.readings || []);
        }
      } catch {
        // Silently handle fetch errors
      }
      setLoading(false);
    }
    fetchHistory();
  }, [deviceId, period, apiBase]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{deviceName} — History</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Period selector */}
        <div className="flex gap-1 border-b px-6 py-3">
          {(['1h', '6h', '24h', '7d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                period === p
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-100'
              )}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="px-6 py-6">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : readings.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-gray-400">
              No data available for this period
            </div>
          ) : (
            <div>
              {/* Large sparkline chart */}
              <Sparkline
                data={readings.map((r) => ({ value: 'avg' in r ? r.avg : (r as any).value }))}
                width={560}
                height={180}
                className="w-full"
              />

              {/* Stats row */}
              <div className="mt-4 grid grid-cols-4 gap-4">
                <div className="rounded-lg bg-gray-50 p-3 text-center">
                  <div className="text-xs text-gray-500">Current</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {readings.length > 0
                      ? ('avg' in readings[readings.length - 1]
                          ? readings[readings.length - 1].avg
                          : (readings[readings.length - 1] as any).value)
                      : '--'}
                  </div>
                </div>
                <div className="rounded-lg bg-blue-50 p-3 text-center">
                  <div className="text-xs text-gray-500">Average</div>
                  <div className="text-lg font-semibold text-blue-700">
                    {readings.length > 0
                      ? (
                          readings.reduce((s, r) => s + ('avg' in r ? r.avg : (r as any).value), 0) /
                          readings.length
                        ).toFixed(1)
                      : '--'}
                  </div>
                </div>
                <div className="rounded-lg bg-green-50 p-3 text-center">
                  <div className="text-xs text-gray-500">Min</div>
                  <div className="text-lg font-semibold text-green-700">
                    {readings.length > 0
                      ? Math.min(
                          ...readings.map((r) => ('min' in r ? r.min : (r as any).value))
                        ).toFixed(1)
                      : '--'}
                  </div>
                </div>
                <div className="rounded-lg bg-red-50 p-3 text-center">
                  <div className="text-xs text-gray-500">Max</div>
                  <div className="text-lg font-semibold text-red-700">
                    {readings.length > 0
                      ? Math.max(
                          ...readings.map((r) => ('max' in r ? r.max : (r as any).value))
                        ).toFixed(1)
                      : '--'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SENSOR CARD
// ============================================================================

function SensorCard({
  device,
  apiBase,
  sparklineData,
}: {
  device: SensorDevice;
  apiBase: string;
  sparklineData: Array<{ value: number }>;
}) {
  const [expanded, setExpanded] = useState(false);
  const alert = isInAlert(device);
  const statusColor = STATUS_COLORS[device.status] || STATUS_COLORS.active;
  const icon = SENSOR_ICONS[device.type] || '📊';

  return (
    <>
      <button
        onClick={() => setExpanded(true)}
        className={cn(
          'w-full rounded-xl border p-4 text-left transition-all hover:shadow-md',
          alert
            ? 'border-red-200 bg-red-50/50 ring-1 ring-red-100'
            : 'border-gray-200 bg-white hover:border-blue-200'
        )}
      >
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <div>
              <div className="text-sm font-medium text-gray-900">{device.name}</div>
              <div className="text-xs text-gray-500">{device.location}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={cn('h-2 w-2 rounded-full', statusColor.dot,
              device.status === 'active' && 'animate-pulse'
            )} />
            <span className={cn('text-xs font-medium capitalize', statusColor.text)}>
              {device.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Current value */}
        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className={cn(
              'text-2xl font-bold',
              alert ? 'text-red-600' : 'text-gray-900'
            )}>
              {formatValue(device.latestValue, device.latestUnit)}
            </div>
            <div className="mt-0.5 text-xs text-gray-500">
              Range today: {formatValue(device.todayMin, device.latestUnit)}–{formatValue(device.todayMax, device.latestUnit)}
            </div>
          </div>

          {/* Sparkline */}
          <Sparkline
            data={sparklineData}
            width={100}
            height={28}
            alertThresholdAbove={device.config?.alertAbove}
            alertThresholdBelow={device.config?.alertBelow}
          />
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2">
          <span className="text-xs text-gray-400">
            Updated {formatTimeAgo(device.lastReading)}
          </span>
          {device.alertCount > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              {device.alertCount} alert{device.alertCount !== 1 ? 's' : ''} today
            </span>
          )}
          {device.batteryLevel !== null && device.batteryLevel <= 20 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              🔋 {device.batteryLevel}%
            </span>
          )}
        </div>
      </button>

      {/* Expanded history modal */}
      {expanded && (
        <ExpandedHistory
          deviceId={device.deviceId}
          deviceName={device.name}
          apiBase={apiBase}
          onClose={() => setExpanded(false)}
        />
      )}
    </>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SensorWidget({
  projectId,
  apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  className,
  compact = false,
  refreshInterval = 60000,
}: SensorWidgetProps) {
  const [summary, setSummary] = useState<SensorSummary | null>(null);
  const [sparklineDataMap, setSparklineDataMap] = useState<Record<string, Array<{ value: number }>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/v1/sensors/project/${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch sensor data');
      const data = await res.json();

      setSummary({
        totalDevices: data.totalDevices,
        activeDevices: data.activeDevices,
        offlineDevices: data.offlineDevices,
        lowBatteryDevices: data.lowBatteryDevices,
        activeAlerts: data.activeAlerts,
        devices: data.devices,
      });

      // Fetch sparkline data for each device (last 24h, aggregated to 15m)
      const sparklines: Record<string, Array<{ value: number }>> = {};
      const now = new Date();
      const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      await Promise.all(
        (data.devices || []).map(async (device: SensorDevice) => {
          try {
            const params = new URLSearchParams({
              from: from.toISOString(),
              to: now.toISOString(),
              interval: '15m',
            });
            const histRes = await fetch(
              `${apiBase}/api/v1/sensors/${device.deviceId}/history?${params}`
            );
            if (histRes.ok) {
              const histData = await histRes.json();
              const aggregated = histData.aggregated || histData.readings || [];
              sparklines[device.deviceId] = aggregated.map((r: any) => ({
                value: r.avg !== undefined ? r.avg : r.value,
              }));
            }
          } catch {
            sparklines[device.deviceId] = [];
          }
        })
      );

      setSparklineDataMap(sparklines);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, apiBase]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  // ── Loading ──
  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
          <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className={cn('rounded-xl border border-red-200 bg-red-50 p-4', className)}>
        <div className="flex items-center gap-2 text-sm text-red-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Sensor data unavailable
        </div>
      </div>
    );
  }

  // ── No sensors ──
  if (!summary || summary.totalDevices === 0) {
    return null; // Don't render anything if project has no sensors
  }

  const displayDevices = compact
    ? summary.devices.filter((d) => isInAlert(d) || d.status !== 'active')
    : summary.devices;

  // If compact and nothing to show, hide
  if (compact && displayDevices.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📡</span>
          <h3 className="text-sm font-semibold text-gray-900">
            Jobsite Sensors
          </h3>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {summary.activeDevices}/{summary.totalDevices} active
          </span>
        </div>

        {/* Alert badge */}
        {summary.activeAlerts > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            {summary.activeAlerts} alert{summary.activeAlerts !== 1 ? 's' : ''}
          </span>
        )}
        {summary.offlineDevices > 0 && summary.activeAlerts === 0 && (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
            {summary.offlineDevices} offline
          </span>
        )}
      </div>

      {/* Sensor cards grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {displayDevices.map((device) => (
          <SensorCard
            key={device.deviceId}
            device={device}
            apiBase={apiBase}
            sparklineData={sparklineDataMap[device.deviceId] || []}
          />
        ))}
      </div>
    </div>
  );
}
