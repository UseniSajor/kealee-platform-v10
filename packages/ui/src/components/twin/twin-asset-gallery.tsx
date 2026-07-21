'use client'

import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'

interface TwinAsset {
  id: string
  zone: string
  storage_url: string
  ai_label?: string | null
  ai_description?: string | null
  created_at: string
}

interface TwinAssetGalleryProps {
  assets: TwinAsset[]
}

const ZONE_LABEL = (zone: string) =>
  zone.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

export function TwinAssetGallery({ assets }: TwinAssetGalleryProps) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // Unique zones
  const zones = Array.from(new Set(assets.map((a) => a.zone)))

  const filtered = selectedZone
    ? assets.filter((a) => a.zone === selectedZone)
    : assets

  function openLightbox(index: number) {
    setLightboxIndex(index)
  }

  function closeLightbox() {
    setLightboxIndex(null)
  }

  function prevImage() {
    setLightboxIndex((i) => (i != null ? Math.max(0, i - 1) : 0))
  }

  function nextImage() {
    setLightboxIndex((i) => (i != null ? Math.min(filtered.length - 1, i + 1) : 0))
  }

  const lightboxAsset = lightboxIndex != null ? filtered[lightboxIndex] : null

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold" style={{ color: '#1A2B4A' }}>
          Photo Gallery
        </h3>
        <span className="text-sm text-gray-400">{assets.length} photos</span>
      </div>

      {/* Zone filter pills */}
      {zones.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedZone(null)}
            className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
            style={
              selectedZone === null
                ? { backgroundColor: '#1A2B4A', color: '#fff' }
                : { backgroundColor: '#F3F4F6', color: '#6B7280' }
            }
          >
            All ({assets.length})
          </button>
          {zones.map((zone) => {
            const count = assets.filter((a) => a.zone === zone).length
            return (
              <button
                key={zone}
                onClick={() => setSelectedZone(zone)}
                className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                style={
                  selectedZone === zone
                    ? { backgroundColor: '#E8793A', color: '#fff' }
                    : { backgroundColor: '#F3F4F6', color: '#6B7280' }
                }
              >
                {ZONE_LABEL(zone)} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-400">No photos in this zone.</div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((asset, idx) => (
            <button
              key={asset.id}
              onClick={() => openLightbox(idx)}
              className="group relative overflow-hidden rounded-xl border border-gray-100 bg-gray-50 aspect-square"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.storage_url}
                alt={asset.ai_label ?? ZONE_LABEL(asset.zone)}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {asset.ai_label && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="truncate text-xs text-white">{asset.ai_label}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxAsset && lightboxIndex != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={closeLightbox}
          >
            <X className="h-5 w-5" />
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 disabled:opacity-30"
            onClick={(e) => { e.stopPropagation(); prevImage() }}
            disabled={lightboxIndex === 0}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 disabled:opacity-30"
            onClick={(e) => { e.stopPropagation(); nextImage() }}
            disabled={lightboxIndex === filtered.length - 1}
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div
            className="mx-auto max-h-[85vh] max-w-3xl px-16"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxAsset.storage_url}
              alt={lightboxAsset.ai_label ?? ZONE_LABEL(lightboxAsset.zone)}
              className="max-h-[75vh] w-full rounded-xl object-contain"
            />
            <div className="mt-3 text-center">
              <p className="text-sm font-medium text-white">
                {ZONE_LABEL(lightboxAsset.zone)}
              </p>
              {lightboxAsset.ai_label && (
                <p className="mt-1 text-xs text-gray-400">{lightboxAsset.ai_label}</p>
              )}
              {lightboxAsset.ai_description && (
                <p className="mt-1 text-xs text-gray-400">{lightboxAsset.ai_description}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {lightboxIndex + 1} / {filtered.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
