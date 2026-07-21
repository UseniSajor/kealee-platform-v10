import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/development-leads/[id] - Get single lead
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await prisma.developmentLead.findUnique({
      where: { id: params.id },
      include: {
        notes: {
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
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
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      { error: "Failed to fetch lead" },
      { status: 500 }
    );
  }
}

// PATCH /api/development-leads/[id] - Update lead
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { updatedBy, ...updateData } = body;

    // Track status changes
    const oldLead = await prisma.developmentLead.findUnique({
      where: { id: params.id },
    });

    const lead = await prisma.developmentLead.update({
      where: { id: params.id },
      data: updateData,
    });

    // Create activity for status change
    if (oldLead && oldLead.status !== lead.status) {
      await prisma.developmentLeadActivity.create({
        data: {
          leadId: lead.id,
          activityType: 'STATUS_CHANGED',
          description: `Status changed from ${oldLead.status} to ${lead.status}`,
          createdBy: updatedBy || 'system',
          metadata: {
            oldStatus: oldLead.status,
            newStatus: lead.status,
          },
        },
      });
    }

    // Create activity for assignment change
    if (oldLead && oldLead.assignedTo !== lead.assignedTo) {
      await prisma.developmentLeadActivity.create({
        data: {
          leadId: lead.id,
          activityType: 'ASSIGNED',
          description: lead.assignedTo 
            ? `Lead assigned to user ${lead.assignedTo}`
            : 'Lead unassigned',
          createdBy: updatedBy || 'system',
          metadata: {
            oldAssignee: oldLead.assignedTo,
            newAssignee: lead.assignedTo,
          },
        },
      });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    );
  }
}

// DELETE /api/development-leads/[id] - Delete lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.developmentLead.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lead:", error);
    return NextResponse.json(
      { error: "Failed to delete lead" },
      { status: 500 }
    );
  }
}
