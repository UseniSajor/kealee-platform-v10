import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { HOME_UPGRADE_PRODUCTS, formatUpgradeRange } from '@kealee/core-rules'

export function HomeUpgradesSection() {
  const products = HOME_UPGRADE_PRODUCTS.filter(product => product.featured).slice(0, 3)
  return (
    <section className="bg-[#f7f5f1] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#c65331]">Kealee Marketplace</p><h2 className="mt-3 font-display text-3xl font-black text-slate-950 sm:text-4xl">Upgrade the property you already own.</h2><p className="mt-4 max-w-xl text-base leading-7 text-slate-600">Shop visual transformations—not construction trades. Choose the result you want, then Kealee coordinates the concept, planning range, zoning, permits, contractor path, and protected delivery.</p><ul className="mt-6 space-y-2 text-sm text-slate-700">{['Before-and-after visualization', 'Basic planning estimate included', 'One package with optional add-ons'].map(item => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />{item}</li>)}</ul><Link href="/marketplace" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#10233e] px-5 py-3 font-bold text-white">Explore property upgrades <ArrowRight className="h-4 w-4" /></Link></div>
          <div className="grid gap-4 sm:grid-cols-3">{products.map(product => <Link key={product.slug} href={`/marketplace/${product.slug}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="relative h-40"><Image src={product.image} alt={product.name} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" /></div><div className="p-4"><h3 className="text-sm font-black text-slate-900">{product.shortName}</h3><p className="mt-2 text-xs text-slate-500">Planning range</p><p className="text-sm font-bold text-[#c65331]">{formatUpgradeRange(product.planningRange)}</p></div></Link>)}</div>
        </div>
      </div>
    </section>
  )
}
