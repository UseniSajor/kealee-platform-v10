'use client'

import Link from 'next/link'
import { Gavel, Megaphone } from 'lucide-react'

export default function SubmitBidPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm sm:px-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><Gavel className="h-6 w-6" /></div>
        <h1 className="mt-5 font-display text-2xl font-bold text-slate-900">Select a real project before preparing a bid</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">Bid forms are created from the project owner’s verified scope, documents, deadline, and invitation. Sample project information is never inserted into a bid.</p>
        <Link href="/leads" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1A2B4A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#243b64]"><Megaphone className="h-4 w-4" />View available leads</Link>
      </div>
    </div>
  )
}
