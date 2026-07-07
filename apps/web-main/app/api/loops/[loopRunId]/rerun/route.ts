import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@kealee/database';
import { getRunLoopQueue } from '@kealee/automation/dist/infrastructure/loop-queues.js';
import { addJob } from '@kealee/automation/dist/infrastructure/queues.js';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { loopRunId: string } }
) {
  try {
    const { loopRunId } = params;

    if (!loopRunId) {
      return NextResponse.json({ error: 'Missing loopRunId' }, { status: 400 });
    }

    const run = await prisma.loopRun.findUnique({
      where: { id: loopRunId },
    });

    if (!run) {
      return NextResponse.json({ error: 'Loop run not found' }, { status: 404 });
    }

    // Reset status to PENDING
    await prisma.loopRun.update({
      where: { id: loopRunId },
      data: {
        status: 'PENDING',
        updatedAt: new Date(),
      },
    });

    // Queue for execution
    await addJob(getRunLoopQueue(), 'runLoop', {
      loopRunId,
      projectId: run.projectId,
      loopType: run.loopType,
    });

    return NextResponse.json({ loopRunId, status: 'QUEUED_FOR_RERUN' });
  } catch (err: any) {
    console.error('[API:loops/rerun] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
