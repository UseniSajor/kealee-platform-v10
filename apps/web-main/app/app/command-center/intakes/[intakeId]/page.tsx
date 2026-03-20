'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ArrowLeft, Camera, Building2, CheckCircle2, Clock, Loader2, AlertTriangle, ExternalLink } from 'lucide-react'

interface IntakeDetail {
  id: string
  project_path: string
  client_name: string
  contact_email: string
  contact_phone?: string
  project_address: string
  budget_range?: string
  status: string
  requires_payment: boolean
  payment_amount: number
  created_at: string
  form_data: Record<string, unknown>
  assigned_to?: string | null
  notes?: string | null
}

interface CaptureSession {
  id: string
  status: string
  progress_percent: number
  uploaded_assets_count: number
  completed_zones: string[]
  required_zones: string[]
  created_at: string
  completed_at?: string | null
}

interface Twin {
  id: string
  status: string
  creation_path: string
  created_at: string
}

const INTAKE_STATUSES = ['new', 'in_review', 'active', 'completed', 'cancelled']

const PATH_LABELS: Record<string, string> = {
  exterior_concept: 'Exterior Concept',
  interior_renovation: 'Interior Renovation',
  whole_home_remodel: 'Whole-Home Remodel',
  addition_expansion: 'Addition / Expansion',
  design_build: 'Design + Build',
  permit_path_only: 'Permit Path',
  capture_site_concept: 'Site Capture',
}

export default function IntakeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const intakeId = params.intakeId as string

  const [intake, setIntake] = useState<IntakeDetail | null>(null)
  const [captureSessions, setCaptureSessions] = useState<CaptureSession[]>([])
  const [twin, setTwin] = useState<Twin | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusUpdating, setStatusUpdating] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const resp = await fetch(`/api/command-center/intakes/${intakeId}`)
        if (!resp.ok) {
          setError('Intake not found')
          return
        }
        const { intake: i, captureSessions: cs, twin: t } = await resp.json()
        setIntake(i)
        setCaptureSessions(cs)
        setTwin(t)
      } catch {
        setError('Failed to load intake')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [intakeId])

  async function handleStatusChange(newStatus: string) {
    if (!intake) return
    setStatusUpdating(true)
    try {
      const resp = await fetch(`/api/command-center/intakes/${intakeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (resp.ok) {
        setIntake((prev) => prev ? { ...prev, status: newStatus } : prev)
      }
    } finally {
      setStatusUpdating(false)
    }
  }

  async function handleCreateCaptureSession() {
    if (!intake) return
    const resp = await fetch('/api/capture/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_path: intake.project_path,
        intake_id: intake.id,
        address: intake.project_address,
        client_name: intake.client_name,
      }),
    })
    const data = await resp.json()
    if (resp.ok) {
      router.push(`/intake/${intake.project_path}/capture?intakeId=${intake.id}`)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#E8793A' }} />
      </div>
    )
  }

  if (error || !intake) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="text-gray-600">{error ?? 'Intake not found'}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Back nav */}
      <button
        onClick={() => router.push('/app/command-center/intakes')}
        className="mb-5 flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Intake Queue
      </button>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>
            {intake.client_name}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">{intake.project_address}</p>
          <span
            className="mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ backgroundColor: '#F0F9FF', color: '#0369A1' }}
          >
            {PATH_LABELS[intake.project_path] ?? intake.project_path}
          </span>
        </div>

        {/* Status control */}
        <div className="flex items-center gap-2">
          <select
            value={intake.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={statusUpdating}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-50"
          >
            {INTAKE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Client info */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 font-semibold" style={{ color: '#1A2B4A' }}>Client Details</h3>
          <dl className="space-y-3 text-sm">
            <Row label="Email" value={intake.contact_email} />
            {intake.contact_phone && <Row label="Phone" value={intake.contact_phone} />}
            {intake.budget_range && <Row label="Budget" value={intake.budget_range} />}
            <Row
              label="Submitted"
              value={new Date(intake.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            />
          </dl>
        </div>

        {/* Form data summary */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 font-semibold" style={{ color: '#1A2B4A' }}>Form Data</h3>
          <dl className="space-y-2 text-sm">
            {Object.entries(intake.form_data ?? {}).slice(0, 8).map(([key, value]) => (
              <Row
                key={key}
                label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}
                value={String(value)}
              />
            ))}
          </dl>
        </div>

        {/* Digital twin */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: '#1A2B4A' }}>Digital Twin</h3>
            {twin && (
              <button
                onClick={() => router.push(`/app/projects/unknown/twin?twinId=${twin.id}`)}
                className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600"
              >
                View <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {twin ? (
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-800">Twin created</p>
                <p className="text-xs text-gray-400">
                  Path: {twin.creation_path.replace(/_/g, ' ')} ·{' '}
                  Status: {twin.status}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No digital twin yet.</p>
          )}
        </div>

        {/* Capture sessions */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: '#1A2B4A' }}>Capture Sessions</h3>
            <button
              onClick={handleCreateCaptureSession}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white"
              style={{ backgroundColor: '#E8793A' }}
            >
              <Camera className="h-3.5 w-3.5" />
              New Capture
            </button>
          </div>
          {captureSessions.length === 0 ? (
            <p className="text-sm text-gray-400">No capture sessions yet.</p>
          ) : (
            <div className="space-y-2">
              {captureSessions.map((cs) => (
                <button
                  key={cs.id}
                  onClick={() => router.push(`/app/projects/unknown/captures/${cs.id}`)}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-left hover:bg-orange-50/40 transition-colors"
                >
                  {cs.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 text-orange-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 capitalize">{cs.status.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-400">
                      {cs.progress_percent}% · {cs.uploaded_assets_count} photos ·{' '}
                      {cs.completed_zones.length}/{cs.required_zones.length} zones
                    </p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-gray-400 flex-shrink-0">{label}</dt>
      <dd className="text-right font-medium text-gray-700 truncate">{value}</dd>
    </div>
  )
}
