import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await prisma.permitServiceLead.findUnique({
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
    console.error("Error fetching permit lead:", error);
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

    const oldLead = await prisma.permitServiceLead.findUnique({ where: { id: params.id } });
    const lead = await prisma.permitServiceLead.update({
      where: { id: params.id },
      data: updateData,
    });

    if (oldLead && oldLead.status !== lead.status) {
      await prisma.permitServiceLeadActivity.create({
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
    console.error("Error updating permit lead:", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}
