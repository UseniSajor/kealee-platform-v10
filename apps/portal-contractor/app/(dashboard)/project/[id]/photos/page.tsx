'use client'

/**
 * /project/[id]/photos — Site Photos
 *
 * Backed by:
 *   GET  /site-tools/photos?projectId=...
 *   POST /site-tools/photos
 *
 * Note: photos are referenced by URL (no file-upload/presign flow exists for
 * this bucket that a contractor can call — /api/v1/projects/:id/photos does
 * have a presigned-upload flow, but it's gated to the project owner via
 * `ownerId: userId`, so it 404s for a contractor). Until a contractor-facing
 * upload endpoint exists, this page records photos already hosted elsewhere
 * (e.g. a phone's cloud backup link) rather than faking a file picker that
 * has nowhere real to upload to.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { constructionOS, type Photo } from '../../../../../lib/api/construction-os'

interface Props { params: { id: string } }

const CATEGORIES: { value: NonNullable<Photo['category']>; label: string; color: string }[] = [
  { value: 'PROGRESS',    label: 'Progress',    color: '#2ABFBF' },
  { value: 'INSPECTION',  label: 'Inspection',  color: '#7C3AED' },
  { value: 'ISSUE',       label: 'Issue',       color: '#F87171' },
  { value: 'COMPLETION',  label: 'Completion',  color: '#38A169' },
]

function categoryColor(cat?: Photo['category']) {
  return CATEGORIES.find((c) => c.value === cat)?.color ?? '#6B7280'
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Add Photo Modal ─────────────────────────────────────────────────────────

function AddPhotoModal({
  projectId,
  onClose,
  onCreated,
}: {
  projectId: string
  onClose:   () => void
  onCreated: (photo: Photo) => void
}) {
  const [url, setUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [category, setCategory] = useState<NonNullable<Photo['category']>>('PROGRESS')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!url.trim()) { setError('Photo URL is required'); return }
    setLoading(true)
    setError(null)
    try {
      const { data } = await constructionOS.photos.create({
        projectId,
        url: url.trim(),
        caption: caption.trim() || undefined,
        category,
      })
      onCreated(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#1a2535] rounded-2xl border border-white/10 w-full max-w-md">
        <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Add Photo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-900/30 border border-rose-500/30 rounded-lg text-rose-300 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Photo URL *</label>
            <input
              type="url"
              placeholder="https://…"
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="w-full bg-[#243852] border border-white/10 rounded-xl text-white text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2ABFBF]"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as NonNullable<Photo['category']>)}
              className="w-full bg-[#243852] border border-white/10 rounded-xl text-white text-sm px-3 py-2.5 focus:outline-none"
            >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Caption</label>
            <input
              type="text"
              placeholder="Foundation pour, north side…"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              className="w-full bg-[#243852] border border-white/10 rounded-xl text-white text-sm px-3 py-2.5 focus:outline-none"
            />
          </div>
        </div>

        <div className="border-t border-white/10 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-white/10 rounded-xl text-gray-300 text-sm hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 bg-[#2ABFBF] hover:bg-[#22a8a8] text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : 'Add Photo'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProjectPhotosPage({ params }: Props) {
  const { id } = params
  const [photos,     setPhotos]     = useState<Photo[]>([])
  const [total,      setTotal]      = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [showAdd,    setShowAdd]    = useState(false)
  const [page,       setPage]       = useState(1)

  async function fetchPhotos(p = 1) {
    try {
      const result = await constructionOS.photos.list({ projectId: id, page: p, limit: 24 })
      if (p === 1) setPhotos(result.data)
      else         setPhotos(prev => [...prev, ...result.data])
      setTotal(result.pagination?.total ?? result.data.length)
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPhotos() }, [id])

  return (
    <div className="min-h-screen bg-[#0f1c2e] text-white">
      {showAdd && (
        <AddPhotoModal
          projectId={id}
          onClose={() => setShowAdd(false)}
          onCreated={photo => { setPhotos(prev => [photo, ...prev]); setTotal(t => t + 1); setShowAdd(false) }}
        />
      )}

      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href={`/project/${id}`} className="hover:text-gray-300">← Project</Link>
            </div>
            <h1 className="text-xl font-bold">Photos</h1>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-[#2ABFBF] hover:bg-[#22a8a8] text-white text-sm font-semibold rounded-xl transition-colors"
          >
            + Add Photo
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6">
        {loading && <p className="text-gray-400 animate-pulse text-center py-12">Loading photos...</p>}

        {error && (
          <div className="p-4 bg-rose-900/30 border border-rose-500/30 rounded-xl text-rose-300 text-sm mb-4">
            {error}
          </div>
        )}

        {!loading && !error && photos.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📷</p>
            <p className="text-gray-400">No photos yet.</p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-4 px-5 py-2.5 bg-[#2ABFBF] text-white rounded-xl text-sm font-semibold"
            >
              Add First Photo
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map(photo => (
            <a
              key={photo.id}
              href={photo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-[#1e2d45]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.thumbnailUrl || photo.url}
                alt={photo.caption || 'Site photo'}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                {photo.category && (
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold text-white mb-1"
                    style={{ backgroundColor: categoryColor(photo.category) }}
                  >
                    {photo.category}
                  </span>
                )}
                <p className="text-[10px] text-gray-300 truncate">{fmtDate(photo.createdAt)}</p>
              </div>
            </a>
          ))}
        </div>

        {photos.length < total && (
          <button
            onClick={() => { const next = page + 1; setPage(next); fetchPhotos(next) }}
            className="w-full mt-4 py-3 border border-white/10 rounded-xl text-gray-400 text-sm hover:bg-white/5"
          >
            Load more ({total - photos.length} remaining)
          </button>
        )}
      </main>
    </div>
  )
}
