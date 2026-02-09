'use client'

import { useEffect, useState, useCallback } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  XCircle,
  ShieldAlert,
  RefreshCcw,
  Trash2,
  Activity,
  Zap,
  RotateCcw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'

// ── Types ────────────────────────────────────────────────────

interface Alert {
  id: string
  level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  source: string
  title: string
  message: string
  data: Record<string, any> | null
  acknowledged: boolean
  acknowledgedBy: string | null
  acknowledgedAt: string | null
  resolvedAt: string | null
  createdAt: string
}

interface AlertStats {
  total: number
  unacknowledged: number
  byLevel: Record<string, number>
  bySource: Record<string, number>
}

interface DeadLetterJob {
  id: string
  originalQueue: string
  jobId: string
  jobName: string
  appId: string
  data: Record<string, any>
  error: string
  attempts: number
  status: 'pending' | 'retried' | 'discarded'
  retriedAt: string | null
  discardedAt: string | null
  discardReason: string | null
  pattern: string | null
  createdAt: string
}

interface DeadLetterStats {
  total: number
  pending: number
  retried: number
  discarded: number
  byApp: Record<string, number>
}

interface CircuitStatus {
  name: string
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  failures: number
  successes: number
  lastFailure: string | null
  lastSuccess: string | null
  nextRetry: string | null
}

// ── Constants ────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const APP_NAMES: Record<string, string> = {
  'APP-01': 'Bid Engine',
  'APP-02': 'Cost Database',
  'APP-03': 'Vendor Matching',
  'APP-04': 'Report Generator',
  'APP-05': 'Contract Engine',
  'APP-06': 'Estimation Tool',
  'APP-07': 'OCR Processing',
  'APP-08': 'Payment Processing',
  'APP-09': 'Permit Tracker',
  'APP-10': 'Inspection Scheduler',
  'APP-11': 'Communication Hub',
  'APP-12': 'Scheduling Engine',
  'APP-13': 'QA Vision',
  'APP-14': 'Marketplace',
  'APP-15': 'Command Center',
  'SYS-EMAIL': 'Email Service',
  'SYS-DLQ': 'Dead Letter',
  'system': 'System',
}

const LEVEL_CONFIG = {
  CRITICAL: { color: 'bg-red-600 text-white', icon: ShieldAlert, text: 'text-red-600' },
  ERROR: { color: 'bg-orange-500 text-white', icon: XCircle, text: 'text-orange-500' },
  WARNING: { color: 'bg-yellow-500 text-white', icon: AlertTriangle, text: 'text-yellow-500' },
  INFO: { color: 'bg-blue-500 text-white', icon: Info, text: 'text-blue-500' },
} as const

// ── Tab Type ─────────────────────────────────────────────────

type TabId = 'alerts' | 'dead-letter' | 'circuits'

// ── Component ────────────────────────────────────────────────

