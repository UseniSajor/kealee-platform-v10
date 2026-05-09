'use client'

/**
 * ReelCarousel — Construction video carousel
 *
 * Shows build-phase reels relevant to the user's project type.
 * TikTok/Instagram-style vertical reel cards.
 *
 * Videos are currently placeholder cards (stock_videos.ts has empty src strings).
 * Replace with Pexels/Vimeo URLs when available.
 */

import { useState } from 'react'
import { Play, ExternalLink } from 'lucide-react'
import { CONSTRUCTION_REELS } from '@kealee/pascal-wrapper'
import type { ProjectType } from '@kealee/pascal-wrapper'

// Representative thumbnail colors per construction phase
const PHASE_COLORS: Record<string, string> = {
  demo:         '#EF4444',
  framing:      '#F59E0B',
  foundation:   '#78716C',
  roofing:      '#6B7280',
  cabinets:     '#8B5CF6',
  countertops:  '#10B981',
  tile:         '#0284C7',
  appliances:   '#64748B',
  plumbing:     '#0284C7',
  electrical:   '#F59E0B',
  flooring:     '#A16207',
  finishes:     '#E8724B',
  reveal:       '#10B981',
  excavation:   '#78716C',
  structural:   '#1A2B4A',
  hvac:         '#6B7280',
  insulation:   '#D97706',
  glass:        '#0EA5E9',
  waterproof:   '#0284C7',
  drywall:      '#E5E7EB',
  timelapse:    '#6366F1',
  millwork:     '#92400E',
  outdoor:      '#16A34A',
  exterior:     '#E8724B',
  facade:       '#E8724B',
  renovation:   '#6366F1',
  commercial:   '#1A2B4A',
  interior:     '#8B5CF6',
}

function getPhaseColor(tags: string[]): string {
  for (const tag of tags) {
    if (PHASE_COLORS[tag]) return PHASE_COLORS[tag]
  }
  return '#1A2B4A'
}

interface Props {
  projectType: ProjectType
}

export default function ReelCarousel({ projectType }: Props) {
  const reels = CONSTRUCTION_REELS[projectType] ?? CONSTRUCTION_REELS['kitchen_remodel']
  const [activeIdx, setActiveIdx] = useState<number | null>(null)

  return (
    <div className="p-4 flex flex-col h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div className="mb-4">
        <p className="font-bold text-slate-900 text-sm mb-1">Construction Reels</p>
        <p className="text-xs text-slate-500">
          Real build phases for your project type — so you know exactly what to expect.
        </p>
      </div>

      {/* Phase list */}
      <div className="space-y-3 flex-1 overflow-y-auto">
        {reels.map((reel, i) => {
          const color = getPhaseColor(reel.tags)
          const isActive = activeIdx === i
          return (
            <div
              key={i}
              className={`rounded-xl border-2 overflow-hidden transition-all cursor-pointer ${
                isActive ? 'border-[#E8724B]' : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => setActiveIdx(isActive ? null : i)}
            >
              {/* Thumbnail */}
              <div
                className="h-40 flex flex-col items-center justify-center relative"
                style={{ background: `linear-gradient(135deg, ${color}20, ${color}40)` }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg mb-2"
                  style={{ backgroundColor: color }}
                >
                  <Play className="w-6 h-6 text-white ml-1" fill="white" />
                </div>
                <p className="text-xs font-bold text-slate-700 px-4 text-center">{reel.title}</p>
                {/* Phase tags */}
                <div className="flex gap-1.5 mt-2 flex-wrap justify-center px-3">
                  {reel.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                      style={{ backgroundColor: `${color}30`, color }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Expanded content */}
              {isActive && (
                <div className="bg-white p-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">
                    This phase covers the {reel.title.toLowerCase()} portion of your {projectType.replace(/_/g, ' ')}.
                    Kealee build managers verify each milestone before any payment releases.
                  </p>
                  <div className="flex gap-2">
                    <span className="text-xs text-slate-400 flex items-center gap-1 flex-1">
                      ⏱ Milestone verified
                    </span>
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(reel.tags.join(' ') + ' construction timelapse')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-[#E8724B] font-semibold hover:underline"
                    >
                      Watch examples <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom CTA */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-500 text-center">
          Kealee manages every phase shown above — site visits, milestone verification, and payment protection.
        </p>
      </div>
    </div>
  )
}
