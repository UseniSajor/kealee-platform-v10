import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import {
  PLATFORM_PRICING,
  PUBLIC_CATALOG_CATEGORIES,
  PUBLIC_PRODUCT_CATALOG,
  formatCatalogPrice,
  formatPriceFromCents,
} from '@kealee/core-rules'

export const metadata: Metadata = {
  title: 'Price Reference — Kealee',
  description: 'Reference pricing for Kealee project services, contractor marketplace access, and developer feasibility.',
}

const display = (cents: number) => cents === 0 ? 'Included / no fee' : formatPriceFromCents(cents).replace('.00', '')

const ROLE_PRICES = [
  { audience: 'Homeowner', service: 'Project Clarity Review', price: 'Free', unit: 'project entry review', href: '/products/home-project-readiness-review' },
  { audience: 'Homeowner', service: 'Project Launch Package', price: display(PLATFORM_PRICING.homeowner.projectLaunchCents), unit: 'one time', href: '/products/project-launch-package' },
  { audience: 'Contractor', service: 'Marketplace Starter', price: display(PLATFORM_PRICING.contractor.marketplaceMonthlyCents.starter), unit: 'per month', href: '/contractor/register' },
  { audience: 'Contractor', service: 'Marketplace Growth', price: display(PLATFORM_PRICING.contractor.marketplaceMonthlyCents.growth), unit: 'per month', href: '/contractor/register' },
  { audience: 'Contractor', service: 'Marketplace Pro', price: display(PLATFORM_PRICING.contractor.marketplaceMonthlyCents.pro), unit: 'per month', href: '/contact' },
  { audience: 'Contractor', service: 'Estimate and Permit Package', price: display(PLATFORM_PRICING.contractor.estimatePermitPackageCents), unit: 'per client project', href: '/products/contractor-estimate-permit-package' },
  { audience: 'Developer', service: 'Feasibility Express', price: display(PLATFORM_PRICING.developer.feasibilityExpressCents), unit: 'per site', href: '/products/developer-feasibility-express' },
] as const

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white px-4 py-16 text-center sm:py-20">
        <div className="mx-auto max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">Price reference</span>
          <h1 className="mt-3 font-display text-4xl font-black text-slate-950 sm:text-5xl">Current Kealee pricing</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600">
            A plain reference list for comparing services. For a guided homeowner, contractor, or developer path,
            use the products page.
          </p>
          <Link href="/products" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-bold text-white hover:bg-orange-700">
            Find my product path <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="font-display text-2xl font-bold text-slate-950">Role-based platform products</h2>
          <p className="mt-2 text-sm text-slate-600">Subscriptions and per-project products are separate purchases.</p>
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {ROLE_PRICES.map((item, index) => (
              <Link key={`${item.audience}-${item.service}`} href={item.href} className={`grid gap-2 px-5 py-4 transition-colors hover:bg-slate-50 sm:grid-cols-[110px_1fr_auto] sm:items-center ${index ? 'border-t border-slate-100' : ''}`}>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{item.audience}</span>
                <span className="text-sm font-semibold text-slate-900">{item.service}</span>
                <span className="text-sm font-bold text-orange-600">{item.price} <span className="font-normal text-slate-400">{item.unit}</span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="font-display text-2xl font-bold text-slate-950">Public service price list</h2>
          <p className="mt-2 text-sm text-slate-600">Project types are intake choices. Pricing is organized by the outcome Kealee delivers.</p>
          <div className="mt-8 space-y-8">
            {PUBLIC_CATALOG_CATEGORIES.map(category => (
              <div key={category.id}>
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">{category.label}</h3>
                <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
                  {PUBLIC_PRODUCT_CATALOG.filter(product => product.categoryId === category.id).map((product, index) => (
                    <Link key={product.key} href={product.href} className={`grid gap-2 px-5 py-4 transition-colors hover:bg-slate-50 sm:grid-cols-[1fr_auto_140px] sm:items-center ${index ? 'border-t border-slate-100' : ''}`}>
                      <span>
                        <span className="block text-sm font-semibold text-slate-900">{product.name}</span>
                        <span className="mt-1 block text-xs text-slate-500">{product.shortDescription}</span>
                      </span>
                      <span className="text-sm font-bold text-orange-600">{formatCatalogPrice(product)}</span>
                      <span className="text-xs text-slate-400 sm:text-right">{product.deliveryDays ?? 'Scoped after intake'}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4 text-center text-xs leading-relaxed text-slate-500 sm:px-6">
          <p>Checkout shows the binding Kealee service amount before payment. Agency fees, surveys, engineering, architecture, taxes, and other third-party costs are separate unless expressly included.</p>
          <p className="mt-2">Preliminary feasibility and concept outputs are not for construction and are subject to licensed professional review.</p>
        </div>
      </section>
    </main>
  )
}
