'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

export const dynamic = 'force-dynamic'

type ContractWithStatus = {
  id: string
  projectId: string
  status: string
  totalAmount: number | null
  docusignEnvelopeId: string | null
  needsSignature: boolean
  pendingSigners: string[]
  lastSignatureDate: Date | null
  project: { id: string; name: string }
  owner: { id: string; name: string; email: string }
  contractor: { id: string; name: string; email: string } | null
  milestones: Array<{ id: string; name: string; amount: number; status: string }>
  updatedAt: string
}

export default function ContractsDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [contracts, setContracts] = useState<ContractWithStatus[]>([])
  const [pendingSignatures, setPendingSignatures] = useState<Array<{ id: string; projectName: string; daysPending: number; projectId: string }>>([])
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'signed' | 'active'>('all')

  const loadDashboard = useCallback(async () => {
    try {
      const [contractsRes, pendingRes] = await Promise.all([
        api.getContractsDashboard().catch(() => ({ contracts: [] })),
        api.getPendingSignatures().catch(() => ({ pending: [] })),
      ])
      setContracts(contractsRes.contracts || [])
      setPendingSignatures(pendingRes.pending || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-neutral-100 text-neutral-700'
      case 'SENT':
        return 'bg-blue-100 text-blue-700'
      case 'SIGNED':
        return 'bg-green-100 text-green-700'
      case 'ACTIVE':
        return 'bg-purple-100 text-purple-700'
      case 'CANCELLED':
        return 'bg-red-100 text-red-700'
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-neutral-100 text-neutral-700'
    }
  }

  const filteredContracts = contracts.filter((contract) => {
    if (filter === 'pending') return contract.needsSignature
    if (filter === 'signed') return contract.status === 'SIGNED'
    if (filter === 'active') return contract.status === 'ACTIVE'
    return true
  })

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <div>Loading dashboard...</div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Contracts Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-600">Monitor all your contracts in one place</p>
      </header>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      {/* Pending Signatures Alert (Prompt 2.5) */}
      {pendingSignatures.length > 0 ? (
        <section className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-900">⚠️ Action Required</h2>
          <p className="mt-2 text-sm text-amber-800">
            You have {pendingSignatures.length} contract{pendingSignatures.length !== 1 ? 's' : ''} waiting for your signature:
          </p>
          <div className="mt-4 space-y-2">
            {pendingSignatures.map((pending) => (
              <div key={pending.id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-white p-3">
                <div>
                  <p className="font-medium text-neutral-900">{pending.projectName}</p>
                  <p className="text-sm text-neutral-600">
                    Pending for {pending.daysPending} day{pending.daysPending !== 1 ? 's' : ''}
                  </p>
                </div>
                <Link
                  href={`/projects/${pending.projectId}/contracts/${pending.id}`}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
                >
                  Sign Now
                </Link>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Filters (Prompt 2.6) */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          All Contracts
        </button>
        <button
          type="button"
          onClick={() => setFilter('pending')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          Pending Signature ({contracts.filter((c) => c.needsSignature).length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('signed')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            filter === 'signed' ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          Signed ({contracts.filter((c) => c.status === 'SIGNED').length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('active')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            filter === 'active' ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          Active ({contracts.filter((c) => c.status === 'ACTIVE').length})
        </button>
      </div>

      {/* Contracts List (Prompt 2.5 & 2.6) */}
      {filteredContracts.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
          <p className="text-neutral-600">No contracts found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContracts.map((contract) => (
            <div
              key={contract.id}
              className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-neutral-900">{contract.project.name}</h3>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(contract.status)}`}>
                      {contract.status}
                    </span>
                    {contract.needsSignature ? (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                        ⚠️ Needs Your Signature
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-neutral-600 sm:grid-cols-2">
                    {contract.totalAmount ? (
                      <div>
                        <span className="font-medium">Amount:</span>{' '}
                        ${Number(contract.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    ) : null}
                    {contract.contractor ? (
                      <div>
                        <span className="font-medium">Contractor:</span> {contract.contractor.name}
                      </div>
                    ) : null}
                    {contract.milestones.length > 0 ? (
                      <div>
                        <span className="font-medium">Milestones:</span> {contract.milestones.length}
                      </div>
                    ) : null}
                    {contract.lastSignatureDate ? (
                      <div>
                        <span className="font-medium">Last signed:</span>{' '}
                        {new Date(contract.lastSignatureDate).toLocaleDateString()}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link
                    href={`/projects/${contract.projectId}/contracts/${contract.id}`}
                    className="rounded-lg border border-neutral-300 px-4 py-2 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    View Details
                  </Link>
                  {contract.status === 'SIGNED' || contract.status === 'ACTIVE' ? (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const blob = await api.downloadSignedContract(contract.id)
                          const url = window.URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `contract_${contract.id}.pdf`
                          document.body.appendChild(a)
                          a.click()
                          window.URL.revokeObjectURL(url)
                          document.body.removeChild(a)
                        } catch (e: unknown) {
                          alert(e instanceof Error ? e.message : 'Failed to download')
                        }
                      }}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      Download PDF
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status Legend (Prompt 2.6) */}
      <section className="mt-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">Status Indicators</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700">DRAFT</span>
            <span className="text-neutral-600">Draft, not sent</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">SENT</span>
            <span className="text-neutral-600">Sent for signature</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">SIGNED</span>
            <span className="text-neutral-600">Fully signed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">ACTIVE</span>
            <span className="text-neutral-600">Project active</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">CANCELLED</span>
            <span className="text-neutral-600">Cancelled</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">ARCHIVED</span>
            <span className="text-neutral-600">Archived</span>
          </div>
        </div>
      </section>
    </main>
  )
}
