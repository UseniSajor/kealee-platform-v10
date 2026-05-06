'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  FolderKanban, DollarSign, FileText, MessageSquare,
  LogOut, Bot, X, ChevronRight, Bell, Package, Menu, Home,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const NAV_ITEMS = [
  { href: '/projects',     label: 'Projects',     icon: FolderKanban, badge: null },
  { href: '/deliverables', label: 'Deliverables', icon: Package,      badge: null },
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
  const [showBot, setShowBot]     = useState(false)
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

      {/* KeaBot */}
      <div className="px-3 pb-3">
        <button onClick={() => { setShowBot(!showBot); setMobileOpen(false) }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
          style={{ backgroundColor: showBot ? `${ACCENT}22` : `${ACCENT}10`, color: ACCENT }}
        >
          <Bot className="h-4 w-4" />
          <span className="flex-1 text-left">KeaBot</span>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#34D399' }} />
        </button>
      </div>

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
          <span className="font-bold font-display text-sm" style={{ color: '#0F1F38' }}>Owner Portal</span>
          <div className="ml-auto flex items-center gap-2">
            <button className="relative rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: CORAL }} />
            </button>
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
            <button className="relative rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: CORAL }} />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${CORAL}, #c95a30)` }}>
              JA
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* KeaBot Chat Widget */}
      {showBot && (
        <div className="fixed bottom-5 right-5 z-50 w-80 overflow-hidden rounded-2xl bg-white sm:w-96"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.18)', border: '1px solid rgba(0,0,0,0.08)' }}>
          <div className="flex items-center justify-between px-4 py-3"
            style={{ background: `linear-gradient(135deg, ${SIDEBAR}, #1e3a6e)` }}>
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" style={{ color: ACCENT }} />
              <span className="text-sm font-semibold text-white">KeaBot Owner</span>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#34D399' }} />
            </div>
            <button onClick={() => setShowBot(false)} className="text-white/50 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="h-64 overflow-y-auto p-4">
            <div className="mb-3 max-w-[85%] rounded-2xl rounded-tl-sm p-3 text-sm leading-relaxed"
              style={{ backgroundColor: '#F0FBFB', color: '#0F1F38', border: `1px solid ${ACCENT}22` }}>
              Hi! I&apos;m your KeaBot Owner assistant. I can help with project status, payment questions, scheduling, and more. What can I help you with?
            </div>
          </div>
          <div className="border-t border-slate-100 p-3">
            <div className="flex gap-2">
              <input type="text" placeholder="Ask about your project…"
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                onFocus={e => (e.target.style.borderColor = ACCENT)}
                onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
              />
              <button className="rounded-xl p-2 text-white" style={{ backgroundColor: CORAL }}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
