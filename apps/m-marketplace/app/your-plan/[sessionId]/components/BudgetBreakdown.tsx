'use client'

interface BudgetLineItem {
  category: string
  lowEstimate: number
  midEstimate: number
  highEstimate: number
  percentage: number
}

interface BudgetBreakdownData {
  title: string
  totalLow: number
  totalMid: number
  totalHigh: number
  lineItems: BudgetLineItem[]
  notes: string
}

const COLORS = ['bg-indigo-500', 'bg-blue-500', 'bg-teal-500', 'bg-amber-500', 'bg-neutral-400']

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export function BudgetBreakdown({ data }: { data: BudgetBreakdownData }) {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-neutral-900">{data.title}</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Low Estimate</p>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(data.totalLow)}</p>
        </div>
        <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Mid Estimate</p>
          <p className="text-2xl font-bold text-indigo-700">{formatCurrency(data.totalMid)}</p>
        </div>
        <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100">
          <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">High Estimate</p>
          <p className="text-2xl font-bold text-purple-700">{formatCurrency(data.totalHigh)}</p>
        </div>
      </div>

      {/* Percentage bar */}
      <div className="flex rounded-full h-4 overflow-hidden">
        {data.lineItems.map((item, idx) => (
          <div
            key={item.category}
            className={`${COLORS[idx % COLORS.length]} transition-all`}
            style={{ width: `${item.percentage}%` }}
            title={`${item.category}: ${item.percentage}%`}
          />
        ))}
      </div>

      {/* Line items table */}
      <div className="bg-neutral-50 rounded-2xl border border-neutral-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="text-left py-3 px-4 font-bold text-neutral-500 text-xs uppercase tracking-wider">Category</th>
              <th className="text-right py-3 px-4 font-bold text-neutral-500 text-xs uppercase tracking-wider">%</th>
              <th className="text-right py-3 px-4 font-bold text-neutral-500 text-xs uppercase tracking-wider hidden sm:table-cell">Low</th>
              <th className="text-right py-3 px-4 font-bold text-neutral-500 text-xs uppercase tracking-wider">Mid</th>
              <th className="text-right py-3 px-4 font-bold text-neutral-500 text-xs uppercase tracking-wider hidden sm:table-cell">High</th>
            </tr>
          </thead>
          <tbody>
            {data.lineItems.map((item, idx) => (
              <tr key={item.category} className="border-b border-neutral-100 last:border-0">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${COLORS[idx % COLORS.length]}`} />
                    <span className="font-medium text-neutral-900">{item.category}</span>
                  </div>
                </td>
                <td className="text-right py-3 px-4 text-neutral-600">{item.percentage}%</td>
                <td className="text-right py-3 px-4 text-neutral-600 hidden sm:table-cell">{formatCurrency(item.lowEstimate)}</td>
                <td className="text-right py-3 px-4 font-medium text-neutral-900">{formatCurrency(item.midEstimate)}</td>
                <td className="text-right py-3 px-4 text-neutral-600 hidden sm:table-cell">{formatCurrency(item.highEstimate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-neutral-400 italic">{data.notes}</p>
    </section>
  )
}
