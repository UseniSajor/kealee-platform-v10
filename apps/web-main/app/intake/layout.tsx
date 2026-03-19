import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Start Your Project | Kealee',
  description: 'Begin your construction or design project with Kealee. Select your project type and complete a quick intake to get matched with the right team.',
}

export default function IntakeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7FAFC' }}>
      {/* Minimal intake header */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ backgroundColor: '#E8793A' }}
            >
              <span className="text-xs font-bold text-white font-display">K</span>
            </div>
            <span className="font-bold" style={{ color: '#1A2B4A' }}>Kealee</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/pricing" className="text-gray-500 hover:text-gray-700">Pricing</Link>
            <Link
              href="/portal"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1A2B4A' }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {children}
      </main>
    </div>
  )
}
