'use client'

/**
 * UploadZone — Drag-and-drop file upload for Pascal Editor
 *
 * Accepts: room photos, floor plans, PDFs, sketches, inspiration images
 * After upload: shows vision analysis status, extracted geometry summary
 * Offers: "Apply to Scene" to convert AI geometry into wall data
 */

import { useState, useCallback, useRef } from 'react'
import { Upload, CheckCircle2, AlertCircle, Loader2, X, Eye } from 'lucide-react'
import { ROOM_COLORS, DEFAULT_CEILING_HEIGHT_FT, type RoomType, type PascalSceneData } from '@kealee/pascal-wrapper'

const VISION_ROOM_TYPE_MAP: Record<string, RoomType> = {
  living: 'living', living_room: 'living', family_room: 'living',
  dining: 'dining', dining_room: 'dining',
  kitchen: 'kitchen',
  bedroom: 'bedroom', primary_bedroom: 'bedroom', master_bedroom: 'bedroom',
  bathroom: 'bathroom', bath: 'bathroom', primary_bathroom: 'bathroom',
  half_bath: 'half_bath', powder_room: 'half_bath',
  office: 'office', study: 'office',
  garage: 'garage',
  basement: 'basement',
  utility: 'utility', laundry: 'utility', laundry_room: 'utility',
  hallway: 'hallway', hall: 'hallway',
  closet: 'closet',
  mud_room: 'mud_room', mudroom: 'mud_room',
  foyer: 'foyer', entry: 'foyer',
  sunroom: 'sunroom',
  game_room: 'game_room',
  gym: 'gym',
  studio: 'studio',
  deck: 'deck',
  patio: 'patio',
}

function toRoomType(label: string): RoomType {
  return VISION_ROOM_TYPE_MAP[label.toLowerCase().trim().replace(/\s+/g, '_')] ?? 'other'
}

interface UploadedFile {
  id: string
  name: string
  type: string
  url: string
  visionStatus: 'idle' | 'pending' | 'processing' | 'completed' | 'failed'
  visionResult?: {
    rooms?: { type: string; estimatedSqFt: number; description: string }[]
    totalEstimatedSqFt?: number
    style?: string
    confidence?: number
    notes?: string
  }
}

const UPLOAD_TYPES = [
  { id: 'PHOTO',       label: 'Room Photo',    accept: 'image/*',       desc: 'Interior or exterior photos' },
  { id: 'FLOOR_PLAN',  label: 'Floor Plan',    accept: 'image/*,.pdf',  desc: 'Existing drawings or plans' },
  { id: 'SKETCH',      label: 'Sketch',        accept: 'image/*',       desc: 'Hand-drawn layouts' },
  { id: 'INSPIRATION', label: 'Inspiration',   accept: 'image/*',       desc: 'Style references, mood boards' },
]

interface Props {
  sceneId: string
}

