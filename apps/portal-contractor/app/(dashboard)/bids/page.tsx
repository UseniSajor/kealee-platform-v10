'use client'

import { useEffect, useState } from 'react'
import { Clock, CheckCircle, XCircle, AlertCircle, DollarSign, Calendar, Cpu, Layers, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuthToken } from '@/hooks/useAuth'
import { CSI_DIVISIONS, PAYMENT_MILESTONES, twinTierLabels } from '@/lib/constants'

interface CsiBreakdown {
  division: string
  amount: number
}

interface Bid {
  id: string
  project: string
  projectType: string
  twinTier: string
  amount: number
  submitted: string
  status: string
  deadline: string
  client: string
  clientRole: string
  csiBreakdown: CsiBreakdown[]
  milestoneSchedule: { key: string; amount: number }[]
}

// Skeleton loader
function BidsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
      ))}
    </div>
  )
}

// Error message
function ErrorMessage({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-red-900 font-semibold">{message}</p>
      <button
        onClick={onRetry}
        className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
      >
        Try Again
      </button>
    </div>
  )
}

export default function BidsPage() {
  const token = useAuthToken()
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    const fetchBids = async () => {
      if (!token) return
      try {
        const res = await fetch('/api/v1/contractor/bids', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('Failed to load bids')
        const data = await res.json()
        setBids(Array.isArray(data) ? data : data.bids || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        console.error('Failed to fetch bids:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBids()
  }, [token])

  if (loading) return <BidsSkeleton />
  if (error) return <ErrorMessage message={error} onRetry={() => { setLoading(true); setError(null) }} />
  if (!bids.length) return <div className="text-gray-500 text-center py-8">No bids yet</div>

  const filtered = filter === 'all' ? bids : bids.filter(b => b.status === filter)
  const statusCounts = {
    all: bids.length,
    pending: bids.filter(b => b.status === 'pending').length,
    shortlisted: bids.filter(b => b.status === 'shortlisted').length,
    won: bids.filter(b => b.status === 'won').length,
    lost: bids.filter(b => b.status === 'lost').length,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won': return '#10B981'
      case 'lost': return '#EF4444'
      case 'shortlisted': return '#F59E0B'
      default: return '#6B7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'won': return <CheckCircle className="w-5 h-5" />
      case 'lost': return <XCircle className="w-5 h-5" />
      case 'shortlisted': return <AlertCircle className="w-5 h-5" />
      default: return <Clock className="w-5 h-5" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bid Management</h1>
        <p className="text-gray-600 mt-2">Track and manage your project bids</p>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {(['all', 'pending', 'shortlisted', 'won', 'lost'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
              filter === status
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status as keyof typeof statusCounts]})
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-gray-500 text-center py-8">No bids found</div>
        ) : (
          filtered.map((bid) => (
            <BidCard key={bid.id} bid={bid} getStatusColor={getStatusColor} getStatusIcon={getStatusIcon} />
          ))
        )}
      </div>
    </div>
  )
}

// Bid card component
function BidCard({ bid, getStatusColor, getStatusIcon }: { bid: Bid; getStatusColor: (s: string) => string; getStatusIcon: (s: string) => React.ReactNode }) {
  const [expanded, setExpanded] = useState(false)
  const daysLeft = Math.ceil((new Date(bid.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <div className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div style={{ color: getStatusColor(bid.status) }}>{getStatusIcon(bid.status)}</div>
            <h3 className="font-semibold text-gray-900">{bid.project}</h3>
          </div>
          <p className="text-sm text-gray-600">{bid.client} • {bid.projectType}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg">${(bid.amount / 100).toLocaleString()}</p>
          <p className={`text-xs mt-1 ${daysLeft < 3 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
            {daysLeft} days left
          </p>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 ml-2" /> : <ChevronDown className="w-5 h-5 ml-2" />}
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Submitted</p>
              <p className="font-medium">{new Date(bid.submitted).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Twin Tier</p>
              <p className="font-medium">{twinTierLabels[bid.twinTier]?.label || bid.twinTier}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2">CSI Breakdown</p>
            <div className="space-y-1">
              {bid.csiBreakdown.map((item) => (
                <div key={item.division} className="flex justify-between text-sm">
                  <span className="text-gray-600">{CSI_DIVISIONS[item.division] || `Division ${item.division}`}</span>
                  <span className="font-medium">${(item.amount / 100).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2">Payment Milestones</p>
            <div className="space-y-1">
              {bid.milestoneSchedule.map((milestone) => {
                const milestoneMeta = PAYMENT_MILESTONES.find(m => m.key === milestone.key)
                return (
                  <div key={milestone.key} className="flex justify-between text-sm">
                    <span className="text-gray-600">{milestoneMeta?.name || milestone.key}</span>
                    <span className="font-medium">${(milestone.amount / 100).toLocaleString()}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
