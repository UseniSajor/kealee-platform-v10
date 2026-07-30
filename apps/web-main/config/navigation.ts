/**
 * config/navigation.ts
 *
 * Single source of truth for all Kealee navigation structure.
 * Used by GlobalNav, MobileNav, and sitemap generation.
 */
import { CONCEPT_START_PRICE, formatPrice } from '@kealee/core-rules'

export interface NavLink {
  type?: 'link'
  label: string
  href:  string
  description?: string
  badge?: string
  external?: boolean
}

export interface NavDropdown {
  label:    string
  href?:    string
  groups:   NavGroup[]
  featured?: NavLink
}

export interface NavGroup {
  title?:  string
  links:   NavLink[]
}

export type NavItem = NavLink | (NavDropdown & { type: 'dropdown' })

// ── Primary navigation items ──────────────────────────────────────────────────

export const PRIMARY_NAV: NavItem[] = [
  // 1 — Start your design (AI Concept Engine)
  {
    label: 'Start your design',
    type:  'dropdown',
    href:  '/concept-engine',
    groups: [
      {
        title: 'Choose Your Design Path',
        links: [
          {
            label:       'Exterior Design',
            href:        '/concept-engine/exterior',
            description: 'Facade, curb appeal, landscaping, hardscaping, outdoor living',
          },
          {
            label:       'Garden & Farming',
            href:        '/concept-engine/garden',
            description: 'Raised beds, backyard farming, irrigation, greenhouse design',
            badge:       'New',
          },
          {
            label:       'Kitchen Remodel',
            href:        '/products/kitchen-remodel',
            description: 'AI concept, permit scope, layout options — in 24 hours',
          },
          {
            label:       'Bathroom Remodel',
            href:        '/products/bath-remodel',
            description: 'Layout options, fixture placement, permit scope, cost band',
          },
          {
            label:       'Whole Home Renovation',
            href:        '/concept-engine/whole-home',
            description: 'Floor plan redesign, structural, systems, every room',
          },
          {
            label:       'Interior Reno & Addition',
            href:        '/concept-engine/interior-reno',
            description: 'Room additions, layout changes, ADUs, and interior redesign',
          },
        ],
      },
    ],
    featured: {
      label:       `AI Concept Engine — From ${formatPrice(CONCEPT_START_PRICE)}`,
      href:        '/concept-engine',
      description: 'AI-generated design + contractor-ready PDF · 5–7 business day delivery',
    },
  },

  // 2 — Products (all services dropdown)
  {
    label: 'Products',
    type:  'dropdown',
    href:  '/products',
    groups: [
      {
        title: 'Plan & Understand',
        links: [
          { label: 'Site Intelligence',         href: '/products#site-intelligence', description: 'Site plans, zoning, constraints, and buildability' },
          { label: 'Concept & Planning',        href: '/products#concept-planning', description: 'Concepts, preliminary layouts, scope, and feasibility' },
          { label: 'Estimation',                href: '/products#estimation', description: 'Planning and professionally reviewed estimates' },
        ],
      },
      {
        title: 'Advance & Execute',
        links: [
          { label: 'Permits & Professional',    href: '/products#permits-professional', description: 'Permit path, drawings, filing, and coordination' },
          { label: 'Construction Execution',    href: '/products#construction-execution', description: 'Professional handoff, contractor match, and support' },
          { label: 'Marketplace',               href: '/marketplace', description: 'Contractor and developer services' },
        ],
      },
    ],
    featured: {
      label:       'All Products →',
      href:        '/products',
      description: 'Every Kealee service in one place · Per-service pricing',
    },
  },

  // 3 — Get Permits
  { label: 'Get Permits', href: '/permits' },

  // 4 — Get Estimate
  { label: 'Get Estimate', href: '/estimate' },

  // 5 — Contractor and developer services are marketplace-only.
  { label: 'Marketplace', href: '/marketplace' },
]

// ── CTA buttons ───────────────────────────────────────────────────────────────

export const NAV_CTA_PRIMARY   = { label: 'Plan my project', href: '/get-started' }
/** Shown when NEXT_PUBLIC_KEALEE_V30_ENABLED=true (GlobalNav / MobileNav). */
export const NAV_CTA_V30       = { label: 'Plan my project', href: '/get-started' }
export const NAV_CTA_SECONDARY = { label: 'Join Marketplace', href: '/marketplace?audience=contractor' }

/** Login dropdown entries — shown in nav, never internal routes */
export const NAV_LOGIN_OPTIONS = [
  { label: 'Client / Contractor Login', href: '/auth/login',  description: 'Owner, contractor, and developer accounts' },
  { label: 'Choose your portal',        href: '/signin',      description: 'Pick Homeowner, Contractor, Developer, or staff' },
]

// ── Footer links ──────────────────────────────────────────────────────────────

export const FOOTER_NAV = {
  platform: [
    { label: 'Start Your Design',          href: '/concept-engine' },
    { label: 'All Products',               href: '/products' },
    { label: 'Get Permits',                href: '/permits' },
    { label: 'Get an Estimate',            href: '/estimate' },
    { label: 'Contractor Marketplace',     href: '/marketplace' },
    { label: 'Design Services',            href: '/design-services' },
    { label: 'Payments & Escrow',          href: '/milestone-pay' },
  ],
  solutions: [
    { label: 'For Homeowners',             href: '/homeowners' },
    { label: 'Garden & Farming',           href: '/homeowners/garden-farming' },
    { label: 'Construction Marketplace',   href: '/marketplace' },
    { label: 'Get Estimate',               href: '/estimate' },
    { label: 'Design Services',            href: '/design-services' },
    { label: 'Milestone Pay',              href: '/milestone-pay' },
  ],
  portals: [
    { label: 'Client Login',               href: '/auth/login' },
    { label: 'Owner Portal',               href: process.env.NEXT_PUBLIC_OWNER_PORTAL_URL ?? '/signin' },
    { label: 'Marketplace Login',          href: '/auth/login?next=/marketplace' },
  ],
  company: [
    { label: 'About Us',                   href: '/about' },
    { label: 'Blog',                       href: '/blog' },
    { label: 'FAQ',                        href: '/faq' },
    { label: 'Contact',                    href: '/contact' },
    { label: 'Pricing',                    href: '/pricing' },
  ],
  legal: [
    { label: 'Terms of Service',           href: '/terms' },
    { label: 'Privacy Policy',             href: '/privacy' },
    { label: 'Delivery & Refund Policy',   href: '/service-policies' },
  ],
}
