import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Internal Access — Kealee',
  description: 'Kealee internal team access',
  robots: { index: false, follow: false },
}

export default function InternalAccessPage() {
  const commandCenterUrl = process.env.NEXT_PUBLIC_COMMAND_CENTER_URL  ?? '#'
  const adminConsoleUrl  = process.env.NEXT_PUBLIC_ADMIN_CONSOLE_URL   ?? '#'

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center py-16 px-4" style={{ background: '#0F1110' }}>
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl"
        style={{
          background: 'rgba(255,255,255,.04)',
          border: '1px solid rgba(255,255,255,.1)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="p-8 text-center">
          <div
            className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: 'rgba(200,82,26,.15)', border: '1px solid rgba(200,82,26,.25)' }}
          >
            <Shield className="h-6 w-6" style={{ color: '#C8521A' }} />
          </div>

          <h1 className="text-xl font-bold font-display" style={{ color: '#ffffff' }}>
            Kealee Internal Access
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,.4)' }}>
            Team access only. Not a public-facing page.
          </p>

          <div className="mt-8 space-y-3">
            <a
              href={commandCenterUrl}
              className="flex w-full items-center justify-between rounded-xl px-5 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)' }}
            >
              <span>Command Center</span>
              <ArrowRight className="h-4 w-4" style={{ color: 'rgba(255,255,255,.4)' }} />
            </a>

            <a
              href={adminConsoleUrl}
              className="flex w-full items-center justify-between rounded-xl px-5 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)' }}
            >
              <span>OS Admin Console</span>
              <ArrowRight className="h-4 w-4" style={{ color: 'rgba(255,255,255,.4)' }} />
            </a>
          </div>

          <p className="mt-8 text-xs" style={{ color: 'rgba(255,255,255,.2)' }}>
            <Link href="/" className="hover:underline" style={{ color: 'rgba(255,255,255,.3)' }}>
              ← Back to Kealee
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
