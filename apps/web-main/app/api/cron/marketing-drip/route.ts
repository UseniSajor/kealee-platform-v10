/**
 * GET /api/cron/marketing-drip
 *
 * Vercel cron job — runs daily at 9am CT.
 * Finds pending drip emails due for delivery and sends them via Resend.
 *
 * Cron schedule in vercel.json:
 *   { "path": "/api/cron/marketing-drip", "schedule": "0 14 * * *" }  (14:00 UTC = 9am CT)
 *
 * Drip sequence:
 *   Step 1 (Day 1):  "What's included in your concept package"
 *   Step 2 (Day 3):  "Real projects, real results"
 *   Step 3 (Day 7):  "Still thinking it over?"
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const SITE_URL    = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kealee.com'
const RESEND_KEY  = process.env.RESEND_API_KEY

// ── Email templates ───────────────────────────────────────────────────────────

function buildEmail(step: number, name: string, serviceLabel: string, funnelUrl: string): {
  subject: string
  html:    string
} {
  const greeting = name ? `Hi ${name}` : 'Hi there'

  if (step === 1) {
    return {
      subject: `Here's everything included in your ${serviceLabel} concept — Kealee`,
      html: `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
  <h2 style="color:#1A2B4A">${greeting}!</h2>
  <p style="color:#4A5568;line-height:1.6">
    You expressed interest in a <strong>${serviceLabel}</strong> concept from Kealee.
    Here's a quick breakdown of everything you get:
  </p>
  <table style="width:100%;border-collapse:collapse;margin:20px 0">
    ${[
      ['AI Concept Renderings', '3–15 photorealistic images of your finished space'],
      ['Floor Plan Direction',  'Layout sketch + room-by-room flow recommendations'],
      ['Permit Scope Brief',    'What permits are required + path-to-approval checklist'],
      ['Cost Estimate',         'Itemized bill of materials with realistic ranges'],
      ['PDF Design Report',     '15–20 page report delivered digitally'],
      ['Permit Credit',         'Your concept cost is credited toward permit drawings'],
    ].map(([item, desc]) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #E2E8F0;vertical-align:top;width:40%">
          <strong style="color:#1A2B4A;font-size:14px">${item}</strong>
        </td>
        <td style="padding:10px 0 10px 16px;border-bottom:1px solid #E2E8F0;color:#4A5568;font-size:14px">
          ${desc}
        </td>
      </tr>`).join('')}
  </table>
  <div style="margin:32px 0;text-align:center">
    <a href="${funnelUrl}" style="display:inline-block;background:#2ABFBF;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 32px;border-radius:12px">
      Start My Concept Package →
    </a>
  </div>
  <p style="color:#718096;font-size:13px">Packages start at $99. No commitment until checkout.</p>
  <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0"/>
  <p style="color:#A0AEC0;font-size:12px">Kealee · hello@kealee.com · <a href="${SITE_URL}" style="color:#2ABFBF">kealee.com</a></p>
</div>`,
    }
  }

  if (step === 2) {
    return {
      subject: `Real ${serviceLabel} projects — see what's possible with Kealee`,
      html: `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
  <h2 style="color:#1A2B4A">${greeting},</h2>
  <p style="color:#4A5568;line-height:1.6">
    We're helping homeowners across Texas visualize and plan their <strong>${serviceLabel}</strong> projects
    before ever hiring a contractor. Here's why they love the Kealee process:
  </p>
  <div style="background:#F7FAFC;border-radius:12px;padding:20px;margin:20px 0">
    <p style="color:#2D3748;font-size:15px;font-style:italic;line-height:1.6;margin:0">
      "I had no idea what my kitchen remodel would look like until Kealee showed me.
       The renderings were so realistic, I felt confident going into contractor bids."
    </p>
    <p style="color:#718096;font-size:13px;margin:12px 0 0">— Sarah M., Austin TX</p>
  </div>
  <ul style="color:#4A5568;line-height:1.8;padding-left:20px">
    <li>AI renderings delivered in your package window</li>
    <li>Permit scope so you know what's required before you start</li>
    <li>Cost estimate to compare contractor bids fairly</li>
    <li>Your concept cost <strong>credited toward permit drawings</strong></li>
  </ul>
  <div style="margin:32px 0;text-align:center">
    <a href="${funnelUrl}" style="display:inline-block;background:#E8793A;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 32px;border-radius:12px">
      View My Package Options →
    </a>
  </div>
  <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0"/>
  <p style="color:#A0AEC0;font-size:12px">Kealee · hello@kealee.com · <a href="${SITE_URL}" style="color:#2ABFBF">kealee.com</a></p>
</div>`,
    }
  }

  // Step 3
  return {
    subject: `Still thinking about your ${serviceLabel}? One last thought from Kealee`,
    html: `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
  <h2 style="color:#1A2B4A">${greeting},</h2>
  <p style="color:#4A5568;line-height:1.6">
    We noticed you haven't started your <strong>${serviceLabel}</strong> concept yet.
    We get it — home projects are a big decision. Here's the thing:
  </p>
  <div style="background:#FFF5F0;border-left:4px solid #E8793A;padding:16px 20px;border-radius:0 8px 8px 0;margin:20px 0">
    <p style="color:#2D3748;font-weight:600;margin:0 0 8px">Starting with a concept is the lowest-risk move.</p>
    <p style="color:#4A5568;margin:0;font-size:14px;line-height:1.6">
      For as little as $99, you get a full design direction, permit scope, and cost estimate —
      before committing to any contractor. And your concept cost is credited toward your permit drawings.
    </p>
  </div>
  <p style="color:#4A5568;line-height:1.6">
    If you're not ready, no worries at all. But if you are — we're here when you need us.
  </p>
  <div style="margin:32px 0;text-align:center">
    <a href="${funnelUrl}" style="display:inline-block;background:#1A2B4A;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 32px;border-radius:12px">
      Start My ${serviceLabel} Concept →
    </a>
  </div>
  <p style="color:#A0AEC0;font-size:12px;text-align:center">
    Not interested? <a href="${SITE_URL}/unsubscribe?email={{email}}" style="color:#A0AEC0">Unsubscribe</a>
  </p>
  <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0"/>
  <p style="color:#A0AEC0;font-size:12px">Kealee · hello@kealee.com · <a href="${SITE_URL}" style="color:#2ABFBF">kealee.com</a></p>
</div>`,
  }
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_KEY) return false
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'Kealee <hello@kealee.com>', to: [to], subject, html }),
    })
    return res.ok
  } catch {
    return false
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = getSupabaseAdmin()
  const now      = new Date().toISOString()

  // Fetch pending emails due for sending
  const { data: due, error } = await supabase
    .from('marketing_drip_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('send_at', now)
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const items    = due ?? []
  let   sent     = 0
  let   failed   = 0

  for (const item of items) {
    const { subject, html } = buildEmail(item.sequence_step, item.name ?? '', item.service_label ?? 'Home Design', item.funnel_url ?? `${SITE_URL}/concept`)
    const ok = await sendEmail(item.email, subject, html)

    await supabase
      .from('marketing_drip_queue')
      .update({ status: ok ? 'sent' : 'failed', sent_at: new Date().toISOString() })
      .eq('id', item.id)

    if (ok) sent++; else failed++
  }

  console.log(`[cron/marketing-drip] processed=${items.length} sent=${sent} failed=${failed}`)

  return NextResponse.json({ processed: items.length, sent, failed, at: now })
}
