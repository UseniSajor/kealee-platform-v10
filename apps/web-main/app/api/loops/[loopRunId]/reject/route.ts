import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@kealee/database';
import { getProcessAutomationEventQueue } from '@kealee/automation/dist/infrastructure/loop-queues.js';
import { addJob } from '@kealee/automation/dist/infrastructure/queues.js';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { loopRunId: string } }
) {
  try {
    const { loopRunId } = params;
    const body = await req.json();
    const { userId, reason } = body;

    if (!loopRunId) {
      return NextResponse.json({ error: 'Missing loopRunId' }, { status: 400 });
    }

    const run = await prisma.loopRun.findUnique({
      where: { id: loopRunId },
      include: { projectTwin: true },
    });

    if (!run || run.status !== 'awaiting_review') {
      return NextResponse.json({ error: 'Loop run not found or not awaiting review' }, { status: 400 });
    }

    // Mark LoopRun as FAILED / REJECTED
    await prisma.loopRun.update({
      where: { id: loopRunId },
      data: {
        status: 'failed',
        updatedAt: new Date(),
      },
    });

    // Trigger next event/notification (ADMIN_OVERRIDE_SUBMITTED with approved = false)
    const nextEvent = await prisma.automationEvent.create({
      data: {
        eventType: 'ADMIN_OVERRIDE_SUBMITTED',
        sourceApp: 'ADMIN-PORTAL',
        projectId: run.projectTwin?.projectId,
        payload: {
          loopRunId,
          approved: false,
          adminId: userId || 'admin',
          reason: reason || 'Rejected by administrator',
        },
      },
    });

    await addJob(getProcessAutomationEventQueue(), 'processEvent', {
      eventId: nextEvent.id,
      eventType: 'ADMIN_OVERRIDE_SUBMITTED',
      sourceApp: 'ADMIN-PORTAL',
      projectId: run.projectTwin?.projectId,
      payload: nextEvent.payload,
    });

    return NextResponse.json({ loopRunId, status: 'REJECTED' });
  } catch (err: any) {
    console.error('[API:loops/reject] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
