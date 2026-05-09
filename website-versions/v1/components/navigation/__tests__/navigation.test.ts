/**
 * Navigation system unit tests
 * Tests config structure, type safety, and link integrity — no DOM rendering needed.
 */

import {
  PRIMARY_NAV,
  NAV_CTA_PRIMARY,
  NAV_LOGIN_OPTIONS,
  FOOTER_NAV,
  type NavItem,
} from '../../../config/navigation'

// ─── PRIMARY_NAV ────────────────────────────────────────────────────────────

describe('PRIMARY_NAV', () => {
  it('exports an array of nav items', () => {
    expect(Array.isArray(PRIMARY_NAV)).toBe(true)
    expect(PRIMARY_NAV.length).toBeGreaterThan(0)
  })

  it('every item has a label', () => {
    PRIMARY_NAV.forEach(item => {
      expect(typeof item.label).toBe('string')
      expect(item.label.length).toBeGreaterThan(0)
    })
  })

  it('every non-dropdown item has an href starting with /', () => {
    PRIMARY_NAV.forEach(item => {
      if (!('type' in item) || item.type !== 'dropdown') {
        expect(item.href).toMatch(/^\//)
      }
    })
  })

  it('every dropdown-type item has groups array', () => {
    const dropdowns = PRIMARY_NAV.filter(i => i.type === 'dropdown')
    expect(dropdowns.length).toBeGreaterThan(0)
    dropdowns.forEach(item => {
      if (item.type === 'dropdown') {
        expect(Array.isArray(item.groups)).toBe(true)
        expect(item.groups.length).toBeGreaterThan(0)
      }
    })
  })

  it('all dropdown group links have href and label', () => {
    PRIMARY_NAV.filter(i => i.type === 'dropdown').forEach(item => {
      if (item.type === 'dropdown') {
        item.groups.forEach(group => {
          group.links.forEach(link => {
            expect(typeof link.label).toBe('string')
            expect(link.href).toMatch(/^\//)
          })
        })
      }
    })
  })

  it('includes a Pricing nav item', () => {
    const pricing = PRIMARY_NAV.find(i => i.label === 'Pricing')
    expect(pricing).toBeDefined()
  })

  it('includes role nav items for Contractors and Developers', () => {
    const labels = PRIMARY_NAV.map(i => i.label)
    expect(labels).toContain('For Contractors')
    expect(labels).toContain('For Developers')
  })

  it('AI Concept Engine item points to /concept', () => {
    const conceptItem = PRIMARY_NAV.find(i => i.label === 'AI Concept Engine')
    expect(conceptItem?.href).toBe('/concept')
  })
})

// ─── CTAs ────────────────────────────────────────────────────────────────────

describe('NAV CTAs', () => {
  it('NAV_CTA_PRIMARY has label and href', () => {
    expect(typeof NAV_CTA_PRIMARY.label).toBe('string')
    expect(NAV_CTA_PRIMARY.href).toMatch(/^\//)
  })

  it('NAV_LOGIN_OPTIONS is a non-empty array with label and href', () => {
    expect(Array.isArray(NAV_LOGIN_OPTIONS)).toBe(true)
    expect(NAV_LOGIN_OPTIONS.length).toBeGreaterThan(0)
    NAV_LOGIN_OPTIONS.forEach(opt => {
      expect(typeof opt.label).toBe('string')
      expect(opt.href).toMatch(/^\//)
    })
  })

  it('NAV_LOGIN_OPTIONS includes a client/contractor login option', () => {
    const client = NAV_LOGIN_OPTIONS.find(o => o.href === '/auth/sign-in')
    expect(client).toBeDefined()
  })
})

// ─── FOOTER_NAV ──────────────────────────────────────────────────────────────

describe('FOOTER_NAV', () => {
  it('has platform, portals, company, and legal sections', () => {
    expect(Array.isArray(FOOTER_NAV.platform)).toBe(true)
    expect(Array.isArray(FOOTER_NAV.portals)).toBe(true)
    expect(Array.isArray(FOOTER_NAV.company)).toBe(true)
    expect(Array.isArray(FOOTER_NAV.legal)).toBe(true)
  })

  it('every footer link has a label and href', () => {
    const allLinks = [
      ...FOOTER_NAV.platform,
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
})

// ─── Deduplication ───────────────────────────────────────────────────────────

describe('Navigation deduplication', () => {
  it('no duplicate labels in PRIMARY_NAV', () => {
    const labels = PRIMARY_NAV.map(i => i.label)
    const unique = new Set(labels)
    expect(unique.size).toBe(labels.length)
  })

  it('no duplicate hrefs in footer platform section', () => {
    const hrefs = FOOTER_NAV.platform.map(l => l.href)
    const unique = new Set(hrefs)
    expect(unique.size).toBe(hrefs.length)
  })
})
