'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  FolderKanban, DollarSign, FileText, MessageSquare,
  LogOut, Bot, X, ChevronRight, Bell,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const NAV_ITEMS = [
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/payments', label: 'Payments', icon: DollarSign },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [showBot, setShowBot] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: '#F7FAFC' }}>
      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)' }}>
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          {/* Logo */}
          <Link href="/projects" className="flex shrink-0 items-center gap-2 mr-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: '#E8793A' }}>
              <span className="text-xs font-bold text-white font-display">K</span>
            </div>
            <span className="hidden text-base font-bold font-display sm:block" style={{ color: '#1A2B4A' }}>Kealee</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full hidden sm:block" style={{ backgroundColor: 'rgba(42,191,191,0.1)', color: '#2ABFBF' }}>Owner</span>
          </Link>

          {/* Nav tabs */}
          <nav className="flex items-center gap-0.5 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: active ? 'rgba(42,191,191,0.08)' : 'transparent',
                    color: active ? '#2ABFBF' : '#6B7280',
                    borderBottom: active ? '2px solid #2ABFBF' : '2px solid transparent',
                  }}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden sm:block">{item.label}</span>
                  {item.label === 'Messages' && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: '#E8793A' }}>
                      2
                    </span>
                  )}
                </Link>
              )
            })}

            {/* KeaBot tab */}
            <button
              onClick={() => setShowBot(!showBot)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ml-1"
              style={{
                backgroundColor: showBot ? 'rgba(42,191,191,0.12)' : 'rgba(42,191,191,0.05)',
                color: '#2ABFBF',
                borderBottom: showBot ? '2px solid #2ABFBF' : '2px solid transparent',
              }}
            >
              <Bot className="h-4 w-4" />
              <span className="hidden sm:block">KeaBot</span>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#38A169' }} />
            </button>
          </nav>

          {/* Right side actions */}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button className="relative rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#E8793A' }} />
            </button>
            <div className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: '#1A2B4A' }}>
              JA
            </div>
            <button
              onClick={handleSignOut}
              className="hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ── Page content ───────────────────────────────────────────────────── */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>

      {/* ── KeaBot Chat Widget ──────────────────────────────────────────────── */}
      {showBot && (
        <div className="fixed bottom-4 right-4 z-50 w-80 overflow-hidden rounded-xl bg-white shadow-2xl sm:w-96" style={{ border: '1px solid #E5E7EB' }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: '#1A2B4A' }}>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" style={{ color: '#2ABFBF' }} />
              <span className="text-sm font-semibold text-white">KeaBot Owner</span>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#38A169' }} />
            </div>
            <button onClick={() => setShowBot(false)} className="text-white/60 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="h-64 overflow-y-auto p-4">
            <div className="mb-3 max-w-[80%] rounded-xl rounded-tl-none p-3 text-sm" style={{ backgroundColor: '#F7FAFC', color: '#1A2B4A' }}>
              Hi! I&apos;m your KeaBot Owner assistant. I can help you with project status, payment questions, scheduling, and more. What can I help you with?
            </div>
          </div>
          <div className="border-t border-gray-200 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask about your project..."
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                style={{ focusRingColor: 'rgba(42,191,191,0.3)' } as React.CSSProperties}
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
