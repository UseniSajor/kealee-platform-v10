// packages/ui/src/components/construction/VisitChecklist.tsx
// Visit Schedule Card — site visit card with interactive checklist

import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { MapPin, Cloud, Sun, CloudRain, Navigation } from 'lucide-react';

export type WeatherCondition = 'SUNNY' | 'CLOUDY' | 'RAINY' | 'OVERCAST';

export interface ChecklistItem {
  id: string;
  label: string;
  completed?: boolean;
}

export interface VisitChecklistProps {
  visitTime: string; // e.g. "9:00"
  visitTimePeriod?: 'AM' | 'PM';
  projectName: string;
  address: string;
  weather?: { condition: WeatherCondition; tempF: number };
  driveMins?: number;
  checklist?: ChecklistItem[];
  onItemToggle?: (id: string, completed: boolean) => void;
  onNavigate?: () => void;
  className?: string;
}

const WEATHER_ICONS: Record<WeatherCondition, React.ElementType> = {
  SUNNY: Sun,
  CLOUDY: Cloud,
  RAINY: CloudRain,
  OVERCAST: Cloud,
};

export function VisitChecklist({
  visitTime,
  visitTimePeriod = 'AM',
  projectName,
  address,
  weather,
  driveMins,
  checklist: initialChecklist = [],
  onItemToggle,
  onNavigate,
  className,
}: VisitChecklistProps) {
  const [items, setItems] = useState(initialChecklist);

  const toggle = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
    const item = items.find((i) => i.id === id);
    if (item) onItemToggle?.(id, !item.completed);
  };

  const completedCount = items.filter((i) => i.completed).length;
  const WeatherIcon = weather ? WEATHER_ICONS[weather.condition] : null;

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden', className)}>
      <div className="flex">
        {/* Time block */}
        <div className="w-20 shrink-0 bg-primary-50 flex flex-col items-center justify-center py-4 relative">
          <span className="text-2xl font-bold text-primary-800 leading-none">{visitTime}</span>
          <span className="text-xs text-primary-600 font-medium mt-0.5">{visitTimePeriod}</span>

          {/* Progress stripes */}
          {completedCount > 0 && items.length > 0 && (
            <div
              className="absolute bottom-0 left-0 right-0 bg-primary-200/60"
              style={{ height: `${(completedCount / items.length) * 100}%`, transition: 'height 0.4s ease' }}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          {/* Header */}
          <div className="mb-3">
            <h3 className="font-semibold text-gray-900">{projectName}</h3>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{address}</span>
            </div>
            {weather && WeatherIcon && (
              <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                <WeatherIcon className="w-3.5 h-3.5" />
                <span>{weather.tempF}°F · {weather.condition.toLowerCase()}</span>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            {/* Checklist */}
            {items.length > 0 && (
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  Checklist ({completedCount}/{items.length})
                </p>
                <ul className="space-y-1.5">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-center gap-2">
                      <button
                        onClick={() => toggle(item.id)}
                        className={cn(
                          'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                          item.completed
                            ? 'bg-primary-600 border-primary-600'
                            : 'border-gray-300 bg-white hover:border-primary-400'
                        )}
                        aria-label={item.completed ? 'Uncheck' : 'Check'}
                      >
                        {item.completed && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                      <span className={cn('text-xs text-gray-700', item.completed && 'line-through text-gray-400')}>
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Route / Navigate */}
            {(driveMins !== undefined || onNavigate) && (
              <div className="shrink-0">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Route</p>
                <button
                  onClick={onNavigate}
                  className="w-24 h-16 bg-gray-100 hover:bg-primary-50 rounded-lg border border-gray-200 hover:border-primary-300 flex flex-col items-center justify-center gap-1 transition-colors group"
                >
                  <Navigation className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                  {driveMins !== undefined && (
                    <span className="text-xs font-medium text-gray-600 group-hover:text-primary-700">
                      {driveMins} min
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
