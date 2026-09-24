import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F7F5F0]">
      <div
        className="pointer-events-none absolute -left-32 -top-44 h-[32rem] w-[32rem] rounded-full opacity-70 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(232,114,75,.2), transparent 68%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-52 -right-32 h-[36rem] w-[36rem] rounded-full opacity-70 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(42,191,191,.16), transparent 68%)' }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(circle, #1A2B4A 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <header className="relative flex items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/kealee-icon-512x512-transparent.png" alt="Kealee" width={36} height={36} className="h-9 w-9" priority />
        </Link>
        <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-600 backdrop-blur-sm">
          Owner Portal
        </span>
      </header>

      <div className="relative flex min-h-[calc(100vh-5rem)] items-start justify-center px-4 pb-12 pt-7 sm:items-center sm:pb-24 sm:pt-10">
        <div className="w-full max-w-[28rem]">{children}</div>
      </div>
    </div>
  )
}
