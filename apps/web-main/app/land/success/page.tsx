import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, ArrowRight, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Land Analysis Started | Kealee',
}

export default function LandSuccessPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0F1A2E] px-4 py-20">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1A2B4A] p-10 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#2ABFBF]/20">
          <CheckCircle2 className="h-8 w-8 text-[#2ABFBF]" />
        </div>
        <h1 className="font-display text-2xl font-bold text-white">Your analysis is started</h1>
        <p className="mt-3 text-white/60">
          We&apos;re reviewing your parcel data, zoning, and buildability. You&apos;ll receive your
          land analysis report via email within 24–48 hours.
        </p>

        <div className="mt-6 rounded-xl border border-white/10 bg-[#0F1A2E] p-4 text-left">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-[#2ABFBF]" />
            <span className="text-sm font-medium text-white">What happens next</span>
          </div>
          <ol className="mt-3 space-y-2 pl-7 text-sm text-white/60">
            <li>1. We verify your parcel and jurisdiction data</li>
            <li>2. Zoning and overlay review is completed</li>
            <li>3. Buildability and cost estimate generated</li>
            <li>4. Report delivered with your recommended next step</li>
          </ol>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/portal"
            className="flex items-center justify-center gap-2 rounded-lg bg-[#E8793A] py-3 font-semibold text-white hover:opacity-90"
          >
            View your portal <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/"
            className="text-sm text-white/40 hover:text-white/60"
          >
            Return home
          </Link>
        </div>
      </div>
    </main>
  )
}
