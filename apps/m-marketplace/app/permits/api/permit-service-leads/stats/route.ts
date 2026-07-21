import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const statusCounts = await prisma.permitServiceLead.groupBy({
      by: ['status'],
      _count: true,
    });

    const contractorTypeCounts = await prisma.permitServiceLead.groupBy({
      by: ['contractorType'],
      _count: true,
    });

    const totalLeads = await prisma.permitServiceLead.count();
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentLeads = await prisma.permitServiceLead.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    const activeClients = await prisma.permitServiceLead.count({
      where: { status: 'ACTIVE_CLIENT' },
    });

    const totalPermitsProcessed = await prisma.permitServiceLead.aggregate({
      _sum: { totalPermitsProcessed: true },
    });

    return NextResponse.json({
      overview: {
        totalLeads,
        recentLeads,
        activeClients,
        totalPermitsProcessed: totalPermitsProcessed._sum.totalPermitsProcessed || 0,
      },
      breakdown: {
        byStatus: statusCounts,
        byContractorType: contractorTypeCounts,
      },
    });
  } catch (error) {
    console.error("Error fetching permit stats:", error);
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
  }
}
