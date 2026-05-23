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

  // Step 4 — estimate upsell (concept_ready cohort); funnelUrl should be /estimate/intake?lead=
  const estimateLink = ctx.funnelUrl.startsWith('http')
    ? ctx.funnelUrl
    : `${SITE_URL}/estimate/intake`

  return {
    subject: `Ready for a certified cost estimate for your ${ctx.serviceLabel}?`,
    html: wrap(`
  <h2 style="color:#1A2B4A">${greeting},</h2>
  <p style="color:#4A5568;line-height:1.6">
    Your concept package is in your Owner Portal. The natural next step is a
    <strong>RSMeans-validated cost estimate</strong> so you can compare contractor bids with confidence.
  </p>
  <ul style="color:#4A5568;line-height:1.8;padding-left:20px">
    <li>Line-item scope aligned to your concept</li>
    <li>DMV market cost ranges</li>
    <li>Credit toward permit drawings when you move forward</li>
  </ul>
  <div style="margin:32px 0;text-align:center">
    <a href="${estimateLink}" style="display:inline-block;background:#2ABFBF;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 32px;border-radius:12px">Get a Cost Estimate →</a>
  </div>
  <p style="color:#718096;font-size:13px">Or <a href="${SITE_URL}/permits" style="color:#2ABFBF">check your permit path</a> if you are ready to pull drawings.</p>`),
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
    '3. From there you can add a cost estimate or permit path on Kealee',
    '',
    `Portal: ${opts.deliverableUrl}`,
    '',
    'Questions? Reply to hello@kealee.com',
  ].join('\n')

  const html = wrap(`
  <h2 style="color:#1A2B4A">Hi ${firstName},</h2>
  <p style="color:#4A5568;line-height:1.6">Your payment is confirmed. We are generating your <strong>${serviceName}</strong> concept package now.</p>
  <ol style="color:#4A5568;line-height:1.8">
    <li>AI design, estimate preview, and permit guidance (per your tier)</li>
    <li>Email when your Owner Portal deliverable is ready</li>
    <li>Optional next steps: certified estimate or permit drawings on Kealee</li>
  </ol>
  <div style="margin:32px 0;text-align:center">
    <a href="${opts.deliverableUrl}" style="display:inline-block;background:#2ABFBF;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 32px;border-radius:12px">Open Owner Portal →</a>
  </div>`)

  return { subject, html, text }
}
