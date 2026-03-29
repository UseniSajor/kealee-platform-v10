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
  // 1 — Start your design (AI Concept Engine)
  {
    label: 'Start your design',
    type:  'dropdown',
    href:  '/concept',
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
            href:        '/intake/developer_concept',
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

  // 3 — For Contractors (direct link to landing page)
  { label: 'For Contractors', href: '/contractors' },

  // 4 — For Developers (direct link to landing page)
  { label: 'For Developers', href: '/developers' },

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
    { label: 'Start Your Design',          href: '/concept' },
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