export default function UploadZone({ sceneId }: Props) {
  const [uploads, setUploads] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [activeType, setActiveType] = useState('PHOTO')
  const [isUploading, setIsUploading] = useState(false)
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())
  const [applyingId, setApplyingId] = useState<string | null>(null)

  // The live canvas (PascalEditor) owns its own in-memory store and doesn't
  // listen for external updates, so this persists rooms to the saved scene
  // via the same PUT the editor's autosave uses, then reloads to pick it up.
  const applyToScene = useCallback(async (upload: UploadedFile) => {
    const rooms = upload.visionResult?.rooms
    if (!rooms || rooms.length === 0) return
    setApplyingId(upload.id)
    try {
      const getRes = await fetch(`/api/editor/scenes/${sceneId}`)
      if (!getRes.ok) throw new Error('Failed to load scene')
      const { scene } = await getRes.json()
      const sceneData = scene.scene_data as PascalSceneData
      const floor = sceneData.floors[0]
      if (!floor) throw new Error('Scene has no floor to add rooms to')

      let xOffset = floor.rooms.reduce((max, r) => {
        const maxX = Math.max(...r.polygon.map(p => p.x))
        return Math.max(max, maxX)
      }, 0)
      if (xOffset > 0) xOffset += 2

      for (const room of rooms) {
        const sqFt = Math.max(room.estimatedSqFt ?? 100, 16)
        const side = Math.sqrt(sqFt)
        const type = toRoomType(room.type)
        floor.rooms.push({
          id: crypto.randomUUID(),
          floorId: floor.id,
          name: room.description || room.type,
          type,
          polygon: [
            { x: xOffset, y: 0 },
            { x: xOffset + side, y: 0 },
            { x: xOffset + side, y: side },
            { x: xOffset, y: side },
          ],
          areaSqFt: sqFt,
          floorMaterial: 'hardwood',
          ceilingHeight: DEFAULT_CEILING_HEIGHT_FT,
          color: ROOM_COLORS[type],
          level: floor.level,
        })
        xOffset += side + 2
      }

      const putRes = await fetch(`/api/editor/scenes/${sceneId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneData }),
      })
      if (!putRes.ok) throw new Error('Failed to save scene')

      setAppliedIds(prev => new Set(prev).add(upload.id))
      window.location.reload()
    } catch (err) {
      console.error('[UploadZone] applyToScene failed:', err)
    } finally {
      setApplyingId(null)
    }
  }, [sceneId])
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(async (file: File) => {
    const tempId = crypto.randomUUID()
    setUploads(prev => [...prev, {
      id: tempId, name: file.name, type: activeType,
      url: URL.createObjectURL(file), visionStatus: 'pending',
    }])

    try {
      const form = new FormData()
      form.append('file', file)
      form.append('sceneId', sceneId)
      form.append('uploadType', activeType)
      form.append('analyzeNow', activeType === 'INSPIRATION' ? 'false' : 'true')

      setIsUploading(true)
      const res = await fetch('/api/editor/upload', { method: 'POST', body: form })
      const { upload } = await res.json()

      setUploads(prev => prev.map(u => u.id === tempId ? {
        ...u, id: upload.id, url: upload.file_url, visionStatus: 'processing',
      } : u))

      // Poll for vision completion (max 30s)
      if (activeType !== 'INSPIRATION') {
        let attempts = 0
        const poll = setInterval(async () => {
          attempts++
          if (attempts > 15) { clearInterval(poll); return }
          try {
            const sceneUploads = await fetch(`/api/editor/scenes/${sceneId}`).then(r => r.json())
            const current = sceneUploads.scene?.uploads?.find((u: { id: string }) => u.id === upload.id)
            if (current?.vision_status === 'completed') {
              setUploads(prev => prev.map(u => u.id === upload.id ? {
                ...u, visionStatus: 'completed', visionResult: current.vision_result,
              } : u))
              clearInterval(poll)
            } else if (current?.vision_status === 'failed') {
              setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, visionStatus: 'failed' } : u))
              clearInterval(poll)
            }
          } catch { /* ignore */ }
        }, 2000)
      }
    } catch {
      setUploads(prev => prev.map(u => u.id === tempId ? { ...u, visionStatus: 'failed' } : u))
    } finally {
      setIsUploading(false)
    }
  }, [sceneId, activeType])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    Array.from(e.dataTransfer.files).forEach(uploadFile)
  }, [uploadFile])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach(uploadFile)
    e.target.value = ''
  }, [uploadFile])

  const removeUpload = (id: string) => setUploads(prev => prev.filter(u => u.id !== id))

  return (
    <div className="p-4 flex flex-col h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div className="mb-4">
        <p className="font-bold text-slate-900 text-sm mb-1">Upload Photos or Plans</p>
        <p className="text-xs text-slate-500">AI reads geometry from your uploads and suggests edits to your floor plan.</p>
      </div>

      {/* Upload type selector */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {UPLOAD_TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveType(t.id)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
              activeType === t.id ? 'border-[#E8724B] bg-orange-50 text-[#E8724B]' : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-4 ${
          isDragging ? 'border-[#E8724B] bg-orange-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'
        }`}
      >
        <Upload className="w-8 h-8 mx-auto mb-3 text-slate-400" />
        <p className="text-sm font-semibold text-slate-700 mb-1">
          {isDragging ? 'Drop to upload' : 'Drag files here or click to browse'}
        </p>
        <p className="text-xs text-slate-400">
          {UPLOAD_TYPES.find(t => t.id === activeType)?.desc}
        </p>
        <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP, PDF — max 25 MB</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={UPLOAD_TYPES.find(t => t.id === activeType)?.accept}
          multiple
          onChange={handleFileChange}
        />
      </div>

      {/* Uploaded files */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {uploads.map(u => (
          <div key={u.id} className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="flex items-start gap-3">
              {/* Thumbnail */}
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                {u.url && u.type !== 'PDF' && (
                  <img src={u.url} alt={u.name} className="w-full h-full object-cover" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate mb-1">{u.name}</p>

                {/* Status */}
                <div className="flex items-center gap-1.5 mb-2">
                  {u.visionStatus === 'processing' && <Loader2 className="w-3 h-3 text-[#E8724B] animate-spin" />}
                  {u.visionStatus === 'completed'  && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                  {u.visionStatus === 'failed'     && <AlertCircle className="w-3 h-3 text-red-400" />}
                  {u.visionStatus === 'pending'    && <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />}
                  <span className="text-[10px] text-slate-500">
                    {u.visionStatus === 'processing' ? 'AI analyzing...' :
                     u.visionStatus === 'completed'  ? 'Analysis complete' :
                     u.visionStatus === 'failed'     ? 'Analysis failed' :
                     'Uploading...'}
                  </span>
                </div>

                {/* Vision results summary */}
                {u.visionStatus === 'completed' && u.visionResult && (
                  <div className="bg-slate-50 rounded-lg p-2 text-[10px] text-slate-600 space-y-0.5">
                    {u.visionResult.totalEstimatedSqFt && (
                      <p><span className="font-semibold">Est. area:</span> {u.visionResult.totalEstimatedSqFt} sf</p>
                    )}
                    {u.visionResult.style && (
                      <p><span className="font-semibold">Style:</span> {u.visionResult.style}</p>
                    )}
                    {u.visionResult.rooms && u.visionResult.rooms.length > 0 && (
                      <p><span className="font-semibold">Rooms:</span> {u.visionResult.rooms.map(r => r.type).join(', ')}</p>
                    )}
                    {u.visionResult.notes && (
                      <p className="text-slate-500 italic">{u.visionResult.notes}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[#6B46C1] font-semibold">
                        Confidence: {Math.round((u.visionResult.confidence ?? 0) * 100)}%
                      </span>
                      <button
                        onClick={() => applyToScene(u)}
                        disabled={appliedIds.has(u.id) || applyingId === u.id}
                        className="flex items-center gap-1 text-[#E8724B] font-semibold text-[10px] disabled:text-slate-400"
                      >
                        {applyingId === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                        {applyingId === u.id ? 'Applying…' : appliedIds.has(u.id) ? 'Applied' : 'Apply to Scene'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => removeUpload(u.id)} className="text-slate-300 hover:text-slate-500 shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {uploads.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-xs">
            No uploads yet. Drop files above.
          </div>
        )}
      </div>
    </div>
  )
}
