import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const activities = await prisma.gCOpsLeadActivity.findMany({
      where: { leadId: params.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const activity = await prisma.gCOpsLeadActivity.create({
      data: {
        leadId: params.id,
        activityType: body.activityType,
        description: body.description,
        metadata: body.metadata || null,
        createdBy: body.createdBy || 'system',
      },
    });

    const contactTypes = ['EMAIL_SENT', 'CALL_MADE', 'MEETING_SCHEDULED'];
    if (contactTypes.includes(body.activityType)) {
      await prisma.gCOpsLead.update({
        where: { id: params.id },
        data: { lastContactedAt: new Date() },
      });
    }

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
  }
}
