'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp, TrendingDown, Users, DollarSign, Activity,
  ArrowUpRight, ArrowDownRight, BarChart3, Bot, Briefcase,
  Shield, Wallet, Zap, Clock, Building2, PieChart,
} from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

// ============================================================================
// TYPES
// ============================================================================

interface PlatformData {
  dateRange: { start: string; end: string }
  revenue: {
    totalRevenue: number
    mrr: number
    arr: number
    growthRate: number
    revenueByMonth: Array<{ month: string; revenue: number; fees: number }>
    avgRevenuePerUser: number
  }
  growth: {
    totalUsers: number
    newUsersThisPeriod: number
    userGrowthRate: number
    usersByRole: Array<{ role: string; count: number }>
    usersByMonth: Array<{ month: string; newUsers: number; churned: number }>
    activationRate: number
    churnRate: number
    retentionDay30: number
  }
  marketplace: {
    totalContractors: number
    activeContractors: number
    totalBidsSubmitted: number
    avgBidsPerProject: number
    matchRate: number
    avgContractorScore: number
    contractorsByTrade: Array<{ trade: string; count: number }>
  }
  financial: {
    totalEscrowVolume: number
    avgEscrowAmount: number
    pendingReleases: number
    disputeRate: number
    processingFees: number
    cashFlowProjection: Array<{ date: string; inflow: number; outflow: number; balance: number }>
  }
  ai: {
    totalAutonomousActions: number
    actionsThisPeriod: number
    approvalRate: number
    hoursRecovered: number
    actionsByType: Array<{ type: string; count: number; approvalRate: number }>
  }
  operations: {
    totalProjects: number
    activeProjects: number
    completedProjects: number
    avgProjectDuration: number
    onTimeCompletionRate: number
    avgBudgetVariance: number
    projectsByStatus: Array<{ status: string; count: number }>
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function pctColor(v: number): string {
  if (v > 0) return 'text-green-600'
  if (v < 0) return 'text-red-600'
  return 'text-gray-600'
}

function statusColor(s: string): string {
  switch (s.toUpperCase()) {
    case 'ACTIVE': case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
    case 'COMPLETED': return 'bg-green-100 text-green-800'
    case 'ON_HOLD': case 'PAUSED': return 'bg-yellow-100 text-yellow-800'
    case 'CANCELLED': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// ============================================================================
// MINI BAR CHART
// ============================================================================

function MiniBarChart({ data, valueKey, labelKey, color = 'bg-blue-500', height = 120 }: {
  data: Array<Record<string, any>>
  valueKey: string
  labelKey: string
  color?: string
  height?: number
}) {
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1)
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center">
          <div
            className={`w-full ${color} rounded-t-sm transition-all duration-500 min-h-[2px]`}
            style={{ height: `${Math.max(2, (d[valueKey] / max) * 100)}%` }}
            title={`${d[labelKey]}: ${typeof d[valueKey] === 'number' && d[valueKey] >= 1000 ? fmt(d[valueKey]) : d[valueKey]}`}
          />
          <span className="text-[10px] text-gray-400 mt-1 truncate w-full text-center">
            {d[labelKey]?.slice(-2) || ''}
          </span>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// STAT CARD
// ============================================================================

function StatCard({ title, value, subtitle, growth, icon: Icon, iconColor = 'text-gray-600' }: {
  title: string
  value: string | number
  subtitle?: string
  growth?: number
  icon: any
  iconColor?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {growth !== undefined && (
          <div className="flex items-center text-xs mt-1">
            {growth >= 0 ? (
              <>
                <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-green-600">+{Math.abs(growth).toFixed(1)}%</span>
              </>
            ) : (
              <>
                <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                <span className="text-red-600">{growth.toFixed(1)}%</span>
              </>
            )}
            <span className="text-gray-500 ml-1">vs previous</span>
          </div>
        )}
        {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// SECTION TABS
// ============================================================================

type Section = 'overview' | 'revenue' | 'marketplace' | 'financial' | 'ai' | 'operations'

const SECTIONS: Array<{ key: Section; label: string; icon: any }> = [
  { key: 'overview', label: 'Overview', icon: PieChart },
  { key: 'revenue', label: 'Revenue & Growth', icon: DollarSign },
  { key: 'marketplace', label: 'Marketplace', icon: Building2 },
  { key: 'financial', label: 'Financial', icon: Wallet },
  { key: 'ai', label: 'AI & Automation', icon: Bot },
  { key: 'operations', label: 'Operations', icon: Briefcase },
]

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function AnalyticsPage() {
  const [data, setData] = useState<PlatformData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [section, setSection] = useState<Section>('overview')

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  async function fetchAnalytics() {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(
        `${API_BASE}/analytics/dashboard/platform?period=${dateRange}`,
        { credentials: 'include' }
      )
      if (!res.ok) throw new Error('Failed to load platform analytics')
      const json = await res.json()
      setData(json.data)
    } catch (err: any) {
      console.error('Analytics fetch error:', err)
      setError(err.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="container mx-auto p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                <p className="mt-4 text-gray-600">Loading platform analytics...</p>
              </div>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="container mx-auto p-6">
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">{error}</div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Platform Analytics</h1>
              <p className="text-gray-600 mt-1">Revenue, growth, marketplace, financial, AI, and operations metrics</p>
            </div>
            <div className="flex gap-2">
              {(['7d', '30d', '90d', '1y'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    dateRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
                </button>
              ))}
            </div>
          </div>

          {/* Section Tabs */}
          <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
            {SECTIONS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSection(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  section === key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {data && (
            <div className="space-y-6">

              {/* ============================================================ */}
              {/* OVERVIEW SECTION */}
              {/* ============================================================ */}
              {section === 'overview' && (
                <>
                  {/* Key KPIs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Monthly Recurring Revenue" value={fmt(data.revenue.mrr)} subtitle={`ARR: ${fmt(data.revenue.arr)}`} growth={data.revenue.growthRate} icon={DollarSign} iconColor="text-green-600" />
                    <StatCard title="Total Users" value={fmtNum(data.growth.totalUsers)} subtitle={`${data.growth.newUsersThisPeriod} new this period`} growth={data.growth.userGrowthRate} icon={Users} iconColor="text-blue-600" />
                    <StatCard title="Active Contractors" value={fmtNum(data.marketplace.activeContractors)} subtitle={`of ${data.marketplace.totalContractors} total`} icon={Building2} iconColor="text-purple-600" />
                    <StatCard title="AI Actions" value={fmtNum(data.ai.actionsThisPeriod)} subtitle={`${data.ai.hoursRecovered}h recovered`} icon={Bot} iconColor="text-orange-600" />
                  </div>

                  {/* Revenue Chart + Operations Summary */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Revenue Trend</CardTitle>
                        <CardDescription>Monthly platform revenue</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <MiniBarChart data={data.revenue.revenueByMonth} valueKey="revenue" labelKey="month" color="bg-green-500" height={140} />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>User Growth</CardTitle>
                        <CardDescription>New user registrations by month</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <MiniBarChart data={data.growth.usersByMonth} valueKey="newUsers" labelKey="month" color="bg-blue-500" height={140} />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-xs text-gray-500">Total Revenue</div>
                        <div className="text-lg font-bold mt-1">{fmt(data.revenue.totalRevenue)}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-xs text-gray-500">Escrow Volume</div>
                        <div className="text-lg font-bold mt-1">{fmt(data.financial.totalEscrowVolume)}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-xs text-gray-500">Bids Submitted</div>
                        <div className="text-lg font-bold mt-1">{fmtNum(data.marketplace.totalBidsSubmitted)}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-xs text-gray-500">Active Projects</div>
                        <div className="text-lg font-bold mt-1">{data.operations.activeProjects}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-xs text-gray-500">AI Approval Rate</div>
                        <div className="text-lg font-bold mt-1">{data.ai.approvalRate.toFixed(0)}%</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-xs text-gray-500">Pending Releases</div>
                        <div className="text-lg font-bold mt-1">{data.financial.pendingReleases}</div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              {/* ============================================================ */}
              {/* REVENUE & GROWTH SECTION */}
              {/* ============================================================ */}
              {section === 'revenue' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Revenue" value={fmt(data.revenue.totalRevenue)} growth={data.revenue.growthRate} icon={DollarSign} iconColor="text-green-600" />
                    <StatCard title="MRR" value={fmt(data.revenue.mrr)} subtitle={`ARR: ${fmt(data.revenue.arr)}`} icon={TrendingUp} iconColor="text-green-600" />
                    <StatCard title="ARPU" value={fmt(data.revenue.avgRevenuePerUser)} subtitle="Avg revenue per user" icon={Users} iconColor="text-blue-600" />
                    <StatCard title="New Users" value={fmtNum(data.growth.newUsersThisPeriod)} growth={data.growth.userGrowthRate} icon={Users} iconColor="text-blue-600" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Revenue by Month</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <MiniBarChart data={data.revenue.revenueByMonth} valueKey="revenue" labelKey="month" color="bg-green-500" height={160} />
                        <div className="mt-3 text-xs text-gray-500 text-center">
                          {data.revenue.revenueByMonth.length > 0 && (
                            <>
                              {data.revenue.revenueByMonth[0].month} — {data.revenue.revenueByMonth[data.revenue.revenueByMonth.length - 1].month}
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>User Growth by Month</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <MiniBarChart data={data.growth.usersByMonth} valueKey="newUsers" labelKey="month" color="bg-blue-500" height={160} />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Users by Role */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Users by Role</CardTitle>
                      <CardDescription>Distribution of users across platform roles</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {data.growth.usersByRole.map((role) => (
                          <div key={role.role} className="flex items-center gap-4">
                            <Badge variant="outline" className="w-32 justify-center">{role.role}</Badge>
                            <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-blue-600 h-2.5 rounded-full"
                                style={{ width: `${(role.count / data.growth.totalUsers) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-16 text-right">{role.count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* ============================================================ */}
              {/* MARKETPLACE SECTION */}
              {/* ============================================================ */}
              {section === 'marketplace' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Contractors" value={fmtNum(data.marketplace.totalContractors)} subtitle={`${data.marketplace.activeContractors} active`} icon={Building2} iconColor="text-purple-600" />
                    <StatCard title="Bids Submitted" value={fmtNum(data.marketplace.totalBidsSubmitted)} subtitle={`${data.marketplace.avgBidsPerProject.toFixed(1)} avg/project`} icon={BarChart3} iconColor="text-blue-600" />
                    <StatCard title="Match Rate" value={`${data.marketplace.matchRate.toFixed(0)}%`} subtitle="Bids resulting in awards" icon={Zap} iconColor="text-yellow-600" />
                    <StatCard title="Avg Contractor Score" value={data.marketplace.avgContractorScore} subtitle="Platform average" icon={Shield} iconColor="text-green-600" />
                  </div>

                  {/* Contractors by Trade */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Contractors by Trade</CardTitle>
                      <CardDescription>Top trades represented on the marketplace</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {data.marketplace.contractorsByTrade.length > 0 ? (
                        <div className="space-y-3">
                          {data.marketplace.contractorsByTrade.map((trade) => {
                            const maxCount = data.marketplace.contractorsByTrade[0]?.count || 1
                            return (
                              <div key={trade.trade} className="flex items-center gap-4">
                                <span className="text-sm text-gray-700 w-40 truncate">{trade.trade}</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className="bg-purple-500 h-2.5 rounded-full transition-all duration-500"
                                    style={{ width: `${(trade.count / maxCount) * 100}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium w-12 text-right">{trade.count}</span>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No trade data available</p>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}

              {/* ============================================================ */}
              {/* FINANCIAL SECTION */}
              {/* ============================================================ */}
              {section === 'financial' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Escrow Volume" value={fmt(data.financial.totalEscrowVolume)} subtitle={`Avg: ${fmt(data.financial.avgEscrowAmount)}`} icon={Wallet} iconColor="text-green-600" />
                    <StatCard title="Pending Releases" value={data.financial.pendingReleases} subtitle="Awaiting approval" icon={Clock} iconColor="text-yellow-600" />
                    <StatCard title="Dispute Rate" value={`${data.financial.disputeRate.toFixed(1)}%`} subtitle="of escrow agreements" icon={Shield} iconColor="text-red-600" />
                    <StatCard title="Processing Fees" value={fmt(data.financial.processingFees)} subtitle="Total collected" icon={DollarSign} iconColor="text-blue-600" />
                  </div>

                  {/* Cash Flow */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Cash Flow Projection</CardTitle>
                      <CardDescription>Monthly inflows, outflows, and running balance</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {data.financial.cashFlowProjection.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-2 px-3 font-medium text-gray-500">Month</th>
                                <th className="text-right py-2 px-3 font-medium text-gray-500">Inflow</th>
                                <th className="text-right py-2 px-3 font-medium text-gray-500">Outflow</th>
                                <th className="text-right py-2 px-3 font-medium text-gray-500">Net</th>
                                <th className="text-right py-2 px-3 font-medium text-gray-500">Balance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.financial.cashFlowProjection.map((cf, i) => {
                                const net = cf.inflow - cf.outflow
                                return (
                                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-2 px-3 font-medium">{cf.date}</td>
                                    <td className="py-2 px-3 text-right text-green-600">{fmt(cf.inflow)}</td>
                                    <td className="py-2 px-3 text-right text-red-600">{fmt(cf.outflow)}</td>
                                    <td className={`py-2 px-3 text-right font-medium ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {net >= 0 ? '+' : ''}{fmt(net)}
                                    </td>
                                    <td className="py-2 px-3 text-right font-medium">{fmt(cf.balance)}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No cash flow data available</p>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}

              {/* ============================================================ */}
              {/* AI & AUTOMATION SECTION */}
              {/* ============================================================ */}
              {section === 'ai' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total AI Actions" value={fmtNum(data.ai.totalAutonomousActions)} subtitle={`${data.ai.actionsThisPeriod} this period`} icon={Bot} iconColor="text-orange-600" />
                    <StatCard title="Approval Rate" value={`${data.ai.approvalRate.toFixed(0)}%`} subtitle="Auto-approved actions" icon={Zap} iconColor="text-green-600" />
                    <StatCard title="Hours Recovered" value={`${data.ai.hoursRecovered}h`} subtitle="Estimated time saved" icon={Clock} iconColor="text-blue-600" />
                    <StatCard title="Actions This Period" value={data.ai.actionsThisPeriod} subtitle="Automated decisions" icon={Activity} iconColor="text-purple-600" />
                  </div>

                  {/* Actions by Type */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Automation by Action Type</CardTitle>
                      <CardDescription>Breakdown of autonomous actions and their approval rates</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {data.ai.actionsByType.length > 0 ? (
                        <div className="space-y-4">
                          {data.ai.actionsByType.sort((a, b) => b.count - a.count).map((action) => (
                            <div key={action.type} className="flex items-center gap-4">
                              <span className="text-sm text-gray-700 w-48 truncate font-medium">{action.type.replace(/_/g, ' ')}</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                                <div
                                  className="bg-orange-500 h-3 rounded-full transition-all duration-500"
                                  style={{ width: `${(action.count / Math.max(...data.ai.actionsByType.map(a => a.count), 1)) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm w-12 text-right font-medium">{action.count}</span>
                              <Badge variant="outline" className="w-16 justify-center text-xs">
                                {action.approvalRate.toFixed(0)}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No automation data available</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Impact Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Bot className="h-10 w-10 text-orange-500 mx-auto mb-3" />
                          <div className="text-3xl font-bold">{data.ai.totalAutonomousActions}</div>
                          <div className="text-sm text-gray-500 mt-1">Total Autonomous Actions</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Clock className="h-10 w-10 text-blue-500 mx-auto mb-3" />
                          <div className="text-3xl font-bold">{data.ai.hoursRecovered}h</div>
                          <div className="text-sm text-gray-500 mt-1">Hours Recovered</div>
                          <div className="text-xs text-gray-400 mt-1">~{Math.round(data.ai.hoursRecovered / 8)} working days</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Zap className="h-10 w-10 text-green-500 mx-auto mb-3" />
                          <div className="text-3xl font-bold">{data.ai.approvalRate.toFixed(0)}%</div>
                          <div className="text-sm text-gray-500 mt-1">Approval Rate</div>
                          <div className="text-xs text-gray-400 mt-1">Confidence threshold met</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              {/* ============================================================ */}
              {/* OPERATIONS SECTION */}
              {/* ============================================================ */}
              {section === 'operations' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Projects" value={data.operations.totalProjects} subtitle={`${data.operations.activeProjects} active`} icon={Briefcase} iconColor="text-blue-600" />
                    <StatCard title="Completed" value={data.operations.completedProjects} subtitle="Projects delivered" icon={Activity} iconColor="text-green-600" />
                    <StatCard title="On-Time Rate" value={`${data.operations.onTimeCompletionRate.toFixed(0)}%`} subtitle="Completed on schedule" icon={Clock} iconColor="text-purple-600" />
                    <StatCard title="Budget Variance" value={`${data.operations.avgBudgetVariance.toFixed(1)}%`} subtitle="Average across projects" icon={TrendingUp} iconColor="text-yellow-600" />
                  </div>

                  {/* Projects by Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Projects by Status</CardTitle>
                      <CardDescription>Current distribution of project statuses</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {data.operations.projectsByStatus.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                          {data.operations.projectsByStatus.map((ps) => (
                            <div key={ps.status} className="text-center p-4 bg-gray-50 rounded-xl">
                              <div className="text-3xl font-bold text-gray-900">{ps.count}</div>
                              <Badge className={`mt-2 ${statusColor(ps.status)}`}>{ps.status}</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No project data available</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Operations Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Briefcase className="h-10 w-10 text-blue-500 mx-auto mb-3" />
                          <div className="text-3xl font-bold">{data.operations.activeProjects}</div>
                          <div className="text-sm text-gray-500 mt-1">Active Projects</div>
                          <div className="text-xs text-gray-400 mt-1">Currently in progress</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Activity className="h-10 w-10 text-green-500 mx-auto mb-3" />
                          <div className="text-3xl font-bold">{data.operations.completedProjects}</div>
                          <div className="text-sm text-gray-500 mt-1">Completed Projects</div>
                          <div className="text-xs text-gray-400 mt-1">Successfully delivered</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <BarChart3 className="h-10 w-10 text-purple-500 mx-auto mb-3" />
                          <div className="text-3xl font-bold">{data.operations.totalProjects}</div>
                          <div className="text-sm text-gray-500 mt-1">Total Projects</div>
                          <div className="text-xs text-gray-400 mt-1">All time</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
