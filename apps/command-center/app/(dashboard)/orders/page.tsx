import { AlertTriangle, CheckCircle2, Clock3, ShoppingBag } from 'lucide-react'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

type PaidOrder = {
  id: string
  project_path: string
  client_name: string
  contact_email: string
  project_address: string
  payment_amount: number
  paid_at: string | null
  created_at: string
  form_data: Record<string, unknown> | null
}

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  let orders: PaidOrder[] = []
  let error: string | null = null
  try {
    const { data, error: queryError } = await getSupabaseAdmin()
      .from('public_intake_leads')
      .select('id, project_path, client_name, contact_email, project_address, payment_amount, paid_at, created_at, form_data')
      .eq('status', 'paid')
      .order('paid_at', { ascending: false, nullsFirst: false })
      .limit(200)
    if (queryError) throw queryError
    orders = (data ?? []) as PaidOrder[]
  } catch (cause) {
    error = cause instanceof Error ? cause.message : 'Paid orders are unavailable'
  }

  const needsAttention = orders.filter(order => {
    const form = order.form_data ?? {}
    return form.requiresHumanFulfillment === true || ['failed', 'retryable', 'manual_review'].includes(String(form.fulfillmentStatus ?? ''))
  }).length

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white">Paid Orders</h1>
        <p className="mt-1 text-sm text-white/50">Every completed service sale and its fulfillment state.</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Metric label="Paid orders" value={orders.length} icon={ShoppingBag} color="#2ABFBF" />
        <Metric label="Needs attention" value={needsAttention} icon={AlertTriangle} color="#E8793A" />
        <Metric label="In progress" value={orders.length - needsAttention} icon={Clock3} color="#38A169" />
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      ) : (
        <div className="overflow-hidden rounded-lg border" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
          {orders.length === 0 ? <p className="p-10 text-center text-sm text-white/40">No paid orders found.</p> : orders.map(order => {
            const form = order.form_data ?? {}
            const attention = form.requiresHumanFulfillment === true || ['failed', 'retryable', 'manual_review'].includes(String(form.fulfillmentStatus ?? ''))
            const status = String(form.fulfillmentStatus ?? 'processing')
            return (
              <div key={order.id} className="grid gap-3 border-b p-4 last:border-b-0 sm:grid-cols-[1.4fr_1fr_auto]" style={{ borderColor: '#2A3D5F' }}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">{order.project_path.replace(/_/g, ' ')}</p>
                    <span className="rounded-full px-2 py-0.5 text-xs" style={{ color: attention ? '#F6AD55' : '#68D391', background: attention ? '#E8793A20' : '#38A16920' }}>
                      {attention ? 'Operator review' : status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-white/40">{order.id} · {order.project_address}</p>
                </div>
                <div>
                  <p className="text-sm text-white/80">{order.client_name}</p>
                  <p className="text-xs text-white/40">{order.contact_email}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">${((order.payment_amount ?? 0) / 100).toLocaleString()}</p>
                  <p className="text-xs text-white/40">{new Date(order.paid_at ?? order.created_at).toLocaleString()}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof CheckCircle2; color: string }) {
  return <div className="rounded-lg border p-4" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
    <div className="flex items-center justify-between"><span className="text-sm text-white/50">{label}</span><Icon className="h-4 w-4" style={{ color }} /></div>
    <p className="mt-2 text-2xl font-bold text-white">{value}</p>
  </div>
}
