'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { TwinAssetGallery } from '@kealee/ui/components/twin/twin-asset-gallery'
import { summarizeCapture } from '@kealee/intake'
import { Loader2, AlertTriangle, CheckCircle2, Clock, Image, Mic, Camera } from 'lucide-react'

interface CaptureDetail {
  id: string
  project_path: string
  address: string
  status: string
  completed_zones: string[]
  required_zones: string[]
  progress_percent: number
  uploaded_assets_count: number
  voice_notes_count: number
  walkthrough_video_uploaded: boolean
  created_at: string
  completed_at?: string | null
}

interface Asset {
  id: string
  zone: string
  storage_url: string
  ai_label?: string | null
  ai_description?: string | null
  created_at: string
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
  completed: {
    bg: '#DCFCE7',
    text: '#166534',
    label: 'Completed',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  in_progress: {
    bg: '#FFF4ED',
    text: '#C2410C',
    label: 'In Progress',
    icon: <Clock className="h-4 w-4" />,
  },
  pending: {
    bg: '#F3F4F6',
    text: '#6B7280',
    label: 'Pending',
    icon: <Clock className="h-4 w-4" />,
  },
}

const ZONE_LABEL = (z: string) =>
  z.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

export default function CaptureSessionDetailPage() {
  const params = useParams()
  const captureSessionId = params.captureSessionId as string

  const [session, setSession] = useState<CaptureDetail | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [sessResp, assetsResp] = await Promise.all([
          fetch(`/api/capture/session?captureSessionId=${captureSessionId}`),
          fetch(`/api/capture/progress?captureSessionId=${captureSessionId}`),
        ])
        if (!sessResp.ok) {
          setError('Capture session not found')
          return
        }
        const sessData = await sessResp.json()
        setSession(sessData)

        // Fetch assets separately
        // (reuse supabase admin via a dedicated endpoint or query params)
        const { supabase } = await import('@supabase/supabase-js').then(async (mod) => {
          const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
          const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          return { supabase: mod.createClient(url, key) }
        })
        const { data: assetsData } = await supabase
          .from('capture_assets')
          .select('id, zone, storage_url, ai_label, ai_description, created_at')
          .eq('capture_session_id', captureSessionId)
          .order('created_at', { ascending: true })
        setAssets(assetsData ?? [])
      } catch {
        setError('Failed to load capture session')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [captureSessionId])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#E8793A' }} />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="text-gray-600">{error}</p>
      </div>
    )
  }

  const statusStyle = STATUS_STYLES[session.status] ?? STATUS_STYLES.pending
  const summary = summarizeCapture({
    progressPercent: session.progress_percent,
    completedZones: session.completed_zones,
    requiredZones: session.required_zones,
    missingRequired: session.required_zones.filter((z) => !session.completed_zones.includes(z)),
    totalAssets: session.uploaded_assets_count,
    voiceNotesCount: session.voice_notes_count,
    walkthroughVideoUploaded: session.walkthrough_video_uploaded,
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>
            Capture Session
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">{session.address}</p>
          <p className="mt-1 text-xs text-gray-400">{summary}</p>
        </div>
        <span
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
          style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
        >
          {statusStyle.icon}
          {statusStyle.label}
        </span>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-5">
        <StatCard icon={<div className="text-sm font-bold">{session.progress_percent}%</div>} label="Progress" />
        <StatCard icon={<Image className="h-4 w-4 text-gray-400" />} value={session.uploaded_assets_count} label="Photos" />
        <StatCard icon={<Mic className="h-4 w-4 text-gray-400" />} value={session.voice_notes_count} label="Voice Notes" />
        <StatCard icon={<Camera className="h-4 w-4 text-gray-400" />} value={session.completed_zones.length} label="Zones Done" />
        <StatCard value={session.required_zones.length} label="Required" />
      </div>

      {/* Progress bar */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold" style={{ color: '#1A2B4A' }}>Zone Completion</h3>
          <span className="text-sm text-gray-500">
            {session.completed_zones.length} / {session.required_zones.length}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 mb-4">
          <div
            className="h-full rounded-full"
            style={{ width: `${session.progress_percent}%`, backgroundColor: '#E8793A' }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {session.required_zones.map((zone) => {
            const done = session.completed_zones.includes(zone)
            return (
              <span
                key={zone}
                className="rounded-full px-2.5 py-1 text-xs font-medium"
                style={done
                  ? { backgroundColor: '#DCFCE7', color: '#166534' }
                  : { backgroundColor: '#F3F4F6', color: '#9CA3AF' }
                }
              >
                {done ? '✓ ' : ''}{ZONE_LABEL(zone)}
              </span>
            )
          })}
        </div>
      </div>

      {/* Asset gallery */}
      {assets.length > 0 && <TwinAssetGallery assets={assets} />}
      {assets.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
          No photos uploaded yet.
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon?: React.ReactNode
  value?: number
  label: string
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-gray-100 bg-white py-3">
      {icon && <span className="mb-1">{icon}</span>}
      {value != null && (
        <span className="text-xl font-bold" style={{ color: '#1A2B4A' }}>
          {value}
        </span>
      )}
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}
