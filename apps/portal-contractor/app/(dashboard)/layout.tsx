'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Megaphone,
  Gavel,
  FolderKanban,
  DollarSign,
  ShieldCheck,
  UserCircle,
  LogOut,
  HardHat,
  Bot,
  Menu,
  X,
  ChevronRight,
  Bell,
  TrendingUp,
  FileText,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const NAV_ITEMS = [
  { href: '/leads', label: 'Leads', icon: Megaphone },
  { href: '/bids', label: 'Bids', icon: Gavel },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/permits', label: 'Permits', icon: FileText },
  { href: '/payments', label: 'Payments', icon: DollarSign },
  { href: '/credentials', label: 'Credentials', icon: ShieldCheck },
  { href: '/marketing', label: 'Grow', icon: TrendingUp },
  { href: '/profile', label: 'Profile', icon: UserCircle },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showBot, setShowBot] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F7FAFC' }}>
      {/* Sidebar - Desktop */}
      <aside className="hidden w-64 flex-shrink-0 lg:flex lg:flex-col" style={{ backgroundColor: '#1A2B4A' }}>
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 px-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Link href="/leads" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: '#E8793A' }}>
              <HardHat className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white font-display">Kealee</span>
            <span className="rounded px-1.5 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: '#E8793A' }}>GC</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: active ? 'rgba(42,191,191,0.15)' : 'transparent',
                  color: active ? '#2ABFBF' : 'rgba(255,255,255,0.6)',
                }}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* KeaBot GC Button */}
        <div className="px-4 pb-2">
          <button
            onClick={() => setShowBot(!showBot)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
            style={{ backgroundColor: 'rgba(42,191,191,0.1)', color: '#2ABFBF' }}
          >
            <Bot className="h-5 w-5" />
            KeaBot GC
            <span className="ml-auto h-2 w-2 rounded-full" style={{ backgroundColor: '#38A169' }} />
          </button>
        </div>

        {/* Sign Out */}
        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/40 transition-colors hover:text-white/80"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
          {/* Mobile menu button */}
          <button
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Logo on mobile */}
          <Link href="/leads" className="flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: '#E8793A' }}>
              <HardHat className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-lg font-bold font-display" style={{ color: '#1A2B4A' }}>Kealee</span>
            <span className="rounded px-1 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: '#E8793A' }}>GC</span>
          </Link>

          {/* Breadcrumb on desktop */}
          <div className="hidden items-center gap-2 text-sm text-gray-500 lg:flex">
            <Link href="/leads" className="hover:text-gray-700">Contractor Portal</Link>
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <span className="font-medium capitalize" style={{ color: '#1A2B4A' }}>
              {pathname.replace('/', '').split('/')[0] || 'leads'}
            </span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: '#E8793A' }} />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: '#1A2B4A' }}>
              SC
            </div>
          </div>
        </header>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="flex gap-1 overflow-x-auto border-b border-gray-200 bg-white px-4 py-2 lg:hidden">
            {NAV_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
                  style={{
                    backgroundColor: active ? 'rgba(42,191,191,0.1)' : 'transparent',
                    color: active ? '#2ABFBF' : '#4A5568',
                  }}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* KeaBot GC Chat Widget */}
      {showBot && (
        <div className="fixed bottom-4 right-4 z-50 w-80 overflow-hidden rounded-xl bg-white shadow-2xl sm:w-96" style={{ border: '1px solid #E5E7EB' }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: '#1A2B4A' }}>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" style={{ color: '#2ABFBF' }} />
              <span className="text-sm font-semibold text-white">KeaBot GC</span>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#38A169' }} />
            </div>
            <button onClick={() => setShowBot(false)} className="text-white/60 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="h-64 overflow-y-auto p-4">
            <div className="mb-3 max-w-[80%] rounded-xl rounded-tl-none p-3 text-sm" style={{ backgroundColor: '#F7FAFC', color: '#1A2B4A' }}>
              Hi! I&apos;m your KeaBot GC assistant. I can help you with lead matching, bid status, project schedules, payments, and more. What can I help you with?
            </div>
          </div>
          <div className="border-t border-gray-200 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask about your leads or projects..."
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                onFocus={(e) => { e.target.style.borderColor = '#2ABFBF'; e.target.style.boxShadow = '0 0 0 1px #2ABFBF' }}
                onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }}
              />
              <button className="rounded-lg p-2 text-white" style={{ backgroundColor: '#E8793A' }}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
