'use client'

import { useState } from 'react'
import { VideoPlayer } from '@/components/VideoPlayer'
import { ImageGallery } from '@/components/ImageGallery'
import { VideoComparison } from '@/components/VideoComparison'
import type { ServiceMedia } from '@/components/media/types'

interface MediaShowcaseProps {
  serviceKey: string
  media: ServiceMedia
  projectTitle: string
  layout?: 'stacked' | 'side'
}

type TabId = 'video' | 'gallery'

export function MediaShowcase({
  serviceKey,
  media,
  projectTitle,
  layout = 'stacked',
}: MediaShowcaseProps) {
  const hasVideo = !!media.heroVideo
  const hasGallery = media.galleryImages.length > 0
  const hasBeforeAfter =
    media.beforeAfterPairs && media.beforeAfterPairs.length > 0
  const showTabs = hasVideo && hasGallery

  const [activeTab, setActiveTab] = useState<TabId>('video')

  // Determine what to show in the video slot
  function VideoSlot() {
    if (hasBeforeAfter && media.beforeAfterPairs![0]) {
      const pair = media.beforeAfterPairs![0]
      return (
        <VideoComparison
          beforeVideoUrl={pair.beforeImage.src}
          afterVideoUrl={pair.afterImage.src}
          projectType={serviceKey}
          projectTitle={projectTitle}
        />
      )
    }
    if (hasVideo) {
      return (
        <VideoPlayer
          video={media.heroVideo!}
          autoPlayOnScroll
          context={serviceKey}
        />
      )
    }
    return null
  }

  if (!hasVideo && !hasGallery) return null

  // ── Side layout (video left, gallery right) ─────────────────────────────
  if (layout === 'side' && hasVideo && hasGallery) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <VideoSlot />
        </div>
        <div>
          <ImageGallery images={media.galleryImages} columns={2} showFilter context={serviceKey} />
        </div>
      </div>
    )
  }

  // ── Stacked layout with optional tabs ────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      {showTabs && (
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
          {([['video', 'Video Preview'], ['gallery', 'Photo Gallery']] as [TabId, string][]).map(
            ([id, label]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="rounded-lg px-4 py-1.5 text-sm font-semibold transition-all"
                style={{
                  backgroundColor: activeTab === id ? '#fff' : 'transparent',
                  color: activeTab === id ? '#1A2B4A' : '#6B7280',
                  boxShadow: activeTab === id ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
                }}
              >
                {label}
              </button>
            )
          )}
        </div>
      )}

      {/* Content */}
      {(!showTabs || activeTab === 'video') && hasVideo && (
        <VideoSlot />
      )}
      {(!showTabs || activeTab === 'gallery') && hasGallery && (
        <ImageGallery
          images={media.galleryImages}
          columns={3}
          showFilter
          context={serviceKey}
        />
      )}
    </div>
  )
}
