/**
 * Navigation system unit tests
 * Tests config structure, type safety, and link integrity — no DOM rendering needed.
 *
 * NAV_SECTIONS is the real topbar nav (components/nav.tsx, rendered via SiteNav
 * in app/layout.tsx). config/navigation.ts only holds the footer nav now — the
 * old PRIMARY_NAV/GlobalNav/MobileNav system was dead code, never rendered
 * anywhere, and has been removed along with its tests.
 */

import { describe, it, expect } from 'vitest'
import { NAV_SECTIONS } from '../../nav'
import { FOOTER_NAV } from '../../../config/navigation'

// ─── NAV_SECTIONS ───────────────────────────────────────────────────────────

describe('NAV_SECTIONS', () => {
  it('exports a non-empty array of nav sections', () => {
    expect(Array.isArray(NAV_SECTIONS)).toBe(true)
    expect(NAV_SECTIONS.length).toBeGreaterThan(0)
  })

  it('every section has a label and an href starting with /', () => {
    NAV_SECTIONS.forEach(section => {
      expect(typeof section.label).toBe('string')
      expect(section.label.length).toBeGreaterThan(0)
      expect(section.href).toMatch(/^\//)
    })
  })

  it('every dropdown item has a label and an href starting with /', () => {
    NAV_SECTIONS.filter(s => s.dropdown).forEach(section => {
      section.dropdown!.forEach(item => {
        expect(typeof item.label).toBe('string')
        expect(item.href).toMatch(/^\//)
      })
    })
  })

  it('is organized around outcome questions, not internal catalog terminology', () => {
    const labels = NAV_SECTIONS.map(s => s.label)
    expect(labels).toContain('Site Plans & Feasibility')
    expect(labels).toContain('Design My Project')
    expect(labels).toContain('What Will It Cost?')
    expect(labels).toContain('Permits & Plans')
    expect(labels).not.toContain('Find a Professional')
  })

  it('does not advertise the professional marketplace in the topbar', () => {
    expect(NAV_SECTIONS.some(s => s.href === '/marketplace')).toBe(false)
  })

  it('includes the public Site Plans entry point', () => {
    const sitePlans = NAV_SECTIONS.find(s => s.label === 'Site Plans & Feasibility')
    expect(sitePlans?.href).toBe('/site-plans')
  })

  it('no duplicate labels', () => {
    const labels = NAV_SECTIONS.map(s => s.label)
    const unique = new Set(labels)
    expect(unique.size).toBe(labels.length)
  })

  it('no duplicate top-level hrefs', () => {
    const hrefs = NAV_SECTIONS.map(s => s.href)
    const unique = new Set(hrefs)
    expect(unique.size).toBe(hrefs.length)
  })
})

// ─── FOOTER_NAV ──────────────────────────────────────────────────────────────

describe('FOOTER_NAV', () => {
  it('has portals, company, and legal sections (services live in the topbar nav, not the footer)', () => {
    expect(Array.isArray(FOOTER_NAV.portals)).toBe(true)
    expect(Array.isArray(FOOTER_NAV.company)).toBe(true)
    expect(Array.isArray(FOOTER_NAV.legal)).toBe(true)
  })

  it('every footer link has a label and href', () => {
    const allLinks = [
      ...FOOTER_NAV.portals,
      ...FOOTER_NAV.company,
      ...FOOTER_NAV.legal,
    ]
    expect(allLinks.length).toBeGreaterThan(0)
    allLinks.forEach(link => {
      expect(typeof link.label).toBe('string')
      expect(typeof link.href).toBe('string')
      expect(link.href.length).toBeGreaterThan(0)
    })
  })

  it('legal section includes Terms and Privacy links', () => {
    const labels = FOOTER_NAV.legal.map(l => l.label)
    expect(labels.some(l => l.toLowerCase().includes('terms'))).toBe(true)
    expect(labels.some(l => l.toLowerCase().includes('privacy'))).toBe(true)
  })

  it('portals section does NOT contain Command Center or OS Admin', () => {
    const labels = FOOTER_NAV.portals.map(l => l.label.toLowerCase())
    expect(labels.every(l => !l.includes('command') && !l.includes('admin'))).toBe(true)
  })

  it('no duplicate hrefs in footer portals section', () => {
    const hrefs = FOOTER_NAV.portals.map(l => l.href)
    const unique = new Set(hrefs)
    expect(unique.size).toBe(hrefs.length)
  })
})
