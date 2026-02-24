"use client"

import * as React from "react"
import { Download, MapPin, Search, Tag, Trash2 } from "lucide-react"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@pm/lib/utils"

type GlobalPhoto = {
  id: string
  title: string
  project: string
  capturedAt: string // ISO
  tags: string[]
  locationText?: string
  gps?: { lat: number; lon: number }
  url: string
}

function downloadUrl(url: string, filename: string) {
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.target = "_blank"
  a.rel = "noreferrer"
  a.click()
}

export default function PhotosPage() {
  const [photos, setPhotos] = React.useState<GlobalPhoto[]>([
    {
      id: "g1",
      title: "Framing progress - day 1",
      project: "Project demo-project",
      capturedAt: "2026-01-24T13:05:00.000Z",
      tags: ["framing", "progress"],
      locationText: "Austin, TX",
      gps: { lat: 30.2673, lon: -97.7433 },
      url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=70",
    },
    {
      id: "g2",
      title: "Before - living room wall",
      project: "Project demo-project",
      capturedAt: "2026-01-11T15:10:00.000Z",
      tags: ["before", "interior"],
      locationText: "Austin, TX",
      gps: { lat: 30.2672, lon: -97.7431 },
      url: "https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=1200&q=70",
    },
    {
      id: "g3",
      title: "After - living room wall",
      project: "Project demo-project",
      capturedAt: "2026-02-06T17:45:00.000Z",
      tags: ["after", "interior"],
      locationText: "Austin, TX",
      gps: { lat: 30.2672, lon: -97.7431 },
      url: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1200&q=70",
    },
    {
      id: "g4",
      title: "Permit board posted",
      project: "Project alpha",
      capturedAt: "2026-01-09T09:22:00.000Z",
      tags: ["permits", "inspection"],
      locationText: "Dallas, TX",
      gps: { lat: 32.7767, lon: -96.797 },
      url: "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=1200&q=70",
    },
  ])

  const [query, setQuery] = React.useState("")
  const [tagQuery, setTagQuery] = React.useState("")
  const [locationQuery, setLocationQuery] = React.useState("")

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const selectedCount = selectedIds.size

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const tq = tagQuery.trim().toLowerCase()
    const lq = locationQuery.trim().toLowerCase()
    return photos.filter((p) => {
      if (q && !(p.title.toLowerCase().includes(q) || p.project.toLowerCase().includes(q))) return false
      if (tq && !p.tags.some((t) => t.toLowerCase().includes(tq))) return false
      if (lq && !(p.locationText ?? "").toLowerCase().includes(lq)) return false
      return true
    })
  }, [photos, query, tagQuery, locationQuery])

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllVisible() {
    setSelectedIds(new Set(filtered.map((p) => p.id)))
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  async function bulkDownloadOriginal() {
    const ids = [...selectedIds]
    if (!ids.length) return
    // Browser limitation: no zip without dependency; download sequentially.
    for (const id of ids) {
      const p = photos.find((x) => x.id === id)
      if (p) downloadUrl(p.url, `${p.title}.jpg`)
      // small delay to avoid popup blockers in some browsers
      await new Promise((r) => setTimeout(r, 150))
    }
  }

  function bulkDelete() {
    if (!selectedIds.size) return
    if (!confirm(`Delete ${selectedIds.size} photo(s)? (placeholder)`)) return
    setPhotos((prev) => prev.filter((p) => !selectedIds.has(p.id)))
    clearSelection()
  }

  function bulkAddTag() {
    if (!selectedIds.size) return
    const t = prompt("Tag to add")?.trim()
    if (!t) return
    setPhotos((prev) =>
      prev.map((p) => (selectedIds.has(p.id) ? { ...p, tags: Array.from(new Set([...p.tags, t])) } : p))
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Photos</h1>
          <p className="text-neutral-600 mt-1">All project photos with location/tag search and bulk operations (placeholder data).</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={selectAllVisible} disabled={!filtered.length}>
            Select visible
          </Button>
          <Button variant="outline" size="sm" onClick={clearSelection} disabled={!selectedCount}>
            Clear selection
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="py-0">
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">Gallery</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title/projectâ€¦" className="pl-9 sm:w-60" />
                  </div>
                  <div className="relative">
                    <Tag className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <Input value={tagQuery} onChange={(e) => setTagQuery(e.target.value)} placeholder="Tagâ€¦" className="pl-9 sm:w-44" />
                  </div>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <Input value={locationQuery} onChange={(e) => setLocationQuery(e.target.value)} placeholder="Locationâ€¦" className="pl-9 sm:w-44" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {filtered.map((p) => {
                  const selected = selectedIds.has(p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleSelect(p.id)}
                      className={cn(
                        "rounded-xl border bg-white overflow-hidden text-left transition-colors",
                        selected ? "ring-2 ring-neutral-900/30" : "hover:bg-neutral-50"
                      )}
                      aria-pressed={selected}
                    >
                      <div className="aspect-square bg-neutral-100 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.url} alt={p.title} className="h-full w-full object-cover" />
                        {selected ? (
                          <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
                        ) : null}
                        <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[10px] text-white">
                          {p.project}
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="font-medium text-neutral-900 truncate">{p.title}</div>
                        <div className="text-xs text-neutral-600 mt-1">{new Date(p.capturedAt).toLocaleString()}</div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {p.tags.slice(0, 3).map((t) => (
                            <span key={t} className="rounded-full border bg-neutral-50 px-2 py-0.5 text-[10px] text-neutral-700">
                              {t}
                            </span>
                          ))}
                          {p.tags.length > 3 ? (
                            <span className="rounded-full border bg-white px-2 py-0.5 text-[10px] text-neutral-600">
                              +{p.tags.length - 3}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  )
                })}
                {!filtered.length ? (
                  <div className="col-span-full rounded-xl border bg-white p-10 text-center text-sm text-neutral-600">
                    No photos match your search.
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Bulk operations</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <div className="rounded-xl border bg-white p-4">
                <div className="text-sm text-neutral-600">Selected</div>
                <div className="mt-1 text-2xl font-bold tabular-nums">{selectedCount}</div>
                <div className="text-xs text-neutral-600 mt-1">
                  Placeholder bulk actions; real implementation can include zipping and cloud batch operations.
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => void bulkDownloadOriginal()} disabled={!selectedCount}>
                <Download className="h-4 w-4" />
                Download originals
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={bulkAddTag} disabled={!selectedCount}>
                <Tag className="h-4 w-4" />
                Add tag
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={bulkDelete} disabled={!selectedCount}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


