import type { NextRequest } from 'next/server'
import { POST as generateConcept } from '@/app/api/concept/generate/route'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Compatibility alias retained for existing v30 checkout links. */
export async function POST(req: NextRequest) {
  return generateConcept(req)
}
