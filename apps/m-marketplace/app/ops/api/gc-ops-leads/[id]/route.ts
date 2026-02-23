import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await prisma.gCOpsLead.findUnique({
      where: { id: params.id },
      include: {
        notes: { orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Error fetching GC lead:", error);
    return NextResponse.json({ error: "Failed to fetch lead" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { updatedBy, ...updateData } = body;

    const oldLead = await prisma.gCOpsLead.findUnique({ where: { id: params.id } });
    const lead = await prisma.gCOpsLead.update({
      where: { id: params.id },
      data: updateData,
    });

    if (oldLead && oldLead.status !== lead.status) {
      await prisma.gCOpsLeadActivity.create({
        data: {
          leadId: lead.id,
          activityType: 'STATUS_CHANGED',
          description: `Status changed from ${oldLead.status} to ${lead.status}`,
          createdBy: updatedBy || 'system',
          metadata: { oldStatus: oldLead.status, newStatus: lead.status },
        },
      });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Error updating GC lead:", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.gCOpsLead.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting GC lead:", error);
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}
