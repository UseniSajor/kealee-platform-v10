import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/gc-ops-engagements/[id] - Full engagement detail
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const engagement = await prisma.gCOpsEngagement.findUnique({
      where: { id: params.id },
      include: {
        tasks: {
          orderBy: { createdAt: "desc" },
        },
        weeklyReports: {
          orderBy: { reportNumber: "desc" },
        },
        vendorActions: {
          orderBy: { createdAt: "desc" },
        },
        permitActions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!engagement) {
      return NextResponse.json(
        { error: "Engagement not found" },
        { status: 404 }
      );
    }

    // Compute summary metrics
    const taskCounts = {
      total: engagement.tasks.length,
      completed: engagement.tasks.filter((t) => t.status === "COMPLETED")
        .length,
      pending: engagement.tasks.filter((t) => t.status === "PENDING").length,
      inProgress: engagement.tasks.filter((t) => t.status === "IN_PROGRESS")
        .length,
      blocked: engagement.tasks.filter((t) => t.status === "BLOCKED").length,
    };

    const vendorCounts = {
      total: engagement.vendorActions.length,
      pending: engagement.vendorActions.filter((v) => v.status === "PENDING")
        .length,
      completed: engagement.vendorActions.filter(
        (v) => v.status === "COMPLETED"
      ).length,
    };

    const permitCounts = {
      total: engagement.permitActions.length,
      approved: engagement.permitActions.filter((p) => p.status === "APPROVED")
        .length,
      submitted: engagement.permitActions.filter(
        (p) => p.status === "SUBMITTED"
      ).length,
      inReview: engagement.permitActions.filter((p) => p.status === "IN_REVIEW")
        .length,
    };

    return NextResponse.json({
      ...engagement,
      summary: {
        taskCounts,
        vendorCounts,
        permitCounts,
        totalReports: engagement.weeklyReports.length,
      },
    });
  } catch (error) {
    console.error("Error fetching engagement:", error);
    return NextResponse.json(
      { error: "Failed to fetch engagement" },
      { status: 500 }
    );
  }
}

// PATCH /api/gc-ops-engagements/[id] - Update engagement
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const existing = await prisma.gCOpsEngagement.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Engagement not found" },
        { status: 404 }
      );
    }

    // Build update data from allowed fields
    const updateData: any = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.assignedOpsManagerId !== undefined)
      updateData.assignedOpsManagerId = body.assignedOpsManagerId;
    if (body.assignedTeam !== undefined)
      updateData.assignedTeam = body.assignedTeam;
    if (body.monthlyFee !== undefined) updateData.monthlyFee = body.monthlyFee;
    if (body.hoursPerWeek !== undefined)
      updateData.hoursPerWeek = body.hoursPerWeek;
    if (body.maxProjects !== undefined)
      updateData.maxProjects = body.maxProjects;
    if (body.slaResponseHours !== undefined)
      updateData.slaResponseHours = body.slaResponseHours;
    if (body.slaLevel !== undefined) updateData.slaLevel = body.slaLevel;
    if (body.packageTier !== undefined)
      updateData.packageTier = body.packageTier;
    if (body.startDate !== undefined)
      updateData.startDate = new Date(body.startDate);
    if (body.endDate !== undefined)
      updateData.endDate = new Date(body.endDate);
    if (body.trialEndDate !== undefined)
      updateData.trialEndDate = new Date(body.trialEndDate);
    if (body.clientSatisfaction !== undefined)
      updateData.clientSatisfaction = body.clientSatisfaction;
    if (body.stripeSubscriptionId !== undefined)
      updateData.stripeSubscriptionId = body.stripeSubscriptionId;

    const engagement = await prisma.gCOpsEngagement.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(engagement);
  } catch (error) {
    console.error("Error updating engagement:", error);
    return NextResponse.json(
      { error: "Failed to update engagement" },
      { status: 500 }
    );
  }
}

// DELETE /api/gc-ops-engagements/[id] - Cancel engagement
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.gCOpsEngagement.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Engagement not found" },
        { status: 404 }
      );
    }

    if (existing.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Engagement is already cancelled" },
        { status: 400 }
      );
    }

    const engagement = await prisma.gCOpsEngagement.update({
      where: { id: params.id },
      data: {
        status: "CANCELLED",
        endDate: new Date(),
      },
    });

    return NextResponse.json(engagement);
  } catch (error) {
    console.error("Error cancelling engagement:", error);
    return NextResponse.json(
      { error: "Failed to cancel engagement" },
      { status: 500 }
    );
  }
}
