'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { api } from '@/lib/api'
import { Users, Building2, FolderKanban, TrendingUp } from 'lucide-react'

interface DashboardStats {
  users: { total: number; today: number }
  orgs: { total: number; today: number }
  projects: { total: number; today: number }
}

interface RecentEvent {
  id: string
  type: string
  entityType: string
  occurredAt: string
  payload?: any
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    users: { total: 0, today: 0 },
    orgs: { total: 0, today: 0 },
    projects: { total: 0, today: 0 },
  })
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        
        // Get today's date range
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayStart = today.toISOString()
        const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()

        // Fetch users, orgs, and recent events in parallel
        const [usersData, orgsData, usersTodayData, orgsTodayData, eventsData] = await Promise.all([
          api.getUsers({ limit: 1 }).catch(() => ({ users: [], pagination: { total: 0 } })),
          api.getOrgs({ limit: 1 }).catch(() => ({ orgs: [], pagination: { total: 0 } })),
          // Get users created today by fetching all and filtering (API doesn't have date filter yet)
          api.getUsers({ limit: 1000 }).catch(() => ({ users: [], pagination: { total: 0 } })),
          // Get orgs created today
          api.getOrgs({ limit: 1000 }).catch(() => ({ orgs: [], pagination: { total: 0 } })),
          // Get recent events for activity feed
          api.getRecentEvents(10).catch(() => ({ events: [] })),
        ])

        // Calculate today's counts
        const usersToday = usersTodayData.users?.filter((user: any) => {
          const created = new Date(user.createdAt)
          return created >= today
        }).length || 0

        const orgsToday = orgsTodayData.orgs?.filter((org: any) => {
          const created = new Date(org.createdAt)
          return created >= today
        }).length || 0

        setStats({
          users: {
            total: usersData.pagination?.total || 0,
            today: usersToday,
          },
          orgs: {
            total: orgsData.pagination?.total || 0,
            today: orgsToday,
          },
          projects: {
            total: 0, // Projects API not implemented yet
            today: 0,
          },
        })

        // Set recent events for activity feed
        setRecentEvents(eventsData.events || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600 mt-2">System overview and metrics</p>
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading dashboard...</p>
              </div>
            </div>
          ) : (
            <>
              {/* System Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Users</p>
                      <p className="text-3xl font-bold mt-2">{stats.users.total.toLocaleString()}</p>
                      <p className="text-sm text-green-600 mt-1">+{stats.users.today} today</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Organizations</p>
                      <p className="text-3xl font-bold mt-2">{stats.orgs.total.toLocaleString()}</p>
                      <p className="text-sm text-green-600 mt-1">+{stats.orgs.today} today</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Projects</p>
                      <p className="text-3xl font-bold mt-2">{stats.projects.total.toLocaleString()}</p>
                      <p className="text-sm text-green-600 mt-1">+{stats.projects.today} today</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <FolderKanban className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity Feed */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {recentEvents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No recent activity</p>
                    </div>
                  ) : (
                    recentEvents.map((event) => {
                      const timeAgo = getTimeAgo(new Date(event.occurredAt))
                      const icon = getEventIcon(event.type, event.entityType)
                      const description = getEventDescription(event.type, event.entityType, event.payload)

                      return (
                        <div key={event.id} className="flex items-center gap-4 pb-4 border-b last:border-b-0 last:pb-0">
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            {icon}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{description}</p>
                            <p className="text-xs text-gray-500">{timeAgo}</p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

// Helper function to get time ago string
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return `${seconds} seconds ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  return `${Math.floor(seconds / 86400)} days ago`
}

// Helper function to get icon for event type
function getEventIcon(type: string, entityType: string) {
  if (type.includes('USER') || entityType === 'User') {
    return <Users className="h-5 w-5 text-gray-600" />
  }
  if (type.includes('ORG') || entityType === 'Org') {
    return <Building2 className="h-5 w-5 text-gray-600" />
  }
  if (type.includes('PROJECT') || entityType === 'Project') {
    return <FolderKanban className="h-5 w-5 text-gray-600" />
  }
  return <TrendingUp className="h-5 w-5 text-gray-600" />
}

// Helper function to get description for event
function getEventDescription(type: string, entityType: string, payload?: any): string {
  // Format common event types
  if (type.includes('CREATED')) {
    return `${entityType} created`
  }
  if (type.includes('UPDATED')) {
    return `${entityType} updated`
  }
  if (type.includes('DELETED')) {
    return `${entityType} deleted`
  }
  if (type.includes('REGISTERED')) {
    return 'New user registered'
  }
  
  // Fallback to formatted type
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}
