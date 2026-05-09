/**
 * POST /api/emails/concept-ready
 *
 * Notifies the customer that their AI concept package has finished generating
 * and is ready to view in the Owner Portal. Called fire-and-forget by
 * /api/concept/generate after the deliverable is written.
 *
 * Body:
 *   to:           string  — customer email
 *   firstName?:   string  — display name (defaults to "there")
 *   service:      string  — projectPath (e.g. "exterior_concept")
 *   intakeId:     string  — UUID of the intake row
 *   estimatedCost?: number  — concept cost band, in USD
 *   tier?:        number  — 1 | 2 | 3 (controls "video included" copy)
 *   videoIncluded?: boolean — whether tier ≥ 2 video is being rendered
 */

import { NextRequest, NextResponse } from 'next/server'
import { getOwnerPortalDeliverableUrl } from '@/lib/owner-portal-urls'

export const dynamic = 'force-dynamic'

interface ConceptReadyEmailPayload {
  to: string
  firstName?: string
  service: string
  intakeId: string
  estimatedCost?: number
  tier?: number
  videoIncluded?: boolean
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ConceptReadyEmailPayload
    const { to, firstName, service, intakeId, estimatedCost, tier, videoIncluded } = body

    if (!to || !intakeId || !service) {
      return NextResponse.json(
        { error: 'to, intakeId and service are required' },
        { status: 400 },
      )
    }

    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.warn('[concept-ready email] RESEND_API_KEY not set — skipping')
      return NextResponse.json({ sent: false, reason: 'RESEND_API_KEY not configured' })
    }

    const greeting        = firstName?.trim() || 'there'
    const serviceName     = service.replace(/_/g, ' ')
    const deliverableUrl  = getOwnerPortalDeliverableUrl(intakeId, service)
    const costLine        = typeof estimatedCost === 'number' && estimatedCost > 0
      ? `  Estimated investment range: $${estimatedCost.toLocaleString('en-US')}`
      : null
    const videoLine       = (tier ?? 1) >= 2 && videoIncluded
      ? '  • A short cinematic walkthrough video (rendering now — typically arrives within a few minutes of this email)'
      : null

    // ── Customer email ────────────────────────────────────────────────────
    const customerRes = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    'Kealee <hello@kealee.com>',
        to:      [to],
        subject: `Your Kealee ${serviceName} concept is ready to view`,
        text:    [
          `Hi ${greeting},`,
          '',
          `Great news — your AI concept package for "${serviceName}" is ready.`,
          '',
          'Inside your deliverable you\'ll find:',
          '  • A design concept summary with style, color palette, and key features',
          '  • A bill of materials with realistic costs for the DMV market',
          '  • Permit scope and zoning guidance',
          '  • Renders that visualise the finished project',
          ...(videoLine ? [videoLine] : []),
          ...(costLine  ? ['', costLine] : []),
          '',
          'View your concept (sign in with the email this was sent to):',
          `  ${deliverableUrl}`,
          '',
          'What happens next:',
          '  1. Review your concept — it\'s permanent in your Owner Portal',
          '  2. Reply with any tweaks (style, scope, materials)',
          '  3. When you\'re ready, we\'ll route you to the right next step:',
          '     a permit package, a certified estimate, or a vetted contractor match',
          '',
          'Questions? Just reply to this email — we read every one.',
          '',
          'The Kealee Team',
          'https://kealee.com',
        ].join('\n'),
      }),
    })

    if (!customerRes.ok) {
      const errBody = await customerRes.text().catch(() => '')
      console.error('[concept-ready email] customer send failed:', customerRes.status, errBody)
    }

    // ── Internal notification ────────────────────────────────────────────
    fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    'Kealee Notifications <notifications@kealee.com>',
        to:      ['hello@kealee.com'],
        subject: `Concept delivered — ${serviceName} #${intakeId}`,
        text:    [
          'A new AI concept was delivered to a customer.',
          '',
          `  Intake ID: ${intakeId}`,
          `  Service:   ${serviceName}`,
          `  Customer:  ${to}`,
          `  Tier:      ${tier ?? 1}`,
          `  Time:      ${new Date().toISOString()}`,
          '',
          `Deliverable URL: ${deliverableUrl}`,
        ].join('\n'),
      }),
    }).catch(err => {
      console.error('[concept-ready email] internal notification failed:', err?.message ?? err)
    })

    return NextResponse.json({ sent: customerRes.ok })
  } catch (err: any) {
    console.error('[concept-ready email]', err?.message ?? err)
    return NextResponse.json({ error: 'Failed to send concept-ready email' }, { status: 500 })
  }
}
