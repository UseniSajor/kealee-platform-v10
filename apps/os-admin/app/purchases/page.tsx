'use client'

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import {
  ShoppingBag, CheckCircle, Clock, AlertCircle,
  Search, RefreshCw, Loader2, Mail, MapPin,
} from 'lucide-react'

interface Purchase {
  id: string
  project_path: string
  client_name: string
  contact_email: string
  contact_phone: string | null
  project_address: string
  status: string
  payment_amount: number
  created_at: string
  form_data: Record<string, unknown> | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  paid:        { label: 'Paid',        color: '#38A169', bg: '#38A16915', icon: CheckCircle },
  new:         { label: 'New',         color: '#2ABFBF', bg: '#2ABFBF15', icon: Clock },
  processing:  { label: 'Processing',  color: '#E8793A', bg: '#E8793A15', icon: Clock },
  error:       { label: 'Error',       color: '#E53E3E', bg: '#E53E3E15', icon: AlertCircle },
}

function formatAmount(cents: number) {
  if (!cents) return '—'
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading]     = useState(true)
  const [live, setLive]           = useState(false)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatus] = useState('all')

  async function fetchPurchases() {
    setLoading(true)
    try {
      const res = await fetch('/api/purchases')
      if (!res.ok) throw new Error('fetch failed')
      const body = await res.json()
      setPurchases(body.purchases ?? [])
      setLive(body.live ?? false)
    } catch {
      setPurchases([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPurchases() }, [])

  const filtered = purchases.filter(p => {
    const q = search.toLowerCase()
    const matchSearch =
      p.client_name?.toLowerCase().includes(q) ||
      p.contact_email?.toLowerCase().includes(q) ||
      p.project_path?.toLowerCase().includes(q) ||
      p.project_address?.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalPaid    = purchases.filter(p => p.status === 'paid').length
  const totalRevenue = purchases
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (p.payment_amount ?? 0), 0)

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="p-6 sm:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Purchases &amp; Inquiries</h1>
              <p className="mt-1 text-sm text-gray-500">
                {live ? 'Live data from Supabase' : 'Intake submissions from kealee.com'}
              </p>
            </div>
            <button
              onClick={fetchPurchases}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </button>
          </div>

          {/* Stats row */}
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Intakes',     value: purchases.length, color: '#1A2B4A' },
              { label: 'Paid',              value: totalPaid,        color: '#38A169' },
              { label: 'Pending',           value: purchases.filter(p => p.status === 'new').length, color: '#2ABFBF' },
              { label: 'Revenue (intakes)', value: formatAmount(totalRevenue), color: '#E8793A' },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or service..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'paid', 'new', 'processing', 'error'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition ${
                    statusFilter === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <ShoppingBag className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No purchases found.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filtered.map(p => {
                  const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.new
                  const Icon = cfg.icon
                  return (
                    <div key={p.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                        <ShoppingBag className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">{p.client_name}</p>
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-medium flex items-center gap-1"
                            style={{ backgroundColor: cfg.bg, color: cfg.color }}
                          >
                            <Icon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {p.project_path.replace(/_/g, ' ')}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {p.contact_email}
                          </span>
                          {p.project_address && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate max-w-[200px]">{p.project_address}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-gray-900">{formatAmount(p.payment_amount)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(p.created_at)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
