import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/gc-ops-engagements/[id]/vendors - List vendor coordination actions
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Filters
    const status = searchParams.get("status");
    const actionType = searchParams.get("actionType");
    const vendorTrade = searchParams.get("vendorTrade");

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

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
    if (actionType) where.actionType = actionType;
    if (vendorTrade) where.vendorTrade = vendorTrade;

    const [vendorActions, total] = await Promise.all([
      prisma.gCOpsVendorAction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.gCOpsVendorAction.count({ where }),
    ]);

    return NextResponse.json({
      vendorActions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching vendor actions:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor actions" },
      { status: 500 }
    );
  }
}

// POST /api/gc-ops-engagements/[id]/vendors - Create vendor action
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Verify engagement exists
    const engagement = await prisma.gCOpsEngagement.findUnique({
      where: { id: params.id },
      select: { id: true, status: true },
    });

    if (!engagement) {
      return NextResponse.json(
        { error: "Engagement not found" },
        { status: 404 }
      );
    }

    if (engagement.status === "CANCELLED" || engagement.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Cannot add vendor actions to a cancelled or completed engagement" },
        { status: 400 }
      );
    }

    const vendorAction = await prisma.gCOpsVendorAction.create({
      data: {
        engagementId: params.id,
        vendorName: body.vendorName,
        vendorTrade: body.vendorTrade || null,
        actionType: body.actionType,
        description: body.description,
        status: "PENDING",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json(vendorAction, { status: 201 });
  } catch (error) {
    console.error("Error creating vendor action:", error);
    return NextResponse.json(
      { error: "Failed to create vendor action" },
      { status: 500 }
    );
  }
}

// PATCH /api/gc-ops-engagements/[id]/vendors - Update vendor action (requires actionId in body)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { actionId, ...updateFields } = body;

    if (!actionId) {
      return NextResponse.json(
        { error: "actionId is required" },
        { status: 400 }
      );
    }

    // Verify action belongs to this engagement
    const existingAction = await prisma.gCOpsVendorAction.findFirst({
      where: {
        id: actionId,
        engagementId: params.id,
      },
    });

    if (!existingAction) {
      return NextResponse.json(
        { error: "Vendor action not found in this engagement" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (updateFields.vendorName !== undefined)
      updateData.vendorName = updateFields.vendorName;
    if (updateFields.vendorTrade !== undefined)
      updateData.vendorTrade = updateFields.vendorTrade;
    if (updateFields.actionType !== undefined)
      updateData.actionType = updateFields.actionType;
    if (updateFields.description !== undefined)
      updateData.description = updateFields.description;
    if (updateFields.notes !== undefined)
      updateData.notes = updateFields.notes;
    if (updateFields.dueDate !== undefined)
      updateData.dueDate = updateFields.dueDate
        ? new Date(updateFields.dueDate)
        : null;

    if (updateFields.status !== undefined) {
      updateData.status = updateFields.status;
      if (
        updateFields.status === "COMPLETED" &&
        existingAction.status !== "COMPLETED"
      ) {
        updateData.completedAt = updateFields.completedAt
          ? new Date(updateFields.completedAt)
          : new Date();
      }
    }

    const vendorAction = await prisma.gCOpsVendorAction.update({
      where: { id: actionId },
      data: updateData,
    });

    return NextResponse.json(vendorAction);
  } catch (error) {
    console.error("Error updating vendor action:", error);
    return NextResponse.json(
      { error: "Failed to update vendor action" },
      { status: 500 }
    );
  }
}
