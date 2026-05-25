/**
 * POST /api/emails/concept-ready
 *
 * Notifies the customer that their AI concept package has finished generating.
 * Uses a Supabase magic link (not a bare deliverable URL) so one click signs them in.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getOwnerPortalDeliverableUrl } from '@/lib/owner-portal-urls'
import { createOwnerPortalMagicLink } from '@/lib/owner-portal-magic-link'
import { onConceptReadyLifecycle } from '@/lib/marketing/lifecycle'

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

    const greeting = firstName?.trim() || 'there'
    const serviceName = service.replace(/_/g, ' ')
    const deliverablePath = `/deliverables/${encodeURIComponent(intakeId)}?projectPath=${encodeURIComponent(service)}`
    const deliverableUrl = getOwnerPortalDeliverableUrl(intakeId, service)

    const magic = await createOwnerPortalMagicLink({
      email: to,
      nextPath: deliverablePath,
    })

    if (!magic.actionLink) {
      console.error('[concept-ready email] magic link failed:', magic.error)
      return NextResponse.json(
        {
          sent: false,
          error: 'Owner portal sign-in link could not be generated',
          detail: magic.error,
          redirectTo: magic.redirectTo,
        },
        { status: 503 },
      )
    }

    const signInUrl = magic.actionLink

    const costLine =
      typeof estimatedCost === 'number' && estimatedCost > 0
        ? `Estimated investment range: $${estimatedCost.toLocaleString('en-US')}`
        : null
    const videoLine =
      (tier ?? 1) >= 2 && videoIncluded
        ? 'A short cinematic walkthrough video (rendering now — typically arrives within a few minutes of this email)'
        : null

    const customerRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Kealee <hello@kealee.com>',
        to: [to],
        subject: `Your Kealee ${serviceName} concept is ready to view`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff">
            <div style="margin-bottom:24px">
              <span style="font-size:22px;font-weight:700;color:#0F1A2E">Kealee</span>
            </div>
            <h2 style="margin:0 0 12px;font-size:20px;color:#0F1A2E">Your concept is ready</h2>
            <p style="color:#555;line-height:1.6;margin:0 0 16px;font-size:15px">
              Hi ${greeting}, your AI concept package for <strong>${serviceName}</strong> is ready in your Owner Portal.
            </p>
            <ul style="color:#555;line-height:1.6;font-size:14px;padding-left:20px">
              <li>Design concept summary, palette, and key features</li>
              <li>Bill of materials with DMV-market costs</li>
              <li>Permit scope and zoning guidance</li>
              <li>Project renders</li>
              ${videoLine ? `<li>${videoLine}</li>` : ''}
            </ul>
            ${costLine ? `<p style="color:#555;font-size:14px">${costLine}</p>` : ''}
            <p style="color:#555;line-height:1.6;margin:24px 0;font-size:14px">
              Click below to sign in with <strong>${to}</strong> (one click — link expires in 1 hour).
            </p>
            <a href="${signInUrl}"
               style="display:inline-block;background:#E8793A;color:#fff;text-decoration:none;
                      padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px">
              Open My Owner Portal →
            </a>
            <p style="color:#aaa;font-size:12px;margin-top:36px;line-height:1.5">
              If the button does not work, copy this link into your browser:<br/>
              <a href="${signInUrl}" style="color:#2ABFBF;word-break:break-all">${signInUrl}</a>
            </p>
          </div>
        `,
        text: [
          `Hi ${greeting},`,
          '',
          `Your AI concept package for "${serviceName}" is ready.`,
          '',
          'Open your Owner Portal (sign in with this email address):',
          signInUrl,
          '',
          ...(videoLine ? [videoLine, ''] : []),
          ...(costLine ? [costLine, ''] : []),
          '',
          'Questions? Reply to this email.',
          '',
          'The Kealee Team',
        ].join('\n'),
      }),
    })

    if (!customerRes.ok) {
      const errBody = await customerRes.text().catch(() => '')
      console.error('[concept-ready email] customer send failed:', customerRes.status, errBody)
    }

    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Kealee Notifications <notifications@kealee.com>',
        to: ['hello@kealee.com'],
        subject: `Concept delivered — ${serviceName} #${intakeId}`,
        text: [
          'A new AI concept was delivered to a customer.',
          '',
          `  Intake ID: ${intakeId}`,
          `  Service:   ${serviceName}`,
          `  Customer:  ${to}`,
          `  Magic link: ${magic.actionLink ? 'yes' : `no (${magic.error})`}`,
          `  Deliverable: ${deliverableUrl}`,
        ].join('\n'),
      }),
    }).catch(err => {
      console.error('[concept-ready email] internal notification failed:', err?.message ?? err)
    })

    onConceptReadyLifecycle({
      intakeId,
      email: to,
      clientName: greeting !== 'there' ? greeting : undefined,
      projectPath: service,
      serviceLabel: serviceName,
    }).catch(err => {
      console.error('[concept-ready email] lifecycle hook failed:', err?.message ?? err)
    })

    return NextResponse.json({
      sent: customerRes.ok,
      magicLink: Boolean(magic.actionLink),
      redirectTo: magic.redirectTo,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[concept-ready email]', message)
    return NextResponse.json({ error: 'Failed to send concept-ready email' }, { status: 500 })
  }
}
