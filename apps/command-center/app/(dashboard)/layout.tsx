'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Boxes,
  Radio,
  Bot,
  Plug,
  BarChart3,
  LogOut,
  Radar,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/twins', label: 'Digital Twins', icon: Boxes },
  { href: '/events', label: 'Events', icon: Radio },
  { href: '/bots', label: 'Bots', icon: Bot },
  { href: '/integrations', label: 'Integrations', icon: Plug },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0F1A2E' }}>
      <aside className="hidden w-64 flex-shrink-0 border-r lg:block" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
        <div className="flex h-16 items-center border-b px-6" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: '#E8793A' }}>
              <Radar className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white font-display">Command</span>
          </Link>
        </div>
        <nav className="space-y-1 p-4">
          {NAV_ITEMS.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? 'text-white' : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                }`}
                style={active ? { backgroundColor: 'rgba(42, 191, 191, 0.15)', color: '#2ABFBF' } : undefined}>
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 w-64 border-t p-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="mb-3 px-3 py-2">
            <p className="text-xs text-white/30">Powered by</p>
            <p className="text-sm font-medium" style={{ color: '#2ABFBF' }}>KeaBot Command</p>
          </div>
          <button onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/50 hover:bg-white/5 hover:text-white/80">
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b px-4 lg:hidden" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
          <Link href="/" className="text-lg font-bold font-display" style={{ color: '#2ABFBF' }}>Command Center</Link>
          <button onClick={handleSignOut} className="rounded-lg p-2 text-white/50 hover:bg-white/5">
            <LogOut className="h-5 w-5" />
          </button>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b px-4 py-2 lg:hidden" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
          {NAV_ITEMS.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
                  active ? '' : 'text-white/50 hover:bg-white/5'
                }`}
                style={active ? { backgroundColor: 'rgba(42, 191, 191, 0.15)', color: '#2ABFBF' } : undefined}>
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
