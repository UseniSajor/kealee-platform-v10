import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

const VALID_ROLES = [
  'ARCHITECT',
  'STRUCTURAL_ENGINEER',
  'MEP_ENGINEER',
  'CIVIL_ENGINEER',
  'LANDSCAPE_ARCHITECT',
]

// POST /api/design-professionals/register
// Accepts architect and engineer registration applications.
// Stores in contact_inquiries (source='design-professional') with graceful DB fallback.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      role,
      firstName,
      lastName,
      email,
      phone,
      firmName,
      licenseNumber,
      licenseState,
      yearsExperience,
      bio,
      portfolioUrl,
      specialties,
      jurisdictions,
    } = body

    if (!firstName || !lastName || !email || !role) {
      return NextResponse.json(
        { error: 'firstName, lastName, email, and role are required' },
        { status: 400 }
      )
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `role must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      )
    }

    let saved = false

    try {
      const supabase = getSupabaseAdmin()
      const { error: insertErr } = await supabase.from('contact_inquiries').insert({
        name: `${firstName} ${lastName}`.trim(),
        email,
        phone: phone ?? null,
        message: bio ?? null,
        source: 'design-professional',
        metadata: {
          role,
          firmName: firmName ?? null,
          licenseNumber: licenseNumber ?? null,
          licenseState: licenseState ?? null,
          yearsExperience: yearsExperience ?? null,
          portfolioUrl: portfolioUrl ?? null,
          specialties: specialties ?? [],
          jurisdictions: jurisdictions ?? [],
        },
      })

      if (!insertErr) saved = true
      else console.warn('[design-pro] Supabase insert failed:', insertErr.message)
    } catch (dbErr) {
      console.warn('[design-pro] DB unavailable, logging application only:', dbErr)
    }

    console.log('[design-pro] Registration received', { role, email, saved })

    return NextResponse.json({ success: true, saved })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
