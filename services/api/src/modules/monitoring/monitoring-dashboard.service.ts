/**
 * Monitoring Dashboard Service
 * Aggregates metrics for monitoring dashboard
 */

import { prismaAny } from '../../utils/prisma-helper'

export interface DashboardMetrics {
  errors: {
    total: number
    byStatus: Array<{ status: number; count: number }>
    byEndpoint: Array<{ endpoint: string; count: number }>
    recent: Array<{
      id: string
      method: string
      path: string
      statusCode: number
      timestamp: Date
    }>
  }
  performance: {
    averageResponseTime: number
    p50: number
    p95: number
    p99: number
    byEndpoint: Array<{ endpoint: string; avgDuration: number; count: number }>
  }
  users: {
    activeUsers24h: number
    activeUsers7d: number
    activeUsers30d: number
    newUsers24h: number
  }
  revenue: {
    totalRevenue: number
    revenue24h: number
    revenue7d: number
    revenue30d: number
    platformFees: number
  }
}

class MonitoringDashboardService {
  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(
    startDate?: Date,
    endDate?: Date
  ): Promise<DashboardMetrics> {
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const dateFilter = startDate || endDate
      ? {
          createdAt: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          },
        }
      : {}

    // Error metrics (if model exists)
    let errorLogs: any[] = []
    let errorsByStatus: any[] = []
    let errorsByEndpoint: any[] = []

    try {
      errorLogs = await (prismaAny as any).apiRequestLog.findMany({
      where: {
        ...dateFilter,
        statusCode: { gte: 400 },
      },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })

      errorsByStatus = await (prismaAny as any).apiRequestLog.groupBy({
      by: ['statusCode'],
      where: {
        ...dateFilter,
        statusCode: { gte: 400 },
      },
      _count: true,
    })

    const errorsByEndpoint = await prismaAny.apiRequestLog.groupBy({
      by: ['path'],
      where: {
        ...dateFilter,
        statusCode: { gte: 400 },
      },
      _count: true,
      orderBy: { _count: { path: 'desc' } },
        take: 10,
      })
    } catch (error: any) {
      console.warn('ApiRequestLog model not migrated yet:', error.message)
    }

    // Performance metrics (if model exists)
    let allLogs: any[] = []
    let performanceByEndpoint: any[] = []

    try {
      allLogs = await (prismaAny as any).apiRequestLog.findMany({
      where: dateFilter,
      select: { durationMs: true, path: true },
    })

    const durations = allLogs.map((log) => log.durationMs).sort((a, b) => a - b)
    const avgResponseTime =
      durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0
    const p50 = durations[Math.floor(durations.length * 0.5)] || 0
    const p95 = durations[Math.floor(durations.length * 0.95)] || 0
    const p99 = durations[Math.floor(durations.length * 0.99)] || 0

    const performanceByEndpoint = await prismaAny.apiRequestLog.groupBy({
      by: ['path'],
      where: dateFilter,
      _avg: { durationMs: true },
      _count: true,
      orderBy: { _avg: { durationMs: 'desc' } },
        take: 10,
      })
    } catch (error: any) {
      console.warn('ApiRequestLog model not migrated yet:', error.message)
    }

    // User metrics
    let activeUsers24h = 0
    let activeUsers7d = 0
    let activeUsers30d = 0

    try {
      // Count distinct users from request logs
      const users24h = await (prismaAny as any).apiRequestLog.findMany({
        where: {
          createdAt: { gte: dayAgo },
          userId: { not: null },
        },
        select: { userId: true },
        distinct: ['userId'],
      })
      activeUsers24h = users24h.length

      const users7d = await (prismaAny as any).apiRequestLog.findMany({
        where: {
          createdAt: { gte: weekAgo },
          userId: { not: null },
        },
        select: { userId: true },
        distinct: ['userId'],
      })
      activeUsers7d = users7d.length

      const users30d = await (prismaAny as any).apiRequestLog.findMany({
        where: {
          createdAt: { gte: monthAgo },
          userId: { not: null },
        },
        select: { userId: true },
        distinct: ['userId'],
      })
      activeUsers30d = users30d.length
    } catch (error: any) {
      console.warn('Could not calculate active users:', error.message)
    }

    const newUsers24h = await prismaAny.user.count({
      where: {
        createdAt: { gte: dayAgo },
      },
    })

    // Revenue metrics
    const payments = await prismaAny.payment.findMany({
      where: {
        status: 'COMPLETED',
        paidAt: dateFilter.createdAt || undefined,
      },
      select: { amount: true, metadata: true },
    })

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const platformFees = payments
      .filter((p) => (p.metadata as any)?.type === 'platform_fee')
      .reduce((sum, p) => sum + Number(p.amount), 0)

    const revenue24h = payments
      .filter((p) => p.paidAt && p.paidAt >= dayAgo)
      .reduce((sum, p) => sum + Number(p.amount), 0)

    const revenue7d = payments
      .filter((p) => p.paidAt && p.paidAt >= weekAgo)
      .reduce((sum, p) => sum + Number(p.amount), 0)

    const revenue30d = payments
      .filter((p) => p.paidAt && p.paidAt >= monthAgo)
      .reduce((sum, p) => sum + Number(p.amount), 0)

    return {
      errors: {
        total: errorLogs.length,
        byStatus: errorsByStatus.map((e) => ({
          status: e.statusCode,
          count: e._count,
        })),
        byEndpoint: errorsByEndpoint.map((e) => ({
          endpoint: e.path,
          count: e._count,
        })),
        recent: errorLogs.slice(0, 10).map((log) => ({
          id: log.id,
          method: log.method,
          path: log.path,
          statusCode: log.statusCode,
          timestamp: log.createdAt,
        })),
      },
      performance: {
        averageResponseTime: Math.round(avgResponseTime),
        p50: Math.round(p50),
        p95: Math.round(p95),
        p99: Math.round(p99),
        byEndpoint: performanceByEndpoint.map((p) => ({
          endpoint: p.path,
          avgDuration: Math.round(p._avg.durationMs || 0),
          count: p._count,
        })),
      },
      users: {
        activeUsers24h,
        activeUsers7d,
        activeUsers30d,
        newUsers24h,
      },
      revenue: {
        totalRevenue,
        revenue24h,
        revenue7d,
        revenue30d,
        platformFees,
      },
    }
  }
}

export const monitoringDashboardService = new MonitoringDashboardService()
