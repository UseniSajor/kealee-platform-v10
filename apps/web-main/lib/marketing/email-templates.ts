const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kealee.com'

function footer(): string {
  return `
  <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0"/>
  <p style="color:#A0AEC0;font-size:12px">Kealee · hello@kealee.com · <a href="${SITE_URL}" style="color:#2ABFBF">kealee.com</a></p>
</div>`
}

function wrap(inner: string): string {
  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">${inner}${footer()}`
}

export interface DripEmailContext {
  name: string
  serviceLabel: string
  funnelUrl: string
  email?: string
}

const PRECONSTRUCTION_COPY: Record<string, { label: string; body: string }> = {
  design_estimate_permit_bundle: {
    label: 'Design + Estimate + Permit Bundle',
    body: 'Connect concept direction, catalogue-based estimating, and permit planning in one connected workflow before construction begins.',
  },
  cost_estimate: {
    label: 'Catalogue-Based Construction Estimate',
    body: 'Build a transparent estimate from defined quantities, labor, materials, equipment, and documented assumptions — no generic cost-per-square-foot pricing.',
  },
  permit_path_only: {
    label: 'Permit Planning',
    body: 'Identify jurisdiction requirements, submission needs, dependencies, and the next documents your project needs before filing.',
  },
}

export function buildPreconstructionWelcomeEmail(
  ctx: DripEmailContext & { serviceKey: string },
): { subject: string; html: string } {
  const greeting = ctx.name ? `Hi ${ctx.name}` : 'Hi there'
  const copy = PRECONSTRUCTION_COPY[ctx.serviceKey] ?? {
    label: ctx.serviceLabel,
    body: 'Kealee provides project-specific preconstruction services built around your scope, not a generic estimate.',
  }
  return {
    subject: `Your ${copy.label} request is confirmed — Kealee`,
    html: wrap(`
  <h2 style="color:#1A2B4A;margin-bottom:8px">${greeting},</h2>
  <p style="color:#4A5568;line-height:1.6">
    We received your preconstruction project details. ${copy.body}
  </p>
  <p style="color:#4A5568;line-height:1.6">
    We will review your scope and follow up with a recommended service path and next action.
  </p>
  <div style="margin:32px 0;text-align:center">
    <a href="${ctx.funnelUrl}" style="display:inline-block;background:#2ABFBF;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 32px;border-radius:12px">
      Start Your Preconstruction Package →
    </a>
  </div>
  <p style="color:#718096;font-size:13px">All estimates are based on your project scope and documented assumptions — not square-foot averages.</p>`),
  }
}

export function buildWelcomeEmail(ctx: DripEmailContext): { subject: string; html: string } {
  const greeting = ctx.name ? `Hi ${ctx.name}` : 'Hi there'
  return {
    subject: `Your ${ctx.serviceLabel} design concept is ready to start — Kealee`,
    html: wrap(`
  <h2 style="color:#1A2B4A;margin-bottom:8px">${greeting}!</h2>
  <p style="color:#4A5568;line-height:1.6">
    Thanks for your interest in a <strong>${ctx.serviceLabel}</strong> concept from Kealee.
    Our AI-powered design engine delivers floor plan direction, permit scope, cost estimates,
    and concept renderings in one package.
  </p>
  <p style="color:#4A5568;line-height:1.6">
    <strong style="color:#1A2B4A">Your concept package cost is credited in full</strong>
    toward permit drawings when you are ready to build.
  </p>
  <div style="margin:32px 0;text-align:center">
    <a href="${ctx.funnelUrl}" style="display:inline-block;background:#2ABFBF;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 32px;border-radius:12px">
      Start Your Concept Package →
    </a>
  </div>
  <p style="color:#718096;font-size:13px">Packages start at $99. Delivered digitally in your package window.</p>`),
  }
}

