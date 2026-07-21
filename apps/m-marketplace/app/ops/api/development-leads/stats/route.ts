import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/development-leads/stats - Get lead statistics and metrics
export async function GET(request: NextRequest) {
  try {
    // Get counts by status
    const statusCounts = await prisma.developmentLead.groupBy({
      by: ['status'],
      _count: true,
    });

    // Get counts by priority
    const priorityCounts = await prisma.developmentLead.groupBy({
      by: ['priority'],
      _count: true,
    });

    // Get counts by asset type
    const assetTypeCounts = await prisma.developmentLead.groupBy({
      by: ['assetType'],
      _count: true,
    });

    // Get counts by project stage
    const projectStageCounts = await prisma.developmentLead.groupBy({
      by: ['projectStage'],
      _count: true,
    });

    // Get recent leads (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentLeadsCount = await prisma.developmentLead.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Get leads needing follow-up (nextFollowUpAt is past)
    const needsFollowUpCount = await prisma.developmentLead.count({
      where: {
        nextFollowUpAt: {
          lt: new Date(),
        },
        status: {
          notIn: ['WON', 'LOST', 'ARCHIVED'],
        },
      },
    });

    // Get total estimated value of active leads
    const activeLeads = await prisma.developmentLead.findMany({
      where: {
        status: {
          in: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATING'],
        },
        estimatedValue: {
          not: null,
        },
      },
      select: {
        estimatedValue: true,
      },
    });

    const totalPipelineValue = activeLeads.reduce(
      (sum, lead) => sum + (lead.estimatedValue?.toNumber() || 0),
      0
    );

    // Get conversion stats (won vs total closed)
    const closedLeadsCount = await prisma.developmentLead.count({
      where: {
        status: {
          in: ['WON', 'LOST'],
        },
      },
    });

    const wonLeadsCount = await prisma.developmentLead.count({
      where: {
        status: 'WON',
      },
    });

    const conversionRate = closedLeadsCount > 0 
      ? ((wonLeadsCount / closedLeadsCount) * 100).toFixed(1)
      : '0.0';

    // Get total closed value (won deals)
    const wonLeads = await prisma.developmentLead.findMany({
      where: {
        status: 'WON',
        closedAmount: {
          not: null,
        },
      },
      select: {
        closedAmount: true,
      },
    });

    const totalClosedValue = wonLeads.reduce(
      (sum, lead) => sum + (lead.closedAmount?.toNumber() || 0),
      0
    );

    return NextResponse.json({
      overview: {
        totalLeads: await prisma.developmentLead.count(),
        recentLeads: recentLeadsCount,
        needsFollowUp: needsFollowUpCount,
        conversionRate: parseFloat(conversionRate),
      },
      pipeline: {
        totalValue: totalPipelineValue,
        totalClosed: totalClosedValue,
        activeLeadsCount: activeLeads.length,
        wonLeadsCount,
      },
      breakdown: {
        byStatus: statusCounts,
        byPriority: priorityCounts,
        byAssetType: assetTypeCounts,
        byProjectStage: projectStageCounts,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
