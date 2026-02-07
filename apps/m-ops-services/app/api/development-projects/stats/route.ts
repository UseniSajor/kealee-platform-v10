import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/development-projects/stats - Dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Fetch all projects for aggregation
    const allProjects = await prisma.developmentProject.findMany({
      select: {
        id: true,
        status: true,
        totalBudget: true,
        totalInvoiced: true,
        totalPaid: true,
        serviceTier: true,
        assetType: true,
        estimatedStart: true,
        estimatedEnd: true,
        actualStart: true,
        actualEnd: true,
        createdAt: true,
      },
    });

    // Active statuses (not COMPLETED, CANCELLED, or ON_HOLD)
    const activeStatuses = [
      "INTAKE",
      "DUE_DILIGENCE",
      "PRE_DEVELOPMENT",
      "DESIGN",
      "PERMITTING",
      "BIDDING",
      "CONSTRUCTION",
      "CLOSEOUT",
      "WARRANTY",
    ];

    const activeProjects = allProjects.filter((p) =>
      activeStatuses.includes(p.status)
    );

    // Total projects by status
    const projectsByStatus = allProjects.reduce(
      (acc: Record<string, number>, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      },
      {}
    );

    // Total budget under management (active projects only)
    const totalBudgetUnderManagement = activeProjects.reduce(
      (sum, p) => sum + Number(p.totalBudget || 0),
      0
    );

    // Revenue metrics (all projects)
    const totalInvoiced = allProjects.reduce(
      (sum, p) => sum + Number(p.totalInvoiced || 0),
      0
    );
    const totalPaid = allProjects.reduce(
      (sum, p) => sum + Number(p.totalPaid || 0),
      0
    );
    const outstanding = totalInvoiced - totalPaid;

    // Average project duration (completed projects with both start and end dates)
    const completedProjects = allProjects.filter(
      (p) =>
        p.status === "COMPLETED" &&
        (p.actualStart || p.estimatedStart) &&
        (p.actualEnd || p.estimatedEnd)
    );

    let averageProjectDurationDays = 0;
    if (completedProjects.length > 0) {
      const totalDays = completedProjects.reduce((sum, p) => {
        const start = new Date(p.actualStart || p.estimatedStart!);
        const end = new Date(p.actualEnd || p.estimatedEnd!);
        const diffMs = end.getTime() - start.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return sum + Math.max(0, diffDays);
      }, 0);
      averageProjectDurationDays = Math.round(totalDays / completedProjects.length);
    }

    // Projects by service tier
    const projectsByServiceTier = allProjects.reduce(
      (acc: Record<string, number>, p) => {
        const tier = p.serviceTier || "UNASSIGNED";
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      },
      {}
    );

    // Projects by asset type
    const projectsByAssetType = allProjects.reduce(
      (acc: Record<string, number>, p) => {
        acc[p.assetType] = (acc[p.assetType] || 0) + 1;
        return acc;
      },
      {}
    );

    // Risk alerts summary (active by severity) across all active projects
    const activeProjectIds = activeProjects.map((p) => p.id);

    const riskAlerts = await prisma.devRiskAlert.findMany({
      where: {
        projectId: { in: activeProjectIds },
        isActive: true,
      },
      select: {
        severity: true,
      },
    });

    const riskAlertsBySeverity = riskAlerts.reduce(
      (acc: Record<string, number>, r) => {
        acc[r.severity] = (acc[r.severity] || 0) + 1;
        return acc;
      },
      {}
    );

    // Upcoming milestones (next 30 days) across all active projects
    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    const upcomingMilestones = await prisma.devMilestone.findMany({
      where: {
        projectId: { in: activeProjectIds },
        dueDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
        status: {
          in: ["NOT_STARTED", "IN_PROGRESS", "BLOCKED"],
        },
      },
      orderBy: { dueDate: "asc" },
      include: {
        project: {
          select: {
            id: true,
            projectName: true,
            clientCompany: true,
          },
        },
      },
    });

    // Overdue milestones across active projects
    const overdueMilestones = await prisma.devMilestone.count({
      where: {
        projectId: { in: activeProjectIds },
        dueDate: { lt: now },
        status: {
          in: ["NOT_STARTED", "IN_PROGRESS", "BLOCKED"],
        },
      },
    });

    return NextResponse.json({
      overview: {
        totalProjects: allProjects.length,
        activeProjects: activeProjects.length,
        completedProjects: completedProjects.length,
        cancelledProjects: allProjects.filter((p) => p.status === "CANCELLED").length,
        onHoldProjects: allProjects.filter((p) => p.status === "ON_HOLD").length,
      },
      projectsByStatus,
      financials: {
        totalBudgetUnderManagement,
        totalInvoiced,
        totalPaid,
        outstanding,
        collectionRate:
          totalInvoiced > 0
            ? parseFloat(((totalPaid / totalInvoiced) * 100).toFixed(1))
            : 0,
      },
      performance: {
        averageProjectDurationDays,
        overdueMilestones,
      },
      projectsByServiceTier,
      projectsByAssetType,
      riskAlerts: {
        totalActive: riskAlerts.length,
        bySeverity: {
          CRITICAL: riskAlertsBySeverity["CRITICAL"] || 0,
          HIGH: riskAlertsBySeverity["HIGH"] || 0,
          MEDIUM: riskAlertsBySeverity["MEDIUM"] || 0,
          LOW: riskAlertsBySeverity["LOW"] || 0,
        },
      },
      upcomingMilestones: upcomingMilestones.map((m) => ({
        id: m.id,
        name: m.name,
        phase: m.phase,
        dueDate: m.dueDate,
        status: m.status,
        assignedTo: m.assignedTo,
        projectId: m.project.id,
        projectName: m.project.projectName,
        clientCompany: m.project.clientCompany,
      })),
    });
  } catch (error) {
    console.error("Error fetching project statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch project statistics" },
      { status: 500 }
    );
  }
}
