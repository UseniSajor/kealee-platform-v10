import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/gc-ops-engagements/[id]/weekly-reports - List weekly reports
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Optional status filter
    const status = searchParams.get("status");

    // Verify engagement exists
    const engagement = await prisma.gCOpsEngagement.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!engagement) {
      return NextResponse.json(
        { error: "Engagement not found" },
        { status: 404 }
      );
    }

    const where: any = {
      engagementId: params.id,
    };

    if (status) where.status = status;

    const [reports, total] = await Promise.all([
      prisma.gCOpsWeeklyReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { reportNumber: "desc" },
      }),
      prisma.gCOpsWeeklyReport.count({ where }),
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
    console.error("Error fetching weekly reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch weekly reports" },
      { status: 500 }
    );
  }
}

// POST /api/gc-ops-engagements/[id]/weekly-reports - Generate weekly report
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Verify engagement exists
    const engagement = await prisma.gCOpsEngagement.findUnique({
      where: { id: params.id },
    });

    if (!engagement) {
      return NextResponse.json(
        { error: "Engagement not found" },
        { status: 404 }
      );
    }

    // Auto-increment reportNumber
    const lastReport = await prisma.gCOpsWeeklyReport.findFirst({
      where: { engagementId: params.id },
      orderBy: { reportNumber: "desc" },
      select: { reportNumber: true },
    });

    const reportNumber = (lastReport?.reportNumber || 0) + 1;

    // Calculate week dates (Monday to Sunday)
    const now = new Date();
    const weekStartDate = body.weekStartDate
      ? new Date(body.weekStartDate)
      : getMonday(now);
    const weekEndDate = body.weekEndDate
      ? new Date(body.weekEndDate)
      : getSunday(weekStartDate);

    // Pull task completion data for the report week
    const completedTasks = await prisma.gCOpsTask.findMany({
      where: {
        engagementId: params.id,
        status: "COMPLETED",
        completedAt: {
          gte: weekStartDate,
          lte: weekEndDate,
        },
      },
      select: {
        title: true,
        category: true,
        actualHours: true,
        completedAt: true,
        notes: true,
      },
    });

    const inProgressTasks = await prisma.gCOpsTask.findMany({
      where: {
        engagementId: params.id,
        status: "IN_PROGRESS",
      },
      select: {
        title: true,
        category: true,
        estimatedHours: true,
        actualHours: true,
        dueDate: true,
      },
    });

    // Build tasks completed JSON
    const tasksCompletedData = completedTasks.map((task) => ({
      task: task.title,
      hours: task.actualHours ? parseFloat(task.actualHours.toString()) : 0,
      result: task.notes || "Completed",
    }));

    // Build tasks in progress JSON
    const tasksInProgressData = inProgressTasks.map((task) => {
      const estimated = task.estimatedHours
        ? parseFloat(task.estimatedHours.toString())
        : 0;
      const actual = task.actualHours
        ? parseFloat(task.actualHours.toString())
        : 0;
      const percent =
        estimated > 0 ? Math.min(Math.round((actual / estimated) * 100), 99) : 0;

      return {
        task: task.title,
        percentComplete: percent,
        eta: task.dueDate ? task.dueDate.toISOString().split("T")[0] : null,
      };
    });

    // Calculate hours breakdown by category
    const hoursBreakdown: Record<string, number> = {};
    let totalHoursWorked = 0;

    completedTasks.forEach((task) => {
      const hours = task.actualHours
        ? parseFloat(task.actualHours.toString())
        : 0;
      const category = task.category.toLowerCase();
      hoursBreakdown[category] = (hoursBreakdown[category] || 0) + hours;
      totalHoursWorked += hours;
    });

    // Also include hours from in-progress tasks logged this week
    inProgressTasks.forEach((task) => {
      const hours = task.actualHours
        ? parseFloat(task.actualHours.toString())
        : 0;
      if (hours > 0) {
        const category = task.category.toLowerCase();
        hoursBreakdown[category] = (hoursBreakdown[category] || 0) + hours;
        totalHoursWorked += hours;
      }
    });

    // Calculate task completion rate
    const allWeekTasks = await prisma.gCOpsTask.count({
      where: {
        engagementId: params.id,
        dueDate: {
          gte: weekStartDate,
          lte: weekEndDate,
        },
      },
    });

    const taskCompletionRate =
      allWeekTasks > 0
        ? Math.round((completedTasks.length / allWeekTasks) * 100)
        : 100;

    // Create the report
    const report = await prisma.gCOpsWeeklyReport.create({
      data: {
        engagementId: params.id,
        reportNumber,
        weekStartDate,
        weekEndDate,
        summary: body.summary || null,
        tasksCompleted: tasksCompletedData,
        tasksInProgress: tasksInProgressData,
        issuesEscalated: body.issuesEscalated || [],
        hoursBreakdown,
        nextWeekPlan: body.nextWeekPlan || [],
        totalHoursWorked,
        taskCompletionRate,
        slaCompliance: body.slaCompliance || null,
        documentUrl: body.documentUrl || null,
        status: "DRAFT",
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Error creating weekly report:", error);
    return NextResponse.json(
      { error: "Failed to create weekly report" },
      { status: 500 }
    );
  }
}

// PATCH /api/gc-ops-engagements/[id]/weekly-reports - Update report (requires reportId in body)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { reportId, ...updateFields } = body;

    if (!reportId) {
      return NextResponse.json(
        { error: "reportId is required" },
        { status: 400 }
      );
    }

    // Verify report belongs to this engagement
    const existingReport = await prisma.gCOpsWeeklyReport.findFirst({
      where: {
        id: reportId,
        engagementId: params.id,
      },
    });

    if (!existingReport) {
      return NextResponse.json(
        { error: "Report not found in this engagement" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (updateFields.summary !== undefined)
      updateData.summary = updateFields.summary;
    if (updateFields.tasksCompleted !== undefined)
      updateData.tasksCompleted = updateFields.tasksCompleted;
    if (updateFields.tasksInProgress !== undefined)
      updateData.tasksInProgress = updateFields.tasksInProgress;
    if (updateFields.issuesEscalated !== undefined)
      updateData.issuesEscalated = updateFields.issuesEscalated;
    if (updateFields.hoursBreakdown !== undefined)
      updateData.hoursBreakdown = updateFields.hoursBreakdown;
    if (updateFields.nextWeekPlan !== undefined)
      updateData.nextWeekPlan = updateFields.nextWeekPlan;
    if (updateFields.totalHoursWorked !== undefined)
      updateData.totalHoursWorked = updateFields.totalHoursWorked;
    if (updateFields.taskCompletionRate !== undefined)
      updateData.taskCompletionRate = updateFields.taskCompletionRate;
    if (updateFields.slaCompliance !== undefined)
      updateData.slaCompliance = updateFields.slaCompliance;
    if (updateFields.documentUrl !== undefined)
      updateData.documentUrl = updateFields.documentUrl;

    // Handle status update to SENT
    if (updateFields.status !== undefined) {
      updateData.status = updateFields.status;
      if (updateFields.status === "SENT" && !existingReport.sentAt) {
        updateData.sentAt = new Date();
      }
    }

    const report = await prisma.gCOpsWeeklyReport.update({
      where: { id: reportId },
      data: updateData,
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error updating weekly report:", error);
    return NextResponse.json(
      { error: "Failed to update weekly report" },
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

// Helper: Get Sunday of the week for a given Monday
function getSunday(monday: Date): Date {
  const d = new Date(monday);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}
