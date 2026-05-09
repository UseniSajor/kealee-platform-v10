'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useMemo, useState } from 'react'

export interface CatalogCard {
  slug: string
  name: string
  tagline: string
  price: string
  bucket: string
  imageUrl: string
}

const FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pm', label: 'PM' },
  { id: 'architecture', label: 'Architecture SKUs' },
  { id: 'architectural', label: 'Design partners' },
  { id: 'owner', label: 'Owner subs' },
  { id: 'permit', label: 'Permit SKUs' },
  { id: 'permits', label: 'Permit legacy' },
  { id: 'ops', label: 'Ops' },
  { id: 'estimation', label: 'Estimation' },
  { id: 'ai-design', label: 'AI Design' },
  { id: 'construction', label: 'Construction' },
  { id: 'specialty', label: 'Specialty' },
]

interface Props {
  items: CatalogCard[]
}

export function ProductsCatalogFilter({ items }: Props) {
  const [filter, setFilter] = useState('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return items
    return items.filter((item) => item.bucket === filter)
  }, [filter, items])

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-wrap gap-2">
        {FILTERS.map((chip) => {
          const active = chip.id === filter
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilter(chip.id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                active ? 'bg-navy text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-builder-orange'
              }`}
            >
              {chip.label}
            </button>
          )
        })}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((product) => (
          <Link
            key={product.slug}
            href={`/products/${product.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="relative h-44 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.imageUrl} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
              <span className="absolute bottom-3 left-3 rounded-full bg-builder-orange px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                {product.bucket}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-display text-lg font-bold text-navy">{product.name}</h3>
              <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-600">{product.tagline}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-builder-orange">{product.price}</span>
                <span className="flex items-center gap-1 text-sm font-semibold text-builder-orange transition group-hover:gap-2">
                  View <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-slate-500">No products match this filter.</p>
      ) : null}
    </div>
  )
}
