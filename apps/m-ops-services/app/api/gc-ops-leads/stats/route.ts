import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const statusCounts = await prisma.gCOpsLead.groupBy({
      by: ['status'],
      _count: true,
    });

    const totalLeads = await prisma.gCOpsLead.count();
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentLeads = await prisma.gCOpsLead.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    const activeTrials = await prisma.gCOpsLead.count({
      where: { status: 'TRIAL_ACTIVE' },
    });

    const converted = await prisma.gCOpsLead.count({
      where: { status: 'CONVERTED' },
    });

    const totalValue = await prisma.gCOpsLead.aggregate({
      where: {
        status: 'CONVERTED',
        monthlyValue: { not: null },
      },
      _sum: { monthlyValue: true },
    });

    return NextResponse.json({
      overview: {
        totalLeads,
        recentLeads,
        activeTrials,
        converted,
        conversionRate: totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : '0.0',
      },
      revenue: {
        monthlyRecurring: totalValue._sum.monthlyValue || 0,
        averageDealSize: converted > 0 ? ((totalValue._sum.monthlyValue?.toNumber() || 0) / converted) : 0,
      },
      breakdown: {
        byStatus: statusCounts,
      },
    });
  } catch (error) {
    console.error("Error fetching GC stats:", error);
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
  }
}
