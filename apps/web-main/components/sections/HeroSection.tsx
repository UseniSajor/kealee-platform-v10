'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Suggestion {
  path: string
  label: string
  directRoute?: boolean
}

const PILLS = [
  'Kitchen remodel', 'Home addition', 'ADU', 'Tiny home',
  'Whole home reno', 'New build', 'Exterior upgrade', 'Landscape', 'Garden', 'Permit filing',
]

const AREAS = [
  'All DMV areas',
  'Washington DC',
  'Montgomery County MD',
  "Prince George's County MD",
  'Fairfax County VA',
  'Arlington / Alexandria VA',
  'Prince William County VA',
  'Northern Virginia',
]

export default function HeroSection() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [area, setArea] = useState('All DMV areas')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onQueryChange = useCallback((val: string) => {
    setQuery(val)
    setActiveIdx(-1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.trim().length < 2) { setSuggestions([]); setSuggestOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`)
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data.suggestions ?? [])
          setSuggestOpen(true)
        }
      } catch { /* silent */ }
    }, 240)
  }, [])

  const navigate = useCallback((q: string, suggestion?: Suggestion) => {
    setSuggestOpen(false)
    if (suggestion?.directRoute) {
      router.push(`/intake/${suggestion.path}`)
    } else if (suggestion) {
      router.push(`/concept?path=${suggestion.path}&q=${encodeURIComponent(q)}`)
    } else {
      router.push(`/concept?q=${encodeURIComponent(q)}`)
    }
  }, [router])

  const pickSuggestion = useCallback((s: Suggestion) => {
    setQuery(s.label)
    navigate(s.label, s)
  }, [navigate])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query }),
      })
      if (res.ok) {
        const data = await res.json()
        navigate(query, data)
      } else {
        navigate(query)
      }
    } catch {
      navigate(query)
    } finally {
      setLoading(false)
    }
  }, [query, navigate])

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!suggestOpen || suggestions.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)) }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); pickSuggestion(suggestions[activeIdx]) }
    else if (e.key === 'Escape') { setSuggestOpen(false) }
  }, [suggestOpen, suggestions, activeIdx, pickSuggestion])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setSuggestOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="hero">
      {/* Background image at 10% opacity */}
      <div className="hbg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&q=50&auto=format&fit=crop" alt="" />
        <div className="hbg-overlay" />
      </div>

      <div className="hi-wrap">
        <div className="search-wrap">
          <h1 className="sh1">What are you<br />building<em>?</em></h1>
          <p className="sh2">Upload photos. Get a floor plan in 24 hours. We file your permit. You hire from verified contractors. Every payment is held in escrow.</p>

          <div ref={wrapRef} style={{ position: 'relative' }}>
            <form className="sbar" onSubmit={handleSubmit}>
              <div className="si-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <input
                className="sinput"
                type="text"
                placeholder="Kitchen remodel, ADU, tiny home, deck, landscape..."
                value={query}
                onChange={e => onQueryChange(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={() => { if (suggestions.length > 0) setSuggestOpen(true) }}
                autoComplete="off"
              />
              <div className="sdiv" />
              <select className="ssel" value={area} onChange={e => setArea(e.target.value)}>
                {AREAS.map(a => <option key={a}>{a}</option>)}
              </select>
              <button type="submit" className="sgo" disabled={loading}>
                {loading ? 'Searching…' : 'Search'}
              </button>
            </form>

            {suggestOpen && suggestions.length > 0 && (
              <div style={{ position: 'absolute', left: 0, right: 0, zIndex: 30, marginTop: 4, overflow: 'hidden', borderRadius: 12, background: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,.18)', border: '1px solid #E2E1DC' }}>
                {suggestions.map((s, i) => (
                  <button key={s.path} type="button"
                    onMouseDown={e => { e.preventDefault(); pickSuggestion(s) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', border: 'none', background: i === activeIdx ? '#FFF5F0' : 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 14, color: '#1A1C1B', fontFamily: 'var(--font-dm, DM Sans, sans-serif)' }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" style={{ width: 14, height: 14, flexShrink: 0 }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pills">
            {PILLS.map(pill => (
              <button key={pill} type="button" className="pill"
                onClick={() => { setQuery(pill); navigate(pill) }}>
                {pill}
              </button>
            ))}
          </div>
        </div>

        {/* Role cards */}
        <div className="rrow">
          <div className="rcard">
            <div className="rtag"><span className="rdot" />&nbsp;Homeowner &amp; project owner</div>
            <h3>Plan, permit, and build</h3>
            <p>$395 gets you a floor plan, zoning check, cost band, and permit risk report — in 24 hours.</p>
            <a href="/#concept" className="rlink">Start your project</a>
          </div>
          <div className="rcard">
            <div className="rtag"><span className="rdot" style={{ background: 'var(--blue)' }} />&nbsp;Contractor / General contractor</div>
            <h3>Project leads and PM platform</h3>
            <p>Verified leads matched to your trade, location, and license. PM platform and operations services.</p>
            <a href="/contractors" className="rlink" style={{ color: 'var(--blue)' }}>Contractor portal</a>
          </div>
          <div className="rcard">
            <div className="rtag"><span className="rdot" style={{ background: 'var(--green)' }} />&nbsp;Developer / Investor</div>
            <h3>Feasibility, capital stack, permits</h3>
            <p>Parcel scoring, pro forma modeling, capital stack structuring, and DMV entitlement support.</p>
            <a href="/developers" className="rlink" style={{ color: 'var(--green)' }}>Developer portal</a>
          </div>
        </div>
      </div>
    </div>
  )
}
