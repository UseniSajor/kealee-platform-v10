'use client'

/**
 * RenderPanel — AI Render Generation Panel
 *
 * User selects:
 * - Room type (kitchen, bathroom, living, bedroom, exterior)
 * - Design style (modern, farmhouse, contemporary, luxury, etc.)
 * - Render quality (standard, realistic, cinematic)
 * - Optional custom prompt
 *
 * Submits to POST /api/editor/renders
 * Polls GET /api/editor/renders/[id] for completion
 * Shows generated renders in a grid
 */

import { useState, useCallback, useEffect } from 'react'
import { Sparkles, Loader2, AlertCircle, Download, RefreshCw } from 'lucide-react'
import type { ProjectType } from '@kealee/pascal-wrapper'

const ROOM_TYPES = [
  { id: 'kitchen',   label: 'Kitchen' },
  { id: 'bathroom',  label: 'Bathroom' },
  { id: 'living',    label: 'Living Room' },
  { id: 'bedroom',   label: 'Bedroom' },
  { id: 'exterior',  label: 'Exterior' },
  { id: 'dining',    label: 'Dining Room' },
]

const STYLES = [
  { id: 'modern',       label: 'Modern', color: '#1A2B4A' },
  { id: 'farmhouse',    label: 'Farmhouse', color: '#92400E' },
  { id: 'contemporary', label: 'Contemporary', color: '#6B7280' },
  { id: 'luxury',       label: 'Luxury', color: '#6B46C1' },
  { id: 'transitional', label: 'Transitional', color: '#0284C7' },
  { id: 'industrial',   label: 'Industrial', color: '#374151' },
]

const RENDER_MODES = [
  { id: 'standard',  label: 'Standard' },
  { id: 'realistic', label: 'Realistic' },
  { id: 'cinematic', label: 'Cinematic' },
]

interface RenderJob {
  jobId: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  outputUrls: string[]
  style: string
  roomType: string
}

interface Props {
  sceneId: string
  projectType: ProjectType
}

export default function RenderPanel({ sceneId, projectType }: Props) {
  const defaultRoom = projectType === 'kitchen_remodel' ? 'kitchen' :
                      projectType === 'bath_remodel'    ? 'bathroom' : 'living'

  const [roomType,    setRoomType]    = useState(defaultRoom)
  const [style,       setStyle]       = useState('modern')
  const [renderMode,  setRenderMode]  = useState('realistic')
  const [extraPrompt, setExtraPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [jobs,        setJobs]        = useState<RenderJob[]>([])
  const [error,       setError]       = useState<string | null>(null)

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/editor/renders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneId, roomType, style, renderMode, prompt: extraPrompt || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to start render')

      const newJob: RenderJob = {
        jobId:      data.jobId,
        status:     'PENDING',
        outputUrls: [],
        style,
        roomType,
      }
      setJobs(prev => [newJob, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Render failed')
    } finally {
      setIsGenerating(false)
    }
  }, [sceneId, roomType, style, renderMode, extraPrompt])

  // Poll pending/processing jobs
  useEffect(() => {
    const pending = jobs.filter(j => j.status === 'PENDING' || j.status === 'PROCESSING')
    if (pending.length === 0) return

    const interval = setInterval(async () => {
      for (const job of pending) {
        try {
          const res = await fetch(`/api/editor/renders/${job.jobId}`)
          const data = await res.json()
          if (data.status !== job.status || data.outputUrls?.length > 0) {
            setJobs(prev => prev.map(j => j.jobId === job.jobId ? {
              ...j,
              status:     data.status,
              outputUrls: data.outputUrls ?? [],
            } : j))
          }
        } catch { /* ignore */ }
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [jobs])

  return (
    <div className="p-4 flex flex-col h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div className="mb-4">
        <p className="font-bold text-slate-900 text-sm mb-1">AI Design Renders</p>
        <p className="text-xs text-slate-500">Generate photorealistic renders of your space in any style.</p>
      </div>

      {/* Room type */}
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Room Type</p>
        <div className="flex flex-wrap gap-2">
          {ROOM_TYPES.map(rt => (
            <button
              key={rt.id}
              onClick={() => setRoomType(rt.id)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                roomType === rt.id ? 'border-[#E8724B] bg-orange-50 text-[#E8724B]' : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {rt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Style */}
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Design Style</p>
        <div className="grid grid-cols-3 gap-2">
          {STYLES.map(s => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              className={`text-xs font-semibold py-2 rounded-lg border transition ${
                style === s.id ? 'text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
              style={{
                borderColor: style === s.id ? s.color : undefined,
                backgroundColor: style === s.id ? s.color : undefined,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Render mode */}
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Render Quality</p>
        <div className="flex gap-2">
          {RENDER_MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setRenderMode(m.id)}
              className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition ${
                renderMode === m.id ? 'border-[#1A2B4A] bg-[#1A2B4A] text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Extra prompt */}
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Additional Notes (optional)</p>
        <textarea
          value={extraPrompt}
          onChange={e => setExtraPrompt(e.target.value)}
          placeholder="e.g. 'dark countertops, large island, pendant lights'"
          rows={2}
          className="w-full text-xs border border-slate-200 rounded-lg p-2 resize-none outline-none focus:border-[#E8724B]"
        />
      </div>

      {/* Generate button */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-500 mb-3">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition mb-5"
      >
        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {isGenerating ? 'Submitting...' : 'Generate Design Render'}
      </button>

      {/* Results */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {jobs.map(job => (
          <div key={job.jobId} className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
              <span className="text-xs font-semibold text-slate-700 capitalize">{job.style} {job.roomType}</span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                job.status === 'COMPLETED'  ? 'bg-green-100 text-green-700' :
                job.status === 'FAILED'     ? 'bg-red-100 text-red-600' :
                'bg-orange-100 text-orange-700'
              }`}>
                {job.status === 'PROCESSING' ? 'Generating...' : job.status}
              </span>
            </div>

            {(job.status === 'PENDING' || job.status === 'PROCESSING') && (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-xs">AI is rendering your design...</span>
              </div>
            )}

            {job.status === 'COMPLETED' && job.outputUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-1 p-1">
                {job.outputUrls.map((url, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden aspect-video bg-slate-200">
                    <img src={url} alt={`Render ${i + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <a href={url} download target="_blank" rel="noopener noreferrer"
                        className="bg-white/90 rounded-full p-1.5" onClick={e => e.stopPropagation()}>
                        <Download className="w-3.5 h-3.5 text-slate-700" />
                      </a>
                      <button
                        onClick={() => {/* TODO: set as header image */}}
                        className="bg-[#E8724B]/90 rounded-full p-1.5">
                        <RefreshCw className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {job.status === 'FAILED' && (
              <div className="flex items-center gap-2 px-3 py-4 text-xs text-red-500">
                <AlertCircle className="w-4 h-4 shrink-0" /> Render failed — please try again
              </div>
            )}
          </div>
        ))}

        {jobs.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-400">
            Generated renders will appear here.
          </div>
        )}
      </div>
    </div>
  )
}
