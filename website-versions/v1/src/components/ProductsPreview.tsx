import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getMergedCatalogProducts } from '@/lib/products'

export function ProductsPreview() {
  const featured = [...getMergedCatalogProducts()]
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .slice(0, 6)

  return (
    <section className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-builder-orange">Products</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-navy sm:text-4xl">Featured SKUs</h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-600">
              PM packages, permits, estimation, ops modules, and owner plans — priced from the Kealee catalog.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-xl bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-light"
          >
            Browse catalog <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featured.map((product) => (
            <Link
              key={product.slug}
              href={`/products/${product.slug}`}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{product.label}</p>
              <h3 className="mt-3 font-display text-xl font-semibold text-navy">{product.name}</h3>
              <p className="mt-2 flex-1 text-sm text-slate-600">{product.tagline}</p>
              <div className="mt-6 flex items-center justify-between text-sm font-semibold text-builder-orange">
                <span>{product.price}</span>
                <span className="flex items-center gap-1">
                  Details <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
