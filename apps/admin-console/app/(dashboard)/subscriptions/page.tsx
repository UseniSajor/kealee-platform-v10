'use client'

import { useState } from 'react'
import { CreditCard, DollarSign, TrendingUp, Users, Search, MoreHorizontal, ArrowUpRight, ArrowDownRight } from 'lucide-react'

const SUBSCRIPTIONS = [
  { id: '1', customer: 'Jennifer Adams', email: 'jennifer@email.com', plan: 'PM Package B', amount: 1499, interval: 'monthly', status: 'active', started: '2025-11-15', nextBilling: '2026-04-15' },
  { id: '2', customer: 'Summit Construction', email: 'billing@summitgc.com', plan: 'Contractor Pro', amount: 299, interval: 'monthly', status: 'active', started: '2025-08-20', nextBilling: '2026-04-20' },
  { id: '3', customer: 'Greenfield Capital', email: 'finance@greenfield.com', plan: 'PM Package D', amount: 4500, interval: 'monthly', status: 'active', started: '2025-06-01', nextBilling: '2026-04-01' },
  { id: '4', customer: 'Lisa Park', email: 'lisa@email.com', plan: 'PM Package A', amount: 299, interval: 'monthly', status: 'active', started: '2026-01-05', nextBilling: '2026-04-05' },
  { id: '5', customer: 'Apex Builders', email: 'billing@apexbuilders.com', plan: 'Contractor Pro', amount: 299, interval: 'monthly', status: 'past_due', started: '2025-04-20', nextBilling: '2026-03-20' },
  { id: '6', customer: 'David Miller', email: 'david@email.com', plan: 'PM Package A', amount: 299, interval: 'monthly', status: 'canceled', started: '2025-09-10', nextBilling: 'N/A' },
]

const MRR_HISTORY = [
  { month: 'Oct', mrr: 32500 },
  { month: 'Nov', mrr: 35200 },
  { month: 'Dec', mrr: 38900 },
  { month: 'Jan', mrr: 42100 },
  { month: 'Feb', mrr: 45600 },
  { month: 'Mar', mrr: 48750 },
]

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  past_due: 'bg-red-100 text-red-700',
  canceled: 'bg-gray-100 text-gray-600',
  trialing: 'bg-blue-100 text-blue-700',
}

export default function SubscriptionsPage() {
  const [search, setSearch] = useState('')

  const filtered = SUBSCRIPTIONS.filter(s => s.customer.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()))
  const activeSubs = SUBSCRIPTIONS.filter(s => s.status === 'active')
  const mrr = activeSubs.reduce((s, sub) => s + sub.amount, 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Subscriptions</h1>
        <p className="mt-1 text-sm text-gray-600">Manage customer subscriptions and billing</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(56, 161, 105, 0.1)' }}><DollarSign className="h-5 w-5" style={{ color: '#38A169' }} /></div>
            <div><p className="text-xs text-gray-500">MRR</p><p className="text-xl font-bold" style={{ color: '#1A2B4A' }}>${mrr.toLocaleString()}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(42, 191, 191, 0.1)' }}><Users className="h-5 w-5" style={{ color: '#2ABFBF' }} /></div>
            <div><p className="text-xs text-gray-500">Active Subscriptions</p><p className="text-xl font-bold" style={{ color: '#1A2B4A' }}>{activeSubs.length}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(56, 161, 105, 0.1)' }}><TrendingUp className="h-5 w-5" style={{ color: '#38A169' }} /></div>
            <div><p className="text-xs text-gray-500">MRR Growth</p>
              <p className="flex items-center gap-1 text-xl font-bold" style={{ color: '#38A169' }}><ArrowUpRight className="h-4 w-4" />6.9%</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(232, 121, 58, 0.1)' }}><CreditCard className="h-5 w-5" style={{ color: '#E8793A' }} /></div>
            <div><p className="text-xs text-gray-500">Past Due</p><p className="text-xl font-bold text-red-600">{SUBSCRIPTIONS.filter(s => s.status === 'past_due').length}</p></div>
          </div>
        </div>
      </div>

      {/* MRR chart simplified */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="font-display mb-4 text-sm font-semibold" style={{ color: '#1A2B4A' }}>MRR Trend</h2>
        <div className="flex items-end gap-3 h-32">
          {MRR_HISTORY.map((m) => (
            <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t" style={{ height: `${(m.mrr / 50000) * 100}%`, backgroundColor: '#2ABFBF' }} />
              <span className="text-xs text-gray-500">{m.month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search subscriptions..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100" style={{ backgroundColor: '#F7FAFC' }}>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Plan</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Next Billing</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((sub) => (
              <tr key={sub.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium" style={{ color: '#1A2B4A' }}>{sub.customer}</p>
                  <p className="text-xs text-gray-500">{sub.email}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{sub.plan}</td>
                <td className="px-4 py-3 text-right text-sm font-medium" style={{ color: '#1A2B4A' }}>${sub.amount.toLocaleString()}/mo</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[sub.status]}`}>{sub.status.replace('_', ' ')}</span></td>
                <td className="px-4 py-3 text-sm text-gray-500">{sub.nextBilling}</td>
                <td className="px-4 py-3 text-center">
                  <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><MoreHorizontal className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
