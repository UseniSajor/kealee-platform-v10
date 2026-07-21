/**
 * Universal deliverable-ready email (concept, estimate, permit, match).
 * Replaces concept-only notifications for all paid intake types.
 */

import { getOwnerPortalDeliverableUrl } from '@/lib/owner-portal-urls'
import { generatePortalAccessToken } from '@/lib/portal-access-token'
import { getBuildPathUpsells } from '@kealee/core-rules'

export interface DeliverableReadyPayload {
  to: string
  firstName?: string
  service: string
  intakeId: string
  estimatedCost?: number
  tier?: number
  videoIncluded?: boolean
  /** Human headline override */
  headline?: string
}

function serviceLabel(projectPath: string): string {
  return projectPath.replace(/_/g, ' ')
}

export async function sendDeliverableReadyEmail(
  payload: DeliverableReadyPayload,
): Promise<{ sent: boolean; claimUrl?: string; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    return { sent: false, error: 'RESEND_API_KEY not configured' }
  }

  const { to, firstName, service, intakeId, estimatedCost, tier, videoIncluded } = payload
  const greeting = firstName?.trim() || 'there'
  const svc = serviceLabel(service)
  const deliverablePath = `/deliverables/${encodeURIComponent(intakeId)}?projectPath=${encodeURIComponent(service)}`

  const portalAccess = await generatePortalAccessToken({
    intakeId,
    email: to,
    nextPath: deliverablePath,
  })

  if (!portalAccess.claimUrl) {
    return { sent: false, error: portalAccess.error ?? 'claim URL failed' }
  }

  const signInUrl = portalAccess.claimUrl
  // "Create a password" link uses the portal's login page in create-account mode.
  // Previously pointed to kealee.com/auth/complete which requires an active session
  // the user doesn't have when arriving from email — causing a 404/auth error.
  const portalBase = (process.env.NEXT_PUBLIC_PORTAL_URL ?? 'https://owner.kealee.com').replace(/\/$/, '')
  const accountUrl = `${portalBase}/login?welcome=1&email=${encodeURIComponent(to)}&next=${encodeURIComponent(getOwnerPortalDeliverableUrl(intakeId, service))}`

  const upsells = getBuildPathUpsells({
    sourceProjectPath: service,
    fromIntakeId: intakeId,
  })
  const upsellLines = upsells.offers
    .filter((o) => o.tier !== 'locked')
    .slice(0, 3)
    .map((o) => `${o.label} — ${o.priceLabel}`)

  const costLine =
    typeof estimatedCost === 'number' && estimatedCost > 0
      ? `Estimated investment range: $${estimatedCost.toLocaleString('en-US')}`
      : null

  const isConcept = !['cost_estimate', 'certified_estimate', 'permit_path_only', 'contractor_match', 'professional_drawings'].includes(service)
  const headline =
    payload.headline ??
    (isConcept
      ? `Your ${svc} concept is ready — open it now`
      : `Your ${svc} package is ready in your Owner Portal`)

  const customerRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Kealee <hello@kealee.com>',
      to: [to],
      subject: headline,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:0;background:#fff">
          <div style="background:#0F1A2E;padding:20px 32px">
            <span style="font-size:20px;font-weight:800;color:#fff">Kealee</span>
          </div>
          <div style="padding:40px 32px 0">
            <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#E8793A;text-transform:uppercase">Your package is ready</p>
            <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#0F1A2E">Hi ${greeting} — your ${svc} deliverable is waiting.</h1>
            <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.7">
              Click below for one-click access. Save your project by creating a password on your next visit.
            </p>
          </div>
          <div style="margin:0 32px;background:#F8F9F9;border:1px solid #E8E6DF;border-radius:12px;padding:24px">
            <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0F1A2E;text-transform:uppercase">Continue toward build</p>
            ${upsellLines.map((line) => `<p style="margin:6px 0;font-size:14px;color:#444">→ ${line}</p>`).join('')}
            ${costLine ? `<p style="margin:16px 0 0;font-size:14px;font-weight:600;color:#0F1A2E">${costLine}</p>` : ''}
          </div>
          <div style="padding:32px 32px 0;text-align:center">
            <a href="${signInUrl}" style="display:inline-block;background:#E8793A;color:#fff;text-decoration:none;padding:16px 40px;border-radius:10px;font-weight:800;font-size:16px">View My Deliverable →</a>
            <p style="margin:14px 0 0;font-size:12px;color:#999"><a href="${accountUrl}" style="color:#2ABFBF">Create a password</a> for faster return access.</p>
          </div>
          <div style="padding:24px 32px 32px;margin-top:24px;border-top:1px solid #E8E6DF">
            <p style="margin:0;font-size:12px;color:#bbb;word-break:break-all">${signInUrl}</p>
          </div>
        </div>
      `,
      text: [
        `Hi ${greeting},`,
        '',
        `Your ${svc} package is ready.`,
        signInUrl,
        '',
        'Next steps toward build:',
        ...upsellLines.map((l) => `- ${l}`),
        '',
        `Create a password: ${accountUrl}`,
      ].join('\n'),
    }),
  })

  return {
    sent: customerRes.ok,
    claimUrl: signInUrl,
    error: customerRes.ok ? undefined : `Resend ${customerRes.status}`,
  }
}