export default function AlertsDashboardPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabId>('alerts')

  // Alerts state
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [alertStats, setAlertStats] = useState<AlertStats | null>(null)
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [alertFilter, setAlertFilter] = useState<{
    level: string
    source: string
    acknowledged: string
  }>({ level: 'all', source: 'all', acknowledged: 'unacknowledged' })
  const [alertPage, setAlertPage] = useState(0)
  const [alertTotal, setAlertTotal] = useState(0)

  // Dead Letter state
  const [deadLetters, setDeadLetters] = useState<DeadLetterJob[]>([])
  const [dlqStats, setDlqStats] = useState<DeadLetterStats | null>(null)
  const [dlqLoading, setDlqLoading] = useState(true)
  const [dlqFilter, setDlqFilter] = useState<{ appId: string; status: string }>({
    appId: 'all',
    status: 'pending',
  })
  const [dlqPage, setDlqPage] = useState(0)
  const [dlqTotal, setDlqTotal] = useState(0)

  // Circuit Breaker state
  const [circuits, setCircuits] = useState<CircuitStatus[]>([])
  const [circuitsLoading, setCircuitsLoading] = useState(true)

  // Expanded alert detail
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null)
  const [expandedDlq, setExpandedDlq] = useState<string | null>(null)

  const PAGE_SIZE = 25

  // ── Data Fetching ────────────────────────────────────────

  const fetchAlerts = useCallback(async () => {
    try {
      setAlertsLoading(true)
      const params = new URLSearchParams()
      if (alertFilter.level !== 'all') params.set('level', alertFilter.level)
      if (alertFilter.source !== 'all') params.set('source', alertFilter.source)
      if (alertFilter.acknowledged !== 'all') {
        params.set('acknowledged', alertFilter.acknowledged === 'acknowledged' ? 'true' : 'false')
      }
      params.set('limit', String(PAGE_SIZE))
      params.set('offset', String(alertPage * PAGE_SIZE))

      const res = await fetch(`${API_BASE}/automation/alerts?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.items ?? [])
        setAlertTotal(data.total ?? 0)
      } else {
        setAlerts([])
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err)
      setAlerts([])
    } finally {
      setAlertsLoading(false)
    }
  }, [alertFilter, alertPage])

  const fetchAlertStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/automation/alerts/stats`)
      if (res.ok) {
        setAlertStats(await res.json())
      }
    } catch (err) {
      console.error('Failed to fetch alert stats:', err)
    }
  }, [])

  const fetchDeadLetters = useCallback(async () => {
    try {
      setDlqLoading(true)
      const params = new URLSearchParams()
      if (dlqFilter.appId !== 'all') params.set('appId', dlqFilter.appId)
      if (dlqFilter.status !== 'all') params.set('status', dlqFilter.status)
      params.set('limit', String(PAGE_SIZE))
      params.set('offset', String(dlqPage * PAGE_SIZE))

      const res = await fetch(`${API_BASE}/automation/dead-letters?${params}`)
      if (res.ok) {
        const data = await res.json()
        setDeadLetters(data.items ?? [])
        setDlqTotal(data.total ?? 0)
      } else {
        setDeadLetters([])
      }
    } catch (err) {
      console.error('Failed to fetch dead letters:', err)
      setDeadLetters([])
    } finally {
      setDlqLoading(false)
    }
  }, [dlqFilter, dlqPage])

  const fetchDlqStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/automation/dead-letters/stats`)
      if (res.ok) {
        setDlqStats(await res.json())
      }
    } catch (err) {
      console.error('Failed to fetch DLQ stats:', err)
    }
  }, [])

  const fetchCircuits = useCallback(async () => {
    try {
      setCircuitsLoading(true)
      const res = await fetch(`${API_BASE}/automation/circuits`)
      if (res.ok) {
        setCircuits(await res.json())
      } else {
        setCircuits([])
      }
    } catch (err) {
      console.error('Failed to fetch circuits:', err)
      setCircuits([])
    } finally {
      setCircuitsLoading(false)
    }
  }, [])

  // Initial load + refresh on tab/filter change
  useEffect(() => {
    fetchAlerts()
    fetchAlertStats()
  }, [fetchAlerts, fetchAlertStats])

  useEffect(() => {
    fetchDeadLetters()
    fetchDlqStats()
  }, [fetchDeadLetters, fetchDlqStats])

  useEffect(() => {
    fetchCircuits()
  }, [fetchCircuits])

  // ── Actions ──────────────────────────────────────────────

  async function acknowledgeAlert(alertId: string) {
    try {
      const res = await fetch(`${API_BASE}/automation/alerts/${alertId}/acknowledge`, {
        method: 'POST',
      })
      if (res.ok) {
        toast.success('Alert acknowledged')
        fetchAlerts()
        fetchAlertStats()
      } else {
        toast.error('Failed to acknowledge alert')
      }
    } catch {
      toast.error('Failed to acknowledge alert')
    }
  }

  async function acknowledgeAllAlerts() {
    try {
      const params: Record<string, string> = {}
      if (alertFilter.source !== 'all') params.source = alertFilter.source
      if (alertFilter.level !== 'all') params.level = alertFilter.level

      const res = await fetch(`${API_BASE}/automation/alerts/acknowledge-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`${data.count ?? 0} alerts acknowledged`)
        fetchAlerts()
        fetchAlertStats()
      } else {
        toast.error('Failed to acknowledge alerts')
      }
    } catch {
      toast.error('Failed to acknowledge alerts')
    }
  }

  async function retryDeadLetter(dlqId: string) {
    try {
      const res = await fetch(`${API_BASE}/automation/dead-letters/${dlqId}/retry`, {
        method: 'POST',
      })
      if (res.ok) {
        toast.success('Job re-queued for retry')
        fetchDeadLetters()
        fetchDlqStats()
      } else {
        toast.error('Failed to retry job')
      }
    } catch {
      toast.error('Failed to retry job')
    }
  }

  async function discardDeadLetter(dlqId: string) {
    try {
      const res = await fetch(`${API_BASE}/automation/dead-letters/${dlqId}/discard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Discarded by admin' }),
      })
      if (res.ok) {
        toast.success('Job discarded')
        fetchDeadLetters()
        fetchDlqStats()
      } else {
        toast.error('Failed to discard job')
      }
    } catch {
      toast.error('Failed to discard job')
    }
  }

  async function retryAllForApp(appId: string) {
    try {
      const res = await fetch(`${API_BASE}/automation/dead-letters/retry-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`${data.retried ?? 0} jobs re-queued for ${APP_NAMES[appId] ?? appId}`)
        fetchDeadLetters()
        fetchDlqStats()
      } else {
        toast.error('Failed to retry jobs')
      }
    } catch {
      toast.error('Failed to retry jobs')
    }
  }

  async function resetCircuit(name: string) {
    try {
      const res = await fetch(`${API_BASE}/automation/circuits/${name}/reset`, {
        method: 'POST',
      })
      if (res.ok) {
        toast.success(`Circuit breaker "${name}" reset`)
        fetchCircuits()
      } else {
        toast.error('Failed to reset circuit')
      }
    } catch {
      toast.error('Failed to reset circuit')
    }
  }

  // ── Helpers ──────────────────────────────────────────────

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  function getAppName(id: string): string {
    return APP_NAMES[id] ?? id
  }

  // ── Stat Cards ───────────────────────────────────────────

  const criticalCount = alertStats?.byLevel?.CRITICAL ?? 0
  const errorCount = alertStats?.byLevel?.ERROR ?? 0
  const warningCount = alertStats?.byLevel?.WARNING ?? 0
  const unackCount = alertStats?.unacknowledged ?? 0

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          {/* ── Header ──────────────────────────────────── */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Alerts &amp; Monitoring</h1>
              <p className="text-gray-600 mt-2">
                System alerts, dead letter queue, and circuit breaker status
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                fetchAlerts()
                fetchAlertStats()
                fetchDeadLetters()
                fetchDlqStats()
                fetchCircuits()
                toast.success('Dashboard refreshed')
              }}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* ── Top Stats ───────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Critical</p>
                    <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
                  </div>
                  <ShieldAlert className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Errors</p>
                    <p className="text-2xl font-bold text-orange-500">{errorCount}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Warnings</p>
                    <p className="text-2xl font-bold text-yellow-500">{warningCount}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Unacknowledged</p>
                    <p className="text-2xl font-bold">{unackCount}</p>
                  </div>
                  <Bell className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Tabs ────────────────────────────────────── */}
          <div className="flex border-b border-gray-200 mb-6">
            <TabButton
              active={activeTab === 'alerts'}
              onClick={() => setActiveTab('alerts')}
              icon={<Bell className="h-4 w-4" />}
              label="Alerts"
              count={unackCount}
            />
            <TabButton
              active={activeTab === 'dead-letter'}
              onClick={() => setActiveTab('dead-letter')}
              icon={<Trash2 className="h-4 w-4" />}
              label="Dead Letter Queue"
              count={dlqStats?.pending ?? 0}
            />
            <TabButton
              active={activeTab === 'circuits'}
              onClick={() => setActiveTab('circuits')}
              icon={<Zap className="h-4 w-4" />}
              label="Circuit Breakers"
              count={circuits.filter((c) => c.state !== 'CLOSED').length}
            />
          </div>

          {/* ── Tab Content ─────────────────────────────── */}
          {activeTab === 'alerts' && (
            <AlertsPanel
              alerts={alerts}
              loading={alertsLoading}
              filter={alertFilter}
              onFilterChange={(f) => { setAlertFilter(f); setAlertPage(0) }}
              onAcknowledge={acknowledgeAlert}
              onAcknowledgeAll={acknowledgeAllAlerts}
              expanded={expandedAlert}
              onToggleExpand={(id) => setExpandedAlert(expandedAlert === id ? null : id)}
              page={alertPage}
              total={alertTotal}
              pageSize={PAGE_SIZE}
              onPageChange={setAlertPage}
              getAppName={getAppName}
              timeAgo={timeAgo}
            />
          )}

          {activeTab === 'dead-letter' && (
            <DeadLetterPanel
              deadLetters={deadLetters}
              stats={dlqStats}
              loading={dlqLoading}
              filter={dlqFilter}
              onFilterChange={(f) => { setDlqFilter(f); setDlqPage(0) }}
              onRetry={retryDeadLetter}
              onDiscard={discardDeadLetter}
              onRetryAllForApp={retryAllForApp}
              expanded={expandedDlq}
              onToggleExpand={(id) => setExpandedDlq(expandedDlq === id ? null : id)}
              page={dlqPage}
              total={dlqTotal}
              pageSize={PAGE_SIZE}
              onPageChange={setDlqPage}
              getAppName={getAppName}
              timeAgo={timeAgo}
            />
          )}

          {activeTab === 'circuits' && (
            <CircuitsPanel
              circuits={circuits}
              loading={circuitsLoading}
              onReset={resetCircuit}
              timeAgo={timeAgo}
            />
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

// ── Tab Button Component ─────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  count: number
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {icon}
      {label}
      {count > 0 && (
        <span
          className={`ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
            active ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )
}

// ── Alerts Panel ─────────────────────────────────────────────

function AlertsPanel({
  alerts,
  loading,
  filter,
  onFilterChange,
  onAcknowledge,
  onAcknowledgeAll,
  expanded,
  onToggleExpand,
  page,
  total,
  pageSize,
  onPageChange,
  getAppName,
  timeAgo,
}: {
  alerts: Alert[]
  loading: boolean
  filter: { level: string; source: string; acknowledged: string }
  onFilterChange: (f: { level: string; source: string; acknowledged: string }) => void
  onAcknowledge: (id: string) => void
  onAcknowledgeAll: () => void
  expanded: string | null
  onToggleExpand: (id: string) => void
  page: number
  total: number
  pageSize: number
  onPageChange: (p: number) => void
  getAppName: (id: string) => string
  timeAgo: (d: string) => string
}) {
  const totalPages = Math.ceil(total / pageSize)

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select
          value={filter.level}
          onValueChange={(v) => onFilterChange({ ...filter, level: v })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
            <SelectItem value="ERROR">Error</SelectItem>
            <SelectItem value="WARNING">Warning</SelectItem>
            <SelectItem value="INFO">Info</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filter.source}
          onValueChange={(v) => onFilterChange({ ...filter, source: v })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="system">System</SelectItem>
            {Object.entries(APP_NAMES)
              .filter(([k]) => k.startsWith('APP-'))
              .map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Select
          value={filter.acknowledged}
          onValueChange={(v) => onFilterChange({ ...filter, acknowledged: v })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unacknowledged">Unacknowledged</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        {filter.acknowledged !== 'acknowledged' && alerts.length > 0 && (
          <Button variant="outline" size="sm" onClick={onAcknowledgeAll}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Acknowledge All
          </Button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner text="Loading alerts..." />
      ) : alerts.length === 0 ? (
        <EmptyState icon={Bell} text="No alerts match your filters" />
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Level</TableHead>
                    <TableHead className="w-[140px]">Source</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="w-[100px]">Time</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[140px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert) => {
                    const config = LEVEL_CONFIG[alert.level]
                    const LevelIcon = config.icon
                    const isExpanded = expanded === alert.id

                    return (
                      <>
                        <TableRow
                          key={alert.id}
                          className={`cursor-pointer hover:bg-gray-50 ${
                            !alert.acknowledged ? 'bg-white' : 'bg-gray-50/50'
                          }`}
                          onClick={() => onToggleExpand(alert.id)}
                        >
                          <TableCell>
                            <Badge className={config.color}>
                              <LevelIcon className="h-3 w-3 mr-1" />
                              {alert.level}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium">
                              {getAppName(alert.source)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`text-sm ${!alert.acknowledged ? 'font-medium' : ''}`}>
                              {alert.title}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {timeAgo(alert.createdAt)}
                          </TableCell>
                          <TableCell>
                            {alert.acknowledged ? (
                              <Badge variant="outline" className="text-green-600 border-green-300">
                                Ack
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                Open
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div
                              className="flex items-center justify-end gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onToggleExpand(alert.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {!alert.acknowledged && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600"
                                  onClick={() => onAcknowledge(alert.id)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Expanded Detail Row */}
                        {isExpanded && (
                          <TableRow key={`${alert.id}-detail`}>
                            <TableCell colSpan={6} className="bg-gray-50 p-4">
                              <div className="space-y-2">
                                <p className="text-sm text-gray-700">{alert.message}</p>
                                {alert.data && Object.keys(alert.data).length > 0 && (
                                  <pre className="mt-2 rounded-md bg-gray-900 text-gray-100 p-3 text-xs overflow-x-auto max-h-48">
                                    {JSON.stringify(alert.data, null, 2)}
                                  </pre>
                                )}
                                <div className="flex gap-4 text-xs text-gray-500 mt-2">
                                  <span>
                                    Created: {new Date(alert.createdAt).toLocaleString()}
                                  </span>
                                  {alert.acknowledgedAt && (
                                    <span>
                                      Acknowledged: {new Date(alert.acknowledgedAt).toLocaleString()}
                                      {alert.acknowledgedBy && ` by ${alert.acknowledgedBy}`}
                                    </span>
                                  )}
                                  {alert.resolvedAt && (
                                    <span>
                                      Resolved: {new Date(alert.resolvedAt).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              onPageChange={onPageChange}
            />
          )}
        </>
      )}
    </>
  )
}

// ── Dead Letter Panel ────────────────────────────────────────

function DeadLetterPanel({
  deadLetters,
  stats,
  loading,
  filter,
  onFilterChange,
  onRetry,
  onDiscard,
  onRetryAllForApp,
  expanded,
  onToggleExpand,
  page,
  total,
  pageSize,
  onPageChange,
  getAppName,
  timeAgo,
}: {
  deadLetters: DeadLetterJob[]
  stats: DeadLetterStats | null
  loading: boolean
  filter: { appId: string; status: string }
  onFilterChange: (f: { appId: string; status: string }) => void
  onRetry: (id: string) => void
  onDiscard: (id: string) => void
  onRetryAllForApp: (appId: string) => void
  expanded: string | null
  onToggleExpand: (id: string) => void
  page: number
  total: number
  pageSize: number
  onPageChange: (p: number) => void
  getAppName: (id: string) => string
  timeAgo: (d: string) => string
}) {
  const totalPages = Math.ceil(total / pageSize)

  return (
    <>
      {/* DLQ Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Pending</p>
              <p className="text-xl font-bold text-red-600">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Retried</p>
              <p className="text-xl font-bold text-blue-600">{stats.retried}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Discarded</p>
              <p className="text-xl font-bold text-gray-600">{stats.discarded}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Apps breakdown */}
      {stats && Object.keys(stats.byApp).length > 0 && (
        <Card className="mb-4">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Pending by App</CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byApp)
                .sort(([, a], [, b]) => b - a)
                .map(([appId, count]) => (
                  <div
                    key={appId}
                    className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-1.5"
                  >
                    <span className="text-sm font-medium text-red-800">
                      {getAppName(appId)}
                    </span>
                    <Badge className="bg-red-600 text-white">{count}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-red-600 hover:bg-red-100"
                      onClick={() => onRetryAllForApp(appId)}
                      title="Retry all pending jobs for this app"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select
          value={filter.appId}
          onValueChange={(v) => onFilterChange({ ...filter, appId: v })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="App" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Apps</SelectItem>
            {Object.entries(APP_NAMES).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filter.status}
          onValueChange={(v) => onFilterChange({ ...filter, status: v })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="retried">Retried</SelectItem>
            <SelectItem value="discarded">Discarded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner text="Loading dead letter jobs..." />
      ) : deadLetters.length === 0 ? (
        <EmptyState icon={CheckCircle} text="No dead letter jobs match your filters" />
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">App</TableHead>
                    <TableHead>Job Name</TableHead>
                    <TableHead className="w-[120px]">Queue</TableHead>
                    <TableHead className="w-[80px]">Attempts</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[100px]">Time</TableHead>
                    <TableHead className="w-[140px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deadLetters.map((job) => {
                    const isExpanded = expanded === job.id

                    return (
                      <>
                        <TableRow
                          key={job.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => onToggleExpand(job.id)}
                        >
                          <TableCell>
                            <span className="text-sm font-medium">
                              {getAppName(job.appId)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <span className="text-sm font-medium">{job.jobName}</span>
                              <p className="text-xs text-gray-500 truncate max-w-xs mt-0.5">
                                {job.error.substring(0, 80)}
                                {job.error.length > 80 ? '...' : ''}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{job.originalQueue}</Badge>
                          </TableCell>
                          <TableCell className="text-center font-mono text-sm">
                            {job.attempts}
                          </TableCell>
                          <TableCell>
                            <DlqStatusBadge status={job.status} />
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {timeAgo(job.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div
                              className="flex items-center justify-end gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {job.status === 'pending' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-blue-600"
                                    onClick={() => onRetry(job.id)}
                                    title="Retry this job"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-gray-500"
                                    onClick={() => onDiscard(job.id)}
                                    title="Discard this job"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onToggleExpand(job.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {isExpanded && (
                          <TableRow key={`${job.id}-detail`}>
                            <TableCell colSpan={7} className="bg-gray-50 p-4">
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                    Error Message
                                  </p>
                                  <p className="text-sm text-red-700 font-mono bg-red-50 rounded p-2">
                                    {job.error}
                                  </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                      Job ID
                                    </p>
                                    <p className="font-mono text-gray-700">{job.jobId}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                      Error Pattern
                                    </p>
                                    <p className="font-mono text-gray-700">{job.pattern ?? 'N/A'}</p>
                                  </div>
                                </div>
                                {job.data && Object.keys(job.data).length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                      Job Data (sanitized)
                                    </p>
                                    <pre className="rounded-md bg-gray-900 text-gray-100 p-3 text-xs overflow-x-auto max-h-48">
                                      {JSON.stringify(job.data, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                <div className="flex gap-4 text-xs text-gray-500">
                                  <span>
                                    Failed: {new Date(job.createdAt).toLocaleString()}
                                  </span>
                                  {job.retriedAt && (
                                    <span>
                                      Retried: {new Date(job.retriedAt).toLocaleString()}
                                    </span>
                                  )}
                                  {job.discardedAt && (
                                    <span>
                                      Discarded: {new Date(job.discardedAt).toLocaleString()}
                                      {job.discardReason && ` — ${job.discardReason}`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              onPageChange={onPageChange}
            />
          )}
        </>
      )}
    </>
  )
}

// ── Circuit Breakers Panel ───────────────────────────────────

function CircuitsPanel({
  circuits,
  loading,
  onReset,
  timeAgo,
}: {
  circuits: CircuitStatus[]
  loading: boolean
  onReset: (name: string) => void
  timeAgo: (d: string) => string
}) {
  const stateConfig = {
    CLOSED: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle, textColor: 'text-green-600' },
    OPEN: { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle, textColor: 'text-red-600' },
    HALF_OPEN: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: AlertTriangle, textColor: 'text-yellow-600' },
  } as const

  if (loading) return <LoadingSpinner text="Loading circuit breaker status..." />

  if (circuits.length === 0) {
    return <EmptyState icon={Zap} text="No circuit breakers registered" />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {circuits.map((circuit) => {
        const config = stateConfig[circuit.state]
        const StateIcon = config.icon

        return (
          <Card key={circuit.name} className={circuit.state === 'OPEN' ? 'border-red-300' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg capitalize">{circuit.name}</CardTitle>
                <Badge className={config.color}>
                  <StateIcon className="h-3 w-3 mr-1" />
                  {circuit.state.replace('_', ' ')}
                </Badge>
              </div>
              <CardDescription>External service circuit breaker</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Failures</p>
                  <p className={`text-lg font-bold ${circuit.failures > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                    {circuit.failures}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Successes</p>
                  <p className="text-lg font-bold text-green-600">{circuit.successes}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Last Failure</p>
                  <p className="text-gray-700">
                    {circuit.lastFailure ? timeAgo(circuit.lastFailure) : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Last Success</p>
                  <p className="text-gray-700">
                    {circuit.lastSuccess ? timeAgo(circuit.lastSuccess) : 'Never'}
                  </p>
                </div>
                {circuit.state === 'OPEN' && circuit.nextRetry && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 uppercase">Next Retry</p>
                    <p className="text-yellow-600 font-medium">
                      {new Date(circuit.nextRetry).toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {circuit.state !== 'CLOSED' && (
                <div className="mt-4 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600"
                    onClick={() => onReset(circuit.name)}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset to Closed
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ── Shared UI Components ─────────────────────────────────────

function DlqStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return <Badge className="bg-red-100 text-red-800 border-red-300">Pending</Badge>
    case 'retried':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Retried</Badge>
    case 'discarded':
      return <Badge className="bg-gray-100 text-gray-600 border-gray-300">Discarded</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function LoadingSpinner({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
        <p className="mt-4 text-gray-600">{text}</p>
      </div>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>
  text: string
}) {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="text-center">
          <Icon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">{text}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (p: number) => void
}) {
  return (
    <div className="flex items-center justify-between mt-4 px-2">
      <p className="text-sm text-gray-500">
        Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-gray-600">
          {page + 1} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
