'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Map, FlaskConical, Landmark, LayoutGrid,
  FileBarChart, LogOut, Building, Briefcase,
  Bot, Bell, Menu, X, ChevronRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const NAV_ITEMS = [
  { href: '/pipeline',    label: 'Land Pipeline',  icon: Map,          group: 'Acquisitions' },
  { href: '/feasibility', label: 'Feasibility',    icon: FlaskConical, group: 'Acquisitions' },
  { href: '/capital',     label: 'Capital Stack',  icon: Landmark,     group: 'Finance' },
  { href: '/portfolio',   label: 'Portfolio',      icon: LayoutGrid,   group: 'Finance' },
  { href: '/reports',     label: 'Reports',        icon: FileBarChart, group: 'Finance' },
  { href: '/services',    label: 'Services',       icon: Briefcase,    group: 'Tools' },
]

// Developer accent: indigo/violet
const ACCENT  = '#818CF8'   // indigo-400
const SIDEBAR = '#1E1B4B'   // indigo-950

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [showBot, setShowBot]       = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // Group nav items for section headers
  const groups = [
    { label: 'Acquisitions', items: NAV_ITEMS.filter(i => i.group === 'Acquisitions') },
    { label: 'Finance',      items: NAV_ITEMS.filter(i => i.group === 'Finance') },
    { label: 'Tools',        items: NAV_ITEMS.filter(i => i.group === 'Tools') },
  ]

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center px-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <Link href="/pipeline" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, #6366F1, #4338CA)' }}>
            <Building className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-white font-display tracking-tight">Kealee</span>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}>
            Dev
          </span>
        </Link>
      </div>

      {/* Grouped Nav */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {groups.map(group => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.25)' }}>
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const active = pathname.startsWith(item.href)
                return (
                  <Link key={item.href} href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
                    style={{
                      backgroundColor: active ? `${ACCENT}18` : 'transparent',
                      color: active ? ACCENT : 'rgba(255,255,255,0.5)',
                      borderLeft: active ? `3px solid ${ACCENT}` : '3px solid transparent',
                    }}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* KeaBot */}
      <div className="px-3 pb-3">
        <button onClick={() => { setShowBot(!showBot); setMobileOpen(false) }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
          style={{ backgroundColor: showBot ? `${ACCENT}22` : `${ACCENT}10`, color: ACCENT }}>
          <Bot className="h-4 w-4" />
          <span className="flex-1 text-left">KeaBot Dev</span>
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

  const currentPage = NAV_ITEMS.find(i => pathname.startsWith(i.href))

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F5F4FF' }}>
      {/* Desktop sidebar */}
      <aside className="hidden w-56 flex-shrink-0 flex-col lg:flex"
        style={{ backgroundColor: SIDEBAR, position: 'sticky', top: 0, height: '100vh' }}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-56 flex flex-col" style={{ backgroundColor: SIDEBAR }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile header */}
        <header className="flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold font-display text-sm" style={{ color: SIDEBAR }}>Developer Portal</span>
          <div className="ml-auto flex items-center gap-2">
            <button className="relative rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <Bell className="h-4 w-4" />
            </button>
            <div className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6366F1, #4338CA)' }}>
              D
            </div>
          </div>
        </header>

        {/* Desktop sub-header */}
        <div className="hidden lg:flex h-12 items-center justify-between px-8 border-b"
          style={{ backgroundColor: '#FAFAFE', borderColor: '#E8E7FF' }}>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Developer Portal</span>
            {currentPage && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                <span className="font-semibold" style={{ color: SIDEBAR }}>{currentPage.label}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="relative rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <Bell className="h-4 w-4" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6366F1, #4338CA)' }}>
              D
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* KeaBot Chat Widget */}
      {showBot && (
        <div className="fixed bottom-5 right-5 z-50 w-80 overflow-hidden rounded-2xl bg-white sm:w-96"
          style={{ boxShadow: '0 20px 60px rgba(30,27,75,0.2)', border: '1px solid rgba(0,0,0,0.08)' }}>
          <div className="flex items-center justify-between px-4 py-3"
            style={{ background: `linear-gradient(135deg, ${SIDEBAR}, #312E81)` }}>
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" style={{ color: ACCENT }} />
              <span className="text-sm font-semibold text-white">KeaBot Dev</span>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#34D399' }} />
            </div>
            <button onClick={() => setShowBot(false)} className="text-white/50 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="h-64 overflow-y-auto p-4">
            <div className="mb-3 max-w-[85%] rounded-2xl rounded-tl-sm p-3 text-sm leading-relaxed"
              style={{ backgroundColor: '#F0F0FF', color: SIDEBAR, border: `1px solid ${ACCENT}22` }}>
              Hi! I&apos;m KeaBot Dev. I can assist with pipeline analysis, feasibility studies, capital structuring, and portfolio reporting. What do you need?
            </div>
          </div>
          <div className="border-t border-slate-100 p-3">
            <div className="flex gap-2">
              <input type="text" placeholder="Ask about your pipeline or deals…"
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                onFocus={e => (e.target.style.borderColor = ACCENT)}
                onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
              />
              <button className="rounded-xl p-2 text-white"
                style={{ background: 'linear-gradient(135deg, #6366F1, #4338CA)' }}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
