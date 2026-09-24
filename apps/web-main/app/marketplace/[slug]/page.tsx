import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle2, CircleOff, Clock3, HardHat, MapPinned, ShieldCheck } from 'lucide-react'
import { HOME_UPGRADE_BY_SLUG, HOME_UPGRADE_PRODUCTS, formatUpgradeRange } from '@kealee/core-rules'
import { UpgradeConfigurator } from './UpgradeConfigurator'

type PageProps = { params: { slug: string } }

export function generateStaticParams() {
  return HOME_UPGRADE_PRODUCTS.map(product => ({ slug: product.slug }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const product = HOME_UPGRADE_BY_SLUG[params.slug]
  if (!product) return { title: 'Upgrade not found | Kealee' }
  return { title: `${product.name} | Kealee Marketplace`, description: product.description }
}

export default function UpgradeProductPage({ params }: PageProps) {
  const product = HOME_UPGRADE_BY_SLUG[params.slug]
  if (!product) notFound()
  return (
    <main className="min-h-screen bg-[#f7f5f1] text-slate-950">
      <section className="relative isolate min-h-[520px] overflow-hidden bg-[#10233e]">
        <Image src={product.image} alt={product.name} fill priority sizes="100vw" className="object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071526] via-[#10233e]/90 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
          <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm font-bold text-white/80 hover:text-white"><ArrowLeft className="h-4 w-4" /> All upgrades</Link>
          <div className="mt-14 max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-orange-300">Kealee Home & Property Upgrades</p><h1 className="mt-4 font-display text-4xl font-black leading-tight text-white sm:text-6xl">{product.name}</h1><p className="mt-5 text-xl font-semibold text-orange-100">{product.promise}</p><p className="mt-5 max-w-2xl text-base leading-7 text-slate-200">{product.description}</p></div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_430px] lg:px-10">
        <div>
          <div className="grid gap-4 sm:grid-cols-4">
            {[['Planning range', formatUpgradeRange(product.planningRange)], ['Typical build', `${product.typicalWeeks.min}–${product.typicalWeeks.max} weeks`], ['Permit likelihood', product.permitLikelihood], ['Disruption', product.disruption]].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4"><span className="text-xs text-slate-500">{label}</span><b className="mt-1 block capitalize text-sm text-slate-900">{value}</b></div>)}
          </div>

          {product.beforeImage && <div className="mt-10"><h2 className="text-2xl font-black">Visualize the transformation</h2><p className="mt-2 text-sm text-slate-600">Your purchased package uses the submitted property media. These images demonstrate the before-and-after experience, not your final design.</p><div className="mt-5 grid gap-4 sm:grid-cols-2">{[[product.beforeImage, 'Before'], [product.image, 'Design direction example']].map(([src, label]) => <figure key={label} className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="relative h-64"><Image src={src} alt={`${product.name} ${label}`} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" /></div><figcaption className="p-3 text-xs font-bold uppercase tracking-wider text-slate-500">{label}</figcaption></figure>)}</div></div>}

          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            <div><h2 className="text-xl font-black">Your starting package includes</h2><ul className="mt-5 space-y-3">{product.included.map(item => <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />{item}</li>)}</ul></div>
            <div><h2 className="text-xl font-black">Not included at this stage</h2><ul className="mt-5 space-y-3">{product.exclusions.map(item => <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600"><CircleOff className="mt-1 h-4 w-4 shrink-0 text-slate-400" />{item}</li>)}</ul></div>
          </div>

          <div className="mt-12 rounded-3xl border border-blue-200 bg-blue-50 p-7"><div className="flex items-start gap-4"><MapPinned className="mt-1 h-6 w-6 shrink-0 text-blue-700" /><div><h2 className="text-xl font-black text-blue-950">Zoning and permit path are included</h2><p className="mt-2 text-sm leading-6 text-blue-900">{product.permitNote} Your package identifies the available zoning code, relevant controls, expected approvals, source confidence, and items that require professional or field verification.</p></div></div></div>

          <div className="mt-10 rounded-3xl bg-white p-7"><h2 className="text-xl font-black">How this reaches construction</h2><div className="mt-6 grid gap-5 sm:grid-cols-3">{[[Clock3, 'Concept + basic estimate', 'Purchase the visual planning package and receive a planning-level cost range.'], [HardHat, 'Verify + detail', 'Confirm measurements and conditions, then produce required professional plans and a detailed estimate.'], [ShieldCheck, 'Match + protect', 'Compare qualified contractors and coordinate approved milestone payments.']].map(([Icon, title, body]) => { const C = Icon as typeof Clock3; return <div key={String(title)}><C className="h-5 w-5 text-[#e8724b]" /><h3 className="mt-3 text-sm font-bold">{String(title)}</h3><p className="mt-2 text-xs leading-5 text-slate-600">{String(body)}</p></div> })}</div></div>
        </div>
        <aside className="lg:-mt-32 lg:relative lg:z-10"><div className="lg:sticky lg:top-24"><UpgradeConfigurator product={product} /></div></aside>
      </section>
    </main>
  )
}
