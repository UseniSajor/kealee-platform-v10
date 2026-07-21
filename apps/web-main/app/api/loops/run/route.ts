import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@kealee/database';
import { getRunLoopQueue } from '@kealee/automation/dist/infrastructure/loop-queues.js';
import { addJob } from '@kealee/automation/dist/infrastructure/queues.js';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { loopRunId } = body;

    if (!loopRunId) {
      return NextResponse.json({ error: 'Missing loopRunId' }, { status: 400 });
    }

    const run = await prisma.loopRun.findUnique({
      where: { id: loopRunId },
    });

    if (!run) {
      return NextResponse.json({ error: 'Loop run not found' }, { status: 404 });
    }

    // Force run loop immediately by adding to the queue
    await addJob(getRunLoopQueue(), 'runLoop', {
      loopRunId,
      projectId: run.projectId,
      loopType: run.loopType,
    });

    return NextResponse.json({ loopRunId, status: 'RUNNING' });
  } catch (err: any) {
    console.error('[API:loops/run] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
