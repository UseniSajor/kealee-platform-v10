import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { password } = (await req.json()) as { password?: string }
  const expected = process.env.PORTAL_ADMIN_SECRET || process.env.PORTAL_ADMIN_PASSWORD
  if (!expected) {
    return NextResponse.json({ error: 'PORTAL_ADMIN_PASSWORD not configured' }, { status: 503 })
  }
  if (password !== expected) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('portal_admin_session', expected, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}
