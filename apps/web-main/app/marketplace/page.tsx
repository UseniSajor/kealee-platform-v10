import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Bath, Boxes, Building2, CheckCircle2, Dumbbell, Flower2, Home, ShieldCheck, Sparkles, ThermometerSun, Trees, Wrench } from 'lucide-react'
import { HOME_UPGRADE_PRODUCTS, formatUpgradeRange, type HomeUpgradeCollectionId } from '@kealee/core-rules'

export const metadata: Metadata = {
  title: 'Home & Property Upgrades | Kealee Marketplace',
  description: 'Visualize, price, plan, permit, and build high-impact property upgrades with one coordinated Kealee workflow.',
}

const COLLECTIONS: Record<HomeUpgradeCollectionId, { label: string; description: string; icon: typeof Home }> = {
  'exterior-transformation': { label: 'Exterior Transformation', description: 'Façade, entries, windows, lighting, and curb appeal.', icon: Home },
  'outdoor-living': { label: 'Outdoor Living', description: 'Decks, patios, pergolas, kitchens, fire, and lighting.', icon: Trees },
  'basement-bonus-rooms': { label: 'Basement & Bonus Rooms', description: 'Theaters, gyms, bars, offices, and guest spaces.', icon: Building2 },
  'bathroom-wellness': { label: 'Bathroom & Wellness', description: 'Spa bathrooms, heated floors, saunas, and recovery.', icon: Bath },
  'smart-climate-comfort': { label: 'Smart & Comfortable', description: 'HVAC zoning, mini-splits, controls, lighting, and security.', icon: ThermometerSun },
  'storage-organization': { label: 'Storage & Organization', description: 'Closets, pantries, mudrooms, laundry, and garages.', icon: Boxes },
  'specialty-rooms': { label: 'Specialty Rooms', description: 'Purpose-built offices, studios, bars, gyms, and hobby rooms.', icon: Dumbbell },
  landscaping: { label: 'Landscaping', description: 'Planting, irrigation, drainage, walls, water, and lighting.', icon: Flower2 },
  homecare: { label: 'Kealee HomeCare', description: 'Recurring maintenance observations and improvement planning.', icon: Wrench },
}

const STEPS = [
  ['1', 'Choose the outcome', 'Start with how you want the property to look, feel, or work.'],
  ['2', 'Share the property', 'Enter the address and add photos, video, a sketch, or documents when available.'],
  ['3', 'See and plan it', 'Receive visual concepts, zoning and permit findings, and a basic planning estimate.'],
  ['4', 'Verify the scope', 'Field conditions and measurements are confirmed before professional plans or a fixed proposal.'],
  ['5', 'Build with protection', 'Compare qualified contractors and manage approved milestones through Kealee.'],
] as const

