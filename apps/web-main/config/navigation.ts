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
  {
    label: 'Services',
    type:  'dropdown',
    href:  '/#choose-service',
    groups: [
      {
        title: 'Plan, approve, and build',
        links: [
          { label: '1. Site Plan', href: '/services/site-plan', description: 'Understand the property and what may fit' },
          { label: '2. Design Concept', href: '/services/design-concept', description: 'Visualize the idea, layout, scope, and materials' },
          { label: '3. Cost Estimate', href: '/services/cost-estimate', description: 'Understand labor, materials, allowances, and risk' },
          { label: '4. Permits', href: '/services/permits', description: 'Prepare the right documents and approval path' },
          { label: '5. Contractor Match', href: '/services/contractor-match', description: 'Compare qualified contractors on one scope' },
          { label: '6. Escrow & Protection', href: '/services/escrow-protection', description: 'Connect payments to approved milestones' },
        ],
      },
    ],
    featured: {
      label:       'Not sure where to start?',
      href:        '/request-service?service=project-clarity&name=Project%20Clarity',
      description: 'Tell us the goal and get a clear recommendation',
    },
  },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'For Contractors', href: '/contractors' },
]

// ── CTA buttons ───────────────────────────────────────────────────────────────

export const NAV_CTA_PRIMARY   = { label: 'Choose a service', href: '/#choose-service' }
/** Shown when NEXT_PUBLIC_KEALEE_V30_ENABLED=true (GlobalNav / MobileNav). */
export const NAV_CTA_V30       = { label: 'Choose a service', href: '/#choose-service' }
export const NAV_CTA_SECONDARY = { label: 'Join as Contractor',   href: '/contractor/register' }

/** Login dropdown entries — shown in nav, never internal routes */
export const NAV_LOGIN_OPTIONS = [
  { label: 'Client / Contractor Login', href: '/auth/login',  description: 'Owner, contractor, and developer accounts' },
  { label: 'Choose your portal',        href: '/login',       description: 'Pick Project Owner, Contractor, Developer, or staff' },
]

// ── Footer links ──────────────────────────────────────────────────────────────

export const FOOTER_NAV = {
  platform: [
    { label: 'Site Plan',                   href: '/services/site-plan' },
    { label: 'Design Concept',              href: '/services/design-concept' },
    { label: 'Cost Estimate',               href: '/services/cost-estimate' },
    { label: 'Permits',                     href: '/services/permits' },
    { label: 'Contractor Match',            href: '/services/contractor-match' },
    { label: 'Escrow & Payment Protection', href: '/services/escrow-protection' },
  ],
  solutions: [
    { label: 'For Project Owners',         href: '/homeowners' },
    { label: 'Garden & Farming',           href: '/homeowners/garden-farming' },
    { label: 'For Contractors',            href: '/contractors' },
    { label: 'Get Estimate',               href: '/products/detailed_estimate' },
    { label: 'Design Services',            href: '/design-services' },
    { label: 'Milestone Pay',              href: '/milestone-pay' },
  ],
  portals: [
    { label: 'Client Login',               href: '/auth/login' },
    { label: 'Owner Portal',               href: process.env.NEXT_PUBLIC_OWNER_PORTAL_URL ?? '/login' },
    { label: 'Contractor Portal',          href: process.env.NEXT_PUBLIC_CONTRACTOR_PORTAL_URL ?? '/login' },
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
