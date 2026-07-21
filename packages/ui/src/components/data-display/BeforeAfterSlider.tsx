// packages/ui/src/components/data-display/BeforeAfterSlider.tsx
// Interactive before/after photo comparison slider for construction progress

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '../../utils';

// ============================================================================
// TYPES
// ============================================================================

export interface BeforeAfterPair {
  id: string;
  area: string;
  beforePhotoUrl: string;
  afterPhotoUrl: string;
  beforeDate: string;
  afterDate: string;
  beforePhase?: string;
  afterPhase?: string;
  progressPercent?: number;
  matchConfidence?: number;
  progressDescription?: string;
}

export interface BeforeAfterSliderProps {
  pair: BeforeAfterPair;
  className?: string;
  height?: number | string;
  showLabels?: boolean;
  showProgress?: boolean;
  initialPosition?: number;        // 0-100, default 50
  onPositionChange?: (position: number) => void;
}

export interface BeforeAfterGalleryProps {
  pairs: BeforeAfterPair[];
  className?: string;
  height?: number | string;
  columns?: 1 | 2;
  onPairClick?: (pair: BeforeAfterPair) => void;
  selectedArea?: string;
  areas?: string[];
  onAreaChange?: (area: string | undefined) => void;
}

// ============================================================================
// SLIDER COMPONENT
// ============================================================================

export function BeforeAfterSlider({
  pair,
  className,
  height = 400,
  showLabels = true,
  showProgress = true,
  initialPosition = 50,
  onPositionChange,
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percent);
      onPositionChange?.(percent);
    },
    [onPositionChange]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      updatePosition(e.clientX);
    },
    [updatePosition]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setIsDragging(true);
      updatePosition(e.touches[0].clientX);
    },
    [updatePosition]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => updatePosition(e.clientX);
    const handleTouchMove = (e: TouchEvent) => updatePosition(e.touches[0].clientX);
    const handleEnd = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, updatePosition]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={cn('select-none', className)}>
      {/* Area label and progress */}
      {showLabels && (
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-900">{pair.area}</h4>
          {showProgress && pair.progressPercent !== undefined && (
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    pair.progressPercent >= 80 ? 'bg-green-500' :
                    pair.progressPercent >= 50 ? 'bg-blue-500' :
                    'bg-amber-500'
                  )}
                  style={{ width: `${pair.progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600">
                {pair.progressPercent}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Slider container */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl cursor-col-resize"
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* After image (full background) */}
        <div className="absolute inset-0">
          <img
            src={pair.afterPhotoUrl}
            alt={`After: ${pair.area}`}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>

        {/* Before image (clipped by slider) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={pair.beforePhotoUrl}
            alt={`Before: ${pair.area}`}
            className="h-full object-cover"
            style={{ width: `${containerRef.current?.offsetWidth || 600}px` }}
            draggable={false}
          />
        </div>

        {/* Slider line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          {/* Slider handle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
            <div className="flex items-center gap-0.5">
              <span className="text-gray-400 text-xs">&#9664;</span>
              <span className="text-gray-400 text-xs">&#9654;</span>
            </div>
          </div>
        </div>

        {/* Before/After labels */}
        {showLabels && (
          <>
            <div className="absolute top-3 left-3 z-20">
              <span className="bg-black/60 text-white text-xs font-medium px-2 py-1 rounded">
                Before
              </span>
              {pair.beforePhase && (
                <span className="ml-1 bg-black/40 text-white text-[10px] px-1.5 py-0.5 rounded">
                  {pair.beforePhase}
                </span>
              )}
            </div>
            <div className="absolute top-3 right-3 z-20">
              <span className="bg-black/60 text-white text-xs font-medium px-2 py-1 rounded">
                After
              </span>
              {pair.afterPhase && (
                <span className="ml-1 bg-black/40 text-white text-[10px] px-1.5 py-0.5 rounded">
                  {pair.afterPhase}
                </span>
              )}
            </div>
          </>
        )}

        {/* Date labels */}
        <div className="absolute bottom-3 left-3 z-20">
          <span className="bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
            {formatDate(pair.beforeDate)}
          </span>
        </div>
        <div className="absolute bottom-3 right-3 z-20">
          <span className="bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
            {formatDate(pair.afterDate)}
          </span>
        </div>
      </div>

      {/* Progress description */}
      {showProgress && pair.progressDescription && (
        <p className="text-xs text-gray-600 mt-2">{pair.progressDescription}</p>
      )}
    </div>
  );
}

// ============================================================================
// GALLERY COMPONENT (Multiple pairs)
// ============================================================================

export function BeforeAfterGallery({
  pairs,
  className,
  height = 300,
  columns = 1,
  onPairClick,
  selectedArea,
  areas,
  onAreaChange,
}: BeforeAfterGalleryProps) {
  const filteredPairs = selectedArea
    ? pairs.filter((p) => p.area === selectedArea)
    : pairs;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Area filter */}
      {areas && areas.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onAreaChange?.(undefined)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full font-medium transition-colors',
              !selectedArea
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            All Areas
          </button>
          {areas.map((area) => (
            <button
              key={area}
              onClick={() => onAreaChange?.(area)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full font-medium transition-colors',
                selectedArea === area
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {area}
            </button>
          ))}
        </div>
      )}

      {/* Pairs grid */}
      <div
        className={cn(
          'grid gap-6',
          columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
        )}
      >
        {filteredPairs.map((pair) => (
          <div
            key={pair.id}
            className={cn(onPairClick && 'cursor-pointer')}
            onClick={() => onPairClick?.(pair)}
          >
            <BeforeAfterSlider
              pair={pair}
              height={height}
              showLabels={true}
              showProgress={true}
            />
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredPairs.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="text-gray-300 text-4xl mb-3">&#128247;</div>
          <p className="text-gray-500 text-sm">No before/after comparisons yet</p>
          <p className="text-gray-400 text-xs mt-1">
            Comparisons will appear automatically as site visits are completed
          </p>
        </div>
      )}
    </div>
  );
}

export default BeforeAfterSlider;
