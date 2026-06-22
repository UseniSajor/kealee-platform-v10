import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@kealee/database';
import { processAutomationEventQueue } from '@kealee/automation/dist/infrastructure/loop-queues.js';
import { addJob } from '@kealee/automation/dist/infrastructure/queues.js';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, sourceApp, projectId, payload } = body;

    if (!eventType || !sourceApp || !payload) {
      return NextResponse.json({ error: 'Missing eventType, sourceApp, or payload' }, { status: 400 });
    }

    // Persist event to the database
    const event = await prisma.automationEvent.create({
      data: {
        eventType,
        sourceApp,
        projectId: projectId || payload.projectId || null,
        payload,
        processed: false,
      },
    });

    // Enqueue job for background processing
    await addJob(processAutomationEventQueue, 'processEvent', {
      eventId: event.id,
      eventType,
      sourceApp,
      projectId: event.projectId,
      payload,
    });

    return NextResponse.json({ eventId: event.id, status: 'QUEUED' });
  } catch (err: any) {
    console.error('[API:events/create] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
