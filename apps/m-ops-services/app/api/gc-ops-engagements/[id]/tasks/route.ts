import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/gc-ops-engagements/[id]/tasks - List tasks for engagement
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Filters
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const assignedToId = searchParams.get("assignedToId");

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Sorting
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

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

    // Build where clause
    const where: any = {
      engagementId: params.id,
    };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (assignedToId) where.assignedToId = assignedToId;

    const [tasks, total] = await Promise.all([
      prisma.gCOpsTask.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.gCOpsTask.count({ where }),
    ]);

    // Compute summary stats
    const allTasks = await prisma.gCOpsTask.groupBy({
      by: ["status"],
      where: { engagementId: params.id },
      _count: true,
    });

    const statusBreakdown = allTasks.reduce(
      (acc, item) => {
        acc[item.status] = item._count;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      statusBreakdown,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/gc-ops-engagements/[id]/tasks - Create task
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Verify engagement exists and is active
    const engagement = await prisma.gCOpsEngagement.findUnique({
      where: { id: params.id },
    });

    if (!engagement) {
      return NextResponse.json(
        { error: "Engagement not found" },
        { status: 404 }
      );
    }

    if (engagement.status === "CANCELLED" || engagement.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Cannot add tasks to a cancelled or completed engagement" },
        { status: 400 }
      );
    }

    const task = await prisma.gCOpsTask.create({
      data: {
        engagementId: params.id,
        title: body.title,
        description: body.description || null,
        category: body.category,
        priority: body.priority || "NORMAL",
        status: "PENDING",
        assignedToId: body.assignedToId || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        estimatedHours: body.estimatedHours || null,
        projectName: body.projectName || null,
        projectAddress: body.projectAddress || null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}

// PATCH /api/gc-ops-engagements/[id]/tasks - Update task (requires taskId in body)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { taskId, ...updateFields } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: "taskId is required" },
        { status: 400 }
      );
    }

    // Verify task belongs to this engagement
    const existingTask = await prisma.gCOpsTask.findFirst({
      where: {
        id: taskId,
        engagementId: params.id,
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found in this engagement" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (updateFields.title !== undefined) updateData.title = updateFields.title;
    if (updateFields.description !== undefined)
      updateData.description = updateFields.description;
    if (updateFields.category !== undefined)
      updateData.category = updateFields.category;
    if (updateFields.priority !== undefined)
      updateData.priority = updateFields.priority;
    if (updateFields.status !== undefined)
      updateData.status = updateFields.status;
    if (updateFields.assignedToId !== undefined)
      updateData.assignedToId = updateFields.assignedToId;
    if (updateFields.dueDate !== undefined)
      updateData.dueDate = updateFields.dueDate
        ? new Date(updateFields.dueDate)
        : null;
    if (updateFields.estimatedHours !== undefined)
      updateData.estimatedHours = updateFields.estimatedHours;
    if (updateFields.actualHours !== undefined)
      updateData.actualHours = updateFields.actualHours;
    if (updateFields.notes !== undefined) updateData.notes = updateFields.notes;
    if (updateFields.completedBy !== undefined)
      updateData.completedBy = updateFields.completedBy;
    if (updateFields.projectName !== undefined)
      updateData.projectName = updateFields.projectName;
    if (updateFields.projectAddress !== undefined)
      updateData.projectAddress = updateFields.projectAddress;

    // Handle task completion: set completedAt, increment engagement counters
    const isCompleting =
      updateFields.status === "COMPLETED" &&
      existingTask.status !== "COMPLETED";

    if (isCompleting) {
      updateData.completedAt = updateFields.completedAt
        ? new Date(updateFields.completedAt)
        : new Date();
    }

    const task = await prisma.gCOpsTask.update({
      where: { id: taskId },
      data: updateData,
    });

    // When completing a task, increment engagement counters
    if (isCompleting) {
      const hoursToAdd = task.actualHours
        ? parseFloat(task.actualHours.toString())
        : 0;

      await prisma.gCOpsEngagement.update({
        where: { id: params.id },
        data: {
          totalTasksCompleted: {
            increment: 1,
          },
          totalHoursLogged: {
            increment: hoursToAdd,
          },
        },
      });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}
