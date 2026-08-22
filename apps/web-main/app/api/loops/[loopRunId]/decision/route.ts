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
    const { decisionType, selectedOption, reason, budgetImpact, scheduleImpact, userId } = body;

    if (!loopRunId || !decisionType || !selectedOption) {
      return NextResponse.json({ error: 'Missing loopRunId, decisionType, or selectedOption' }, { status: 400 });
    }

    const run = await prisma.loopRun.findUnique({
      where: { id: loopRunId },
      include: { projectTwin: true },
    });

    if (!run) {
      return NextResponse.json({ error: 'Loop run not found' }, { status: 404 });
    }
    if (!run.projectTwinId) {
      return NextResponse.json({ error: 'Loop run has no project twin' }, { status: 409 });
    }

    // Persist the decision
    const decision = await prisma.projectDecision.create({
      data: {
        projectTwinId: run.projectTwinId,
        loopRunId,
        decisionType,
        title: `Decision: ${decisionType}`,
        context: { selectedOption },
        recommendation: reason || null,
        status: 'decided',
        decidedBy: userId || null,
        decidedAt: new Date(),
        metadata: {
          budgetImpact: budgetImpact !== undefined ? Number(budgetImpact) : null,
          scheduleImpact: scheduleImpact || null,
        },
      },
    });

    // Update the LoopRun status
    await prisma.loopRun.update({
      where: { id: loopRunId },
      data: {
        status: 'completed',
        updatedAt: new Date(),
      },
    });

    // Trigger the NEXT event in the loop architecture (USER_DECISION_SUBMITTED)
    const nextEvent = await prisma.automationEvent.create({
      data: {
        eventType: 'USER_DECISION_SUBMITTED',
        sourceApp: 'USER-INTERFACE',
        projectId: run.projectTwin?.projectId,
        payload: {
          loopRunId,
          decisionId: decision.id,
          decisionType,
          selectedOption,
        },
      },
    });

    await addJob(getProcessAutomationEventQueue(), 'processEvent', {
      eventId: nextEvent.id,
      eventType: 'USER_DECISION_SUBMITTED',
      sourceApp: 'USER-INTERFACE',
      projectId: run.projectTwin?.projectId,
      payload: nextEvent.payload,
    });

    return NextResponse.json({ decisionId: decision.id, status: 'DECIDED_AND_RESUMED' });
  } catch (err: any) {
    console.error('[API:loops/decision] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
