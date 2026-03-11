'use client'

import { useState } from 'react'
import { Building2, Search, Users, FolderKanban, Calendar, MoreHorizontal, Plus } from 'lucide-react'

const ORGS = [
  { id: '1', name: 'Summit Construction LLC', type: 'Contractor', members: 8, projects: 5, plan: 'Pro', status: 'Active', created: '2025-06-15' },
  { id: '2', name: 'Greenfield Capital', type: 'Developer', members: 4, projects: 4, plan: 'Enterprise', status: 'Active', created: '2025-05-01' },
  { id: '3', name: 'Apex Builders Inc', type: 'Contractor', members: 12, projects: 8, plan: 'Pro', status: 'Active', created: '2025-04-20' },
  { id: '4', name: 'City of Austin - Inspections', type: 'Government', members: 3, projects: 0, plan: 'Government', status: 'Active', created: '2025-09-01' },
  { id: '5', name: 'Bluebonnet Homes', type: 'Developer', members: 2, projects: 2, plan: 'Basic', status: 'Active', created: '2025-11-10' },
  { id: '6', name: 'Rio Grande Contractors', type: 'Contractor', members: 6, projects: 3, plan: 'Pro', status: 'Trial', created: '2026-02-28' },
  { id: '7', name: 'Lone Star Development', type: 'Developer', members: 0, projects: 0, plan: 'None', status: 'Inactive', created: '2025-03-15' },
]

const typeColors: Record<string, string> = {
  Contractor: 'bg-orange-100 text-orange-700',
  Developer: 'bg-emerald-100 text-emerald-700',
  Government: 'bg-blue-100 text-blue-700',
}

const statusColors: Record<string, string> = {
  Active: 'bg-green-100 text-green-700',
  Trial: 'bg-amber-100 text-amber-700',
  Inactive: 'bg-gray-100 text-gray-600',
}

export default function OrgsPage() {
  const [search, setSearch] = useState('')

  const filtered = ORGS.filter(o => o.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Organizations</h1>
          <p className="mt-1 text-sm text-gray-600">{ORGS.length} registered organizations</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: '#E8793A' }}>
          <Plus className="h-4 w-4" />
          Create Org
        </button>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search organizations..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100" style={{ backgroundColor: '#F7FAFC' }}>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Organization</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Type</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Members</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Projects</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Plan</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Created</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((org) => (
              <tr key={org.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(26, 43, 74, 0.1)' }}>
                      <Building2 className="h-4 w-4" style={{ color: '#1A2B4A' }} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: '#1A2B4A' }}>{org.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[org.type] || 'bg-gray-100 text-gray-700'}`}>{org.type}</span></td>
                <td className="px-4 py-3 text-center text-sm text-gray-600">{org.members}</td>
                <td className="px-4 py-3 text-center text-sm text-gray-600">{org.projects}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{org.plan}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[org.status]}`}>{org.status}</span></td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(org.created).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</td>
                <td className="px-4 py-3 text-center">
                  <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><MoreHorizontal className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
