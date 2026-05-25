/**
 * POST /api/emails/resend-portal-access
 * Body: { intakeId: string, email?: string }
 *
 * Regenerates the 7-day claim link and resends concept-ready email (internal/cron).
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@kealee/database'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { intakeId?: string; email?: string }
    const intakeId = body.intakeId?.trim()
    if (!intakeId) {
      return NextResponse.json({ error: 'intakeId required' }, { status: 400 })
    }

    const intake = await prisma.publicIntakeLead.findUnique({
      where: { id: intakeId },
      select: {
        id: true,
        contactEmail: true,
        projectPath: true,
        clientName: true,
      },
    })

    if (!intake) {
      return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
    }

    const to = (body.email?.trim() || intake.contactEmail || '').toLowerCase()
    if (!to) {
      return NextResponse.json({ error: 'No email on intake' }, { status: 400 })
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_WEB_MAIN_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    const res = await fetch(`${baseUrl}/api/emails/concept-ready`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        intakeId,
        service: intake.projectPath ?? 'concept',
        firstName: intake.clientName?.split(' ')[0],
      }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json({ error: data.error ?? 'Resend failed', detail: data }, { status: res.status })
    }

    return NextResponse.json({ ok: true, ...data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[resend-portal-access]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
