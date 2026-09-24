import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #1A2B4A 0%, #0F1D34 60%, #1A0A2A 100%)' }}
    >
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }}
      />
      <div className="relative flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/kealee-icon-512x512-transparent.png" alt="Kealee" width={32} height={32} className="h-8 w-8" priority />
        </Link>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{ backgroundColor: 'rgba(128,90,213,0.2)', color: '#805AD5' }}
        >
          Developer Portal
        </span>
      </div>
      <div className="relative flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
