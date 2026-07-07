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
    });

    if (!run || run.status !== 'AWAITING_REVIEW') {
      return NextResponse.json({ error: 'Loop run not found or not awaiting review' }, { status: 400 });
    }

    const outputSnapshot = (run.outputSnapshot as any) || {};

    // 1. Queue Digital Twin updates (auto-updates relational tables)
    await addJob(getUpdateDigitalTwinQueue(), 'updateDigitalTwin', {
      loopRunId,
      projectId: run.projectId,
      updates: outputSnapshot.digitalTwinUpdates,
    });

    // 2. Queue Deliverables if present
    if (outputSnapshot.deliverableUpdates && Object.keys(outputSnapshot.deliverableUpdates).length > 0) {
      await addJob(getGenerateDeliverableQueue(), 'generateDeliverable', {
        loopRunId,
        projectId: run.projectId,
        deliverables: outputSnapshot.deliverableUpdates,
      });
    }

    // 3. Mark LoopRun as COMPLETED
    await prisma.loopRun.update({
      where: { id: loopRunId },
      data: {
        status: 'COMPLETED',
        requiresReview: false,
        updatedAt: new Date(),
      },
    });

    // 4. Trigger next event/notification (ADMIN_OVERRIDE_SUBMITTED)
    const nextEvent = await prisma.automationEvent.create({
      data: {
        eventType: 'ADMIN_OVERRIDE_SUBMITTED',
        sourceApp: 'ADMIN-PORTAL',
        projectId: run.projectId,
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
      projectId: run.projectId,
      payload: nextEvent.payload,
    });

    // Send customer notification
    await addJob(getSendNotificationQueue(), 'sendNotification', {
      projectId: run.projectId,
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
