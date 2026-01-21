'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AdminApiClient } from '@/lib/api/admin-client'
import { DollarSign, TrendingUp, TrendingDown, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface FinancialData {
  totalRevenue: number
  mrr: number
  arr: number
  revenueGrowth: number
  churn: {
    rate: number
    count: number
    growth: number
  }
  ltv: {
    average: number
    growth: number
  }
  subscriptions: {
    total: number
    active: number
    trialing: number
    canceled: number
  }
  revenueByProduct: Array<{
    product: string
    revenue: number
    growth: number
  }>
}

export default function FinancialsPage() {
  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  useEffect(() => {
    fetchFinancials()
  }, [dateRange])

  async function fetchFinancials() {
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

      const stats = await AdminApiClient.getBillingStats({
        start: startDate.toISOString(),
        end: endDate,
      })

      const revenueReport = await AdminApiClient.getRevenueReport({
        startDate: startDate.toISOString(),
        endDate,
        groupBy: dateRange === '7d' ? 'day' : dateRange === '30d' ? 'day' : dateRange === '90d' ? 'week' : 'month',
      })

      setData({
        totalRevenue: stats.totalRevenue || 0,
        mrr: stats.mrr || 0,
        arr: stats.arr || 0,
        revenueGrowth: stats.revenueGrowth || 0,
        churn: {
          rate: stats.churnRate || 0,
          count: stats.churnCount || 0,
          growth: stats.churnGrowth || 0,
        },
        ltv: {
          average: stats.avgLtv || 0,
          growth: stats.ltvGrowth || 0,
        },
        subscriptions: {
          total: stats.totalSubscriptions || 0,
          active: stats.activeSubscriptions || 0,
          trialing: stats.trialingSubscriptions || 0,
          canceled: stats.canceledSubscriptions || 0,
        },
        revenueByProduct: revenueReport.byProduct || [],
      })
    } catch (err: any) {
      console.error('Financials fetch error:', err)
      setError(err.message || 'Failed to load financial data')
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
                <p className="mt-4 text-gray-600">Loading financial data...</p>
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
              <h1 className="text-3xl font-bold">Financials</h1>
              <p className="text-gray-600 mt-2">
                Platform-wide revenue, MRR/ARR trends, churn, LTV (meta-level)
              </p>
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
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-gray-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${data.totalRevenue.toLocaleString()}</div>
                    <div className="flex items-center text-xs text-gray-600 mt-1">
                      {data.revenueGrowth >= 0 ? (
                        <>
                          <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                          <span className="text-green-600">+{Math.abs(data.revenueGrowth)}%</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                          <span className="text-red-600">{data.revenueGrowth}%</span>
                        </>
                      )}
                      <span className="ml-1">vs previous period</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
                    <TrendingUp className="h-4 w-4 text-gray-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${data.mrr.toLocaleString()}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      ARR: ${data.arr.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                    <TrendingDown className="h-4 w-4 text-gray-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{data.churn.rate.toFixed(2)}%</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {data.churn.count} cancellations
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Average LTV</CardTitle>
                    <Users className="h-4 w-4 text-gray-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${data.ltv.average.toLocaleString()}</div>
                    <div className="flex items-center text-xs text-gray-600 mt-1">
                      {data.ltv.growth >= 0 ? (
                        <>
                          <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                          <span className="text-green-600">+{Math.abs(data.ltv.growth)}%</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                          <span className="text-red-600">{data.ltv.growth}%</span>
                        </>
                      )}
                      <span className="ml-1">growth</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Subscription Health */}
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Health</CardTitle>
                  <CardDescription>Current subscription status breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Total</div>
                      <div className="text-2xl font-bold">{data.subscriptions.total}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Active</div>
                      <div className="text-2xl font-bold text-green-600">{data.subscriptions.active}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Trialing</div>
                      <div className="text-2xl font-bold text-blue-600">{data.subscriptions.trialing}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Canceled</div>
                      <div className="text-2xl font-bold text-red-600">{data.subscriptions.canceled}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue by Product */}
              {data.revenueByProduct.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Product</CardTitle>
                    <CardDescription>Revenue breakdown across platform products</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.revenueByProduct.map((product) => (
                        <div key={product.product} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">{product.product}</Badge>
                              <span className="text-sm text-gray-600">${product.revenue.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              {product.growth >= 0 ? (
                                <>
                                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                                  <span className="text-green-600">+{Math.abs(product.growth)}%</span>
                                </>
                              ) : (
                                <>
                                  <ArrowDownRight className="h-3 w-3 text-red-600" />
                                  <span className="text-red-600">{product.growth}%</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${(product.revenue / data.totalRevenue) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
