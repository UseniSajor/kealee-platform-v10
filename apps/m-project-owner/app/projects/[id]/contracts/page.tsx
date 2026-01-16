'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { api, Contract } from '@/lib/api'

export default function ContractsPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [error, setError] = useState<string | null>(null)

  const loadContracts = useCallback(async () => {
    try {
      const res = await api.listProjectContracts(params.id)
      setContracts(res.contracts || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load contracts')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    loadContracts()
  }, [loadContracts])


  if (loading) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-6">
        <div>Loading contracts...</div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6">
      <nav aria-label="Breadcrumb" className="text-sm text-neutral-600">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link className="underline underline-offset-4" href="/">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link className="underline underline-offset-4" href={`/projects/${params.id}`}>
              Project
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-neutral-800">Contracts</li>
        </ol>
      </nav>

      <header className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Contracts</h1>
          <p className="mt-1 text-sm text-neutral-600">Manage all contracts for this project</p>
        </div>
        <Link
          href={`/projects/${params.id}/contracts/new`}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Contract
        </Link>
      </header>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      {contracts.length === 0 ? (
        <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
          <p className="text-neutral-600">No contracts yet</p>
          <Link
            href={`/projects/${params.id}/contracts/new`}
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Your First Contract
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {contracts.map((contract) => (
            <Link
              key={contract.id}
              href={`/projects/${params.id}/contracts/${contract.id}`}
              className="block rounded-xl border border-neutral-200 bg-white p-6 shadow-sm hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-neutral-900">Contract #{contract.id.slice(0, 8)}</h3>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        contract.status === 'DRAFT'
                          ? 'bg-neutral-100 text-neutral-700'
                          : contract.status === 'SENT'
                            ? 'bg-blue-100 text-blue-700'
                            : contract.status === 'SIGNED'
                              ? 'bg-green-100 text-green-700'
                              : contract.status === 'ACTIVE'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {contract.status}
                    </span>
                  </div>
                  {contract.totalAmount ? (
                    <p className="mt-2 text-sm text-neutral-600">
                      Total: ${Number(contract.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  ) : null}
                  {contract.contractor ? (
                    <p className="mt-1 text-sm text-neutral-600">
                      Contractor: {contract.contractor.name}
                    </p>
                  ) : null}
                  {contract.milestones && contract.milestones.length > 0 ? (
                    <p className="mt-1 text-sm text-neutral-600">
                      {contract.milestones.length} milestone{contract.milestones.length !== 1 ? 's' : ''}
                    </p>
                  ) : null}
                </div>
                <div className="text-sm text-neutral-400">→</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
