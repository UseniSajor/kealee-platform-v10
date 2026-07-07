import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@kealee/database';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const loops = await prisma.v30LoopRun.findMany({
      where: {
        OR: [
          { status: 'AWAITING_REVIEW' },
          { requiresReview: true }
        ]
      },
      include: {
        steps: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ loops });
  } catch (err: any) {
    console.error('[API:admin/loops/review] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
