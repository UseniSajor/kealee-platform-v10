'use client'

import { useState } from 'react'
import { Search, Users, Filter, MoreHorizontal, CheckCircle, XCircle, Clock, Shield } from 'lucide-react'

const USERS = [
  { id: '1', name: 'Jennifer Adams', email: 'jennifer@email.com', role: 'homeowner', status: 'ACTIVE', org: 'N/A', projects: 2, created: '2025-11-15', lastLogin: '2026-03-10' },
  { id: '2', name: 'Mike Rodriguez', email: 'mike@summitgc.com', role: 'contractor', status: 'ACTIVE', org: 'Summit Construction', projects: 5, created: '2025-08-20', lastLogin: '2026-03-10' },
  { id: '3', name: 'Sarah Chen', email: 'sarah@greenfield.com', role: 'developer', status: 'ACTIVE', org: 'Greenfield Capital', projects: 4, created: '2025-06-01', lastLogin: '2026-03-09' },
  { id: '4', name: 'Tom Jackson', email: 'tom@inspector.com', role: 'inspector', status: 'ACTIVE', org: 'City of Austin', projects: 0, created: '2025-10-01', lastLogin: '2026-03-08' },
  { id: '5', name: 'Lisa Park', email: 'lisa@email.com', role: 'homeowner', status: 'ACTIVE', org: 'N/A', projects: 1, created: '2026-01-05', lastLogin: '2026-03-07' },
  { id: '6', name: 'David Miller', email: 'david@email.com', role: 'homeowner', status: 'INACTIVE', org: 'N/A', projects: 1, created: '2025-09-10', lastLogin: '2025-12-01' },
  { id: '7', name: 'Rachel Green', email: 'rachel@apexbuilders.com', role: 'contractor', status: 'PENDING', org: 'Apex Builders', projects: 0, created: '2026-03-08', lastLogin: 'Never' },
  { id: '8', name: 'James Wilson', email: 'james@email.com', role: 'homeowner', status: 'SUSPENDED', org: 'N/A', projects: 0, created: '2025-07-15', lastLogin: '2025-11-20' },
]

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle }> = {
  ACTIVE: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
  INACTIVE: { color: 'bg-gray-100 text-gray-700', icon: Clock },
  PENDING: { color: 'bg-amber-100 text-amber-700', icon: Clock },
  SUSPENDED: { color: 'bg-red-100 text-red-700', icon: XCircle },
}

const roleColors: Record<string, string> = {
  homeowner: 'bg-blue-100 text-blue-700',
  contractor: 'bg-orange-100 text-orange-700',
  developer: 'bg-emerald-100 text-emerald-700',
  inspector: 'bg-purple-100 text-purple-700',
  admin: 'bg-red-100 text-red-700',
}

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const filtered = USERS.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Users</h1>
          <p className="mt-1 text-sm text-gray-600">{USERS.length} total users across all portals</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: '#E8793A' }}>
          <Users className="h-4 w-4" />
          Invite User
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal" />
        </div>
        <div className="flex gap-1">
          {['all', 'homeowner', 'contractor', 'developer', 'inspector'].map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className="rounded-lg px-3 py-2 text-xs font-medium capitalize"
              style={{
                backgroundColor: roleFilter === r ? '#1A2B4A' : '#F3F4F6',
                color: roleFilter === r ? '#2ABFBF' : '#4B5563'
              }}>{r}</button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100" style={{ backgroundColor: '#F7FAFC' }}>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Organization</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Projects</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Last Login</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((user) => {
              const status = statusConfig[user.status]
              const StatusIcon = status.icon
              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#1A2B4A' }}>{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${roleColors[user.role]}`}>{user.role}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.org}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">{user.projects}</td>
                  <td className="px-4 py-3">
                    <span className={`flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                      <StatusIcon className="h-3 w-3" />{user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{user.lastLogin}</td>
                  <td className="px-4 py-3 text-center">
                    <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
