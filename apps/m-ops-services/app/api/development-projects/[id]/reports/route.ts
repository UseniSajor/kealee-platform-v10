import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/development-projects/[id]/reports - List reports for project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params;
    const searchParams = request.nextUrl.searchParams;

    // Verify project exists
    const project = await prisma.developmentProject.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Optional filters
    const status = searchParams.get("status");
    const frequency = searchParams.get("frequency");

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = { projectId };
    if (status) where.status = status;
    if (frequency) where.frequency = frequency;

    const [reports, total] = await Promise.all([
      prisma.devReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { reportNumber: "desc" },
      }),
      prisma.devReport.count({ where }),
    ]);

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

// POST /api/development-projects/[id]/reports - Generate new report
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params;
    const body = await request.json();

    // Fetch project with milestones and risk alerts for report generation
    const project = await prisma.developmentProject.findUnique({
      where: { id: projectId },
      include: {
        milestones: {
          orderBy: { sortOrder: "asc" },
        },
        riskAlerts: {
          where: { isActive: true },
          orderBy: { severity: "desc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Auto-increment report number
    const lastReport = await prisma.devReport.findFirst({
      where: { projectId },
      orderBy: { reportNumber: "desc" },
      select: { reportNumber: true, periodEnd: true },
    });

    const reportNumber = (lastReport?.reportNumber ?? 0) + 1;

    // Determine frequency
    const frequency = body.frequency || "MONTHLY";

    // Calculate period dates
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    if (body.periodStart && body.periodEnd) {
      periodStart = new Date(body.periodStart);
      periodEnd = new Date(body.periodEnd);
    } else if (lastReport?.periodEnd) {
      // Start from day after last report ended
      periodStart = new Date(lastReport.periodEnd);
      periodStart.setDate(periodStart.getDate() + 1);
      periodEnd = new Date(periodStart);

      if (frequency === "WEEKLY") {
        periodEnd.setDate(periodEnd.getDate() + 6);
      } else if (frequency === "BI_WEEKLY") {
        periodEnd.setDate(periodEnd.getDate() + 13);
      } else {
        // MONTHLY
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        periodEnd.setDate(periodEnd.getDate() - 1);
      }
    } else {
      // First report - default to current month
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Calculate milestone progress for the report
    const milestoneProgress = project.milestones.map((m) => ({
      id: m.id,
      name: m.name,
      phase: m.phase,
      status: m.status,
      percentComplete: m.percentComplete,
      plannedDate: m.plannedDate,
      actualDate: m.actualDate,
      dueDate: m.dueDate,
      isOverdue: m.dueDate && m.status !== "COMPLETED" && m.status !== "SKIPPED"
        ? new Date(m.dueDate) < now
        : false,
    }));

    const totalMilestones = project.milestones.length;
    const completedMilestones = project.milestones.filter(
      (m) => m.status === "COMPLETED"
    ).length;
    const overallPercent =
      totalMilestones > 0
        ? Math.round(
            project.milestones.reduce((sum, m) => sum + m.percentComplete, 0) /
              totalMilestones
          )
        : 0;

    const progressUpdate = {
      milestones: milestoneProgress,
      totalMilestones,
      completedMilestones,
      percentComplete: overallPercent,
      keyActivities: body.keyActivities || [],
    };

    // Budget summary
    const totalBudget = Number(project.totalBudget || 0);
    const totalInvoiced = Number(project.totalInvoiced || 0);
    const totalPaid = Number(project.totalPaid || 0);

    const budgetSummary = {
      totalBudget,
      spent: totalInvoiced,
      remaining: totalBudget - totalInvoiced,
      variance: totalBudget > 0
        ? ((totalInvoiced / totalBudget) * 100).toFixed(1)
        : "0.0",
      forecast: totalBudget, // Simplified - could be enhanced with burn rate
      invoiced: totalInvoiced,
      collected: totalPaid,
      outstanding: totalInvoiced - totalPaid,
    };

    // Schedule update
    const overdueMilestones = project.milestones.filter(
      (m) =>
        m.dueDate &&
        m.status !== "COMPLETED" &&
        m.status !== "SKIPPED" &&
        new Date(m.dueDate) < now
    );

    const upcomingMilestones = project.milestones.filter(
      (m) =>
        m.dueDate &&
        m.status !== "COMPLETED" &&
        m.status !== "SKIPPED" &&
        new Date(m.dueDate) >= now &&
        new Date(m.dueDate) <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    );

    const scheduleUpdate = {
      onTrack: overdueMilestones.length === 0,
      overdueCount: overdueMilestones.length,
      delaysExplanation: overdueMilestones.length > 0
        ? `${overdueMilestones.length} milestone(s) overdue: ${overdueMilestones.map((m) => m.name).join(", ")}`
        : "All milestones on track",
      lookahead: upcomingMilestones.map((m) => ({
        name: m.name,
        dueDate: m.dueDate,
        status: m.status,
      })),
    };

    // Risks and issues
    const risksAndIssues = project.riskAlerts.map((r) => ({
      id: r.id,
      risk: r.title,
      description: r.description,
      severity: r.severity,
      category: r.category,
      mitigation: r.mitigationPlan,
      probabilityPercent: r.probabilityPercent,
      estimatedCostImpact: r.estimatedCostImpact ? Number(r.estimatedCostImpact) : null,
    }));

    // Financial details
    const financialDetails = {
      invoiced: totalInvoiced,
      collected: totalPaid,
      outstanding: totalInvoiced - totalPaid,
      monthlyFee: project.monthlyFee ? Number(project.monthlyFee) : null,
    };

    // Generate title
    const title =
      body.title ||
      `${project.projectName} - Report #${reportNumber} (${periodStart.toLocaleDateString("en-US", { month: "short", year: "numeric" })})`;

    // Generate executive summary
    const executiveSummary =
      body.executiveSummary ||
      `Progress report #${reportNumber} for ${project.projectName}. ` +
        `Overall project completion is at ${overallPercent}% with ${completedMilestones} of ${totalMilestones} milestones completed. ` +
        `Budget utilization stands at ${budgetSummary.variance}% ($${totalInvoiced.toLocaleString()} of $${totalBudget.toLocaleString()}). ` +
        (overdueMilestones.length > 0
          ? `There are ${overdueMilestones.length} overdue milestone(s) requiring attention. `
          : "All milestones are currently on schedule. ") +
        (project.riskAlerts.length > 0
          ? `${project.riskAlerts.length} active risk alert(s) are being monitored.`
          : "No active risk alerts.");

    const report = await prisma.devReport.create({
      data: {
        projectId,
        reportNumber,
        frequency,
        periodStart,
        periodEnd,
        title,
        executiveSummary,
        progressUpdate,
        budgetSummary,
        scheduleUpdate,
        risksAndIssues,
        nextSteps: body.nextSteps || [],
        photos: body.photos || [],
        financialDetails,
        aiInsights: body.aiInsights,
        aiRiskScore: body.aiRiskScore,
        status: "DRAFT",
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}
