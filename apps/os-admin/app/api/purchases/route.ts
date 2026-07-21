import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { hasOsAdminRole, verifyOpsBearer } from '@kealee/auth/ops-api-auth'

export const runtime = 'nodejs'

async function authorizePurchases(req: NextRequest): Promise<NextResponse | null> {
  if (verifyOpsBearer(req)) return null

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {},
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = (user.app_metadata?.role as string | undefined)?.toLowerCase()
  if (!hasOsAdminRole(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return null
}

export async function GET(req: NextRequest) {
  const denied = await authorizePurchases(req)
  if (denied) return denied

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ purchases: [], live: false })
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  const { data, error } = await supabase
    .from('public_intake_leads')
    .select(
      'id, project_path, status, payment_amount, created_at, form_data, client_name, contact_email, contact_phone, project_address',
    )
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ purchases: [], live: false, error: error.message })
  }

  // Derive tier + CAD delivery readiness so staff can spot Premium+ orders that
  // still need their CAD file delivered, without shipping raw form_data to the UI.
  const purchases = (data ?? []).map((row) => {
    const formData = (row.form_data as Record<string, unknown>) ?? {}
    const isV30 = Boolean(formData.v30 || formData.v30Quote || formData.v30ProjectId)
    const tier = typeof formData.tier === 'number' ? formData.tier : null
    const conceptOutput = (formData.conceptOutput ?? formData.v30ConceptOutput) as
      | { cadDxfInline?: string }
      | undefined
    const isPremiumPlusConcept = tier === 3 && Boolean(conceptOutput)
    const cadReady = isV30
      ? Boolean((formData.v30FloorplanDeliverables as { cadExport?: { dxf?: string } } | undefined)?.cadExport?.dxf)
      : Boolean(conceptOutput?.cadDxfInline)

    return {
      id: row.id,
      project_path: row.project_path,
      status: row.status,
      payment_amount: row.payment_amount,
      created_at: row.created_at,
      client_name: row.client_name,
      contact_email: row.contact_email,
      contact_phone: row.contact_phone,
      project_address: row.project_address,
      tier,
      isV30,
      needsCadDelivery: isPremiumPlusConcept && !cadReady,
    }
  })

  return NextResponse.json({ purchases, live: true })
}
