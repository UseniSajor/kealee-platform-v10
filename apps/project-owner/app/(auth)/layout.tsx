import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #1A2B4A 0%, #0F1D34 60%, #1A3B3B 100%)' }}
    >
      {/* Subtle dot-grid texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }}
      />

      {/* Top bar */}
      <div className="relative flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: '#E8793A' }}
          >
            <span className="text-sm font-bold text-white font-display">K</span>
          </div>
          <span className="text-lg font-bold text-white font-display">Kealee</span>
        </Link>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{ backgroundColor: 'rgba(42,191,191,0.15)', color: '#2ABFBF' }}
        >
          Owner Portal
        </span>
      </div>

      <div className="relative flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
