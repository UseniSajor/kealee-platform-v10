'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Map,
  FlaskConical,
  Landmark,
  LayoutGrid,
  FileBarChart,
  LogOut,
  Building,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const NAV_ITEMS = [
  { href: '/pipeline', label: 'Land Pipeline', icon: Map },
  { href: '/feasibility', label: 'Feasibility', icon: FlaskConical },
  { href: '/capital', label: 'Capital', icon: Landmark },
  { href: '/portfolio', label: 'Portfolio', icon: LayoutGrid },
  { href: '/reports', label: 'Reports', icon: FileBarChart },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F7FAFC' }}>
      <aside className="hidden w-64 flex-shrink-0 border-r border-gray-200 lg:block" style={{ backgroundColor: '#1A2B4A' }}>
        <div className="flex h-16 items-center border-b border-white/10 px-6">
          <Link href="/pipeline" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: '#E8793A' }}>
              <Building className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white font-display">Kealee</span>
            <span className="rounded px-1.5 py-0.5 text-xs font-medium" style={{ backgroundColor: 'rgba(42, 191, 191, 0.2)', color: '#2ABFBF' }}>Dev</span>
          </Link>
        </div>
        <nav className="space-y-1 p-4">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? 'text-white' : 'text-white/60 hover:bg-white/10 hover:text-white/90'
                }`}
                style={active ? { backgroundColor: 'rgba(42, 191, 191, 0.15)', color: '#2ABFBF' } : undefined}>
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 w-64 border-t border-white/10 p-4">
          <div className="mb-3 px-3 py-2">
            <p className="text-xs text-white/40">Powered by</p>
            <p className="text-sm font-medium" style={{ color: '#2ABFBF' }}>KeaBot Developer</p>
          </div>
          <button onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white/90">
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
          <Link href="/pipeline" className="text-lg font-bold font-display" style={{ color: '#1A2B4A' }}>Kealee Dev</Link>
          <button onClick={handleSignOut} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
            <LogOut className="h-5 w-5" />
          </button>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-gray-200 bg-white px-4 py-2 lg:hidden">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
                  active ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={active ? { backgroundColor: '#1A2B4A', color: '#2ABFBF' } : undefined}>
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
