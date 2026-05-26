/**
 * POST /api/emails/concept-ready
 *
 * Notifies the customer that their AI concept package has finished generating.
 * Uses a Supabase magic link (not a bare deliverable URL) so one click signs them in.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getOwnerPortalDeliverableUrl } from '@/lib/owner-portal-urls'
import { generatePortalAccessToken } from '@/lib/portal-access-token'
import { onConceptReadyLifecycle } from '@/lib/marketing/lifecycle'
import {
  getPermitZoningLabels,
  intakePathToFamily,
  type ConceptTier,
} from '@kealee/core-rules'

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

    const portalAccess = await generatePortalAccessToken({
      intakeId,
      email: to,
      nextPath: deliverablePath,
    })

    if (!portalAccess.claimUrl) {
      console.error('[concept-ready email] portal access token failed:', portalAccess.error)
      return NextResponse.json(
        {
          sent: false,
          error: 'Owner portal access link could not be generated',
          detail: portalAccess.error,
        },
        { status: 503 },
      )
    }

    const signInUrl = portalAccess.claimUrl

    const costLine =
      typeof estimatedCost === 'number' && estimatedCost > 0
        ? `Estimated investment range: $${estimatedCost.toLocaleString('en-US')}`
        : null
    const videoLine =
      (tier ?? 1) >= 2 && videoIncluded
        ? 'A short cinematic walkthrough video (rendering now — typically arrives within a few minutes of this email)'
        : null

    const tierKey = ((tier ?? 1) === 3 ? 3 : (tier ?? 1) === 2 ? 2 : 1) as ConceptTier
    const permitZoningBullets = getPermitZoningLabels(intakePathToFamily(service), tierKey)

    const customerRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Kealee <hello@kealee.com>',
        to: [to],
        subject: `Your ${serviceName} concept is ready — open it now`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:0;background:#fff">

            <!-- Header bar -->
            <div style="background:#0F1A2E;padding:20px 32px">
              <span style="font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.5px">Kealee</span>
            </div>

            <!-- Hero -->
            <div style="padding:40px 32px 0">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#E8793A;text-transform:uppercase;letter-spacing:0.08em">Your concept is ready</p>
              <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#0F1A2E;line-height:1.2">
                Hi ${greeting} — your ${serviceName} package just landed.
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.7">
                Your AI concept package is complete and waiting in your Owner Portal.
                Click below to sign in and access your results.
              </p>
            </div>

            <!-- What's inside card -->
            <div style="margin:0 32px;background:#F8F9F9;border:1px solid #E8E6DF;border-radius:12px;padding:24px">
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0F1A2E;text-transform:uppercase;letter-spacing:0.06em">Inside your package</p>
              <table style="border-collapse:collapse;width:100%">
                <tr>
                  <td style="padding:5px 0;font-size:14px;color:#444;line-height:1.5">&#10003;&nbsp; Design concept summary, palette &amp; key features</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;font-size:14px;color:#444;line-height:1.5">&#10003;&nbsp; Bill of materials with DMV-market cost ranges</td>
                </tr>
                ${permitZoningBullets
                  .map(
                    (line) =>
                      `<tr><td style="padding:5px 0;font-size:14px;color:#444;line-height:1.5">&#10003;&nbsp; ${line}</td></tr>`,
                  )
                  .join('')}
                <tr>
                  <td style="padding:5px 0;font-size:14px;color:#444;line-height:1.5">&#10003;&nbsp; Rendered project visuals</td>
                </tr>
                ${videoLine ? `<tr><td style="padding:5px 0;font-size:14px;color:#444;line-height:1.5">&#10003;&nbsp; ${videoLine}</td></tr>` : ''}
              </table>
              ${costLine ? `<p style="margin:16px 0 0;font-size:14px;color:#0F1A2E;font-weight:600">${costLine}</p>` : ''}
            </div>

            <!-- CTA -->
            <div style="padding:32px 32px 0;text-align:center">
              <a href="${signInUrl}"
                 style="display:inline-block;background:#E8793A;color:#fff;text-decoration:none;
                        padding:16px 40px;border-radius:10px;font-weight:800;font-size:16px;
                        letter-spacing:-0.2px">
                View My Concept &rarr;
              </a>
              <p style="margin:14px 0 0;font-size:12px;color:#999">
                This link is personal to you and valid for 7 days.
              </p>
            </div>

            <!-- Divider -->
            <div style="margin:36px 32px 0;border-top:1px solid #E8E6DF"></div>

            <!-- Footer -->
            <div style="padding:24px 32px 32px">
              <p style="margin:0 0 8px;font-size:13px;color:#888;line-height:1.6">
                Questions? Reply to this email or reach us at
                <a href="mailto:support@kealee.com" style="color:#E8793A;text-decoration:none">support@kealee.com</a>.
              </p>
              <p style="margin:0;font-size:12px;color:#bbb;line-height:1.5">
                If the button does not work, copy this URL into your browser:<br/>
                <a href="${signInUrl}" style="color:#2ABFBF;word-break:break-all">${signInUrl}</a>
              </p>
            </div>

          </div>
        `,
        text: [
          `Hi ${greeting},`,
          '',
          `Your ${serviceName} AI concept package is ready in your Owner Portal.`,
          '',
          'Sign in to access your concept:',
          signInUrl,
          '',
          'Inside your package:',
          '- Design concept summary, palette & key features',
          '- Bill of materials with DMV-market cost ranges',
          ...permitZoningBullets.map((line) => `- ${line}`),
          '- Rendered project visuals',
          ...(videoLine ? [`- ${videoLine}`] : []),
          ...(costLine ? ['', costLine] : []),
          '',
          'This link is personal to you and valid for 7 days.',
          '',
          'Questions? Reply to this email or write to support@kealee.com.',
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
          `  Intake ID:   ${intakeId}`,
          `  Service:     ${serviceName}`,
          `  Customer:    ${to}`,
          `  Claim URL:   ${portalAccess.claimUrl ? 'generated' : `failed (${portalAccess.error})`}`,
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
      claimToken: Boolean(portalAccess.claimUrl),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[concept-ready email]', message)
    return NextResponse.json({ error: 'Failed to send concept-ready email' }, { status: 500 })
  }
}
