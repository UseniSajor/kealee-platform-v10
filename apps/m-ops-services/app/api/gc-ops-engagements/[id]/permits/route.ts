import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/gc-ops-engagements/[id]/permits - List permit tracking actions
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Filters
    const status = searchParams.get("status");
    const permitType = searchParams.get("permitType");
    const jurisdiction = searchParams.get("jurisdiction");

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
    if (permitType) where.permitType = permitType;
    if (jurisdiction) {
      where.jurisdiction = { contains: jurisdiction, mode: "insensitive" };
    }

    const [permitActions, total] = await Promise.all([
      prisma.gCOpsPermitAction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.gCOpsPermitAction.count({ where }),
    ]);

    return NextResponse.json({
      permitActions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching permit actions:", error);
    return NextResponse.json(
      { error: "Failed to fetch permit actions" },
      { status: 500 }
    );
  }
}

// POST /api/gc-ops-engagements/[id]/permits - Create permit action
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
        { error: "Cannot add permit actions to a cancelled or completed engagement" },
        { status: 400 }
      );
    }

    const permitAction = await prisma.gCOpsPermitAction.create({
      data: {
        engagementId: params.id,
        permitType: body.permitType,
        jurisdiction: body.jurisdiction,
        projectAddress: body.projectAddress || null,
        status: "NOT_STARTED",
        applicationDate: body.applicationDate
          ? new Date(body.applicationDate)
          : null,
        applicationFee: body.applicationFee || null,
        feesPaid: body.feesPaid || false,
        notes: body.notes || null,
        documentUrl: body.documentUrl || null,
      },
    });

    return NextResponse.json(permitAction, { status: 201 });
  } catch (error) {
    console.error("Error creating permit action:", error);
    return NextResponse.json(
      { error: "Failed to create permit action" },
      { status: 500 }
    );
  }
}

// PATCH /api/gc-ops-engagements/[id]/permits - Update permit action (requires permitActionId in body)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { permitActionId, ...updateFields } = body;

    if (!permitActionId) {
      return NextResponse.json(
        { error: "permitActionId is required" },
        { status: 400 }
      );
    }

    // Verify permit action belongs to this engagement
    const existingAction = await prisma.gCOpsPermitAction.findFirst({
      where: {
        id: permitActionId,
        engagementId: params.id,
      },
    });

    if (!existingAction) {
      return NextResponse.json(
        { error: "Permit action not found in this engagement" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (updateFields.permitType !== undefined)
      updateData.permitType = updateFields.permitType;
    if (updateFields.jurisdiction !== undefined)
      updateData.jurisdiction = updateFields.jurisdiction;
    if (updateFields.projectAddress !== undefined)
      updateData.projectAddress = updateFields.projectAddress;
    if (updateFields.status !== undefined)
      updateData.status = updateFields.status;
    if (updateFields.notes !== undefined)
      updateData.notes = updateFields.notes;
    if (updateFields.documentUrl !== undefined)
      updateData.documentUrl = updateFields.documentUrl;
    if (updateFields.feesPaid !== undefined)
      updateData.feesPaid = updateFields.feesPaid;
    if (updateFields.applicationFee !== undefined)
      updateData.applicationFee = updateFields.applicationFee;

    // Date tracking fields
    if (updateFields.applicationDate !== undefined)
      updateData.applicationDate = updateFields.applicationDate
        ? new Date(updateFields.applicationDate)
        : null;
    if (updateFields.submittedDate !== undefined)
      updateData.submittedDate = updateFields.submittedDate
        ? new Date(updateFields.submittedDate)
        : null;
    if (updateFields.approvedDate !== undefined)
      updateData.approvedDate = updateFields.approvedDate
        ? new Date(updateFields.approvedDate)
        : null;
    if (updateFields.expirationDate !== undefined)
      updateData.expirationDate = updateFields.expirationDate
        ? new Date(updateFields.expirationDate)
        : null;
    if (updateFields.inspectionDate !== undefined)
      updateData.inspectionDate = updateFields.inspectionDate
        ? new Date(updateFields.inspectionDate)
        : null;

    // Auto-set date when status transitions
    if (updateFields.status === "SUBMITTED" && !existingAction.submittedDate) {
      updateData.submittedDate = updateData.submittedDate || new Date();
    }
    if (updateFields.status === "APPROVED" && !existingAction.approvedDate) {
      updateData.approvedDate = updateData.approvedDate || new Date();
    }

    const permitAction = await prisma.gCOpsPermitAction.update({
      where: { id: permitActionId },
      data: updateData,
    });

    return NextResponse.json(permitAction);
  } catch (error) {
    console.error("Error updating permit action:", error);
    return NextResponse.json(
      { error: "Failed to update permit action" },
      { status: 500 }
    );
  }
}
