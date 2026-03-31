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
  // 1 — AI Concept Engine (flagship product)
  {
    label: 'AI Concept Engine',
    type:  'dropdown',
    href:  '/concept-engine',
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
      href:        '/get-started',
      description: 'AI design + contractor-ready PDF · 5–7 business day delivery',
    },
  },

  // 2 — For Homeowners
  {
    label: 'For Homeowners',
    type:  'dropdown',
    href:  '/homeowners',
    groups: [
      {
        title: 'Start a Project',
        links: [
          {
            label:       'Get AI Concept Design',
            href:        '/concept-engine',
            description: 'See your project before breaking ground — from $395',
            badge:       'AI',
          },
          {
            label:       'Exterior & Curb Appeal',
            href:        '/homeowners',
            description: 'Facade, landscaping, hardscaping, outdoor living',
          },
          {
            label:       'Garden & Farming',
            href:        '/homeowners/garden-farming',
            description: 'Garden design, raised beds, irrigation, greenhouse build',
          },
          {
            label:       'Whole Home Renovation',
            href:        '/homeowners',
            description: 'Complete transformation — floor plan to finish',
          },
          {
            label:       'Kitchen, Bath & Additions',
            href:        '/homeowners',
            description: 'Interior renovations, room additions, and ADUs',
          },
        ],
      },
      {
        title: 'Manage Your Build',
        links: [
          {
            label:       'Owner Portal',
            href:        '/login',
            description: 'Track progress, approve payments, message your team',
          },
          {
            label:       'Escrow Payments',
            href:        '/homeowners#payments',
            description: 'Milestone-based, escrow-protected payments',
          },
          {
            label:       'AI Project Assistant',
            href:        '/homeowners#keabot',
            description: 'KeaBot Owner — ask anything about your project',
          },
        ],
      },
    ],
    featured: {
      label:       'Start with AI Concept Design',
      href:        '/get-started',
      description: 'Property-specific design concept + consultation — from $395',
    },
  },

  // 3 — For Developers
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
            description: 'Parcel analysis, zoning, and due diligence tools',
          },
          {
            label:       'Feasibility Studies',
            href:        '/developers#feasibility',
            description: 'Pro forma modeling and go/no-go scenario analysis',
          },
          {
            label:       'Development Finance',
            href:        '/developers#finance',
            description: 'Capital stack, draw tracking, investor reporting',
          },
          {
            label:       'Commercial Projects',
            href:        '/commercial',
            description: 'Office, retail, industrial, mixed-use, multifamily',
          },
          {
            label:       'AI Developer Concept',
            href:        '/concept-engine/developer',
            description: 'AI concept packages for new development projects',
            badge:       'AI',
          },
        ],
      },
      {
        title: 'Portals & Dashboards',
        links: [
          {
            label:       'Developer Portal',
            href:        '/login',
            description: 'Portfolio dashboard, analytics, and multi-project reporting',
          },
          {
            label:       'Digital Twin System',
            href:        '/developers#ddts',
            description: 'Live digital model of every project in your portfolio',
          },
          {
            label:       'Property Managers',
            href:        '/property-managers',
            description: 'Capital improvement and portfolio project management',
          },
        ],
      },
    ],
    featured: {
      label:       'Open Developer Portal',
      href:        '/login',
      description: 'Land · Feasibility · Capital · Portfolio — one platform',
    },
  },

  // 4 — For GC & Contractors
  {
    label: 'For GC & Contractors',
    type:  'dropdown',
    href:  '/contractors',
    groups: [
      {
        title: 'Join & Win Work',
        links: [
          {
            label:       'Join as GC / Builder / Contractor',
            href:        '/contractor/register',
            description: 'Get verified and start winning matched project bids',
            badge:       'Apply',
          },
          {
            label:       'Browse Open Projects',
            href:        '/marketplace',
            description: 'Find projects matched to your trade, license, and area',
          },
          {
            label:       'Lead Pipeline',
            href:        '/contractors',
            description: 'Track and respond to matched leads from homeowners',
          },
        ],
      },
      {
        title: 'Run Your Business',
        links: [
          {
            label:       'Contractor Portal',
            href:        '/login',
            description: 'Construction OS — schedules, RFIs, punch lists, payments',
          },
          {
            label:       'KeaBot GC',
            href:        '/contractors#keabot',
            description: 'AI assistant for bids, compliance, and crew management',
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
      description: 'Licensed & insured contractors — apply in minutes',
    },
  },

  // 5 — Marketplace
  {
    label: 'Marketplace',
    type:  'dropdown',
    href:  '/marketplace',
    groups: [
      {
        title: 'Find Professionals',
        links: [
          {
            label:       'Browse GC / Builders / Contractors',
            href:        '/marketplace',
            description: 'Search verified, background-checked professionals',
          },
          {
            label:       'Post a Project',
            href:        '/contact',
            description: 'Describe your project and get matched in 24 hrs',
          },
          {
            label:       'AI Concept + Contractor Match',
            href:        '/get-started',
            description: 'Get an AI design concept, then match to a contractor',
            badge:       'AI',
          },
          {
            label:       'How It Works',
            href:        '/marketplace#how-it-works',
            description: 'Vetting, matching, and milestone payment protection',
          },
        ],
      },
      {
        title: 'For GC / Builders / Contractors',
        links: [
          {
            label:       'Join the Marketplace',
            href:        '/contractor/register',
            description: 'Apply as a verified GC, builder, or specialty contractor',
            badge:       'Apply',
          },
          {
            label:       'Contractor Portal',
            href:        '/login',
            description: 'Manage bids, projects, crew, and payments',
          },
        ],
      },
    ],
    featured: {
      label:       'Start a Project',
      href:        '/get-started',
      description: 'AI concept design + vetted contractor match — from $395',
    },
  },

  // 6 — Get Estimate
  { label: 'Get Estimate', href: '/estimate' },

  // 7 — About
  { label: 'About', href: '/about' },
]

// ── CTA buttons ───────────────────────────────────────────────────────────────

export const NAV_CTA_PRIMARY   = { label: 'Start AI Concept',          href: '/get-started' }
export const NAV_CTA_SECONDARY = { label: 'Join as GC / Contractor',   href: '/contractor/register' }
export const NAV_LOGIN         = { label: 'Log In', href: '/login' }

// ── Footer links ──────────────────────────────────────────────────────────────

export const FOOTER_NAV = {
  platform: [
    { label: 'AI Concept Engine',          href: '/concept-engine' },
    { label: 'Digital Twins',              href: '/developers#ddts' },
    { label: 'Land Intelligence',          href: '/developers#land' },
    { label: 'Feasibility Studies',        href: '/developers#feasibility' },
    { label: 'Construction OS',            href: '/contractors' },
    { label: 'Payments & Escrow',          href: '/homeowners#payments' },
    { label: 'Marketplace',                href: '/marketplace' },
    { label: 'AI KeaBots',                 href: '/#keabots' },
  ],
  solutions: [
    { label: 'For Homeowners',             href: '/homeowners' },
    { label: 'Garden & Farming',           href: '/homeowners/garden-farming' },
    { label: 'For Developers',             href: '/developers' },
    { label: 'For GC & Contractors',       href: '/contractors' },
    { label: 'For Property Managers',      href: '/property-managers' },
    { label: 'Commercial Projects',        href: '/commercial' },
    { label: 'Government',                 href: '/government' },
    { label: 'Get Estimate',               href: '/estimate' },
    { label: 'Design Services',            href: '/design-services' },
    { label: 'Milestone Pay',              href: '/milestone-pay' },
  ],
  portals: [
    { label: 'Owner Portal',               href: '/login' },
    { label: 'Contractor Portal',          href: '/login' },
    { label: 'Developer Portal',           href: '/login' },
    { label: 'Command Center',             href: '/login' },
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
