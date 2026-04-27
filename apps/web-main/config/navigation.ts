/**
 * config/navigation.ts
 *
 * Single source of truth for all Kealee navigation structure.
 * Used by GlobalNav, MobileNav, and sitemap generation.
 */

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
          {
            label:       'Developer Concept',
            href:        '/intake/developer_concept',
            description: 'Multifamily, mixed-use, and new development project concepts',
          },
        ],
      },
    ],
    featured: {
      label:       'AI Concept Engine — From $395',
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
        title: 'AI Design',
        links: [
          { label: 'Whole Home Renovation',    href: '/products/whole-home',      description: 'Full concept, permits, contractor — From $585' },
          { label: 'Kitchen Remodel',          href: '/products/kitchen-remodel', description: 'Layouts, permit scope, cost band — From $395' },
          { label: 'Bathroom Remodel',         href: '/products/bath-remodel',    description: 'Layout, fixtures, permit scope — From $395' },
          { label: 'Exterior Renovation',      href: '/products/exterior',        description: 'Facade, deck, siding, windows — From $395' },
          { label: 'ADU & In-Law Suite',       href: '/products/adu',             description: 'Zoning check, concept, permit — From $395' },
          { label: 'Basement Finish',          href: '/products/basement',        description: 'Egress check, layouts, permits — From $395' },
        ],
      },
      {
        title: 'Garden & Landscape',
        links: [
          { label: 'Garden & Farming Design',  href: '/products/garden',          description: 'Raised beds, irrigation, AI concept — From $395' },
          { label: 'Landscape Design & Install', href: '/products/landscape',     description: 'Beds, hardscape, drainage — From $395' },
        ],
      },
      {
        title: 'Permits & Estimation',
        links: [
          { label: 'Permit Package',           href: '/products/permit-package',   description: 'File, track, respond — From $149' },
          { label: 'Permit Research',          href: '/products/permit-research',  description: 'Know what you need before filing — $297' },
          { label: 'Cost Estimate',            href: '/products/cost-estimate',    description: 'RSMeans-validated, lender-ready — From $595' },
        ],
      },
      {
        title: 'Design & Construction',
        links: [
          { label: 'Design Starter',           href: '/products/design-starter',  description: 'Schematic drawings from licensed pro — $1,200' },
          { label: 'PM Advisory',              href: '/products/pm-advisory',     description: 'Monthly site visits, milestone approvals — $950' },
          { label: 'ADU Bundle',               href: '/products/adu-bundle',      description: 'Concept + permit bundled — $1,345' },
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

  // 5 — For Contractors (direct link to landing page)
  { label: 'For Contractors', href: '/contractors' },

  // 6 — For Developers (direct link to landing page)
  { label: 'For Developers', href: '/developers' },
]

// ── CTA buttons ───────────────────────────────────────────────────────────────

export const NAV_CTA_PRIMARY   = { label: 'Start your design',    href: '/concept-engine' }
export const NAV_CTA_SECONDARY = { label: 'Join as Contractor',   href: '/contractor/register' }

/** Login dropdown entries — shown in nav, never internal routes */
export const NAV_LOGIN_OPTIONS = [
  { label: 'Client / Contractor Login', href: '/auth/sign-in',   description: 'Owner, contractor, and developer accounts' },
  { label: 'Internal Login',            href: '/auth/internal',  description: 'Kealee team access only' },
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
    { label: 'AI KeaBots',                 href: '/#keabots' },
  ],
  solutions: [
    { label: 'For Homeowners',             href: '/homeowners' },
    { label: 'Garden & Farming',           href: '/homeowners/garden-farming' },
    { label: 'For Developers',             href: '/developers' },
    { label: 'For Contractors',            href: '/contractors' },
    { label: 'Commercial Projects',        href: '/commercial' },
    { label: 'Government',                 href: '/government' },
    { label: 'Get Estimate',               href: '/estimate' },
    { label: 'Design Services',            href: '/design-services' },
    { label: 'Milestone Pay',              href: '/milestone-pay' },
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
