'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight, ChevronDown } from 'lucide-react'

const DMV_AREAS = [
  'All DMV areas',
  'Washington, DC',
  'Montgomery County, MD',
  'Prince George\'s County, MD',
  'Fairfax County, VA',
  'Arlington County, VA',
  'Alexandria City, VA',
  'Prince William County, VA',
  'Frederick County, MD',
  'Howard County, MD',
  'Anne Arundel County, MD',
]

// ── Types ──────────────────────────────────────────────────────────────────────

type DashTab = 'projects' | 'permits' | 'marketplace'

interface ProjectCard {
  name: string
  status: string
  statusColor: 'orange' | 'blue' | 'green'
  meta: string
  progress: number
}

interface PermitItem {
  name: string
  status: string
  statusColor: 'orange' | 'blue' | 'green' | 'smoke'
  meta: string
  progress: number
}

interface Contractor {
  name: string
  trade: string
  area: string
  rating: string
}

// ── Data ───────────────────────────────────────────────────────────────────────

const PROJECTS: ProjectCard[] = [
  {
    name: 'Kitchen + addition — Bethesda MD',
    status: 'Permit review',
    statusColor: 'orange',
    meta: 'Montgomery DPS · Submitted 12 days ago · Est. approval: 26 days',
    progress: 65,
  },
  {
    name: 'ADU / in-law suite — Rockville MD',
    status: 'AI concept',
    statusColor: 'blue',
    meta: 'Report delivered · Cost band: $68K–$82K · Permit risk: low',
    progress: 22,
  },
  {
    name: 'Basement finish — Fairfax VA',
    status: 'Building',
    statusColor: 'green',
    meta: 'Milestone 4 of 6 · Next payment: $18,500 pending approval',
    progress: 71,
  },
]

const PERMIT_ITEMS: PermitItem[] = [
  { name: 'Bethesda kitchen — Montgomery DPS', status: 'Under review', statusColor: 'orange', meta: 'Comment response due: 8 days', progress: 55 },
  { name: 'Rockville ADU — Montgomery DPS',    status: 'Submitted',    statusColor: 'blue',   meta: 'Initial review: 21 days est.',  progress: 15 },
  { name: 'Fairfax basement — Fairfax LDS',    status: 'Approved',     statusColor: 'green',  meta: 'Permit #FC-2026-04821 issued',  progress: 100 },
  { name: 'Alexandria deck — City of Alexandria', status: 'Drafting', statusColor: 'smoke', meta: 'Application in preparation',    progress: 8 },
]

const CONTRACTORS: Contractor[] = [
  { name: 'Marcus T.',        trade: 'General contractor', area: 'Fairfax VA',       rating: '4.9' },
  { name: 'Rivera HVAC',      trade: 'HVAC specialist',    area: 'Montgomery MD',    rating: '4.8' },
  { name: 'Blue Ridge Deck',  trade: 'Exterior',           area: 'Northern VA',      rating: '4.7' },
  { name: 'Chen Landscaping', trade: 'Landscape',          area: 'DC / MD / VA',     rating: '4.9' },
]

const ACTIVITY = [
  { icon: '✓', iconColor: 'green', title: 'Permit Package submitted — Fairfax LDS',    time: '2 hours ago' },
  { icon: '○', iconColor: 'orange', title: 'Milestone 4 payment — awaiting your approval', time: 'Yesterday · $18,500 in escrow' },
  { icon: '✓', iconColor: 'green', title: 'AI concept delivered — Rockville ADU',       time: '2 days ago · Floor plan + zoning check' },
  { icon: '🔒', iconColor: 'blue', title: 'Lien waiver collected — Milestone 3',        time: '3 days ago · Unconditional' },
]

const PILLS = ['Kitchen Remodel', 'Bathroom Remodel', 'ADU / Garage', 'Deck & Patio', 'Addition', 'New Home']

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  orange: { bg: 'rgba(200,82,26,.15)',  text: '#C8521A' },
  blue:   { bg: 'rgba(74,143,168,.15)', text: '#4A8FA8' },
  green:  { bg: 'rgba(58,125,82,.15)',  text: '#3A7D52' },
  smoke:  { bg: 'rgba(255,255,255,.08)', text: 'rgba(255,255,255,.4)' },
}

