import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@kealee/database';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { loopRunId: string } }
) {
  try {
    const { loopRunId } = params;

    if (!loopRunId) {
      return NextResponse.json({ error: 'Missing loopRunId' }, { status: 400 });
    }

    const loop = await prisma.loopRun.findUnique({
      where: { id: loopRunId },
      include: {
        steps: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!loop) {
      return NextResponse.json({ error: 'Loop run not found' }, { status: 404 });
    }

    return NextResponse.json({ loop });
  } catch (err: any) {
    console.error('[API:loops/detail] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
