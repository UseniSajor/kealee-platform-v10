import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/gc-ops-engagements/stats - Dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // 1. Total engagements by status
    const statusCounts = await prisma.gCOpsEngagement.groupBy({
      by: ["status"],
      _count: true,
    });

    const statusBreakdown = statusCounts.reduce(
      (acc, item) => {
        acc[item.status] = item._count;
        return acc;
      },
      {} as Record<string, number>
    );

    const totalEngagements = statusCounts.reduce(
      (sum, item) => sum + item._count,
      0
    );

    // 2. Active clients count
    const activeClientsCount = await prisma.gCOpsEngagement.count({
      where: {
        status: { in: ["ACTIVE", "TRIAL", "ONBOARDING"] },
      },
    });

    // 3. Monthly recurring revenue (sum of monthlyFee for ACTIVE engagements)
    const activeEngagements = await prisma.gCOpsEngagement.findMany({
      where: { status: "ACTIVE" },
      select: { monthlyFee: true },
    });

    const monthlyRecurringRevenue = activeEngagements.reduce(
      (sum, eng) => sum + parseFloat(eng.monthlyFee.toString()),
      0
    );

    // 4. Tasks completed this week and this month
    const now = new Date();

    const startOfWeek = getMonday(now);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [tasksCompletedThisWeek, tasksCompletedThisMonth] = await Promise.all(
      [
        prisma.gCOpsTask.count({
          where: {
            status: "COMPLETED",
            completedAt: { gte: startOfWeek },
          },
        }),
        prisma.gCOpsTask.count({
          where: {
            status: "COMPLETED",
            completedAt: { gte: startOfMonth },
          },
        }),
      ]
    );

    // 5. Average SLA compliance from recent weekly reports
    const recentReports = await prisma.gCOpsWeeklyReport.findMany({
      where: {
        slaCompliance: { not: null },
        createdAt: { gte: startOfMonth },
      },
      select: { slaCompliance: true },
    });

    const averageSlaCompliance =
      recentReports.length > 0
        ? Math.round(
            recentReports.reduce(
              (sum, r) => sum + (r.slaCompliance || 0),
              0
            ) / recentReports.length
          )
        : null;

    // 6. Package tier distribution
    const packageCounts = await prisma.gCOpsEngagement.groupBy({
      by: ["packageTier"],
      where: {
        status: { in: ["ACTIVE", "TRIAL", "ONBOARDING"] },
      },
      _count: true,
    });

    const packageDistribution = packageCounts.reduce(
      (acc, item) => {
        acc[item.packageTier] = item._count;
        return acc;
      },
      {} as Record<string, number>
    );

    // 7. Open permits count
    const openPermitsCount = await prisma.gCOpsPermitAction.count({
      where: {
        status: {
          in: [
            "NOT_STARTED",
            "APPLICATION_PREP",
            "SUBMITTED",
            "IN_REVIEW",
            "CORRECTIONS",
          ],
        },
      },
    });

    // 8. Vendor actions pending
    const vendorActionsPending = await prisma.gCOpsVendorAction.count({
      where: {
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
    });

    // 9. Additional useful metrics
    const totalTasksPending = await prisma.gCOpsTask.count({
      where: { status: "PENDING" },
    });

    const totalTasksInProgress = await prisma.gCOpsTask.count({
      where: { status: "IN_PROGRESS" },
    });

    const overdueTasks = await prisma.gCOpsTask.count({
      where: {
        status: { in: ["PENDING", "IN_PROGRESS"] },
        dueDate: { lt: now },
      },
    });

    return NextResponse.json({
      overview: {
        totalEngagements,
        activeClients: activeClientsCount,
        monthlyRecurringRevenue,
        averageSlaCompliance,
      },
      tasks: {
        completedThisWeek: tasksCompletedThisWeek,
        completedThisMonth: tasksCompletedThisMonth,
        pending: totalTasksPending,
        inProgress: totalTasksInProgress,
        overdue: overdueTasks,
      },
      engagements: {
        byStatus: statusBreakdown,
        byPackage: packageDistribution,
      },
      permits: {
        open: openPermitsCount,
      },
      vendors: {
        pending: vendorActionsPending,
      },
    });
  } catch (error) {
    console.error("Error fetching GC ops stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}

// Helper: Get Monday of the week for a given date
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
