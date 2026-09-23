import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, FileInput, ShieldCheck } from 'lucide-react'
import {
  PUBLIC_PRODUCT_CATALOG,
  formatCatalogPrice,
  getPublicCatalogProduct,
} from '@kealee/core-rules'

export function generateStaticParams() {
  return PUBLIC_PRODUCT_CATALOG.map(product => ({ slug: product.key }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = getPublicCatalogProduct(slug)
  if (!product) return { title: 'Product not found' }
  return { title: `${product.name} — Kealee`, description: product.shortDescription }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = getPublicCatalogProduct(slug)
  if (!product) notFound()

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <Link href="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
            <ArrowLeft className="h-4 w-4" /> All services
          </Link>
        </div>
      </div>

      <section className="bg-gradient-to-br from-[#1A2B4A] via-[#10233f] to-[#164b50] px-6 py-16 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_340px] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">{product.preliminary ? 'Preliminary planning service' : 'Professional project service'}</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">{product.name}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-300">{product.shortDescription}</p>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-white">{product.outcome}</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Project fee</p>
            <p className="mt-2 text-3xl font-black">{formatCatalogPrice(product)}</p>
            <p className="mt-2 text-sm text-slate-300">Exact price is confirmed after intake and before payment.</p>
            {product.deliveryDays && <p className="mt-4 flex items-center gap-2 text-sm text-slate-200"><Clock3 className="h-4 w-4" /> {product.deliveryDays}</p>}
            <Link href={product.startHref} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#E8724B] px-5 py-3 font-bold text-white hover:bg-[#D45C33]">
              Start this service <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">What you receive</h2>
            {product.includedEstimate && (
              <div className="mt-5 rounded-2xl border border-teal-200 bg-teal-50 p-5">
                <p className="font-bold text-teal-950">{product.includedEstimate.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-teal-900">{product.includedEstimate.description}</p>
              </div>
            )}
            <ul className="mt-6 space-y-3">
              {product.includes.map(item => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" /> {item}
                </li>
              ))}
            </ul>
          </article>

          <div className="space-y-8">
            <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-950"><FileInput className="h-5 w-5 text-teal-600" /> What you provide</h2>
              <ul className="mt-5 space-y-3">
                {product.customerProvides.map(item => <li key={item} className="text-sm text-slate-700">• {item}</li>)}
              </ul>
            </article>
            <article className="rounded-3xl border border-amber-200 bg-amber-50 p-7">
              <h2 className="flex items-center gap-2 text-xl font-bold text-amber-950"><ShieldCheck className="h-5 w-5" /> Professional boundary</h2>
              <ul className="mt-5 space-y-3">
                {product.limitations.map(item => <li key={item} className="text-sm leading-relaxed text-amber-900">• {item}</li>)}
              </ul>
            </article>
          </div>
        </div>
      </section>
    </main>
  )
}
