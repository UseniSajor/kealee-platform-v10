'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCw, Filter, ChevronRight, Camera, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

interface IntakeRow {
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
  captureSessionCount: number
}

const STATUS_META: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  new: { label: 'New', bg: '#DBEAFE', text: '#1E40AF', icon: <AlertCircle className="h-3.5 w-3.5" /> },
  in_review: { label: 'In Review', bg: '#FEF3C7', text: '#92400E', icon: <Clock className="h-3.5 w-3.5" /> },
  active: { label: 'Active', bg: '#DCFCE7', text: '#166534', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  completed: { label: 'Completed', bg: '#F3F4F6', text: '#6B7280', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  cancelled: { label: 'Cancelled', bg: '#FFE4E6', text: '#9F1239', icon: <AlertCircle className="h-3.5 w-3.5" /> },
}

const PATH_LABELS: Record<string, string> = {
  exterior_concept: 'Exterior Concept',
  interior_renovation: 'Interior Renovation',
  kitchen_remodel: 'Kitchen Remodel',
  bathroom_remodel: 'Bathroom Remodel',
  whole_home_remodel: 'Whole-Home Remodel',
  addition_expansion: 'Addition / Expansion',
  design_build: 'Design + Build',
  permit_path_only: 'Permit Path',
  capture_site_concept: 'Site Capture',
}

export default function CommandCenterIntakesPage() {
  const router = useRouter()
  const [intakes, setIntakes] = useState<IntakeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [pathFilter, setPathFilter] = useState<string>('')
  const [total, setTotal] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (pathFilter) params.set('projectPath', pathFilter)
      params.set('limit', '100')
      const resp = await fetch(`/api/command-center/intakes?${params}`)
      if (!resp.ok) return
      const { intakes: data, total: t } = await resp.json()
      setIntakes(data)
      setTotal(t)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, pathFilter])

  useEffect(() => { load() }, [load])

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>
            Intake Queue
          </h1>
          <p className="text-sm text-gray-500">{total} total intakes</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <select
          value={pathFilter}
          onChange={(e) => setPathFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        >
          <option value="">All Paths</option>
          {Object.entries(PATH_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Table / List */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
        </div>
      ) : intakes.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center text-sm text-gray-400">
          No intakes found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Client</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Path</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 hidden sm:table-cell">Address</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 hidden md:table-cell">Captures</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 hidden lg:table-cell">Date</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {intakes.map((intake) => {
                const statusMeta = STATUS_META[intake.status] ?? STATUS_META.new
                return (
                  <tr
                    key={intake.id}
                    onClick={() => router.push(`/app/command-center/intakes/${intake.id}`)}
                    className="cursor-pointer hover:bg-orange-50/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-800">{intake.client_name}</p>
                        <p className="text-xs text-gray-400">{intake.contact_email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{ backgroundColor: '#F0F9FF', color: '#0369A1' }}
                      >
                        {PATH_LABELS[intake.project_path] ?? intake.project_path}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-gray-500 sm:table-cell max-w-[180px] truncate">
                      {intake.project_address}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{ backgroundColor: statusMeta.bg, color: statusMeta.text }}
                      >
                        {statusMeta.icon}
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      {intake.captureSessionCount > 0 ? (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Camera className="h-3.5 w-3.5" />
                          {intake.captureSessionCount}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-gray-400 lg:table-cell">
                      {new Date(intake.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-2 py-3">
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
