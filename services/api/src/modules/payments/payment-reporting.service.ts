/**
 * Payment Reporting Service
 * Generates platform revenue reports and payment analytics
 */

import { prismaAny } from '../../utils/prisma-helper'
import { AuthorizationError } from '../../errors/app.error'

class PaymentReportingService {
  /**
   * Get platform revenue report
   */
  async getPlatformRevenueReport(
    userId: string,
    options?: {
      startDate?: Date
      endDate?: Date
      orgId?: string
    }
  ) {
    // Check if user has admin access
    // For now, allow any authenticated user (can be restricted later)

    const where: any = {
      status: 'COMPLETED',
      metadata: {
        path: ['type'],
        equals: 'platform_fee',
      },
    }

    if (options?.startDate) {
      where.paidAt = { ...where.paidAt, gte: options.startDate }
    }

    if (options?.endDate) {
      where.paidAt = { ...where.paidAt, lte: options.endDate }
    }

    if (options?.orgId) {
      where.orgId = options.orgId
    }

    // Get all platform fee payments
    const payments = await prismaAny.payment.findMany({
      where,
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    })

    // Calculate totals
    const totalFees = payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const totalPayments = payments.length

    // Group by organization
    const byOrg = payments.reduce((acc, p) => {
      const orgId = p.orgId || 'unknown'
      if (!acc[orgId]) {
        acc[orgId] = {
          orgId,
          orgName: p.org?.name || 'Unknown',
          count: 0,
          total: 0,
        }
      }
      acc[orgId].count++
      acc[orgId].total += Number(p.amount)
      return acc
    }, {} as Record<string, { orgId: string; orgName: string; count: number; total: number }>)

    // Group by month
    const byMonth = payments.reduce((acc, p) => {
      if (!p.paidAt) return acc
      const month = p.paidAt.toISOString().slice(0, 7) // YYYY-MM
      if (!acc[month]) {
        acc[month] = { month, count: 0, total: 0 }
      }
      acc[month].count++
      acc[month].total += Number(p.amount)
      return acc
    }, {} as Record<string, { month: string; count: number; total: number }>)

    return {
      summary: {
        totalFees,
        totalPayments,
        averageFee: totalPayments > 0 ? totalFees / totalPayments : 0,
        dateRange: {
          start: options?.startDate || null,
          end: options?.endDate || null,
        },
      },
      byOrganization: Object.values(byOrg),
      byMonth: Object.values(byMonth).sort((a: any, b: any) => b.month.localeCompare(a.month)),
      payments: payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        paidAt: p.paidAt,
        orgId: p.orgId,
        orgName: p.org?.name,
        milestoneId: (p.metadata as any)?.milestoneId,
      })),
    }
  }

  /**
   * Get payments by contractor
   */
  async getPaymentsByContractor(
    userId: string,
    contractorId: string,
    options?: {
      startDate?: Date
      endDate?: Date
    }
  ) {
    // Get milestones for this contractor
    const milestones = await prismaAny.milestone.findMany({
      where: {
        contract: {
          contractorId,
        },
        status: 'PAID',
        paidAt: options?.startDate || options?.endDate
          ? {
              ...(options.startDate ? { gte: options.startDate } : {}),
              ...(options.endDate ? { lte: options.endDate } : {}),
            }
          : undefined,
      },
      include: {
        contract: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    })

    // Get payment records
    const milestoneIds = milestones.map((m) => m.id)
    const payments = await prismaAny.payment.findMany({
      where: {
        metadata: {
          path: ['milestoneId'],
          in: milestoneIds,
        },
      },
    })

    const totalPaid = milestones.reduce((sum, m) => sum + Number(m.amount), 0)
    const totalFees = payments
      .filter((p) => (p.metadata as any)?.type === 'platform_fee')
      .reduce((sum, p) => sum + Number(p.amount), 0)
    const contractorReceived = totalPaid - totalFees

    return {
      contractorId,
      summary: {
        totalMilestones: milestones.length,
        totalPaid,
        platformFees: totalFees,
        contractorReceived,
      },
      milestones: milestones.map((m) => ({
        id: m.id,
        name: m.name,
        amount: Number(m.amount),
        paidAt: m.paidAt,
        projectId: m.contract.projectId,
        projectName: m.contract.project.name,
      })),
    }
  }

  /**
   * Export revenue report to CSV
   */
  async exportRevenueReportCSV(
    userId: string,
    options?: {
      startDate?: Date
      endDate?: Date
      orgId?: string
    }
  ) {
    const report = await this.getPlatformRevenueReport(userId, options)

    // Generate CSV
    const headers = ['Date', 'Amount', 'Organization', 'Milestone ID', 'Payment ID']
    const rows = report.payments.map((p) => [
      p.paidAt ? p.paidAt.toISOString().split('T')[0] : '',
      p.amount.toFixed(2),
      p.orgName || '',
      p.milestoneId || '',
      p.id,
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    return csv
  }
}

export const paymentReportingService = new PaymentReportingService()
