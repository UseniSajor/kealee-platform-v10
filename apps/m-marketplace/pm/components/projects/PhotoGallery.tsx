"use client"

import * as React from "react"
import { Download, Image as ImageIcon, MapPin, Pencil, Search, SlidersHorizontal } from "lucide-react"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@pm/lib/utils"

export type PhotoCategory = "Progress" | "Issue" | "Before" | "After" | "Inspection" | "Materials" | "Other"

export type PhotoItem = {
  id: string
  title: string
  category: PhotoCategory
  capturedAt: string // ISO
  gps?: { lat: number; lon: number }
  file?: File
  objectUrl?: string
  annotations: { id: string; x: number; y: number; text: string }[]
  pairKey?: string // used for before/after grouping
}

export type PhotoGalleryProps = {
  projectId?: string
  initialPhotos?: PhotoItem[]
  className?: string
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}`
}

function isImage(file: File) {
  return /^image\//.test(file.type)
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString()
}

async function downloadCompressedImage(url: string, filename: string) {
  const img = new Image()
  img.decoding = "async"
  img.crossOrigin = "anonymous"
  const loaded = new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error("Failed to load image"))
  })
  img.src = url
  await loaded

  const maxW = 1600
  const scale = Math.min(1, maxW / img.width)
  const w = Math.round(img.width * scale)
  const h = Math.round(img.height * scale)

  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  ctx.drawImage(img, 0, 0, w, h)

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82))
  if (!blob) return
  const dlUrl = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = dlUrl
  a.download = filename.replace(/\.\w+$/, "") + "-compressed.jpg"
  a.click()
  URL.revokeObjectURL(dlUrl)
}

export function PhotoGallery({ projectId, initialPhotos, className }: PhotoGalleryProps) {
  const [photos, setPhotos] = React.useState<PhotoItem[]>(
    initialPhotos ?? [
      {
        id: "ph1",
        title: "Before - living room wall",
        category: "Before",
        capturedAt: "2026-01-11T15:10:00.000Z",
        gps: { lat: 30.2672, lon: -97.7431 },
        objectUrl: "https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=1200&q=70",
        annotations: [{ id: "a1", x: 0.62, y: 0.38, text: "Crack to patch" }],
        pairKey: "living-room-wall",
      },
      {
        id: "ph2",
        title: "After - living room wall",
        category: "After",
        capturedAt: "2026-02-06T17:45:00.000Z",
        gps: { lat: 30.2672, lon: -97.7431 },
        objectUrl: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1200&q=70",
        annotations: [],
        pairKey: "living-room-wall",
      },
      {
        id: "ph3",
        title: "Progress - framing day 1",
        category: "Progress",
        capturedAt: "2026-01-24T13:05:00.000Z",
        gps: { lat: 30.2673, lon: -97.7433 },
        objectUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=70",
        annotations: [],
      },
    ]
  )

  const [query, setQuery] = React.useState("")
  const [category, setCategory] = React.useState<"All" | PhotoCategory>("All")
  const [selected, setSelected] = React.useState<string | null>(null)
  const [annotateMode, setAnnotateMode] = React.useState(false)
  const [compare, setCompare] = React.useState<{ beforeId: string; afterId: string; slider: number } | null>(null)

  const fileRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    return () => {
      for (const p of photos) if (p.file && p.objectUrl && p.objectUrl.startsWith("blob:")) URL.revokeObjectURL(p.objectUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function addFiles(files: FileList | null) {
    if (!files?.length) return
    const now = new Date().toISOString()
    const next: PhotoItem[] = []
    for (const f of Array.from(files)) {
      if (!isImage(f)) continue
      const url = URL.createObjectURL(f)
      next.push({
        id: uid("ph"),
        title: f.name,
        category: "Progress",
        capturedAt: now,
        gps: undefined,
        file: f,
        objectUrl: url,
        annotations: [],
      })
    }
    if (!next.length) return
    setPhotos((prev) => [...next, ...prev])
  }

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return photos.filter((p) => {
      if (category !== "All" && p.category !== category) return false
      if (!q) return true
      return p.title.toLowerCase().includes(q)
    })
  }, [photos, query, category])

  const active = React.useMemo(() => photos.find((p) => p.id === selected) ?? null, [photos, selected])

  function setCategoryFor(id: string, next: PhotoCategory) {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, category: next } : p)))
  }

  function startCompareFromPair(pairKey: string) {
    const before = photos.find((p) => p.pairKey === pairKey && p.category === "Before")
    const after = photos.find((p) => p.pairKey === pairKey && p.category === "After")
    if (!before || !after) return
    setCompare({ beforeId: before.id, afterId: after.id, slider: 50 })
  }

  function downloadOriginal(p: PhotoItem) {
    if (!p.objectUrl) return
    const a = document.createElement("a")
    a.href = p.objectUrl
    a.download = p.title
    a.click()
  }

  function onImageClick(e: React.MouseEvent<HTMLDivElement>, p: PhotoItem) {
    if (!annotateMode) return
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    const text = prompt("Annotation text")?.trim()
    if (!text) return
    setPhotos((prev) =>
      prev.map((ph) =>
        ph.id === p.id ? { ...ph, annotations: [...ph.annotations, { id: uid("a"), x, y, text }] } : ph
      )
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Photos</h2>
          <p className="text-sm text-neutral-600 mt-1">
            Grid gallery with metadata, categories, before/after compare, annotations, and downloads (GPS from EXIF is a placeholder).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setAnnotateMode((v) => !v)} disabled={!active}>
            <Pencil className="h-4 w-4" />
            {annotateMode ? "Exit markup" : "Annotate"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <ImageIcon className="h-4 w-4" />
            Upload photos
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files)
              e.currentTarget.value = ""
            }}
          />
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
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="pl-9 sm:w-64" />
                  </div>
                  <select
                    className="h-9 rounded-md border bg-white px-3 text-sm"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as "All" | PhotoCategory)}
                    aria-label="Category filter"
                  >
                    <option value="All">All categories</option>
                    {(["Progress", "Issue", "Before", "After", "Inspection", "Materials", "Other"] as PhotoCategory[]).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {filtered.length ? (
                  filtered.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelected(p.id)}
                      className={cn(
                        "group rounded-xl border bg-white overflow-hidden text-left transition-colors",
                        selected === p.id ? "ring-2 ring-neutral-900/30" : "hover:bg-neutral-50"
                      )}
                    >
                      <div className="aspect-square bg-neutral-100 relative">
                        {p.objectUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.objectUrl} alt={p.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-neutral-500">
                            <ImageIcon className="h-6 w-6" />
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[10px] text-white">
                          {p.category}
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="font-medium text-neutral-900 truncate">{p.title}</div>
                        <div className="text-xs text-neutral-600 mt-1">{formatDate(p.capturedAt)}</div>
                        {p.gps ? (
                          <div className="mt-1 text-xs text-neutral-600 inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {p.gps.lat.toFixed(4)}, {p.gps.lon.toFixed(4)}
                          </div>
                        ) : null}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="col-span-full rounded-xl border bg-white p-10 text-center text-sm text-neutral-600">
                    No photos match your filters.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {compare ? (
            <Card className="py-0">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Before / after comparison
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setCompare(null)}>
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pb-4 space-y-3">
                {(() => {
                  const before = photos.find((p) => p.id === compare.beforeId)
                  const after = photos.find((p) => p.id === compare.afterId)
                  if (!before?.objectUrl || !after?.objectUrl) return <div className="text-sm text-neutral-600">Missing images.</div>
                  return (
                    <>
                      <div className="relative aspect-[16/9] overflow-hidden rounded-xl border bg-neutral-100">
                        {/* after base */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={after.objectUrl} alt="after" className="absolute inset-0 h-full w-full object-cover" />
                        {/* before clipped */}
                        <div
                          className="absolute inset-0 overflow-hidden"
                          style={{ width: `${compare.slider}%` }}
                          aria-hidden="true"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={before.objectUrl} alt="before" className="h-full w-full object-cover" />
                        </div>
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow"
                          style={{ left: `${compare.slider}%` }}
                          aria-hidden="true"
                        />
                        <div className="absolute left-3 top-3 rounded-full bg-black/70 px-2 py-1 text-[10px] text-white">
                          Before
                        </div>
                        <div className="absolute right-3 top-3 rounded-full bg-black/70 px-2 py-1 text-[10px] text-white">
                          After
                        </div>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={compare.slider}
                        onChange={(e) => setCompare((p) => (p ? { ...p, slider: Number(e.target.value) } : p))}
                        className="w-full"
                        aria-label="Comparison slider"
                      />
                    </>
                  )
                })()}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Photo details</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-4">
              {active ? (
                <>
                  <div className="rounded-xl border bg-white overflow-hidden">
                    <div
                      className={cn("relative aspect-square bg-neutral-100", annotateMode ? "cursor-crosshair" : "")}
                      onClick={(e) => onImageClick(e, active)}
                      role={annotateMode ? "button" : undefined}
                      aria-label={annotateMode ? "Click to add annotation" : undefined}
                    >
                      {active.objectUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={active.objectUrl} alt={active.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-neutral-500">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                      )}
                      {active.annotations.map((a) => (
                        <div
                          key={a.id}
                          className="absolute"
                          style={{ left: `${a.x * 100}%`, top: `${a.y * 100}%` }}
                        >
                          <div className="-translate-x-1/2 -translate-y-1/2">
                            <div className="h-3 w-3 rounded-full bg-red-600 shadow" />
                            <div className="mt-1 rounded-md bg-black/80 px-2 py-1 text-[10px] text-white max-w-[180px]">
                              {a.text}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="font-medium text-neutral-900">{active.title}</div>
                      <div className="text-sm text-neutral-600">{formatDate(active.capturedAt)}</div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-xs text-neutral-600">Category</div>
                        <select
                          className="h-9 rounded-md border bg-white px-3 text-sm"
                          value={active.category}
                          onChange={(e) => setCategoryFor(active.id, e.target.value as PhotoCategory)}
                        >
                          {(["Progress", "Issue", "Before", "After", "Inspection", "Materials", "Other"] as PhotoCategory[]).map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      {active.gps ? (
                        <div className="text-sm text-neutral-700 inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="tabular-nums">
                            {active.gps.lat.toFixed(5)}, {active.gps.lon.toFixed(5)}
                          </span>
                          <span className="text-xs text-neutral-500">(GPS display placeholder)</span>
                        </div>
                      ) : (
                        <div className="text-sm text-neutral-600">No GPS data (placeholder: parse EXIF during upload).</div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <Button variant="outline" size="sm" onClick={() => downloadOriginal(active)} disabled={!active.objectUrl}>
                      <Download className="h-4 w-4" />
                      Download original
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => active.objectUrl && downloadCompressedImage(active.objectUrl, active.title)}
                      disabled={!active.objectUrl}
                    >
                      <Download className="h-4 w-4" />
                      Download compressed
                    </Button>
                  </div>

                  {active.pairKey ? (
                    <Button variant="outline" size="sm" onClick={() => startCompareFromPair(active.pairKey!)}>
                      <SlidersHorizontal className="h-4 w-4" />
                      Compare before/after
                    </Button>
                  ) : (
                    <div className="text-sm text-neutral-600">
                      Before/after compare is available when photos share the same <code className="px-1 rounded bg-neutral-100">pairKey</code>.
                    </div>
                  )}

                  <div className="text-xs text-neutral-600">
                    Project: <span className="font-medium text-neutral-900">{projectId ?? "—"}</span>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border bg-white p-6 text-sm text-neutral-600">
                  Select a photo to see details, GPS, and markups.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 text-sm text-neutral-600 space-y-2">
              <div>
                - GPS tagging is shown from sample data; real implementation should parse EXIF on upload (or accept mobile app metadata).
              </div>
              <div>
                - Markups are lightweight pin annotations (placeholder). For full markups, use canvas drawing + export overlays.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

