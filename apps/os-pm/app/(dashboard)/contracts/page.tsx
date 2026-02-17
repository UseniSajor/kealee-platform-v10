'use client'

import { useEffect, useState } from 'react'
import { Scale, FileText, Clock, CheckCircle, AlertCircle, Search } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface Contract {
  id: string
  title: string
  projectName: string
  contractorName: string
  status: string
  totalValue: number
  startDate: string
  endDate?: string
  type: string
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadContracts()
  }, [])

  const loadContracts = async () => {
    setLoading(true)
    try {
      // Contracts are managed through the PM projects/documents system
      // Try to fetch from the backend
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const res = await fetch(`${API_URL}/pm/documents?type=contract`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      })

      if (res.ok) {
        const data = await res.json()
        // Map documents to contract shape
        const docs = (data.documents || []).map((d: any) => ({
          id: d.id,
          title: d.title || d.name || 'Untitled Contract',
          projectName: d.project?.name || d.projectName || '',
          contractorName: d.contractor?.name || d.metadata?.contractorName || '',
          status: d.status || 'draft',
          totalValue: d.metadata?.totalValue || 0,
          startDate: d.createdAt,
          endDate: d.metadata?.endDate,
          type: d.subtype || d.metadata?.contractType || 'general',
        }))
        setContracts(docs)
      }
    } catch (err) {
      console.error('Failed to load contracts:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredContracts = contracts.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contractorName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      expired: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
    }
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || colors.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Scale className="h-6 w-6 text-blue-600" />
          Contracts
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage project contracts and agreements
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search contracts..."
          className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Contract List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="rounded-xl border bg-white py-16 text-center">
          <Scale className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No contracts found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Contracts from your projects will appear here
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white divide-y">
          {filteredContracts.map((contract) => (
            <div key={contract.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{contract.title}</p>
                  <p className="text-xs text-gray-500">{contract.projectName}</p>
                  {contract.contractorName && (
                    <p className="text-xs text-gray-400">{contract.contractorName}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {contract.totalValue > 0 && (
                  <span className="text-sm font-semibold text-gray-900">
                    ${contract.totalValue.toLocaleString()}
                  </span>
                )}
                {statusBadge(contract.status)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
