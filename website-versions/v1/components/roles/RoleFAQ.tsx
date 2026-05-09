'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

interface RoleFAQProps {
  items: FAQItem[]
  headline?: string
}

export function RoleFAQ({ items, headline = 'Frequently Asked Questions' }: RoleFAQProps) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="py-20 border-t border-gray-100">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: 'rgba(26,43,74,0.05)', color: '#1A2B4A' }}
          >
            FAQ
          </span>
          <h2 className="mt-3 text-2xl font-bold font-display sm:text-3xl" style={{ color: '#1A2B4A' }}>
            {headline}
          </h2>
        </div>

        <div className="space-y-3">
          {items.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={i} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50"
                >
                  <span className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>
                    {item.question}
                  </span>
                  {isOpen
                    ? <Minus className="h-4 w-4 shrink-0 text-gray-400" />
                    : <Plus className="h-4 w-4 shrink-0 text-gray-400" />
                  }
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-sm leading-relaxed text-gray-600">
                    {item.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
