'use client'

import { useEffect, useState } from 'react'
import { Users, Mail, Phone, Search, Building2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface TeamMember {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  company?: string
  title?: string
  avatarUrl?: string
}

export default function DirectoryPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadDirectory()
  }, [])

  const loadDirectory = async () => {
    setLoading(true)
    try {
      const { supabase } = await import('@pm/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const res = await fetch(`${API_URL}/pm/team`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      })

      if (res.ok) {
        const data = await res.json()
        setMembers(data.members || data.team || [])
      }
    } catch (err) {
      console.error('Failed to load directory:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = members.filter(
    (m) =>
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.company?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-800',
    pm: 'bg-blue-100 text-blue-800',
    contractor: 'bg-green-100 text-green-800',
    client: 'bg-orange-100 text-orange-800',
    architect: 'bg-teal-100 text-teal-800',
    engineer: 'bg-indigo-100 text-indigo-800',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          Team Directory
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Project contacts, team members, and contractors
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, email, role, or company..."
          className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Directory */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="rounded-xl border bg-white py-16 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">
            {searchQuery ? 'No results found' : 'No team members yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery ? 'Try a different search term' : 'Team members will appear here as projects are set up'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <div key={member.id} className="rounded-xl border bg-white p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 shrink-0">
                  {getInitials(member.name || 'U')}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{member.name}</p>
                  {member.title && (
                    <p className="text-xs text-gray-500 truncate">{member.title}</p>
                  )}
                  {member.company && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Building2 className="h-3 w-3 text-gray-400" />
                      <p className="text-xs text-gray-500 truncate">{member.company}</p>
                    </div>
                  )}
                </div>
                <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  ROLE_COLORS[member.role?.toLowerCase()] || 'bg-gray-100 text-gray-800'
                }`}>
                  {member.role}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 border-t pt-3">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  <a href={`mailto:${member.email}`} className="hover:text-blue-600 truncate">
                    {member.email}
                  </a>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    <a href={`tel:${member.phone}`} className="hover:text-blue-600">
                      {member.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

