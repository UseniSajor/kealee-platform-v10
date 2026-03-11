'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  FolderKanban, DollarSign, FileText, MessageSquare,
  Boxes, LogOut, LayoutDashboard, Bot, Menu, X,
  ChevronRight, Bell, User, Send,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'

const NAV_ITEMS = [
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/payments', label: 'Payments', icon: DollarSign },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showBot, setShowBot] = useState(false)
  const [userInitials, setUserInitials] = useState('JA')
  const [userName, setUserName] = useState('')
  const [botInput, setBotInput] = useState('')
  const [botMessages, setBotMessages] = useState<Array<{ role: 'bot' | 'user'; text: string }>>([
    { role: 'bot', text: "Hi! I'm your KeaBot Owner assistant. I can help you with project status, payment questions, scheduling, and more. What can I help you with?" },
  ])
  const [botSending, setBotSending] = useState(false)

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const meta = (user.user_metadata || {}) as Record<string, string>
          const fullName = meta.full_name || meta.firstName || user.email || ''
          setUserName(fullName)
          const parts = fullName.split(' ')
          if (parts.length >= 2) {
            setUserInitials(`${parts[0][0]}${parts[1][0]}`.toUpperCase())
          } else if (parts.length === 1 && parts[0]) {
            setUserInitials(parts[0].substring(0, 2).toUpperCase())
          }
        }
      } catch {
        // Keep defaults
      }
    }
    fetchUser()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const handleBotSend = async () => {
    if (!botInput.trim() || botSending) return
    const msg = botInput
    setBotInput('')
    setBotMessages(prev => [...prev, { role: 'user', text: msg }])
    setBotSending(true)
    try {
      const res = await api.chatWithKeaBot(msg)
      setBotMessages(prev => [...prev, { role: 'bot', text: res.reply }])
    } catch {
      setBotMessages(prev => [...prev, { role: 'bot', text: 'Sorry, I could not reach the server. Please try again.' }])
    } finally {
      setBotSending(false)
    }
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F7FAFC' }}>
      {/* Sidebar - Desktop */}
      <aside className="hidden w-64 flex-shrink-0 lg:flex lg:flex-col" style={{ backgroundColor: '#1A2B4A' }}>
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 px-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: '#E8793A' }}>
            <span className="text-sm font-bold text-white font-display">K</span>
          </div>
          <span className="text-lg font-bold text-white font-display">Kealee</span>
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
                {item.label === 'Messages' && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#E8793A' }}>
                    2
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* KeaBot Button */}
        <div className="px-4 pb-2">
          <button
            onClick={() => setShowBot(!showBot)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
            style={{ backgroundColor: 'rgba(42,191,191,0.1)', color: '#2ABFBF' }}
          >
            <Bot className="h-5 w-5" />
            KeaBot Owner
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
          <Link href="/projects" className="flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: '#E8793A' }}>
              <span className="text-xs font-bold text-white font-display">K</span>
            </div>
            <span className="text-lg font-bold font-display" style={{ color: '#1A2B4A' }}>Kealee</span>
          </Link>

          {/* Breadcrumb on desktop */}
          <div className="hidden items-center gap-2 text-sm text-gray-500 lg:flex">
            <Link href="/projects" className="hover:text-gray-700">Owner Portal</Link>
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <span className="font-medium capitalize" style={{ color: '#1A2B4A' }}>
              {pathname.replace('/', '').split('/')[0] || 'projects'}
            </span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: '#E8793A' }} />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: '#1A2B4A' }}>
              {userInitials}
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

      {/* KeaBot Chat Widget */}
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
          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {botMessages.map((msg, i) => (
              <div key={i} className={`max-w-[80%] rounded-xl p-3 text-sm ${
                msg.role === 'user' ? 'ml-auto rounded-tr-none text-white' : 'rounded-tl-none'
              }`} style={msg.role === 'user' ? { backgroundColor: '#1A2B4A' } : { backgroundColor: '#F7FAFC', color: '#1A2B4A' }}>
                {msg.text}
              </div>
            ))}
            {botSending && (
              <div className="max-w-[80%] rounded-xl rounded-tl-none p-3 text-sm text-gray-400" style={{ backgroundColor: '#F7FAFC' }}>
                Thinking...
              </div>
            )}
          </div>
          <div className="border-t border-gray-200 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask about your project..."
                value={botInput}
                onChange={(e) => setBotInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBotSend()}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
              />
              <button onClick={handleBotSend} disabled={botSending} className="rounded-lg p-2 text-white disabled:opacity-50" style={{ backgroundColor: '#E8793A' }}>
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
