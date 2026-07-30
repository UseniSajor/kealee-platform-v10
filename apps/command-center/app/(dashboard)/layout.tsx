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
  Megaphone,
  ImageIcon,
  Orbit,
  ClipboardCheck,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const MARKETING_OS_URL = process.env.NEXT_PUBLIC_MARKETING_OS_URL ?? 'http://localhost:3032'

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/twins', label: 'Digital Twins', icon: Boxes },
  { href: '/events', label: 'Events', icon: Radio },
  { href: '/bots', label: 'Bots', icon: Bot },
  { href: '/marketing', label: 'Marketing', icon: Megaphone },
  { href: MARKETING_OS_URL, label: 'Marketing OS', icon: Orbit, external: true },
  { href: '/renderings', label: 'Renderings', icon: ImageIcon },
  { href: '/site-plans', label: 'Site Plans', icon: ClipboardCheck },
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
    <div className="flex min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <aside className="hidden w-64 flex-shrink-0 border-r lg:block" style={{ borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
        <div className="flex h-16 items-center border-b px-6" style={{ borderColor: '#E2E8F0' }}>
          <Link href="/" className="flex items-center gap-2">
            <img src="/kealee-icon-192x192.png" alt="" className="h-8 w-8 rounded-lg" />
            <span className="text-lg font-bold font-display" style={{ color: '#1A2B4A' }}>Kealee Command</span>
          </Link>
        </div>
        <nav className="space-y-1 p-4">
          {NAV_ITEMS.map((item) => {
            const active = item.external ? false : item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noreferrer' : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? '' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
                style={active ? { backgroundColor: 'rgba(42, 191, 191, 0.12)', color: '#1A8F8F' } : undefined}>
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 w-64 border-t p-4" style={{ borderColor: '#E2E8F0' }}>
          <div className="mb-3 px-3 py-2">
            <p className="text-xs text-slate-400">Powered by</p>
            <p className="text-sm font-medium" style={{ color: '#1A8F8F' }}>KeaBot Command</p>
          </div>
          <button onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900">
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b px-4 lg:hidden" style={{ borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
          <Link href="/" className="flex items-center gap-2 text-lg font-bold font-display" style={{ color: '#1A2B4A' }}>
            <img src="/kealee-icon-192x192.png" alt="" className="h-7 w-7 rounded-md" /> Kealee Command
          </Link>
          <button onClick={handleSignOut} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50">
            <LogOut className="h-5 w-5" />
          </button>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b px-4 py-2 lg:hidden" style={{ borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
          {NAV_ITEMS.map((item) => {
            const active = item.external ? false : item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noreferrer' : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
                  active ? '' : 'text-slate-500 hover:bg-slate-50'
                }`}
                style={active ? { backgroundColor: 'rgba(42, 191, 191, 0.12)', color: '#1A8F8F' } : undefined}>
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
