// packages/ui/src/components/data-display/VisualTimeline.tsx
// Visual photo timeline component for construction project progress

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { cn } from '../../utils';

// ============================================================================
// TYPES
// ============================================================================

export interface VisualTimelineEntry {
  id: string;
  date: string;
  type: 'visit' | 'milestone' | 'inspection' | 'progress';
  title: string;
  description: string;
  photos: VisualTimelinePhoto[];
  phase?: string;
  progressPercent?: number;
  metadata?: Record<string, any>;
}

export interface VisualTimelinePhoto {
  url: string;
  caption?: string;
  area?: string;
  thumbnail?: string;
}

export interface VisualTimelineProps {
  entries: VisualTimelineEntry[];
  projectName?: string;
  currentPhase?: string;
  overallProgress?: number;
  className?: string;
  onEntryClick?: (entry: VisualTimelineEntry) => void;
  onPhotoClick?: (photo: VisualTimelinePhoto, entry: VisualTimelineEntry) => void;
  showProgress?: boolean;
  compact?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

const TYPE_CONFIG: Record<string, { color: string; bgColor: string; icon: string; label: string }> = {
  visit: { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: '\u{1F4F7}', label: 'Site Visit' },
  milestone: { color: 'text-green-600', bgColor: 'bg-green-100', icon: '\u{1F3C1}', label: 'Milestone' },
  inspection: { color: 'text-amber-600', bgColor: 'bg-amber-100', icon: '\u{1F50D}', label: 'Inspection' },
  progress: { color: 'text-indigo-600', bgColor: 'bg-indigo-100', icon: '\u{1F4C8}', label: 'Progress' },
};

function formatTimelineDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatTimelineDate(dateStr);
}

// ============================================================================
// PHOTO STRIP SUB-COMPONENT
// ============================================================================

