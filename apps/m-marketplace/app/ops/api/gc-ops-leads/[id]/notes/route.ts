import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notes = await prisma.gCOpsLeadNote.findMany({
      where: { leadId: params.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const note = await prisma.gCOpsLeadNote.create({
      data: {
        leadId: params.id,
        content: body.content,
        createdBy: body.createdBy || 'system',
        isPrivate: body.isPrivate || false,
      },
    });

    await prisma.gCOpsLeadActivity.create({
      data: {
        leadId: params.id,
        activityType: 'NOTE_ADDED',
        description: `Note added: ${body.content.substring(0, 50)}...`,
        createdBy: body.createdBy || 'system',
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
