import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@kealee/database';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const loops = await prisma.loopRun.findMany({
      where: { projectId },
      include: {
        steps: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ loops });
  } catch (err: any) {
    console.error('[API:loops/project] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