function PhotoStrip({
  photos,
  onPhotoClick,
  compact,
}: {
  photos: VisualTimelinePhoto[];
  onPhotoClick?: (photo: VisualTimelinePhoto) => void;
  compact?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = direction === 'left' ? -200 : 200;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  }, []);

  if (photos.length === 0) return null;

  return (
    <div className="relative group">
      {/* Scroll buttons */}
      {photos.length > 3 && (
        <>
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Scroll left"
          >
            &#8249;
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Scroll right"
          >
            &#8250;
          </button>
        </>
      )}

      {/* Photo strip */}
      <div
        ref={scrollRef}
        className={cn(
          'flex gap-2 overflow-x-auto scrollbar-hide pb-1',
          compact ? 'max-h-16' : 'max-h-32'
        )}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {photos.map((photo, idx) => (
          <div
            key={idx}
            className={cn(
              'flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all',
              compact ? 'w-16 h-16' : 'w-28 h-24'
            )}
            onClick={() => onPhotoClick?.(photo)}
          >
            <img
              src={photo.thumbnail || photo.url}
              alt={photo.caption || `Photo ${idx + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// PROGRESS BAR SUB-COMPONENT
// ============================================================================

function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  const color =
    percent >= 80 ? 'bg-green-500' :
    percent >= 60 ? 'bg-blue-500' :
    percent >= 40 ? 'bg-yellow-500' :
    percent >= 20 ? 'bg-orange-500' :
    'bg-red-500';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 w-10 text-right">{percent}%</span>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function VisualTimeline({
  entries,
  projectName,
  currentPhase,
  overallProgress,
  className,
  onEntryClick,
  onPhotoClick,
  showProgress = true,
  compact = false,
}: VisualTimelineProps) {
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  return (
    <div className={cn('relative', className)}>
      {/* Header with overall progress */}
      {showProgress && overallProgress !== undefined && (
        <div className="mb-6 bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              {projectName && (
                <h3 className="text-sm font-semibold text-gray-900">{projectName}</h3>
              )}
              {currentPhase && (
                <span className="text-xs text-gray-500">Phase: {currentPhase}</span>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{overallProgress}%</div>
              <div className="text-xs text-gray-500">Overall Progress</div>
            </div>
          </div>
          <ProgressBar percent={overallProgress} />
        </div>
      )}

      {/* Timeline entries */}
      <div className="space-y-1">
        {entries.map((entry, index) => {
          const config = TYPE_CONFIG[entry.type] || TYPE_CONFIG.visit;
          const isExpanded = expandedEntry === entry.id;
          const isLast = index === entries.length - 1;

          return (
            <div key={entry.id} className="relative flex gap-4">
              {/* Timeline line and dot */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-lg z-10 border-2 border-white shadow-sm',
                    config.bgColor
                  )}
                >
                  {config.icon}
                </div>
                {!isLast && (
                  <div className="w-0.5 flex-1 bg-gray-200 my-1" />
                )}
              </div>

              {/* Entry card */}
              <div
                className={cn(
                  'flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden mb-3 transition-shadow hover:shadow-md',
                  onEntryClick && 'cursor-pointer'
                )}
                onClick={() => {
                  setExpandedEntry(isExpanded ? null : entry.id);
                  onEntryClick?.(entry);
                }}
              >
                {/* Card header */}
                <div className={cn('px-4 py-3', compact && 'px-3 py-2')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-[10px] font-medium px-2 py-0.5 rounded-full',
                        config.bgColor, config.color
                      )}>
                        {config.label}
                      </span>
                      <h4 className={cn(
                        'font-medium text-gray-900',
                        compact ? 'text-xs' : 'text-sm'
                      )}>
                        {entry.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.progressPercent !== undefined && (
                        <span className={cn(
                          'text-xs font-semibold',
                          entry.progressPercent >= 80 ? 'text-green-600' :
                          entry.progressPercent >= 50 ? 'text-blue-600' :
                          'text-amber-600'
                        )}>
                          {entry.progressPercent}%
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {formatRelativeDate(entry.date)}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {!compact && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {entry.description}
                    </p>
                  )}

                  {/* Phase badge */}
                  {entry.phase && (
                    <span className="inline-flex mt-1 text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {entry.phase}
                    </span>
                  )}
                </div>

                {/* Photo strip */}
                {entry.photos.length > 0 && (
                  <div className={cn('px-4 pb-3', compact && 'px-3 pb-2')}>
                    <PhotoStrip
                      photos={entry.photos}
                      onPhotoClick={(photo) => onPhotoClick?.(photo, entry)}
                      compact={compact}
                    />
                  </div>
                )}

                {/* Expanded details */}
                {isExpanded && !compact && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                    <div className="text-xs text-gray-500 mb-2">
                      {formatTimelineDate(entry.date)}
                    </div>
                    <p className="text-sm text-gray-700">{entry.description}</p>

                    {entry.progressPercent !== undefined && (
                      <div className="mt-3">
                        <div className="text-xs text-gray-500 mb-1">Progress</div>
                        <ProgressBar percent={entry.progressPercent} />
                      </div>
                    )}

                    {entry.metadata?.stalledAreas && entry.metadata.stalledAreas.length > 0 && (
                      <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-2">
                        <div className="text-xs font-medium text-amber-800 mb-1">Stalled Areas</div>
                        <ul className="text-xs text-amber-700 list-disc list-inside">
                          {entry.metadata.stalledAreas.map((area: string, i: number) => (
                            <li key={i}>{area}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {entry.metadata?.highlights && entry.metadata.highlights.length > 0 && (
                      <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-2">
                        <div className="text-xs font-medium text-green-800 mb-1">Highlights</div>
                        <ul className="text-xs text-green-700 list-disc list-inside">
                          {entry.metadata.highlights.map((h: string, i: number) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="text-gray-300 text-4xl mb-3">&#128247;</div>
          <p className="text-gray-500 text-sm">No timeline entries yet</p>
          <p className="text-gray-400 text-xs mt-1">
            Photos and milestones will appear here as your project progresses
          </p>
        </div>
      )}
    </div>
  );
}

export default VisualTimeline;
