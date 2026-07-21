import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Palette, BadgeDollarSign, ShieldCheck } from 'lucide-react'
import { getRevenueProduct } from '@/lib/revenue-product-catalog'

export const metadata: Metadata = {
  title: 'Plan My Project — Kealee',
  description: 'Answer five quick questions and get a recommended starting point for your home project.',
}

const recommended = getRevenueProduct('project-launch-package')!

export default function GetStartedPage() {
  return <main className="min-h-screen bg-slate-50 px-4 py-12 sm:py-16">
    <div className="mx-auto max-w-3xl">
      <header className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Plan my project</p>
        <h1 className="mt-3 text-3xl font-black text-slate-900 sm:text-5xl">Tell us where you are. We’ll recommend one clear next step.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">You do not need construction knowledge. These five questions help us avoid asking you to buy more than you need.</p>
      </header>

      <form action="/intake/whole_home_concept" method="get" className="mt-10 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div><label htmlFor="goal" className="block text-sm font-bold text-slate-900">1. What are you hoping to change?</label><textarea id="goal" name="goal" required rows={3} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="A brighter kitchen, more living space, an addition…" /></div>
        <div><label htmlFor="address" className="block text-sm font-bold text-slate-900">2. Where is the property?</label><input id="address" name="address" required autoComplete="street-address" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Street address, city, state, ZIP" /></div>
        <div><label htmlFor="stage" className="block text-sm font-bold text-slate-900">3. What stage are you in?</label><select id="stage" name="stage" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"><option>Just exploring ideas</option><option>I know what I want</option><option>I have plans or estimates</option><option>I am preparing to hire</option></select></div>
        <div><label htmlFor="help" className="block text-sm font-bold text-slate-900">4. What would help most right now?</label><select id="help" name="help" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"><option>See a design direction</option><option>Understand likely cost</option><option>Check permits and approvals</option><option>Put all three together</option></select></div>
        <div><label htmlFor="timing" className="block text-sm font-bold text-slate-900">5. When would you like to move forward?</label><select id="timing" name="timing" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"><option>Within 1–3 months</option><option>Within 3–6 months</option><option>Within 6–12 months</option><option>I am flexible</option></select></div>
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-4 text-sm font-bold text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">Continue to my project intake <ArrowRight className="h-4 w-4" /></button>
      </form>

      <section aria-labelledby="recommended-heading" className="mt-8 rounded-2xl border border-teal-200 bg-teal-50 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-teal-800">Recommended when you need the full picture</p>
        <h2 id="recommended-heading" className="mt-2 text-xl font-bold text-slate-900">{recommended.name}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">A practical starting package when design direction, likely cost, and permit questions affect one another. ${(recommended.priceCents / 100).toLocaleString()} one-time; preliminary planning only, not stamped drawings or permit approval.</p>
      </section>

      <section aria-labelledby="other-starts" className="mt-10">
        <h2 id="other-starts" className="text-center text-sm font-bold text-slate-900">Or start with one question</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Palette, label: 'Explore a concept', href: '/concept' },
            { icon: BadgeDollarSign, label: 'Understand cost', href: '/estimate' },
            { icon: ShieldCheck, label: 'Check permits', href: '/permits' },
          ].map(item => <Link key={item.href} href={item.href} className="rounded-xl border border-slate-200 bg-white p-5 text-center font-semibold text-slate-800 shadow-sm hover:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500"><item.icon className="mx-auto mb-3 h-5 w-5 text-orange-600" />{item.label}</Link>)}
        </div>
      </section>
    </div>
  </main>
}