export default function MarketplacePage() {
  const featured = HOME_UPGRADE_PRODUCTS.filter(product => product.featured)
  return (
    <main className="min-h-screen bg-[#f7f5f1] text-slate-950">
      <section className="relative isolate overflow-hidden bg-[#10233e]">
        <Image src="/media/service-photos/product-facade.jpg" alt="Completed exterior property transformation" fill priority sizes="100vw" className="object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071526] via-[#10233e]/95 to-[#10233e]/45" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:px-10 lg:py-28">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[.2em] text-orange-200 backdrop-blur"><Sparkles className="h-4 w-4" /> Kealee Home & Property Upgrades</p>
            <h1 className="font-display text-4xl font-black leading-[1.05] text-white sm:text-6xl">Upgrade the property you already own.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">Choose a transformation. Kealee coordinates visualization, planning estimates, zoning, permits, professional services, contractor matching, and protected project delivery.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="#featured-upgrades" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e8724b] px-6 py-3.5 font-bold text-white shadow-lg transition hover:bg-[#d9603c]">Explore upgrades <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/services" className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 font-bold text-white backdrop-blur transition hover:bg-white/20">Plan a custom project</Link>
            </div>
          </div>
          <div className="self-end rounded-3xl border border-white/15 bg-white/10 p-6 text-white backdrop-blur-md">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-200">How Kealee sells it</p>
            <p className="mt-3 text-2xl font-black">See it. Price it. Plan it. Build it.</p>
            <ul className="mt-5 space-y-3 text-sm text-slate-100">
              {['One complete planning package—not confusing service tiers', 'Basic estimate included with the concept', 'Zoning and permit path included', 'Fixed proposal only after verification'].map(item => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />{item}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-slate-200 md:grid-cols-3 lg:grid-cols-9">
          {Object.entries(COLLECTIONS).map(([id, collection]) => {
            const Icon = collection.icon
            return <Link key={id} href={`#${id}`} className="group bg-white px-4 py-5 text-center transition hover:bg-orange-50"><Icon className="mx-auto h-5 w-5 text-slate-500 group-hover:text-[#e8724b]" /><span className="mt-2 block text-xs font-bold text-slate-700">{collection.label}</span></Link>
          })}
        </div>
      </section>

      <section id="featured-upgrades" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
        <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#c65331]">Best places to start</p><h2 className="mt-3 font-display text-3xl font-black sm:text-4xl">High-impact upgrades made understandable</h2><p className="mt-4 text-base leading-7 text-slate-600">Prices remain planning ranges until Kealee reviews the address, desired scope, available media, and existing conditions.</p></div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featured.map(product => (
            <article key={product.slug} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <Link href={`/marketplace/${product.slug}`} className="block">
                <div className="relative h-56 overflow-hidden"><Image src={product.image} alt={product.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" /><p className="absolute bottom-4 left-5 right-5 text-xl font-black text-white">{product.name}</p></div>
                <div className="p-6"><p className="min-h-12 text-sm leading-6 text-slate-600">{product.promise}</p><div className="mt-5 grid grid-cols-3 gap-2 border-y border-slate-100 py-4 text-xs"><div><span className="block text-slate-400">Planning range</span><b className="mt-1 block text-slate-900">{formatUpgradeRange(product.planningRange)}</b></div><div><span className="block text-slate-400">Typical build</span><b className="mt-1 block text-slate-900">{product.typicalWeeks.min}–{product.typicalWeeks.max} weeks</b></div><div><span className="block text-slate-400">Permit</span><b className="mt-1 block capitalize text-slate-900">{product.permitLikelihood}</b></div></div><span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#c65331]">Configure this upgrade <ArrowRight className="h-4 w-4" /></span></div>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-16"><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#c65331]">All collections</p><h2 className="mt-3 font-display text-3xl font-black">Find the improvement that fits your life</h2></div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {HOME_UPGRADE_PRODUCTS.map(product => { const collection = COLLECTIONS[product.collectionId]; const Icon = collection.icon; return <article id={product.collectionId} key={product.slug} className="scroll-mt-24 rounded-2xl border border-slate-200 p-6 transition hover:border-orange-300 hover:bg-orange-50/40"><div className="flex items-start justify-between gap-4"><div className="rounded-xl bg-slate-100 p-3"><Icon className="h-5 w-5 text-slate-700" /></div><span className="text-xs font-semibold text-slate-500">{formatUpgradeRange(product.planningRange)}</span></div><p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">{collection.label}</p><h3 className="mt-1 text-xl font-black">{product.name}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{product.description}</p><Link href={`/marketplace/${product.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#c65331]">View the transformation <ArrowRight className="h-4 w-4" /></Link></article> })}
        </div>
      </div></section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10"><div className="rounded-[2rem] bg-[#10233e] p-8 text-white sm:p-12">
        <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-orange-300">One coordinated journey</p><h2 className="mt-3 font-display text-3xl font-black">From an emotional idea to a controlled construction project</h2></div>
        <div className="mt-10 grid gap-6 md:grid-cols-5">{STEPS.map(([number, title, body]) => <div key={number}><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8724b] text-sm font-black">{number}</span><h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-300">{body}</p></div>)}</div>
        <div className="mt-10 flex flex-col gap-3 border-t border-white/15 pt-8 sm:flex-row"><Link href="#featured-upgrades" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-[#10233e]">Choose an upgrade <ArrowRight className="h-4 w-4" /></Link><Link href="/products/contractor_match" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-6 py-3 font-bold text-white"><ShieldCheck className="h-4 w-4" /> Contractor matching & milestone protection</Link></div>
      </div></section>
    </main>
  )
}
