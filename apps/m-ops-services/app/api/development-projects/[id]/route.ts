import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/development-projects/[id] - Full project detail
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const project = await prisma.developmentProject.findUnique({
      where: { id },
      include: {
        milestones: {
          orderBy: { sortOrder: "asc" },
        },
        reports: {
          orderBy: { reportNumber: "desc" },
        },
        riskAlerts: {
          orderBy: { createdAt: "desc" },
        },
        proposals: {
          orderBy: { createdAt: "desc" },
        },
        documents: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            milestones: true,
            reports: true,
            riskAlerts: true,
            proposals: true,
            documents: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Compute milestone progress summary
    const milestoneProgress = {
      total: project.milestones.length,
      completed: project.milestones.filter((m) => m.status === "COMPLETED").length,
      inProgress: project.milestones.filter((m) => m.status === "IN_PROGRESS").length,
      blocked: project.milestones.filter((m) => m.status === "BLOCKED").length,
      notStarted: project.milestones.filter((m) => m.status === "NOT_STARTED").length,
      overallPercent:
        project.milestones.length > 0
          ? Math.round(
              project.milestones.reduce((sum, m) => sum + m.percentComplete, 0) /
                project.milestones.length
            )
          : 0,
    };

    // Compute active risk count
    const activeRisks = project.riskAlerts.filter((r) => r.isActive).length;

    return NextResponse.json({
      ...project,
      milestoneProgress,
      activeRisks,
    });
  } catch (error) {
    console.error("Error fetching project detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch project detail" },
      { status: 500 }
    );
  }
}

// PATCH /api/development-projects/[id] - Update project fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Verify project exists
    const existing = await prisma.developmentProject.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Build update data, only including provided fields
    const updateData: any = {};

    const directFields = [
      "projectName",
      "clientName",
      "clientCompany",
      "clientEmail",
      "clientPhone",
      "address",
      "city",
      "state",
      "assetType",
      "totalUnits",
      "totalBudget",
      "status",
      "assignedPmId",
      "assignedTeam",
      "serviceTier",
      "monthlyFee",
      "totalInvoiced",
      "totalPaid",
      "cpaceApplicable",
      "historicTaxCredits",
      "lihtcApplicable",
      "opportunityZone",
      "incentiveNotes",
    ];

    for (const field of directFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Handle date fields separately
    const dateFields = [
      "estimatedStart",
      "estimatedEnd",
      "actualStart",
      "actualEnd",
      "contractStartDate",
      "contractEndDate",
    ];

    for (const field of dateFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field] ? new Date(body[field]) : null;
      }
    }

    const project = await prisma.developmentProject.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            milestones: true,
            reports: true,
            riskAlerts: true,
            proposals: true,
            documents: true,
          },
        },
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/development-projects/[id] - Soft-cancel project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const existing = await prisma.developmentProject.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (existing.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Project is already cancelled" },
        { status: 400 }
      );
    }

    const project = await prisma.developmentProject.update({
      where: { id },
      data: {
        status: "CANCELLED",
        actualEnd: new Date(),
      },
    });

    return NextResponse.json({
      message: "Project cancelled successfully",
      project,
    });
  } catch (error) {
    console.error("Error cancelling project:", error);
    return NextResponse.json(
      { error: "Failed to cancel project" },
      { status: 500 }
    );
  }
}
