import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/gc-ops-leads/[id] - Full lead detail with notes and activities
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await prisma.gCOpsLead.findUnique({
      where: { id: params.id },
      include: {
        notes: {
          orderBy: { createdAt: "desc" },
        },
        activities: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Error fetching GC ops lead:", error);
    return NextResponse.json(
      { error: "Failed to fetch lead" },
      { status: 500 }
    );
  }
}

// PATCH /api/gc-ops-leads/[id] - Update lead
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { updatedBy, ...updateFields } = body;

    // Verify lead exists and get current state for activity tracking
    const oldLead = await prisma.gCOpsLead.findUnique({
      where: { id: params.id },
    });

    if (!oldLead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Build update data from allowed fields
    const updateData: any = {};

    if (updateFields.status !== undefined) updateData.status = updateFields.status;
    if (updateFields.priority !== undefined) updateData.priority = updateFields.priority;
    if (updateFields.assignedTo !== undefined) updateData.assignedTo = updateFields.assignedTo;
    if (updateFields.selectedPackage !== undefined)
      updateData.selectedPackage = updateFields.selectedPackage;
    if (updateFields.monthlyValue !== undefined)
      updateData.monthlyValue = updateFields.monthlyValue;
    if (updateFields.trialStartDate !== undefined)
      updateData.trialStartDate = updateFields.trialStartDate
        ? new Date(updateFields.trialStartDate)
        : null;
    if (updateFields.trialEndDate !== undefined)
      updateData.trialEndDate = updateFields.trialEndDate
        ? new Date(updateFields.trialEndDate)
        : null;
    if (updateFields.convertedDate !== undefined)
      updateData.convertedDate = updateFields.convertedDate
        ? new Date(updateFields.convertedDate)
        : null;
    if (updateFields.churnedDate !== undefined)
      updateData.churnedDate = updateFields.churnedDate
        ? new Date(updateFields.churnedDate)
        : null;
    if (updateFields.churnReason !== undefined)
      updateData.churnReason = updateFields.churnReason;
    if (updateFields.lastContactedAt !== undefined)
      updateData.lastContactedAt = updateFields.lastContactedAt
        ? new Date(updateFields.lastContactedAt)
        : null;
    if (updateFields.nextFollowUpAt !== undefined)
      updateData.nextFollowUpAt = updateFields.nextFollowUpAt
        ? new Date(updateFields.nextFollowUpAt)
        : null;
    if (updateFields.source !== undefined) updateData.source = updateFields.source;
    if (updateFields.packageInterest !== undefined)
      updateData.packageInterest = updateFields.packageInterest;

    const lead = await prisma.gCOpsLead.update({
      where: { id: params.id },
      data: updateData,
    });

    // Create activity for status change
    if (oldLead.status !== lead.status) {
      await prisma.gCOpsLeadActivity.create({
        data: {
          leadId: lead.id,
          activityType: "STATUS_CHANGED",
          description: `Status changed from ${oldLead.status} to ${lead.status}`,
          createdBy: updatedBy || "system",
          metadata: {
            oldStatus: oldLead.status,
            newStatus: lead.status,
          },
        },
      });

      // Special activity tracking for trial start
      if (lead.status === "TRIAL_ACTIVE" && oldLead.status !== "TRIAL_ACTIVE") {
        await prisma.gCOpsLeadActivity.create({
          data: {
            leadId: lead.id,
            activityType: "TRIAL_STARTED",
            description: `Trial started for ${lead.fullName} (${lead.company})`,
            createdBy: updatedBy || "system",
          },
        });
      }
    }

    // Create activity for assignment change
    if (oldLead.assignedTo !== lead.assignedTo) {
      await prisma.gCOpsLeadActivity.create({
        data: {
          leadId: lead.id,
          activityType: "ASSIGNED",
          description: lead.assignedTo
            ? `Lead assigned to user ${lead.assignedTo}`
            : "Lead unassigned",
          createdBy: updatedBy || "system",
          metadata: {
            oldAssignee: oldLead.assignedTo,
            newAssignee: lead.assignedTo,
          },
        },
      });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Error updating GC ops lead:", error);
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    );
  }
}

// DELETE /api/gc-ops-leads/[id] - Archive lead (soft delete by setting status to ARCHIVED)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.gCOpsLead.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    if (existing.status === "ARCHIVED") {
      return NextResponse.json(
        { error: "Lead is already archived" },
        { status: 400 }
      );
    }

    const lead = await prisma.gCOpsLead.update({
      where: { id: params.id },
      data: { status: "ARCHIVED" },
    });

    // Log the archive activity
    await prisma.gCOpsLeadActivity.create({
      data: {
        leadId: lead.id,
        activityType: "STATUS_CHANGED",
        description: `Lead archived (previous status: ${existing.status})`,
        createdBy: "system",
        metadata: {
          oldStatus: existing.status,
          newStatus: "ARCHIVED",
        },
      },
    });

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("Error archiving GC ops lead:", error);
    return NextResponse.json(
      { error: "Failed to archive lead" },
      { status: 500 }
    );
  }
}
