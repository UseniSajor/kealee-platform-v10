import { NextRequest, NextResponse } from 'next/server'
import { authorizeOps, unauthorized } from '@/lib/admin/intelligence-auth'
import { prisma } from '@kealee/database'
import { isIntelligencePersistenceAvailable } from '@kealee/intelligence'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!authorizeOps(req, 'read:intelligence').authorized) return unauthorized()
  if (!isIntelligencePersistenceAvailable()) {
    return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 503 })
  }
  try {
    const autoOnly = req.nextUrl.searchParams.get('autoAssigned') === 'true'
    const items = await prisma.campaignRecommendation.findMany({
      where: autoOnly
        ? {
            metadata: {
              path: ['autoAssigned'],
              equals: true,
            },
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        propertyTwin: { select: { address: true, jurisdiction: true } },
      },
    })
    return NextResponse.json({ items, count: items.length })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
