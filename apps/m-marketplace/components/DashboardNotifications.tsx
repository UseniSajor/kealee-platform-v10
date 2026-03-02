'use client'

import { useState, useEffect, useCallback } from 'react'
import { useProfile } from '@kealee/auth/client'
import { LiveNotificationBell, type LiveNotification } from '@kealee/ui'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export function DashboardNotifications() {
  const { profile } = useProfile()
  const router = useRouter()
  const [notifications, setNotifications] = useState<LiveNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    if (!profile?.access_token) return
    try {
      const res = await fetch(`${API_URL}/api/notifications?limit=10`, {
        headers: { Authorization: `Bearer ${profile.access_token}` },
      })
      if (!res.ok) return

      const data = await res.json()
      const items: LiveNotification[] = (data.notifications || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: mapNotificationType(n.type),
        timestamp: n.createdAt,
        read: n.status === 'SENT' || n.status === 'READ',
        actionUrl: n.data?.actionUrl,
        source: n.data?.source || 'Kealee',
        eventType: n.type,
      }))

      setNotifications(items)
      setUnreadCount(data.unreadCount ?? items.filter((n: LiveNotification) => !n.read).length)
    } catch {
      // fail silently
    }
  }, [profile?.access_token])

  useEffect(() => {
    fetchNotifications()
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const handleNotificationClick = (notification: LiveNotification) => {
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }

  const handleMarkRead = async (id: string) => {
    if (!profile?.access_token) return
    try {
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${profile.access_token}` },
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch {
      // fail silently
    }
  }

  const handleMarkAllRead = async () => {
    if (!profile?.access_token) return
    try {
      await fetch(`${API_URL}/api/notifications/mark-all-read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${profile.access_token}` },
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {
      // fail silently
    }
  }

  if (!profile) return null

  return (
    <LiveNotificationBell
      notifications={notifications}
      unreadCount={unreadCount}
      onNotificationClick={handleNotificationClick}
      onMarkRead={handleMarkRead}
      onMarkAllRead={handleMarkAllRead}
      maxVisible={8}
    />
  )
}

function mapNotificationType(type: string): 'info' | 'success' | 'warning' | 'error' {
  if (type.includes('FAILED') || type.includes('ERROR')) return 'error'
  if (type.includes('ALERT') || type.includes('WARNING')) return 'warning'
  if (type.includes('COMPLETED') || type.includes('READY') || type.includes('DELIVERED') || type.includes('RELEASED')) return 'success'
  return 'info'
}
