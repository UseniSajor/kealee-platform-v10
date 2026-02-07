'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Users,
  DollarSign,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Search,
  ArrowUpRight,
} from 'lucide-react'

interface Contractor {
  id: string
  name: string
  email: string
  accountStatus: 'active' | 'pending' | 'restricted' | 'none'
  isOnboarded: boolean
  canReceivePayments: boolean
  totalPaid: number
  pendingPayments: number
}

interface PendingRelease {
  id: string
  projectName: string
  milestoneName: string
  contractorName: string
  contractorAccountId: string
  amount: number
  escrowId: string
  status: string
}

interface PayoutRecord {
  id: string
  contractorName: string
  projectName: string
  amount: number
  platformFee: number
  netAmount: number
  status: string
  createdAt: string
}

export default function ContractorPaymentsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [pendingReleases, setPendingReleases] = useState<PendingRelease[]>([])
  const [payoutHistory, setPayoutHistory] = useState<PayoutRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'contractors' | 'history'>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [releasing, setReleasing] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [contractorsRes, releasesRes, historyRes] = await Promise.all([
        fetch('/api/payments/contractors'),
        fetch('/api/payments/pending-releases'),
        fetch('/api/payments/payout-history'),
      ])

      if (contractorsRes.ok) {
        const data = await contractorsRes.json()
        setContractors(data.contractors || [])
      }
      if (releasesRes.ok) {
        const data = await releasesRes.json()
        setPendingReleases(data.releases || [])
      }
      if (historyRes.ok) {
        const data = await historyRes.json()
        setPayoutHistory(data.payouts || [])
      }
    } catch (err) {
      console.error('Failed to load contractor payment data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRelease = async (release: PendingRelease) => {
    if (!confirm(`Release $${release.amount.toLocaleString()} to ${release.contractorName} for "${release.milestoneName}"?`)) {
      return
    }

    setReleasing(release.id)
    try {
      const res = await fetch('/api/payments/release-milestone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escrowId: release.escrowId,
          milestoneId: release.id,
          amount: Math.round(release.amount * 100),
          contractorAccountId: release.contractorAccountId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to release payment')
      }

      await loadData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setReleasing(null)
    }
  }

  const totalPendingAmount = pendingReleases.reduce((sum, r) => sum + r.amount, 0)
  const totalPaidOut = payoutHistory
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.netAmount, 0)

  const filteredContractors = contractors.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const accountStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Active</span>
      case 'pending': return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">Pending</span>
      case 'restricted': return <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">Restricted</span>
      default: return <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">No Account</span>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Contractor Payments</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Manage milestone releases, contractor payouts, and Connect accounts
        </p>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2.5">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-600">Pending Releases</p>
              <p className="text-lg font-bold text-neutral-900">{pendingReleases.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2.5">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-600">Pending Amount</p>
              <p className="text-lg font-bold text-neutral-900">${totalPendingAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2.5">
              <Send className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-600">Total Paid Out</p>
              <p className="text-lg font-bold text-neutral-900">${totalPaidOut.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2.5">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-600">Contractors</p>
              <p className="text-lg font-bold text-neutral-900">{contractors.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-neutral-200">
        <div className="flex gap-6">
          {(['pending', 'contractors', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 pb-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {tab === 'pending' ? `Pending Releases (${pendingReleases.length})` : tab === 'contractors' ? 'Contractors' : 'Payout History'}
            </button>
          ))}
        </div>
      </div>

      {/* Pending Releases Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-3">
          {pendingReleases.length === 0 ? (
            <div className="rounded-xl border border-neutral-200 bg-white py-16 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-300" />
              <h3 className="mt-4 text-sm font-medium text-neutral-900">All caught up</h3>
              <p className="mt-1 text-sm text-neutral-500">No pending milestone releases at this time.</p>
            </div>
          ) : (
            pendingReleases.map((release) => (
              <div key={release.id} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-neutral-900">{release.milestoneName}</h3>
                    <p className="text-sm text-neutral-600">{release.projectName}</p>
                    <p className="text-xs text-neutral-500">Contractor: {release.contractorName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-neutral-900">
                      ${release.amount.toLocaleString()}
                    </p>
                    <button
                      onClick={() => handleRelease(release)}
                      disabled={releasing === release.id}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {releasing === release.id ? (
                        'Releasing...'
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          Release
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Contractors Tab */}
      {activeTab === 'contractors' && (
        <div>
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contractors..."
              className="w-full rounded-lg border border-neutral-300 py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
            {filteredContractors.length === 0 ? (
              <div className="py-16 text-center">
                <Users className="mx-auto h-12 w-12 text-neutral-300" />
                <h3 className="mt-4 text-sm font-medium text-neutral-900">No contractors found</h3>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {filteredContractors.map((contractor) => (
                  <div key={contractor.id} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-600">
                        {contractor.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{contractor.name}</p>
                        <p className="text-xs text-neutral-500">{contractor.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-neutral-900">
                          ${contractor.totalPaid.toLocaleString()}
                        </p>
                        <p className="text-xs text-neutral-500">total paid</p>
                      </div>
                      {accountStatusBadge(contractor.accountStatus)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payout History Tab */}
      {activeTab === 'history' && (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          {payoutHistory.length === 0 ? (
            <div className="py-16 text-center">
              <ArrowUpRight className="mx-auto h-12 w-12 text-neutral-300" />
              <h3 className="mt-4 text-sm font-medium text-neutral-900">No payout history</h3>
              <p className="mt-1 text-sm text-neutral-500">Completed payouts will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {payoutHistory.map((payout) => (
                <div key={payout.id} className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{payout.contractorName}</p>
                      <p className="text-xs text-neutral-500">{payout.projectName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-neutral-900">${payout.netAmount.toLocaleString()}</p>
                      <p className="text-xs text-neutral-500">
                        fee: ${payout.platformFee.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-neutral-500">
                      {new Date(payout.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    {payout.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                        <Clock className="h-3 w-3" />
                        {payout.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
