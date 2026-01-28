'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AdminApiClient } from '@/lib/api/admin-client'
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface AnalyticsData {
  acquisition: {
    totalSignups: number
    signupsGrowth: number
    signupsBySource: Array<{ source: string; count: number }>
  }
  activation: {
    activatedUsers: number
    activationRate: number
    activationGrowth: number
  }
  retention: {
    day1: number
    day7: number
    day30: number
    retentionGrowth: number
  }
  revenue: {
    totalRevenue: number
    mrr: number
    arr: number
    revenueGrowth: number
  }
  referral: {
    totalReferrals: number
    referralRate: number
    referralGrowth: number
  }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  async function fetchAnalytics() {
    try {
      setLoading(true)
      setError(null)
      
      const endDate = new Date().toISOString()
      const startDate = new Date()
      
      switch (dateRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(startDate.getDate() - 30)
          break
        case '90d':
          startDate.setDate(startDate.getDate() - 90)
          break
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
      }

      const response = await AdminApiClient.getAnalytics({
        startDate: startDate.toISOString(),
        endDate,
        metrics: ['acquisition', 'activation', 'retention', 'revenue', 'referral'],
      }) as any

      // Transform API response to match our interface
      setData({
        acquisition: {
          totalSignups: response.acquisition?.totalSignups || 0,
          signupsGrowth: response.acquisition?.growth || 0,
          signupsBySource: response.acquisition?.bySource || [],
        },
        activation: {
          activatedUsers: response.activation?.activatedUsers || 0,
          activationRate: response.activation?.rate || 0,
          activationGrowth: response.activation?.growth || 0,
        },
        retention: {
          day1: response.retention?.day1 || 0,
          day7: response.retention?.day7 || 0,
          day30: response.retention?.day30 || 0,
          retentionGrowth: response.retention?.growth || 0,
        },
        revenue: {
          totalRevenue: response.revenue?.total || 0,
          mrr: response.revenue?.mrr || 0,
          arr: response.revenue?.arr || 0,
          revenueGrowth: response.revenue?.growth || 0,
        },
        referral: {
          totalReferrals: response.referral?.total || 0,
          referralRate: response.referral?.rate || 0,
          referralGrowth: response.referral?.growth || 0,
        },
      })
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
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading analytics...</p>
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
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Analytics</h1>
              <p className="text-gray-600 mt-2">Platform-wide analytics (acquisition, funnel, retention)</p>
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

          {data && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Signups</CardTitle>
                    <Users className="h-4 w-4 text-gray-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{data.acquisition.totalSignups.toLocaleString()}</div>
                    <div className="flex items-center text-xs text-gray-600 mt-1">
                      {data.acquisition.signupsGrowth >= 0 ? (
                        <>
                          <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                          <span className="text-green-600">+{Math.abs(data.acquisition.signupsGrowth)}%</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                          <span className="text-red-600">{data.acquisition.signupsGrowth}%</span>
                        </>
                      )}
                      <span className="ml-1">vs previous period</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Activation Rate</CardTitle>
                    <Activity className="h-4 w-4 text-gray-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{data.activation.activationRate.toFixed(1)}%</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {data.activation.activatedUsers.toLocaleString()} activated users
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-gray-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${data.revenue.mrr.toLocaleString()}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      ARR: ${data.revenue.arr.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">30-Day Retention</CardTitle>
                    <TrendingUp className="h-4 w-4 text-gray-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{data.retention.day30.toFixed(1)}%</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Day 1: {data.retention.day1.toFixed(1)}% • Day 7: {data.retention.day7.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Acquisition Sources */}
              <Card>
                <CardHeader>
                  <CardTitle>Acquisition by Source</CardTitle>
                  <CardDescription>User signups broken down by acquisition channel</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.acquisition.signupsBySource.length > 0 ? (
                    <div className="space-y-3">
                      {data.acquisition.signupsBySource.map((source) => (
                        <div key={source.source} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{source.source}</Badge>
                            <span className="text-sm text-gray-600">{source.count} signups</span>
                          </div>
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${(source.count / data.acquisition.totalSignups) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No acquisition data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Retention Funnel */}
              <Card>
                <CardHeader>
                  <CardTitle>Retention Funnel</CardTitle>
                  <CardDescription>User retention at Day 1, Day 7, and Day 30</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Day 1 Retention</span>
                      <div className="flex items-center gap-2">
                        <div className="w-48 bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-green-600 h-3 rounded-full"
                            style={{ width: `${data.retention.day1}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{data.retention.day1.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Day 7 Retention</span>
                      <div className="flex items-center gap-2">
                        <div className="w-48 bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-blue-600 h-3 rounded-full"
                            style={{ width: `${data.retention.day7}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{data.retention.day7.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Day 30 Retention</span>
                      <div className="flex items-center gap-2">
                        <div className="w-48 bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-purple-600 h-3 rounded-full"
                            style={{ width: `${data.retention.day30}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{data.retention.day30.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">${data.revenue.totalRevenue.toLocaleString()}</div>
                    <div className="flex items-center text-xs text-gray-600 mt-2">
                      {data.revenue.revenueGrowth >= 0 ? (
                        <>
                          <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                          <span className="text-green-600">+{Math.abs(data.revenue.revenueGrowth)}%</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                          <span className="text-red-600">{data.revenue.revenueGrowth}%</span>
                        </>
                      )}
                      <span className="ml-1">growth</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Referral Program</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{data.referral.totalReferrals.toLocaleString()}</div>
                    <div className="text-xs text-gray-600 mt-2">
                      {data.referral.referralRate.toFixed(1)}% referral rate
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Activation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{data.activation.activationRate.toFixed(1)}%</div>
                    <div className="text-xs text-gray-600 mt-2">
                      {data.activation.activatedUsers.toLocaleString()} users activated
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
