'use client';

/**
 * WeatherForecastBar — 7-day horizontal weather forecast with workability indicators.
 * Shows weather conditions, temperature range, and work suitability for each day.
 * Highlights at-risk tasks with red dot indicators.
 */

import React, { useEffect, useState } from 'react';
import { cn } from '../../utils';

// ============================================================================
// TYPES
// ============================================================================

interface ForecastDay {
  date: string;
  conditions: string;
  icon: string;
  tempHigh: number;
  tempLow: number;
  workabilityScore: number;
  isWorkable: boolean;
  windSpeed: number;
  precipProbability: number;
}

interface WeatherRisk {
  scheduleItemId: string;
  taskName: string;
  trade: string;
  date: string;
  workabilityScore: number;
  restrictions: string[];
  suggestedNewDate: string | null;
  weatherCode: number;
}

interface WeatherForecastBarProps {
  projectId: string;
  className?: string;
}

interface WeatherData {
  forecast: ForecastDay[];
  risks: WeatherRisk[];
  summary: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function getDayAbbr(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getWorkabilityBadge(score: number, isWorkable: boolean): {
  label: string;
  color: string;
  bg: string;
} {
  if (isWorkable && score >= 80) {
    return { label: 'OK', color: 'text-green-700', bg: 'bg-green-50 border-green-200' };
  }
  if (isWorkable && score >= 60) {
    return { label: 'Caution', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' };
  }
  return { label: 'No Work', color: 'text-red-700', bg: 'bg-red-50 border-red-200' };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function WeatherForecastBar({ projectId, className }: WeatherForecastBarProps) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWeather() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/scheduler/projects/${projectId}/weather-risks`);
        if (!res.ok) throw new Error('Failed to fetch weather data');
        const json = await res.json();
        setData(json);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Weather data unavailable');
      } finally {
        setLoading(false);
      }
    }

    if (projectId) {
      fetchWeather();
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className={cn('rounded-xl border bg-white p-4', className)}>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-4 w-4 animate-pulse rounded bg-neutral-200" />
          <div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-neutral-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={cn('rounded-xl border bg-white p-4', className)}>
        <p className="text-sm text-neutral-500">
          {error || 'Weather data unavailable. Ensure project has GPS coordinates.'}
        </p>
      </div>
    );
  }

  // Map risks by date for quick lookup
  const risksByDate = new Map<string, WeatherRisk[]>();
  for (const risk of data.risks) {
    const dateStr = typeof risk.date === 'string'
      ? risk.date.split('T')[0]
      : new Date(risk.date).toISOString().split('T')[0];
    if (!risksByDate.has(dateStr)) {
      risksByDate.set(dateStr, []);
    }
    risksByDate.get(dateStr)!.push(risk);
  }

  return (
    <div className={cn('rounded-xl border bg-white', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h3 className="text-sm font-semibold text-neutral-900">7-Day Weather Forecast</h3>
        {data.risks.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            {data.risks.length} at risk
          </span>
        )}
      </div>

      {/* Summary */}
      <p className="px-4 pb-2 text-xs text-neutral-500">{data.summary}</p>

      {/* Forecast Grid */}
      <div className="grid grid-cols-7 gap-1 px-3 pb-3">
        {data.forecast.map((day) => {
          const badge = getWorkabilityBadge(day.workabilityScore, day.isWorkable);
          const dayRisks = risksByDate.get(day.date) || [];
          const hasRisk = dayRisks.length > 0;
          const isToday = day.date === new Date().toISOString().split('T')[0];

          return (
            <div
              key={day.date}
              className={cn(
                'relative flex flex-col items-center rounded-lg border px-1 py-2 text-center transition-colors',
                isToday ? 'border-blue-300 bg-blue-50/50' : 'border-neutral-100 bg-neutral-50/50',
                hasRisk && 'border-red-200 bg-red-50/30'
              )}
              title={`${day.conditions}\nWind: ${Math.round(day.windSpeed)} mph\nPrecip: ${day.precipProbability}%\nWorkability: ${day.workabilityScore}/100${
                dayRisks.length > 0
                  ? '\n\nAt-risk tasks:\n' + dayRisks.map(r => `- ${r.taskName} (${r.trade})`).join('\n')
                  : ''
              }`}
            >
              {/* Day label */}
              <span className={cn(
                'text-[10px] font-medium',
                isToday ? 'text-blue-700' : 'text-neutral-500'
              )}>
                {isToday ? 'Today' : getDayAbbr(day.date)}
              </span>

              {/* Weather icon */}
              <span className="text-lg leading-none my-0.5">{day.icon}</span>

              {/* Temperature */}
              <div className="text-[10px] text-neutral-700">
                <span className="font-medium">{Math.round(day.tempHigh)}</span>
                <span className="text-neutral-400">/{Math.round(day.tempLow)}</span>
              </div>

              {/* Workability badge */}
              <span className={cn(
                'mt-1 inline-block rounded-full border px-1.5 py-0 text-[9px] font-medium leading-4',
                badge.bg,
                badge.color
              )}>
                {badge.label}
              </span>

              {/* Risk indicator dot */}
              {hasRisk && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* At-risk tasks detail (if any) */}
      {data.risks.length > 0 && (
        <div className="border-t px-4 py-2">
          <p className="text-[10px] font-medium text-red-700 uppercase tracking-wide mb-1">At-Risk Tasks</p>
          <div className="space-y-1">
            {data.risks.slice(0, 3).map((risk) => (
              <div key={risk.scheduleItemId} className="flex items-center justify-between text-xs">
                <span className="text-neutral-700 truncate max-w-[60%]">{risk.taskName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400">{risk.trade}</span>
                  {risk.suggestedNewDate && (
                    <span className="text-green-600 text-[10px]">
                      Suggest: {getDateLabel(typeof risk.suggestedNewDate === 'string' ? risk.suggestedNewDate.split('T')[0] : '')}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {data.risks.length > 3 && (
              <p className="text-[10px] text-neutral-400">+{data.risks.length - 3} more</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