export function buildDripEmail(
  step: number,
  ctx: DripEmailContext,
): { subject: string; html: string } {
  const greeting = ctx.name ? `Hi ${ctx.name}` : 'Hi there'

  if (step === 1) {
    return {
      subject: `Here's everything included in your ${ctx.serviceLabel} concept — Kealee`,
      html: wrap(`
  <h2 style="color:#1A2B4A">${greeting}!</h2>
  <p style="color:#4A5568;line-height:1.6">
    You expressed interest in a <strong>${ctx.serviceLabel}</strong> concept. Here's what you get:
  </p>
  <table style="width:100%;border-collapse:collapse;margin:20px 0">
    ${[
      ['AI Concept Renderings', 'Photorealistic images of your finished space'],
      ['Floor Plan Direction', 'Layout sketch and flow recommendations'],
      ['Permit Scope Brief', 'Path-to-approval checklist for DMV'],
      ['Cost Estimate', 'Itemized ranges for budgeting'],
      ['PDF Design Report', 'Delivered in your Owner Portal'],
      ['Permit Credit', 'Concept cost credited toward permit drawings'],
    ]
      .map(
        ([item, desc]) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #E2E8F0;vertical-align:top;width:40%"><strong style="color:#1A2B4A;font-size:14px">${item}</strong></td>
        <td style="padding:10px 0 10px 16px;border-bottom:1px solid #E2E8F0;color:#4A5568;font-size:14px">${desc}</td>
      </tr>`,
      )
      .join('')}
  </table>
  <div style="margin:32px 0;text-align:center">
    <a href="${ctx.funnelUrl}" style="display:inline-block;background:#2ABFBF;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 32px;border-radius:12px">Start My Concept Package →</a>
  </div>
  <p style="color:#718096;font-size:13px">No commitment until checkout.</p>`),
    }
  }

  if (step === 2) {
    return {
      subject: `Real ${ctx.serviceLabel} projects — see what's possible with Kealee`,
      html: wrap(`
  <h2 style="color:#1A2B4A">${greeting},</h2>
  <p style="color:#4A5568;line-height:1.6">Homeowners across the DMV use Kealee to visualize <strong>${ctx.serviceLabel}</strong> projects before hiring a contractor.</p>
  <div style="background:#F7FAFC;border-radius:12px;padding:20px;margin:20px 0">
    <p style="color:#2D3748;font-size:15px;font-style:italic;line-height:1.6;margin:0">"The renderings were so realistic, I felt confident going into contractor bids."</p>
    <p style="color:#718096;font-size:13px;margin:12px 0 0">— Kealee homeowner, DMV</p>
  </div>
  <div style="margin:32px 0;text-align:center">
    <a href="${ctx.funnelUrl}" style="display:inline-block;background:#E8793A;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 32px;border-radius:12px">View My Package Options →</a>
  </div>`),
    }
  }

  if (step === 3) {
    const unsub = ctx.email
      ? `${SITE_URL}/api/marketing/unsubscribe?email=${encodeURIComponent(ctx.email)}`
      : `${SITE_URL}/api/marketing/unsubscribe`
    return {
      subject: `Still thinking about your ${ctx.serviceLabel}? One last thought from Kealee`,
      html: wrap(`
  <h2 style="color:#1A2B4A">${greeting},</h2>
  <p style="color:#4A5568;line-height:1.6">Starting with a concept is the lowest-risk move — design direction, permit scope, and cost estimate before any contractor commitment.</p>
  <div style="margin:32px 0;text-align:center">
    <a href="${ctx.funnelUrl}" style="display:inline-block;background:#1A2B4A;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 32px;border-radius:12px">Start My ${ctx.serviceLabel} Concept →</a>
  </div>
  <p style="color:#A0AEC0;font-size:12px;text-align:center"><a href="${unsub}" style="color:#A0AEC0">Unsubscribe</a></p>`),
    }
  }

  // Step 4 — permit-ready professional drawings upsell (concept_ready); estimate already included
  const permitDrawingsLink = ctx.funnelUrl.startsWith('http')
    ? ctx.funnelUrl
    : `${SITE_URL}/intake/professional_drawings`

  return {
    subject: `Ready for permit-ready drawings for your ${ctx.serviceLabel}?`,
    html: wrap(`
  <h2 style="color:#1A2B4A">${greeting},</h2>
  <p style="color:#4A5568;line-height:1.6">
    Your concept package is in your Owner Portal — including the <strong>RSMeans cost estimate</strong> (no separate purchase needed).
    The next step is <strong>permit-ready professional drawings</strong> so you can file with your jurisdiction.
  </p>
  <ul style="color:#4A5568;line-height:1.8;padding-left:20px">
    <li>Licensed architect / PE drawing set</li>
    <li>Floor plans, elevations, site plan</li>
    <li>PE stamp where required · permit filing coordination</li>
  </ul>
  <div style="margin:32px 0;text-align:center">
    <a href="${permitDrawingsLink}" style="display:inline-block;background:#2ABFBF;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 32px;border-radius:12px">Get Permit-Ready Drawings →</a>
  </div>
  <p style="color:#718096;font-size:13px">Or <a href="${SITE_URL}/permits" style="color:#2ABFBF">add full permit filing</a> when you are ready to submit.</p>`),
  }
}

export function buildPostPaymentEmail(opts: {
  clientName: string
  projectPath: string
  intakeId: string
  deliverableUrl: string
}): { subject: string; html: string; text: string } {
  const serviceName = opts.projectPath.replace(/_/g, ' ')
  const firstName = opts.clientName.split(' ')[0] || 'there'
  const subject = 'Your Kealee concept package is confirmed — generating now'
  const text = [
    `Hi ${firstName},`,
    '',
    'Your payment has been received. Your AI concept is generating now.',
    '',
    `Service: ${serviceName}`,
    `Order ID: ${opts.intakeId}`,
    '',
    'What happens next:',
    '1. Your concept generates now (v30 parallel deliverables)',
    '2. You will receive an email when your package is ready in the Owner Portal',
    '3. From there you can order permit-ready drawings or full permit filing on Kealee',
    '',
    `Portal: ${opts.deliverableUrl}`,
    '',
    'Questions? Reply to hello@kealee.com',
  ].join('\n')

  const html = wrap(`
  <h2 style="color:#1A2B4A">Hi ${firstName},</h2>
  <p style="color:#4A5568;line-height:1.6">Your payment is confirmed. We are generating your <strong>${serviceName}</strong> concept package now.</p>
  <ol style="color:#4A5568;line-height:1.8">
    <li>AI design, RSMeans estimate (included), and permit guidance (per your tier)</li>
    <li>Email when your Owner Portal deliverable is ready</li>
    <li>Next step: permit-ready professional drawings — estimate already included</li>
  </ol>
  <div style="margin:32px 0;text-align:center">
    <a href="${opts.deliverableUrl}" style="display:inline-block;background:#2ABFBF;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 32px;border-radius:12px">Open Owner Portal →</a>
  </div>`)

  return { subject, html, text }
}
