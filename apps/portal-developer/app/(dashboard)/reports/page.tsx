'use client'

import Link from 'next/link'
import { FileBarChart, LayoutGrid } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm sm:px-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><FileBarChart className="h-6 w-6" /></div>
        <h1 className="mt-5 font-display text-2xl font-bold text-slate-900">No reports have been generated</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">Verified portfolio analytics and downloadable reports will appear here after your real project data is connected. Kealee does not display sample financial or performance figures as account data.</p>
        <Link href="/portfolio" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1E1B4B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#312e81]"><LayoutGrid className="h-4 w-4" />View portfolio</Link>
      </div>
    </div>
  )
}
