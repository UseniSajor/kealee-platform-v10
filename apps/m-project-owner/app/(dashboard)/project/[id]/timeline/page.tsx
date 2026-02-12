'use client';

import React, { useState, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface TimelineEntry {
  id: string;
  date: string;
  type: 'visit' | 'milestone' | 'inspection' | 'progress';
  title: string;
  description: string;
  photos: TimelinePhoto[];
  phase?: string;
  progressPercent?: number;
  metadata?: Record<string, any>;
}

interface TimelinePhoto {
  url: string;
  caption?: string;
  area?: string;
}

interface BeforeAfterPair {
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

interface ProjectTimelineData {
  projectId: string;
  projectName: string;
  startDate: string;
  currentPhase: string;
  overallProgress: number;
  entries: TimelineEntry[];
  totalPhotos: number;
  totalVisits: number;
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRelative(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(dateStr);
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ProjectTimelinePage({ params }: { params: { id: string } }) {
  const [timeline, setTimeline] = useState<ProjectTimelineData | null>(null);
  const [pairs, setPairs] = useState<BeforeAfterPair[]>([]);
  const [activeTab, setActiveTab] = useState<'timeline' | 'compare'>('timeline');
  const [selectedPhoto, setSelectedPhoto] = useState<TimelinePhoto | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [selectedArea, setSelectedArea] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder — replace with actual API calls
    // fetch(`/api/qa/projects/${params.id}/timeline`)
    // fetch(`/api/qa/projects/${params.id}/before-after`)
    setLoading(false);
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">Loading timeline...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {timeline?.projectName || 'Project'} Timeline
          </h1>
          <p className="text-gray-600 mt-1">
            Watch your project come to life, visit by visit.
          </p>
        </div>

        {/* Progress Hero */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-4xl font-bold">
                {timeline?.overallProgress || 0}%
              </div>
              <div className="text-blue-200 text-sm mt-1">Overall Progress</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-200">Current Phase</div>
              <div className="text-lg font-semibold">
                {timeline?.currentPhase || 'Getting Started'}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-1000"
              style={{ width: `${timeline?.overallProgress || 0}%` }}
            />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/20">
            <div className="text-center">
              <div className="text-xl font-bold">{timeline?.totalVisits || 0}</div>
              <div className="text-xs text-blue-200">Site Visits</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{timeline?.totalPhotos || 0}</div>
              <div className="text-xs text-blue-200">Photos</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{pairs.length}</div>
              <div className="text-xs text-blue-200">Comparisons</div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 mb-6 bg-white rounded-lg border border-gray-200 p-1">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'timeline'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            &#128247; Photo Timeline
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'compare'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            &#8596; Before & After
          </button>
        </div>

        {/* ================================================================ */}
        {/* TIMELINE TAB */}
        {/* ================================================================ */}
        {activeTab === 'timeline' && (
          <div className="space-y-1">
            {(timeline?.entries || []).length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <div className="text-gray-300 text-5xl mb-4">&#128247;</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Your Project Timeline
                </h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  As site visits are completed and milestones are reached,
                  you&apos;ll see a visual record of your project&apos;s journey here.
                </p>
                <p className="text-gray-400 text-xs mt-4">
                  GET /api/qa/projects/{params.id}/timeline
                </p>
              </div>
            ) : (
              (timeline?.entries || []).map((entry, index) => {
                const config = TYPE_CONFIG[entry.type] || TYPE_CONFIG.visit;
                const isLast = index === (timeline?.entries || []).length - 1;

                return (
                  <div key={entry.id} className="relative flex gap-4">
                    {/* Timeline connector */}
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg z-10 border-2 border-white shadow-sm ${config.bgColor}`}>
                        {config.icon}
                      </div>
                      {!isLast && (
                        <div className="w-0.5 flex-1 bg-gray-200 my-1" />
                      )}
                    </div>

                    {/* Entry card */}
                    <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden mb-3 hover:shadow-md transition-shadow">
                      <div className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
                              {config.label}
                            </span>
                            <h4 className="text-sm font-medium text-gray-900">
                              {entry.title}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            {entry.progressPercent !== undefined && (
                              <span className={`text-xs font-semibold ${
                                entry.progressPercent >= 80 ? 'text-green-600' :
                                entry.progressPercent >= 50 ? 'text-blue-600' :
                                'text-amber-600'
                              }`}>
                                {entry.progressPercent}%
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {formatRelative(entry.date)}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {entry.description}
                        </p>

                        {entry.phase && (
                          <span className="inline-flex mt-1 text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {entry.phase}
                          </span>
                        )}
                      </div>

                      {/* Photo strip */}
                      {entry.photos.length > 0 && (
                        <div className="px-4 pb-3">
                          <div
                            className="flex gap-2 overflow-x-auto pb-1"
                            style={{ scrollbarWidth: 'none' }}
                          >
                            {entry.photos.map((photo, pidx) => (
                              <div
                                key={pidx}
                                className="flex-shrink-0 w-28 h-24 rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                                onClick={() => setSelectedPhoto(photo)}
                              >
                                <img
                                  src={photo.url}
                                  alt={photo.caption || `Photo ${pidx + 1}`}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Stalled areas warning */}
                      {entry.metadata?.stalledAreas?.length > 0 && (
                        <div className="mx-4 mb-3 bg-amber-50 border border-amber-200 rounded-lg p-2">
                          <div className="text-xs font-medium text-amber-800 mb-1">Areas with No Progress</div>
                          <ul className="text-xs text-amber-700 list-disc list-inside">
                            {entry.metadata?.stalledAreas?.map((area: string, i: number) => (
                              <li key={i}>{area}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* BEFORE/AFTER TAB */}
        {/* ================================================================ */}
        {activeTab === 'compare' && (
          <div>
            {pairs.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <div className="text-gray-300 text-5xl mb-4">&#8596;</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Before &amp; After Comparisons
                </h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  After two or more site visits, AI will automatically match photos
                  from the same areas so you can see the transformation.
                </p>
                <p className="text-gray-400 text-xs mt-4">
                  GET /api/qa/projects/{params.id}/before-after
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Area filter */}
                {(() => {
                  const areas = [...new Set(pairs.map(p => p.area))];
                  if (areas.length <= 1) return null;
                  return (
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setSelectedArea(undefined)}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                          !selectedArea
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        All Areas
                      </button>
                      {areas.map(area => (
                        <button
                          key={area}
                          onClick={() => setSelectedArea(area)}
                          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                            selectedArea === area
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                  );
                })()}

                {/* Slider pairs */}
                {(selectedArea ? pairs.filter(p => p.area === selectedArea) : pairs).map(pair => (
                  <div key={pair.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    {/* Pair header */}
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-900">{pair.area}</h4>
                      {pair.progressPercent !== undefined && (
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                pair.progressPercent >= 80 ? 'bg-green-500' :
                                pair.progressPercent >= 50 ? 'bg-blue-500' :
                                'bg-amber-500'
                              }`}
                              style={{ width: `${pair.progressPercent}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600">
                            {pair.progressPercent}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Interactive slider */}
                    <div
                      className="relative overflow-hidden rounded-xl cursor-col-resize h-80"
                      onMouseDown={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        setSliderPosition((x / rect.width) * 100);
                      }}
                      onMouseMove={(e) => {
                        if (e.buttons === 1) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          setSliderPosition(Math.max(0, Math.min(100, (x / rect.width) * 100)));
                        }
                      }}
                    >
                      {/* After image */}
                      <div className="absolute inset-0">
                        <img
                          src={pair.afterPhotoUrl}
                          alt={`After: ${pair.area}`}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                      </div>

                      {/* Before image (clipped) */}
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ width: `${sliderPosition}%` }}
                      >
                        <img
                          src={pair.beforePhotoUrl}
                          alt={`Before: ${pair.area}`}
                          className="h-full object-cover"
                          style={{ width: '100vw', maxWidth: '800px' }}
                          draggable={false}
                        />
                      </div>

                      {/* Slider line */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
                        style={{ left: `${sliderPosition}%` }}
                      >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center select-none">
                          <span className="text-gray-400 text-xs">&#9664; &#9654;</span>
                        </div>
                      </div>

                      {/* Labels */}
                      <div className="absolute top-3 left-3 z-20">
                        <span className="bg-black/60 text-white text-xs font-medium px-2 py-1 rounded">
                          Before
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 z-20">
                        <span className="bg-black/60 text-white text-xs font-medium px-2 py-1 rounded">
                          After
                        </span>
                      </div>
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

                    {/* Description */}
                    {pair.progressDescription && (
                      <p className="text-xs text-gray-600 mt-3">{pair.progressDescription}</p>
                    )}

                    {/* Phase badges */}
                    {(pair.beforePhase || pair.afterPhase) && (
                      <div className="flex items-center gap-2 mt-2">
                        {pair.beforePhase && (
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {pair.beforePhase}
                          </span>
                        )}
                        {pair.beforePhase && pair.afterPhase && (
                          <span className="text-gray-400">&#8594;</span>
                        )}
                        {pair.afterPhase && (
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                            {pair.afterPhase}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Photo lightbox */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="max-w-4xl max-h-[90vh] relative" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute -top-10 right-0 text-white text-xl hover:text-gray-300"
              >
                &#10005;
              </button>
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption || 'Project photo'}
                className="max-w-full max-h-[85vh] rounded-lg object-contain"
              />
              {selectedPhoto.caption && (
                <p className="text-white text-sm text-center mt-2">{selectedPhoto.caption}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
