import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/development-projects/[id]/milestones - List milestones for project
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
    const phase = searchParams.get("phase");

    const where: any = { projectId };
    if (status) where.status = status;
    if (phase) where.phase = phase;

    const milestones = await prisma.devMilestone.findMany({
      where,
      orderBy: { sortOrder: "asc" },
    });

    // Compute summary statistics
    const summary = {
      total: milestones.length,
      completed: milestones.filter((m) => m.status === "COMPLETED").length,
      inProgress: milestones.filter((m) => m.status === "IN_PROGRESS").length,
      blocked: milestones.filter((m) => m.status === "BLOCKED").length,
      notStarted: milestones.filter((m) => m.status === "NOT_STARTED").length,
      skipped: milestones.filter((m) => m.status === "SKIPPED").length,
      overallPercent:
        milestones.length > 0
          ? Math.round(
              milestones.reduce((sum, m) => sum + m.percentComplete, 0) /
                milestones.length
            )
          : 0,
      totalInvoiceAmount: milestones
        .filter((m) => m.triggersInvoice && m.invoiceAmount)
        .reduce((sum, m) => sum + Number(m.invoiceAmount), 0),
    };

    return NextResponse.json({
      milestones,
      summary,
    });
  } catch (error) {
    console.error("Error fetching milestones:", error);
    return NextResponse.json(
      { error: "Failed to fetch milestones" },
      { status: 500 }
    );
  }
}

// POST /api/development-projects/[id]/milestones - Create milestone
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params;
    const body = await request.json();

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

    if (!body.name || !body.phase) {
      return NextResponse.json(
        { error: "Missing required fields: name, phase" },
        { status: 400 }
      );
    }

    // Determine next sortOrder if not provided
    let sortOrder = body.sortOrder;
    if (sortOrder === undefined || sortOrder === null) {
      const lastMilestone = await prisma.devMilestone.findFirst({
        where: { projectId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      sortOrder = (lastMilestone?.sortOrder ?? -1) + 1;
    }

    const milestone = await prisma.devMilestone.create({
      data: {
        projectId,
        name: body.name,
        description: body.description,
        phase: body.phase,
        sortOrder,
        status: body.status || "NOT_STARTED",
        percentComplete: body.percentComplete || 0,
        plannedDate: body.plannedDate ? new Date(body.plannedDate) : undefined,
        actualDate: body.actualDate ? new Date(body.actualDate) : undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        dependsOnIds: body.dependsOnIds || [],
        assignedTo: body.assignedTo,
        completedBy: body.completedBy,
        blockedReason: body.blockedReason,
        triggersInvoice: body.triggersInvoice || false,
        invoiceAmount: body.invoiceAmount,
        notes: body.notes,
      },
    });

    return NextResponse.json(milestone, { status: 201 });
  } catch (error) {
    console.error("Error creating milestone:", error);
    return NextResponse.json(
      { error: "Failed to create milestone" },
      { status: 500 }
    );
  }
}

// PATCH /api/development-projects/[id]/milestones - Update milestone (requires milestoneId in body)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params;
    const body = await request.json();

    if (!body.milestoneId) {
      return NextResponse.json(
        { error: "Missing required field: milestoneId" },
        { status: 400 }
      );
    }

    // Verify milestone belongs to project
    const existing = await prisma.devMilestone.findFirst({
      where: { id: body.milestoneId, projectId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Milestone not found for this project" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};

    const directFields = [
      "name",
      "description",
      "phase",
      "sortOrder",
      "status",
      "percentComplete",
      "dependsOnIds",
      "assignedTo",
      "completedBy",
      "blockedReason",
      "triggersInvoice",
      "invoiceAmount",
      "notes",
    ];

    for (const field of directFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Handle date fields
    const dateFields = ["plannedDate", "actualDate", "dueDate"];
    for (const field of dateFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field] ? new Date(body[field]) : null;
      }
    }

    // Auto-set percentComplete to 100 and actualDate when completing
    if (body.status === "COMPLETED") {
      if (!updateData.percentComplete) {
        updateData.percentComplete = 100;
      }
      if (!updateData.actualDate && !existing.actualDate) {
        updateData.actualDate = new Date();
      }
    }

    const milestone = await prisma.devMilestone.update({
      where: { id: body.milestoneId },
      data: updateData,
    });

    return NextResponse.json(milestone);
  } catch (error) {
    console.error("Error updating milestone:", error);
    return NextResponse.json(
      { error: "Failed to update milestone" },
      { status: 500 }
    );
  }
}
