import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getClerkUser } from '@kealee/auth'
import { hasOsAdminRole, verifyOpsBearer } from '@kealee/auth/ops-api-auth'

export const runtime = 'nodejs'

async function authorizePurchases(req: NextRequest): Promise<NextResponse | null> {
  if (verifyOpsBearer(req)) return null

  const user = await getClerkUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = user.role?.toLowerCase()
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

  // The purchases table renders client name, email, phone, address, and
  // form_data — selecting only five columns left every one of those blank.
  const { data, error } = await supabase
    .from('public_intake_leads')
    .select(
      'id, project_path, client_name, contact_email, contact_phone, project_address, status, payment_amount, paid_at, stripe_session_id, created_at, form_data',
    )
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ purchases: [], live: false, error: error.message })
  }

  return NextResponse.json({ purchases: data ?? [], live: true })
}