const PROGRESS_GRAD: Record<string, string> = {
  orange: 'linear-gradient(90deg,#C8521A,#E8733D)',
  blue:   'linear-gradient(90deg,#4A8FA8,#6BAFC6)',
  green:  'linear-gradient(90deg,#3A7D52,#5AA870)',
  smoke:  'linear-gradient(90deg,rgba(255,255,255,.2),rgba(255,255,255,.35))',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  return (
    <div
      className="relative mt-2 h-[3px] w-full overflow-hidden rounded-sm"
      style={{ background: 'rgba(255,255,255,.08)' }}
    >
      <div
        className="proj-bar absolute left-0 top-0 h-full rounded-sm"
        style={{
          '--target-width': `${progress}%`,
          background: PROGRESS_GRAD[color] ?? PROGRESS_GRAD.smoke,
          width: `${progress}%`,
        } as React.CSSProperties}
      />
    </div>
  )
}

function ProjectCards() {
  return (
    <>
      {PROJECTS.map((p) => {
        const ss = STATUS_STYLES[p.statusColor]
        return (
          <div
            key={p.name}
            className="px-4 py-3.5"
            style={{ borderBottom: '1px solid rgba(255,255,255,.06)' }}
          >
            <div className="flex items-start justify-between gap-2">
              <p style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,.8)', lineHeight: 1.3 }}>{p.name}</p>
              <span
                className="flex-shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold"
                style={{ background: ss.bg, color: ss.text }}
              >
                {p.status}
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginTop: 4 }}>{p.meta}</p>
            <ProgressBar progress={p.progress} color={p.statusColor} />
          </div>
        )
      })}

      {/* Activity feed */}
      <div className="px-4 pb-3">
        <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(255,255,255,.25)', padding: '10px 0 6px' }}>
          Recent activity
        </p>
        {ACTIVITY.map((a, i) => {
          const dotColor = a.iconColor === 'green' ? '#5AA870' : a.iconColor === 'orange' ? '#C8521A' : '#4A8FA8'
          return (
            <div
              key={i}
              className="flex items-start gap-2.5 py-1.5"
              style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}
            >
              <div
                className="mt-0.5 flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full text-[10px]"
                style={{ background: `${dotColor}22`, color: dotColor }}
              >
                {a.icon}
              </div>
              <div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.65)', lineHeight: 1.4 }}>{a.title}</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', marginTop: 2 }}>{a.time}</p>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

function PermitCards() {
  return (
    <>
      {PERMIT_ITEMS.map((p) => {
        const ss = STATUS_STYLES[p.statusColor]
        return (
          <div
            key={p.name}
            className="px-4 py-3.5"
            style={{ borderBottom: '1px solid rgba(255,255,255,.06)' }}
          >
            <div className="flex items-start justify-between gap-2">
              <p style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,.8)', lineHeight: 1.3 }}>{p.name}</p>
              <span
                className="flex-shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold"
                style={{ background: ss.bg, color: ss.text }}
              >
                {p.status}
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginTop: 4 }}>{p.meta}</p>
            <ProgressBar progress={p.progress} color={p.statusColor} />
          </div>
        )
      })}
    </>
  )
}

