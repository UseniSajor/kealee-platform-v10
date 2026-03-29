/**
 * config/navigation.ts
 *
 * Single source of truth for all Kealee navigation structure.
 * Used by GlobalNav, MobileNav, and sitemap generation.
 */

export interface NavLink {
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
  // 1 — AI Concept Engine
  {
    label: 'AI Concept Engine',
    type:  'dropdown',
    href:  '/concept',
    groups: [
      {
        title: 'Choose Your Design Path',
        links: [
          {
            label:       'Exterior Design',
            href:        '/concept-engine/homeowner',
            description: 'Facade, curb appeal, landscaping, hardscaping, outdoor living',
          },
          {
            label:       'Garden & Farming',
            href:        '/concept-engine/garden',
            description: 'Raised beds, backyard farming, irrigation, greenhouse design',
            badge:       'New',
          },
          {
            label:       'Whole Home Renovation',
            href:        '/concept-engine/whole-home',
            description: 'Floor plan redesign, structural, systems, every room',
          },
          {
            label:       'Interior Reno & Addition',
            href:        '/concept-engine/interior-reno',
            description: 'Kitchen, bath, additions, ADUs, and full interior redesign',
          },
          {
            label:       'Developer Concept',
            href:        '/concept-engine/developer',
            description: 'Multifamily, mixed-use, and new development project concepts',
          },
        ],
      },
    ],
    featured: {
      label:       'AI Concept Package — From $395',
      href:        '/concept',
      description: 'AI-generated design + contractor-ready PDF · 5–7 business day delivery',
    },
  },

  // 2 — Get Permits
  { label: 'Get Permits', href: '/permits' },

  // 3 — For Contractors
  {
    label: 'For Contractors',
    type:  'dropdown',
    href:  '/contractors',
    groups: [
      {
        title: 'Join & Win Work',
        links: [
          {
            label:       'Join as GC / Contractor',
            href:        '/contractor/register',
            description: 'Get verified and start winning AI-matched project bids',
            badge:       'Apply',
          },
          {
            label:       'Browse Open Projects',
            href:        '/marketplace',
            description: 'Find projects matched to your trade, license, and area',
          },
          {
            label:       'AI Bid Assistant',
            href:        '/contractors#keabot',
            description: 'KeaBot GC helps you prepare competitive bids from plans and specs',
            badge:       'AI',
          },
        ],
      },
      {
        title: 'Run Your Business',
        links: [
          {
            label:       'Construction OS',
            href:        '/contractors#os',
            description: 'Schedules, RFIs, punch lists, daily logs, and milestone payments',
          },
          {
            label:       'Milestone Payments',
            href:        '/contractors#payments',
            description: 'Escrow-backed payments released at each verified milestone',
          },
        ],
      },
    ],
    featured: {
      label:       'Apply to Join',
      href:        '/contractor/register',
      description: 'Licensed & insured contractors — verified in 48 hours',
    },
  },

  // 4 — For Developers
  {
    label: 'For Developers',
    type:  'dropdown',
    href:  '/developers',
    groups: [
      {
        title: 'Development Tools',
        links: [
          {
            label:       'Land Intelligence',
            href:        '/developers#land',
            description: 'Parcel analysis, zoning, and AI-powered due diligence',
          },
          {
            label:       'Feasibility Studies',
            href:        '/developers#feasibility',
            description: 'AI-assisted pro forma modeling and go/no-go analysis',
          },
          {
            label:       'Digital Twin Platform',
            href:        '/developers#ddts',
            description: 'Live digital model of every project in your portfolio',
          },
          {
            label:       'Developer Concept',
            href:        '/concept-engine/developer',
            description: 'AI concept packages for new development projects',
            badge:       'AI',
          },
        ],
      },
    ],
    featured: {
      label:       'Start a Feasibility',
      href:        '/developers',
      description: 'Land · Feasibility · Capital · Portfolio — one AI-powered platform',
    },
  },

  // 5 — Pricing
  { label: 'Pricing', href: '/pricing' },
]

// ── CTA buttons ───────────────────────────────────────────────────────────────

export const NAV_CTA_PRIMARY   = { label: 'Get Started',            href: '/concept' }
export const NAV_CTA_SECONDARY = { label: 'Join as Contractor',     href: '/contractor/register' }

/** Login dropdown entries — shown in nav, never internal routes */
export const NAV_LOGIN_OPTIONS = [
  { label: 'Client / Contractor Login', href: '/auth/sign-in',   description: 'Owner, contractor, and developer accounts' },
  { label: 'Internal Login',            href: '/auth/internal',  description: 'Kealee team access only' },
]

// ── Footer links ──────────────────────────────────────────────────────────────

export const FOOTER_NAV = {
  platform: [
    { label: 'AI Concept Engine',          href: '/concept' },
    { label: 'Get Permits',                href: '/permits' },
    { label: 'Contractor Marketplace',     href: '/marketplace' },
    { label: 'Construction OS',            href: '/contractors' },
    { label: 'Digital Twins',              href: '/developers#ddts' },
    { label: 'Land Intelligence',          href: '/developers#land' },
    { label: 'Payments & Escrow',          href: '/homeowners#payments' },
    { label: 'AI KeaBots',                 href: '/#keabots' },
  ],
  solutions: [
    { label: 'For Homeowners',             href: '/homeowners' },
    { label: 'Garden & Farming',           href: '/homeowners/garden-farming' },
    { label: 'For Developers',             href: '/developers' },
    { label: 'For Contractors',            href: '/contractors' },
    { label: 'Commercial Projects',        href: '/commercial' },
  ],
  portals: [
    { label: 'Client Login',               href: '/auth/sign-in' },
    { label: 'Owner Portal',               href: process.env.NEXT_PUBLIC_OWNER_PORTAL_URL ?? '/auth/sign-in' },
    { label: 'Contractor Portal',          href: process.env.NEXT_PUBLIC_CONTRACTOR_PORTAL_URL ?? '/auth/sign-in' },
    { label: 'Developer Portal',           href: process.env.NEXT_PUBLIC_DEVELOPER_PORTAL_URL ?? '/auth/sign-in' },
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
  ],
}
