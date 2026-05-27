/**
 * POST /api/emails/deliverable-ready
 * Universal paid-intake delivery email with claim link + build-path upsells.
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendDeliverableReadyEmail } from '@/lib/deliverable-ready-email'
import { onConceptReadyLifecycle } from '@/lib/marketing/lifecycle'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { to, firstName, service, intakeId, estimatedCost, tier, videoIncluded, headline } = body

    if (!to || !intakeId || !service) {
      return NextResponse.json({ error: 'to, intakeId, service required' }, { status: 400 })
    }

    const result = await sendDeliverableReadyEmail({
      to,
      firstName,
      service,
      intakeId,
      estimatedCost,
      tier,
      videoIncluded,
      headline,
    })

    if (!result.sent) {
      return NextResponse.json({ sent: false, error: result.error }, { status: result.error ? 503 : 200 })
    }

    const isConcept = !['cost_estimate', 'certified_estimate', 'permit_path_only', 'contractor_match', 'professional_drawings'].includes(service)
    if (isConcept) {
      onConceptReadyLifecycle({
        intakeId,
        email: to,
        clientName: firstName,
        projectPath: service,
      }).catch(() => {})
    }

    return NextResponse.json({ sent: true, claimUrl: result.claimUrl })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[deliverable-ready]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
