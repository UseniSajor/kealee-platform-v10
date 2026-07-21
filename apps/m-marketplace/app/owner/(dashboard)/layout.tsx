'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Building2,
  CheckSquare,
  DollarSign,
  FileText,
  FolderOpen,
  HelpCircle,
  Home,
  Layers,
  LogOut,
  User,
} from 'lucide-react'
import { supabase } from '@owner/lib/supabase'
import { OwnerProfileProvider, useOwnerProfile } from '@owner/lib/user-context'

// ---------------------------------------------------------------------------
// All possible nav items — filtered by portalTabs from user metadata
// ---------------------------------------------------------------------------
const ALL_NAV_ITEMS = [
  { key: 'dashboard', href: '/owner/dashboard', label: 'Home', icon: Home },
  { key: 'projects', href: '/owner/projects', label: 'My Projects', icon: FolderOpen },
  { key: 'approvals', href: '/owner/approvals', label: 'Approvals', icon: CheckSquare },
  { key: 'reports', href: '/owner/reports', label: 'Reports', icon: FileText },
  { key: 'analytics', href: '/owner/analytics', label: 'Analytics', icon: BarChart3 },
  // Multifamily-specific tabs (only shown for multifamily projects)
  { key: 'units', href: '/owner/units', label: 'Unit Tracker', icon: Building2 },
  { key: 'draws', href: '/owner/draws', label: 'Lender Draws', icon: DollarSign },
  { key: 'phasing', href: '/owner/phasing', label: 'Area Phasing', icon: Layers },
  // Always-available
  { key: 'help', href: '/owner/help', label: 'Help', icon: HelpCircle },
]

function LayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { portalTabs, loading: profileLoading } = useOwnerProfile()

  // Filter nav items based on user's portal tabs
  const navItems = ALL_NAV_ITEMS.filter((item) => portalTabs.includes(item.key))

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/owner/dashboard" className="text-xl font-bold text-blue-600">
            Kealee
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/owner/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/owner/account"
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <User className="h-5 w-5" />
            </Link>
            <button
              onClick={handleSignOut}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-t border-gray-100 px-4 py-2 md:hidden">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/owner/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Exported layout — wraps inner with OwnerProfileProvider
// ---------------------------------------------------------------------------
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <OwnerProfileProvider>
      <LayoutInner>{children}</LayoutInner>
    </OwnerProfileProvider>
  )
}
