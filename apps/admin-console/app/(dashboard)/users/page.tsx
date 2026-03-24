'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Users, MoreHorizontal, CheckCircle, XCircle, Clock, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { listUsers, suspendUser, activateUser, type AdminUser } from '@/lib/api/admin'

// ── Seed data shown when API unavailable ──────────────────────────────────────
const SEED_USERS: AdminUser[] = [
  { id: '1', name: 'Jennifer Adams',  email: 'jennifer@email.com',   role: 'homeowner',  status: 'ACTIVE',    orgName: null,                projectCount: 2, createdAt: '2025-11-15', lastLoginAt: '2026-03-10' },
  { id: '2', name: 'Mike Rodriguez',  email: 'mike@summitgc.com',    role: 'contractor', status: 'ACTIVE',    orgName: 'Summit Construction', projectCount: 5, createdAt: '2025-08-20', lastLoginAt: '2026-03-10' },
  { id: '3', name: 'Sarah Chen',      email: 'sarah@greenfield.com', role: 'developer',  status: 'ACTIVE',    orgName: 'Greenfield Capital',  projectCount: 4, createdAt: '2025-06-01', lastLoginAt: '2026-03-09' },
  { id: '4', name: 'Tom Jackson',     email: 'tom@inspector.com',    role: 'inspector',  status: 'ACTIVE',    orgName: 'City of Austin',      projectCount: 0, createdAt: '2025-10-01', lastLoginAt: '2026-03-08' },
  { id: '5', name: 'Lisa Park',       email: 'lisa@email.com',       role: 'homeowner',  status: 'ACTIVE',    orgName: null,                projectCount: 1, createdAt: '2026-01-05', lastLoginAt: '2026-03-07' },
  { id: '6', name: 'David Miller',    email: 'david@email.com',      role: 'homeowner',  status: 'INACTIVE',  orgName: null,                projectCount: 1, createdAt: '2025-09-10', lastLoginAt: '2025-12-01' },
  { id: '7', name: 'Rachel Green',    email: 'rachel@apexbuilders.com', role: 'contractor', status: 'PENDING', orgName: 'Apex Builders',      projectCount: 0, createdAt: '2026-03-08', lastLoginAt: null },
  { id: '8', name: 'James Wilson',    email: 'james@email.com',      role: 'homeowner',  status: 'SUSPENDED', orgName: null,                projectCount: 0, createdAt: '2025-07-15', lastLoginAt: '2025-11-20' },
]

const STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle }> = {
  ACTIVE:    { color: 'bg-green-100 text-green-700', icon: CheckCircle },
  INACTIVE:  { color: 'bg-gray-100 text-gray-700',  icon: Clock },
  PENDING:   { color: 'bg-amber-100 text-amber-700', icon: Clock },
  SUSPENDED: { color: 'bg-red-100 text-red-700',    icon: XCircle },
}

const ROLE_COLORS: Record<string, string> = {
  homeowner:  'bg-blue-100 text-blue-700',
  contractor: 'bg-orange-100 text-orange-700',
  developer:  'bg-emerald-100 text-emerald-700',
  inspector:  'bg-purple-100 text-purple-700',
  admin:      'bg-red-100 text-red-700',
}

const PAGE_SIZE = 25

export default function UsersPage() {
  const [users, setUsers]         = useState<AdminUser[]>(SEED_USERS)
  const [total, setTotal]         = useState(SEED_USERS.length)
  const [isLive, setIsLive]       = useState(false)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [page, setPage]           = useState(0)
  const [actionUser, setActionUser] = useState<string | null>(null)
  const [openMenu, setOpenMenu]   = useState<string | null>(null)

  const load = useCallback(async (pg = page, s = search, r = roleFilter) => {
    setLoading(true)
    try {
      const data = await listUsers({ limit: PAGE_SIZE, offset: pg * PAGE_SIZE, search: s || undefined, role: r })
      setUsers(data.users ?? [])
      setTotal(data.total ?? 0)
      setIsLive(true)
    } catch {
      // keep seed — only on first load
      if (pg === 0 && !s && r === 'all') {
        setUsers(SEED_USERS)
        setTotal(SEED_USERS.length)
      }
    } finally {
      setLoading(false)
    }
  }, [page, search, roleFilter])

  useEffect(() => { load(0, '', 'all') }, []) // initial load only

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => { setPage(0); load(0, search, roleFilter) }, 400)
    return () => clearTimeout(timer)
  }, [search, roleFilter])

  async function handleSuspend(userId: string) {
    setActionUser(userId)
    try {
      await suspendUser(userId)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'SUSPENDED' } : u))
    } catch { /* ignore */ }
    setActionUser(null)
    setOpenMenu(null)
  }

  async function handleActivate(userId: string) {
    setActionUser(userId)
    try {
      await activateUser(userId)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'ACTIVE' } : u))
    } catch { /* ignore */ }
    setActionUser(null)
    setOpenMenu(null)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Users</h1>
          <p className="mt-1 text-sm text-gray-600">
            {total} total users across all portals
            {isLive && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700"><span className="h-1.5 w-1.5 rounded-full bg-green-500" />Live</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(page, search, roleFilter)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: '#E8793A' }}>
            <Users className="h-4 w-4" />
            Invite User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {['all', 'homeowner', 'contractor', 'developer', 'inspector'].map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium capitalize"
              style={{ backgroundColor: roleFilter === r ? '#1A2B4A' : '#F3F4F6', color: roleFilter === r ? '#2ABFBF' : '#4B5563' }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No users found.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100" style={{ backgroundColor: '#F7FAFC' }}>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Organization</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Projects</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Last Login</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Joined</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => {
                const statusCfg = STATUS_CONFIG[user.status] ?? STATUS_CONFIG['INACTIVE']
                const StatusIcon = statusCfg.icon
                const isActioning = actionUser === user.id
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#1A2B4A' }}>{user.name || '—'}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.orgName || 'N/A'}</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">{user.projectCount ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={`flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.color}`}>
                        <StatusIcon className="h-3 w-3" />{user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
                        : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-center relative">
                      {isLive ? (
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                            disabled={isActioning}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {openMenu === user.id && (
                            <div className="absolute right-0 z-10 mt-1 w-40 rounded-lg border border-gray-200 bg-white shadow-lg">
                              {user.status !== 'ACTIVE' && (
                                <button onClick={() => handleActivate(user.id)} className="w-full px-3 py-2 text-left text-xs font-medium text-green-700 hover:bg-green-50">
                                  Activate
                                </button>
                              )}
                              {user.status === 'ACTIVE' && (
                                <button onClick={() => handleSuspend(user.id)} className="w-full px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50">
                                  Suspend
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setPage(p => p - 1); load(page - 1, search, roleFilter) }}
              disabled={page === 0}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-sm text-gray-600">{page + 1} / {totalPages}</span>
            <button
              onClick={() => { setPage(p => p + 1); load(page + 1, search, roleFilter) }}
              disabled={page >= totalPages - 1}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
