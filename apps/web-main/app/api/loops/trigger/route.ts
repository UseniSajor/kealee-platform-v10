import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@kealee/database';
import { loopRouter } from '@kealee/automation/dist/loop-router.js';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, eventType, payload } = body;

    if (!projectId || !eventType) {
      return NextResponse.json({ error: 'Missing projectId or eventType' }, { status: 400 });
    }

    const result = await loopRouter.routeEvent({
      eventType,
      sourceApp: 'API-TRIGGER',
      projectId,
      payload: payload || {},
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[API:loops/trigger] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
