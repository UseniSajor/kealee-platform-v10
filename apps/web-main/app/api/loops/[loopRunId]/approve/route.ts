import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@kealee/database';
import {
  getUpdateDigitalTwinQueue,
  getGenerateDeliverableQueue,
  getSendNotificationQueue,
  getProcessAutomationEventQueue,
} from '@kealee/automation/dist/infrastructure/loop-queues.js';
import { addJob } from '@kealee/automation/dist/infrastructure/queues.js';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { loopRunId: string } }
) {
  try {
    const { loopRunId } = params;
    const body = await req.json();
    const { userId } = body;

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
    const projectId = run.projectTwin?.projectId;
    if (!projectId) return NextResponse.json({ error: 'Loop run has no project' }, { status: 409 });

    const outputSnapshot = (run.result as any) || {};

    // 1. Queue Digital Twin updates (auto-updates relational tables)
    await addJob(getUpdateDigitalTwinQueue(), 'updateDigitalTwin', {
      loopRunId,
      projectId,
      updates: outputSnapshot.digitalTwinUpdates,
    });

    // 2. Queue Deliverables if present
    if (outputSnapshot.deliverableUpdates && Object.keys(outputSnapshot.deliverableUpdates).length > 0) {
      await addJob(getGenerateDeliverableQueue(), 'generateDeliverable', {
        loopRunId,
        projectId,
        deliverables: outputSnapshot.deliverableUpdates,
      });
    }

    // 3. Mark LoopRun as COMPLETED
    await prisma.loopRun.update({
      where: { id: loopRunId },
      data: {
        status: 'completed',
        updatedAt: new Date(),
      },
    });

    // 4. Trigger next event/notification (ADMIN_OVERRIDE_SUBMITTED)
    const nextEvent = await prisma.automationEvent.create({
      data: {
        eventType: 'ADMIN_OVERRIDE_SUBMITTED',
        sourceApp: 'ADMIN-PORTAL',
        projectId,
        payload: {
          loopRunId,
          approved: true,
          adminId: userId || 'admin',
        },
      },
    });

    await addJob(getProcessAutomationEventQueue(), 'processEvent', {
      eventId: nextEvent.id,
      eventType: 'ADMIN_OVERRIDE_SUBMITTED',
      sourceApp: 'ADMIN-PORTAL',
      projectId,
      payload: nextEvent.payload,
    });

    // Send customer notification
    await addJob(getSendNotificationQueue(), 'sendNotification', {
      projectId,
      type: 'loop_completed',
      title: 'Project Update Recommendations Approved',
      body: outputSnapshot.summary,
    });

    return NextResponse.json({ loopRunId, status: 'APPROVED' });
  } catch (err: any) {
    console.error('[API:loops/approve] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