function MarketplaceCards() {
  return (
    <div className="grid grid-cols-2 gap-2 p-4">
      {CONTRACTORS.map((c) => (
        <div
          key={c.name}
          className="rounded-lg p-3"
          style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' }}
        >
          <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.8)' }}>{c.name}</p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 2 }}>{c.trade}</p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', marginTop: 1 }}>{c.area}</p>
          <div className="mt-2 flex items-center justify-between">
            <span style={{ fontSize: 10, color: '#5AA870' }}>★ {c.rating}</span>
            <span style={{ fontSize: 9, background: 'rgba(90,168,112,.15)', color: '#5AA870', borderRadius: 4, padding: '1px 6px' }}>Verified</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Dashboard Panel ───────────────────────────────────────────────────────────

function DashboardPanel() {
  const [activeTab, setActiveTab] = useState<DashTab>('projects')
  const [visible, setVisible]     = useState(true)

  function switchTab(tab: DashTab) {
    if (tab === activeTab) return
    setVisible(false)
    setTimeout(() => {
      setActiveTab(tab)
      setVisible(true)
    }, 110)
  }

  const TABS: { id: DashTab; label: string }[] = [
    { id: 'projects',    label: 'Active projects' },
    { id: 'permits',     label: 'Permits' },
    { id: 'marketplace', label: 'Marketplace' },
  ]

  return (
    <div
      className="hero-panel overflow-hidden"
      style={{
        background: 'rgba(255,255,255,.04)',
        border: '1px solid rgba(255,255,255,.1)',
        borderRadius: 16,
        backdropFilter: 'blur(20px)',
        marginTop: 8,
        animation: 'fadeUp .5s .3s ease both',
        maxHeight: 560,
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}
      >
        <div className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              style={{
                fontSize: 11,
                fontWeight: 500,
                padding: '5px 11px',
                borderRadius: 5,
                transition: 'all .12s',
                background: activeTab === t.id ? 'rgba(255,255,255,.1)' : 'transparent',
                color: activeTab === t.id ? 'rgba(255,255,255,.8)' : 'rgba(255,255,255,.35)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5">
          <div
            className="h-[6px] w-[6px] rounded-full"
            style={{ background: '#5AA870', animation: 'pulse 2s infinite' }}
          />
          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(255,255,255,.3)' }}>LIVE</span>
        </div>
      </div>

      {/* Tab content */}
      <div style={{ opacity: visible ? 1 : 0, transition: 'opacity .12s ease' }}>
        {activeTab === 'projects'    && <ProjectCards />}
        {activeTab === 'permits'     && <PermitCards />}
        {activeTab === 'marketplace' && <MarketplaceCards />}
      </div>

      {/* Stats row — only on projects tab */}
      {activeTab === 'projects' && (
        <div
          className="grid grid-cols-3"
          style={{ borderTop: '1px solid rgba(255,255,255,.07)' }}
        >
          {[
            { value: '3',   label: 'Active projects' },
            { value: '$54K', label: 'In escrow' },
            { value: '24hr', label: 'Concept delivery' },
          ].map((s, i) => (
            <div
              key={s.label}
              className="flex flex-col items-center py-3 text-center"
              style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,.07)' : undefined }}
            >
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#fff' }}>{s.value}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', letterSpacing: '.04em', marginTop: 4 }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Hero ─────────────────────────────────────────────────────────────────

export function HeroSection() {
  const router = useRouter()
  const [query,       setQuery]       = useState('')
  const [area,        setArea]        = useState('All DMV areas')
  const [areaOpen,    setAreaOpen]    = useState(false)
  const [searchFocus, setSearchFocus] = useState(false)
  const areaRef = useRef<HTMLDivElement>(null)

  // Close area dropdown on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (areaRef.current && !areaRef.current.contains(e.target as Node)) setAreaOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (area !== 'All DMV areas') params.set('area', area)
    router.push(`/concept${params.toString() ? '?' + params.toString() : ''}`)
  }

  return (
    <section
      className="hero relative overflow-hidden"
      style={{ background: '#0F1110' }}
    >
      {/* Layer 1: gradient mesh */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 70% 40%, rgba(200,82,26,.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 20% 70%, rgba(74,143,168,.12) 0%, transparent 55%),
            radial-gradient(ellipse 100% 100% at 50% 0%, rgba(58,125,82,.08) 0%, transparent 50%),
            #0F1110
          `,
          zIndex: 0,
        }}
      />

      {/* Layer 2: grid lines */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,.028) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.028) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          zIndex: 0,
        }}
      />

      {/* Layer 3: grain texture */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          backgroundSize: '200px',
          opacity: 0.4,
          zIndex: 1,
        }}
      />

      {/* Hero inner — 2-col grid */}
      <div
        className="relative mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28"
        style={{ maxWidth: 1320, zIndex: 2 }}
      >
        <div className="hero-grid">
          {/* LEFT: main content */}
          <div>
            {/* Eyebrow */}
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
              style={{ background: 'rgba(42,191,191,.12)', color: '#2ABFBF' }}
            >
              AI-Powered Construction Platform
            </div>

            {/* H1 */}
            <h1
              className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-[58px]"
              style={{ letterSpacing: '-0.02em' }}
            >
              Build <em>Smarter.</em>{' '}
              <br className="hidden lg:block" />
              From Concept to Closeout.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,.5)' }}>
              <strong style={{ color: 'rgba(255,255,255,.75)', fontWeight: 400 }}>Permits, AI design, and construction management</strong>
              {' '}for homeowners and developers — guided every step by AI assistants that know your project.
            </p>

            {/* Search bar — white card, matches screenshot */}
            <form onSubmit={handleSearch} className="mt-8">
              <div
                className="search-bar-wrap flex items-stretch overflow-hidden"
                style={{
                  background: '#ffffff',
                  borderRadius: 12,
                  boxShadow: searchFocus
                    ? '0 0 0 3px rgba(200,82,26,.25), 0 4px 24px rgba(0,0,0,.22)'
                    : '0 4px 24px rgba(0,0,0,.22)',
                  transition: 'box-shadow .18s',
                }}
                onFocusCapture={() => setSearchFocus(true)}
                onBlurCapture={() => setSearchFocus(false)}
              >
                {/* Text input */}
                <div className="flex flex-1 items-center gap-2.5 px-4">
                  <Search className="h-4 w-4 flex-shrink-0" style={{ color: '#9CA3AF' }} />
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Kitchen remodel, ADU, tiny home, deck, landscape..."
                    className="flex-1 py-4 text-sm focus:outline-none"
                    style={{
                      background: 'transparent',
                      color: '#1A1C1B',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: 14,
                    }}
                  />
                </div>

                {/* Vertical divider */}
                <div className="my-3 w-px self-stretch" style={{ background: '#E2E1DC' }} />

                {/* Location dropdown */}
                <div className="relative flex-shrink-0" ref={areaRef}>
                  <button
                    type="button"
                    onClick={() => setAreaOpen(s => !s)}
                    className="flex h-full items-center gap-1.5 px-4 text-sm font-medium transition-colors hover:bg-gray-50"
                    style={{ color: '#6B7280', fontFamily: 'DM Sans, sans-serif', minWidth: 148 }}
                  >
                    <span className="truncate">{area}</span>
                    <ChevronDown
                      className="h-3.5 w-3.5 flex-shrink-0 transition-transform"
                      style={{ transform: areaOpen ? 'rotate(180deg)' : 'none', color: '#9CA3AF' }}
                    />
                  </button>

                  {areaOpen && (
                    <div
                      className="absolute left-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-xl bg-white py-1"
                      style={{ boxShadow: '0 8px 24px rgba(0,0,0,.14)', border: '1px solid #E2E1DC' }}
                    >
                      {DMV_AREAS.map(a => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => { setArea(a); setAreaOpen(false) }}
                          className="flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50"
                          style={{
                            color: a === area ? '#C8521A' : '#374151',
                            fontWeight: a === area ? 600 : 400,
                            fontFamily: 'DM Sans, sans-serif',
                          }}
                        >
                          {a === area && <span className="mr-2 text-[#C8521A]">✓</span>}
                          {a}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search button */}
                <button
                  type="submit"
                  className="flex flex-shrink-0 items-center gap-2 px-6 py-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
                  style={{
                    background: '#C8521A',
                    fontFamily: 'Syne, sans-serif',
                    letterSpacing: '0.01em',
                    borderRadius: '0 12px 12px 0',
                  }}
                >
                  Search
                </button>
              </div>
            </form>

            {/* Quick-select pills — match screenshot style */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginRight: 2 }}>Try:</span>
              {PILLS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => router.push(`/concept?q=${encodeURIComponent(p)}`)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium transition-all hover:-translate-y-px"
                  style={{
                    background: 'rgba(255,255,255,.09)',
                    color: 'rgba(255,255,255,.6)',
                    border: '1px solid rgba(255,255,255,.12)',
                    fontFamily: 'DM Sans, sans-serif',
                    letterSpacing: '0.01em',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget
                    el.style.background = 'rgba(200,82,26,.18)'
                    el.style.color = '#E8733D'
                    el.style.borderColor = 'rgba(200,82,26,.35)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget
                    el.style.background = 'rgba(255,255,255,.09)'
                    el.style.color = 'rgba(255,255,255,.6)'
                    el.style.borderColor = 'rgba(255,255,255,.12)'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Path buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              {[
                { dot: '#C8521A', label: 'Start your AI design',  sub: 'Design + permits · from $395', href: '/concept' },
                { dot: '#4A8FA8', label: 'Get your permits',       sub: 'Have drawings · from $149',   href: '/permits' },
                { dot: '#3A7D52', label: 'Find a contractor',      sub: 'No design needed · free',      href: '/#marketplace' },
              ].map(btn => (
                <Link
                  key={btn.label}
                  href={btn.href}
                  className="flex items-center gap-2 transition-all"
                  style={{
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,.1)',
                    background: 'rgba(255,255,255,.04)',
                    backdropFilter: 'blur(8px)',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget
                    el.style.background = 'rgba(255,255,255,.09)'
                    el.style.borderColor = 'rgba(255,255,255,.2)'
                    el.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget
                    el.style.background = 'rgba(255,255,255,.04)'
                    el.style.borderColor = 'rgba(255,255,255,.1)'
                    el.style.transform = 'none'
                  }}
                >
                  <div className="h-[7px] w-[7px] rounded-full flex-shrink-0" style={{ background: btn.dot }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,.85)', lineHeight: 1 }}>{btn.label}</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', letterSpacing: '.02em', marginTop: 3 }}>{btn.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* RIGHT: live dashboard panel — hidden on mobile via CSS */}
          <div className="hero-panel-col">
            <DashboardPanel />
          </div>
        </div>

        {/* Role card strip — full-width below the 2-col grid */}
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { tag: 'Homeowner', title: 'Start a home project', body: 'AI concept, permits, and vetted contractor — all in one place.', href: '/concept', linkLabel: 'Get started →', linkColor: '#C8521A' },
            { tag: 'Contractor', title: 'Win more work', body: 'AI-matched leads, milestone payments, and a full construction OS.', href: '/contractors', linkLabel: 'Join free →', linkColor: '#4A8FA8' },
            { tag: 'Developer', title: 'Scale your portfolio', body: 'Feasibility, capital stack, digital twins, and investor reporting.', href: '/developers', linkLabel: 'Explore tools →', linkColor: '#3A7D52' },
          ].map(card => (
            <div
              key={card.tag}
              className="rounded-[14px] p-5 transition-all"
              style={{
                background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(255,255,255,.09)',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.background = 'rgba(255,255,255,.07)'
                el.style.borderColor = 'rgba(255,255,255,.16)'
                el.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.background = 'rgba(255,255,255,.04)'
                el.style.borderColor = 'rgba(255,255,255,.09)'
                el.style.transform = 'none'
              }}
            >
              <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(255,255,255,.3)', marginBottom: 8 }}>{card.tag}</p>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,.85)', fontFamily: 'Syne, sans-serif', marginBottom: 6 }}>{card.title}</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', lineHeight: 1.5, marginBottom: 12 }}>{card.body}</p>
              <Link
                href={card.href}
                style={{ fontSize: 13, fontWeight: 600, color: card.linkColor, textDecoration: 'none' }}
              >
                {card.linkLabel}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Dark-to-light transition */}
      <div
        style={{
          height: 80,
          background: 'linear-gradient(to bottom, transparent 0%, #ffffff 100%)',
          position: 'relative',
          zIndex: 2,
        }}
      />

      {/* Responsive styles */}
      <style jsx>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px) }
          to   { opacity: 1; transform: translateY(0) }
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 48px;
          align-items: start;
        }

        .hero-panel-col {
          display: none;
        }

        @media (min-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr 380px;
          }
          .hero-panel-col {
            display: block;
          }
        }

        @media (min-width: 1024px) {
          .hero-grid {
            grid-template-columns: 1fr 480px;
          }
        }
      `}</style>
    </section>
  )
}
