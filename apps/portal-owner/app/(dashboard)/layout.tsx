'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import {
  FolderKanban, DollarSign, FileText, MessageSquare,
  LogOut, Package, Menu, Home, Sparkles, Calculator,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PortalPageWithAskRail } from '@kealee/ui'

const NAV_ITEMS = [
  { href: '/projects',     label: 'Projects',          icon: FolderKanban, badge: null },
  { href: '/deliverables', label: 'Concept Packages', icon: Package,      badge: null },
  { href: '/services',     label: 'Estimate & Permits', icon: Calculator, badge: null },
  { href: '/concepts',     label: 'Order Concept',    icon: Sparkles,     badge: null },
  { href: '/payments',     label: 'Payments',     icon: DollarSign,   badge: null },
  { href: '/documents',    label: 'Documents',    icon: FileText,     badge: null },
  { href: '/messages',     label: 'Messages',     icon: MessageSquare, badge: '2' },
]

// Owner accent: coral #E8724B + teal #2ABFBF
const ACCENT   = '#2ABFBF'
const CORAL    = '#E8724B'
const SIDEBAR  = '#0F1F38'  // slightly deeper navy for contrast

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Link href="/projects" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `linear-gradient(135deg, ${CORAL}, #c95a30)` }}>
            <Home className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-white font-display tracking-tight">Kealee</span>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}>
            Owner
          </span>
        </Link>
      </div>

      {/* Section label */}
      <div className="px-5 pt-5 pb-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Workspace</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 pb-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
              style={{
                backgroundColor: active ? `${ACCENT}18` : 'transparent',
                color: active ? ACCENT : 'rgba(255,255,255,0.55)',
                borderLeft: active ? `3px solid ${ACCENT}` : '3px solid transparent',
              }}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: CORAL }}>
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '12px' }}>
        <button onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/40 transition-colors hover:bg-white/5 hover:text-white/70">
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F5F6FA' }}>
      {/* Desktop sidebar */}
      <aside className="hidden w-56 flex-shrink-0 flex-col lg:flex" style={{ backgroundColor: SIDEBAR, position: 'sticky', top: 0, height: '100vh' }}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-56 flex flex-col" style={{ backgroundColor: SIDEBAR }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Content area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden"
          style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.06)' }}>
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold font-display text-sm" style={{ color: '#0F1F38' }}>Project Workspace</span>
          <div className="ml-auto flex items-center gap-2">
            <NotificationCenter />
            <div className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${CORAL}, #c95a30)` }}>
              JA
            </div>
          </div>
        </header>

        {/* Desktop top strip — colored accent bar */}
        <div className="hidden lg:flex h-12 items-center justify-between px-8 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="font-medium" style={{ color: '#0F1F38' }}>
              {NAV_ITEMS.find(i => pathname.startsWith(i.href))?.label ?? 'Dashboard'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter />
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${CORAL}, #c95a30)` }}>
              JA
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
          <div className="flex-grow">
            <PortalPageWithAskRail portal="owner">{children}</PortalPageWithAskRail>
          </div>
          <footer className="mt-8 pt-4 border-t border-slate-200/50 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            © {new Date().getFullYear()} Kealee Services LLC. All rights reserved. · DC · MD · VA
          </footer>
        </main>
      </div>
    </div>
  )
}
