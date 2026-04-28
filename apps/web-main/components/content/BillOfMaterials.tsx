'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { BOMItem } from '@/lib/types'

interface Props {
  items: BOMItem[]
}

export function BillOfMaterials({ items }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const byCategory = items.reduce<Record<string, BOMItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  const grandTotal = items.reduce((s, i) => s + i.total, 0)

  function toggleCategory(cat: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  return (
    <div className="space-y-2">
      {Object.entries(byCategory).map(([category, catItems]) => {
        const catTotal = catItems.reduce((s, i) => s + i.total, 0)
        const open = expanded.has(category)
        return (
          <div key={category} className="rounded-xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100 transition text-left"
            >
              <div>
                <p className="text-sm font-bold text-slate-900">{category}</p>
                <p className="text-xs text-slate-500">{catItems.length} items</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-[#E8724B]">${catTotal.toLocaleString()}</p>
                {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>
            {open && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-5 py-2 text-xs text-slate-400 font-semibold">Item</th>
                      <th className="text-right px-3 py-2 text-xs text-slate-400 font-semibold">Qty</th>
                      <th className="text-right px-3 py-2 text-xs text-slate-400 font-semibold">Unit</th>
                      <th className="text-right px-3 py-2 text-xs text-slate-400 font-semibold">Unit Cost</th>
                      <th className="text-right px-5 py-2 text-xs text-slate-400 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catItems.map((item, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                        <td className="px-5 py-2.5 text-slate-800">{item.item}</td>
                        <td className="px-3 py-2.5 text-right text-slate-600">{item.quantity}</td>
                        <td className="px-3 py-2.5 text-right text-slate-600">{item.unit}</td>
                        <td className="px-3 py-2.5 text-right text-slate-600">${item.unitCost.toLocaleString()}</td>
                        <td className="px-5 py-2.5 text-right font-semibold text-slate-900">${item.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}

      <div className="flex items-center justify-between rounded-xl bg-slate-900 px-5 py-4 mt-4">
        <p className="text-sm font-bold text-white">Grand Total</p>
        <p className="text-xl font-black text-[#E8724B]">${grandTotal.toLocaleString()}</p>
      </div>
    </div>
  )
}
