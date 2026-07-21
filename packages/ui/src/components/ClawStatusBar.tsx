'use client'

import React, { useState, useEffect } from 'react'

/**
 * ClawStatusBar — Shared CLAW system status indicator for all app dashboards.
 *
 * Shows:
 * - System health (online/degraded/offline)
 * - Number of active CLAWs
 * - Quick link to CLAW activity
 *
 * Usage in any app:
 *   import { ClawStatusBar } from '@kealee/ui'
 *   <ClawStatusBar clawsUrl="http://localhost:3002" getToken={getAuthToken} />
 */

interface ClawStatusBarProps {
  clawsUrl?: string
  getToken?: () => Promise<string | null>
  compact?: boolean
  className?: string
}

interface HealthData {
  status: 'ok' | 'degraded' | 'down'
  totalClaws: number
  onlineClaws: number
  eventBus: 'connected' | 'disconnected'
}

export function ClawStatusBar({
  clawsUrl,
  getToken,
  compact = false,
  className = '',
}: ClawStatusBarProps) {
  const [health, setHealth] = useState<HealthData | null>(null)

  const baseUrl = clawsUrl || (typeof window !== 'undefined' ? (window as any).__CLAWS_URL : null) || process.env.NEXT_PUBLIC_CLAWS_URL || 'http://localhost:3002'

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchHealth() {
    try {
      const token = getToken ? await getToken() : null
      const res = await fetch(`${baseUrl}/health`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setHealth(data)
      }
    } catch {
      setHealth({ status: 'degraded', totalClaws: 8, onlineClaws: 0, eventBus: 'disconnected' })
    }
  }

  const statusColor = health?.status === 'ok'
    ? 'bg-green-50 text-green-700 border-green-200'
    : health?.status === 'degraded'
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-gray-50 text-gray-500 border-gray-200'

  const dotColor = health?.status === 'ok'
    ? 'bg-green-500 animate-pulse'
    : health?.status === 'degraded'
    ? 'bg-amber-500'
    : 'bg-gray-400'

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColor} ${className}`}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        {health?.status === 'ok' ? `${health.onlineClaws}/8` : '...'}
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${statusColor} ${className}`}>
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {health?.status === 'ok'
        ? `${health.onlineClaws}/8 CLAWs Active`
        : health?.status === 'degraded'
        ? 'CLAWs Starting...'
        : 'CLAWs Connecting...'}
    </div>
  )
}

/**
 * ClawActivityFeed — Shows recent CLAW agent activity for a project.
 * Embeddable in any app dashboard.
 */
interface ClawActivityFeedProps {
  projectId: string
  clawsUrl?: string
  getToken?: () => Promise<string | null>
  limit?: number
  className?: string
}

interface ActivityItem {
  id: string
  type: string
  claw: string
  message: string
  severity: string
  createdAt: string
}

const CLAW_LABELS: Record<string, string> = {
  'acquisition-precon-claw': 'Acquisition',
  'contract-commercials-claw': 'Contracts',
  'schedule-field-ops-claw': 'Schedule',
  'budget-cost-claw': 'Budget',
  'permits-compliance-claw': 'Permits',
  'docs-communication-claw': 'Docs',
  'risk-prediction-claw': 'Risk',
  'command-automation-claw': 'Command',
}

const CLAW_ICONS: Record<string, string> = {
  'acquisition-precon-claw': '🔍',
  'contract-commercials-claw': '📝',
  'schedule-field-ops-claw': '📅',
  'budget-cost-claw': '💰',
  'permits-compliance-claw': '📋',
  'docs-communication-claw': '📄',
  'risk-prediction-claw': '🧠',
  'command-automation-claw': '🎯',
}

export function ClawActivityFeed({
  projectId,
  clawsUrl,
  getToken,
  limit = 5,
  className = '',
}: ClawActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const baseUrl = clawsUrl || process.env.NEXT_PUBLIC_CLAWS_URL || 'http://localhost:3002'

  useEffect(() => {
    fetchActivity()
    const interval = setInterval(fetchActivity, 15000)
    return () => clearInterval(interval)
  }, [projectId])

  async function fetchActivity() {
    try {
      const token = getToken ? await getToken() : null
      const res = await fetch(`${baseUrl}/api/claws/command/activity?projectId=${projectId}&limit=${limit}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setActivities(data.activities || [])
      }
    } catch {
      // CLAWs not available
    }
  }

  if (activities.length === 0) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-gray-900">CLAW Activity</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        </div>
        <p className="text-xs text-gray-400">CLAWs are monitoring. Activity will appear here.</p>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-semibold text-gray-900">CLAW Activity</span>
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      </div>
      <div className="space-y-2">
        {activities.map((item) => (
          <div key={item.id} className="flex items-start gap-2 text-xs">
            <span>{CLAW_ICONS[item.claw] || '⚡'}</span>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-gray-700">{CLAW_LABELS[item.claw] || item.claw}</span>
              <span className="text-gray-400 mx-1">·</span>
              <span className="text-gray-500">{item.message}</span>
            </div>
            <span className="text-gray-400 whitespace-nowrap">
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
