'use client'

import Link from 'next/link'
import { Boxes, FolderKanban } from 'lucide-react'

export default function DigitalTwinPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm sm:px-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600"><Boxes className="h-6 w-6" /></div>
        <h1 className="mt-5 font-display text-2xl font-bold text-slate-900">Digital twin data is not available yet</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">This workspace will show verified schedule, cost, permit, field, and sensor data after a digital twin is activated for this project. No sample project data is shown.</p>
        <Link href="/projects" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1A2B4A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#243b64]"><FolderKanban className="h-4 w-4" />Return to projects</Link>
      </div>
    </div>
  )
}
