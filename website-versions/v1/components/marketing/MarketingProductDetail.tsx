import Link from 'next/link'
import { ArrowRight, CheckCircle } from 'lucide-react'
import { WEB_MARKETING_PRODUCTS } from '@kealee/core-rules/pricing'
import type { Product } from '@/lib/products'

interface Props {
  product: Product
}

export function MarketingProductDetail({ product }: Props) {
  const def = WEB_MARKETING_PRODUCTS.find((p) => p.slug === product.slug)
  const schemaPrice =
    def && def.amountCents > 0 ? (def.amountCents / 100).toFixed(2) : undefined

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product.stripeEnvVar ?? product.slug,
    brand: {
      '@type': 'Brand',
      name: 'Kealee',
    },
    offers: schemaPrice
      ? {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: schemaPrice,
          url: `https://kealee.com/products/${product.slug}`,
        }
      : {
          '@type': 'Offer',
          priceCurrency: 'USD',
          description: 'Custom pricing — scoped during onboarding',
          url: `https://kealee.com/products/${product.slug}`,
        },
  }

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3 text-xs text-slate-500 sm:px-6">
          <Link href="/" className="hover:text-builder-orange">
            Home
          </Link>
          <span aria-hidden>/</span>
          <Link href="/products" className="hover:text-builder-orange">
            Products
          </Link>
          <span aria-hidden>/</span>
          <span className="font-medium text-navy">{product.name}</span>
        </div>
      </div>

      <section className="border-b border-slate-100 bg-gradient-to-br from-navy via-navy-light to-navy-dark px-4 py-14 text-white sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[2fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-teal-light">{product.label}</p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl">{product.name}</h1>
            <p className="mt-4 max-w-2xl text-lg text-white/80">{product.tagline}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={`/concept?product=${encodeURIComponent(product.slug)}`}
                className="inline-flex items-center gap-2 rounded-xl bg-builder-orange px-7 py-3 text-base font-semibold text-white hover:bg-builder-orange-dark"
              >
                Get Started <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-7 py-3 text-base font-semibold text-white hover:bg-white/5"
              >
                Back to catalog
              </Link>
            </div>
          </div>
          <aside className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Published rate</p>
            <p className="mt-3 font-display text-3xl font-bold text-white">{product.price}</p>
            <p className="mt-2 text-sm text-white/70">{product.priceNote}</p>
            {product.stripeEnvVar ? (
              <p className="mt-4 text-[11px] uppercase tracking-wide text-white/45">
                Stripe price env · {product.stripeEnvVar}
              </p>
            ) : null}
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[3fr_2fr]">
          <div>
            <h2 className="font-display text-2xl font-bold text-navy">Features</h2>
            <ul className="mt-6 space-y-4">
              {product.includes.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-slate-700">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <aside className="rounded-2xl border border-teal/25 bg-teal/5 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-teal-dark">Milestone Pay</p>
            <p className="mt-3 text-sm text-slate-700">
              Pair any SKU with Milestone Pay so releases stay tied to verified progress—not guesses or handshake agreements.
            </p>
            <Link href="/milestone-pay" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-builder-orange hover:text-builder-orange-dark">
              Learn how Milestone Pay works <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </aside>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-2xl font-bold text-navy">Delivery rhythm</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {product.steps.map((step) => (
              <div key={step.n} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-builder-orange text-sm font-bold text-white">
                    {step.n}
                  </span>
                  <h3 className="font-semibold text-navy">{step.title}</h3>
                </div>
                <p className="mt-3 text-sm text-slate-600">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-bold text-navy">Questions</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {product.faq.map((item) => (
            <div key={item.q} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-navy">{item.q}</p>
              <p className="mt-2 text-sm text-slate-600">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-navy px-4 py-16 text-center text-white sm:px-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <h2 className="font-display text-3xl font-bold">Ready to continue in Concept?</h2>
          <p className="text-white/75">
            Build your dossier once—permits, estimation, ops modules, and Milestone Pay attach only when you elect them.
          </p>
          <Link
            href={`/concept?product=${encodeURIComponent(product.slug)}`}
            className="inline-flex items-center gap-2 rounded-xl bg-builder-orange px-8 py-4 text-base font-semibold text-white hover:bg-builder-orange-dark"
          >
            Continue with this SKU <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  )
}
