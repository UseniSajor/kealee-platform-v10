'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useClerk } from '@clerk/nextjs'
import {
  Megaphone, Gavel, FolderKanban, DollarSign, ShieldCheck,
  UserCircle, LogOut, Menu, ChevronRight,
  TrendingUp, FileText,
  Settings,
} from 'lucide-react'
import { PortalPageWithAskRail, TenantBrandAttribution, useTenantBranding } from '@kealee/ui'

const NAV_ITEMS = [
  { href: '/leads',       label: 'Leads',        icon: Megaphone,    group: 'Business' },
  { href: '/bids',        label: 'Bids',         icon: Gavel,        group: 'Business' },
  { href: '/projects',    label: 'Projects',     icon: FolderKanban, group: 'Business' },
  { href: '/services',    label: 'Estimate & Permits', icon: FileText, group: 'Compliance' },
  { href: '/permits',     label: 'Permit tracker', icon: ShieldCheck,  group: 'Compliance' },
  { href: '/payments',    label: 'Payments',     icon: DollarSign,   group: 'Compliance' },
  { href: '/credentials', label: 'Credentials',  icon: ShieldCheck,  group: 'Compliance' },
  { href: '/marketing',   label: 'Grow',         icon: TrendingUp,   group: 'Growth' },
  { href: '/profile',     label: 'Profile',      icon: UserCircle,   group: 'Growth' },
  { href: '/company-settings', label: 'Company OS', icon: Settings, group: 'Growth' },
]

// Contractor accent: amber / warm orange
const ACCENT  = '#F59E0B'   // amber-400
const SIDEBAR = '#1C1008'   // very dark warm brown-black

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const tenantBrand = useTenantBranding()
  const accent = tenantBrand?.accentColor || ACCENT
  const sidebar = tenantBrand?.secondaryColor || SIDEBAR
  const portalName = tenantBrand?.productName || tenantBrand?.companyName || 'Contractor Portal'
  const showKealeeBrand = tenantBrand?.kealeeBrandingVisible !== false
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { signOut } = useClerk()

  const handleSignOut = async () => {
    await signOut({ redirectUrl: '/login' })
  }

  const groups = [
    { label: 'Business',   items: NAV_ITEMS.filter(i => i.group === 'Business') },
    { label: 'Compliance', items: NAV_ITEMS.filter(i => i.group === 'Compliance') },
    { label: 'Growth',     items: NAV_ITEMS.filter(i => i.group === 'Growth') },
  ]

  const currentPage = NAV_ITEMS.find(i => pathname.startsWith(i.href))

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center px-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <Link href="/leads" className="flex items-center gap-2.5">
          {tenantBrand?.logoUrl ? (
            // Tenant logos are configuration-owned URLs and bypass Next's host allowlist.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenantBrand.logoUrl} alt={`${tenantBrand.companyName} logo`} className="h-8 max-w-28 object-contain" />
          ) : showKealeeBrand ? (
            <Image src="/kealee-icon-512x512-transparent.png" alt="Kealee" width={32} height={32} className="h-8 w-8" priority />
          ) : (
            <span className="max-w-28 truncate text-sm font-semibold text-white">{tenantBrand?.companyName || 'Company'}</span>
          )}
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
            style={{ backgroundColor: tenantBrand?.primaryColor || '#D97706' }}>
            GC
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
                      backgroundColor: active ? `${accent}18` : 'transparent',
                      color: active ? accent : 'rgba(255,255,255,0.5)',
                      borderLeft: active ? `3px solid ${accent}` : '3px solid transparent',
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
    <div className="flex min-h-screen" style={{ backgroundColor: '#FAFAF7' }}>
      {/* Desktop sidebar */}
      <aside className="hidden w-56 flex-shrink-0 flex-col lg:flex"
        style={{ backgroundColor: sidebar, position: 'sticky', top: 0, height: '100vh' }}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-56 flex flex-col" style={{ backgroundColor: sidebar }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Content area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile header */}
        <header className="flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
          <button type="button" aria-label="Open navigation" onClick={() => setMobileOpen(true)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold font-display text-sm" style={{ color: sidebar }}>{portalName}</span>
          <div className="ml-auto flex items-center gap-2">
            <UserCircle className="h-7 w-7 text-slate-400" aria-label="Account" />
          </div>
        </header>

        {/* Desktop breadcrumb header */}
        <div className="hidden lg:flex h-12 items-center justify-between px-8 border-b"
          style={{ backgroundColor: '#FEFCF3', borderColor: '#FEF3C7' }}>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">{portalName}</span>
            {currentPage && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                <span className="font-semibold" style={{ color: sidebar }}>{currentPage.label}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <UserCircle className="h-8 w-8 text-slate-400" aria-label="Account" />
          </div>
        </div>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
          <div className="flex-grow">
            <PortalPageWithAskRail portal="contractor">{children}</PortalPageWithAskRail>
          </div>
          <footer className="mt-8 pt-4 border-t border-slate-200/50 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {tenantBrand?.kealeeBrandingVisible === false
              ? `© ${new Date().getFullYear()} ${tenantBrand.companyName}. All rights reserved.`
              : <><span>© {new Date().getFullYear()} Kealee Services LLC. All rights reserved. · DC · MD · VA</span><span className="ml-2"><TenantBrandAttribution /></span></>}
          </footer>
        </main>
      </div>
    </div>
  )
}
