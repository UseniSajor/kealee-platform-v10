'use client'

import { useEffect, useState, useCallback } from 'react'
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'

interface Notification {
  id: string
  event: string
  title: string
  body: string
  isRead: boolean
  readAt: string | null
  createdAt: string
  entityType: string | null
  entityId: string | null
}

interface NotificationCenterData {
  unreadCount: number
  total: number
  notifications: Notification[]
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<NotificationCenterData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(() => {
    setLoading(true)
    apiFetch<NotificationCenterData>('/comms/notifications?limit=20')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchNotifications()
    // Poll every 60s
    const interval = setInterval(fetchNotifications, 60_000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markRead = async (ids: string[]) => {
    await apiFetch('/comms/notifications/read', { method: 'PATCH', body: JSON.stringify({ notificationIds: ids }) })
    setData(prev => prev ? {
      ...prev,
      unreadCount: Math.max(0, prev.unreadCount - ids.length),
      notifications: prev.notifications.map(n =>
        ids.includes(n.id) ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      ),
    } : prev)
  }

  const markAllRead = async () => {
    await apiFetch('/comms/notifications/read-all', { method: 'POST' })
    setData(prev => prev ? {
      ...prev,
      unreadCount: 0,
      notifications: prev.notifications.map(n => ({ ...n, isRead: true })),
    } : prev)
  }

  const remove = async (id: string) => {
    await apiFetch(`/comms/notifications/${id}`, { method: 'DELETE' })
    setData(prev => prev ? {
      ...prev,
      total: prev.total - 1,
      notifications: prev.notifications.filter(n => n.id !== id),
    } : prev)
  }

  const unread = data?.unreadCount ?? 0

  return (
    <div className="relative">
      {/* Bell trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-full z-40 mt-2 w-96 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h3 className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>
                Notifications {unread > 0 && <span className="ml-1 text-xs text-gray-400">({unread} unread)</span>}
              </h3>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                    title="Mark all read"
                  >
                    <CheckCheck className="h-3 w-3" />
                    All read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-gray-100">
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {loading && !data ? (
                <div className="space-y-2 p-4">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
                  ))}
                </div>
              ) : !data?.notifications.length ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <Bell className="h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-400">No notifications yet</p>
                </div>
              ) : (
                data.notifications.map(n => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 border-b border-gray-50 px-4 py-3 transition-colors hover:bg-gray-50 ${!n.isRead ? 'bg-teal-50/40' : ''}`}
                  >
                    {/* Unread dot */}
                    <div className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${!n.isRead ? 'bg-teal-500' : 'bg-transparent'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight" style={{ color: '#1A2B4A' }}>{n.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{n.body}</p>
                      <p className="mt-1 text-[10px] text-gray-400">{timeAgo(n.createdAt)}</p>
                    </div>
                    <div className="flex flex-shrink-0 gap-1">
                      {!n.isRead && (
                        <button
                          onClick={() => markRead([n.id])}
                          className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-teal-600"
                          title="Mark read"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={() => remove(n.id)}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {(data?.total ?? 0) > 20 && (
              <div className="border-t border-gray-100 px-4 py-2 text-center">
                <span className="text-xs text-gray-400">{data!.total} total — showing most recent 20</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
