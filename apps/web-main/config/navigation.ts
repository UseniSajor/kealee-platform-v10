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
  href?:    string          // optional top-level link
  groups:   NavGroup[]
  featured?: NavLink        // highlighted item at bottom of dropdown
}

export interface NavGroup {
  title?:  string
  links:   NavLink[]
}

export type NavItem = NavLink | (NavDropdown & { type: 'dropdown' })

// ── Primary navigation items ──────────────────────────────────────────────────

export const PRIMARY_NAV: NavItem[] = [
  {
    label: 'Marketplace',
    type:  'dropdown',
    href:  '/marketplace',
    groups: [
      {
        title: 'Find Professionals',
        links: [
          { label: 'Browse Contractors',  href: '/marketplace',           description: 'Search verified local contractors' },
          { label: 'Post a Project',      href: '/contact',               description: 'Describe your project and get matched' },
          { label: 'How It Works',        href: '/marketplace#how-it-works', description: 'Our vetting and matching process' },
        ],
      },
      {
        title: 'For Contractors',
        links: [
          { label: 'Join the Network',    href: '/contractor/register',   description: 'Apply to become a Kealee contractor', badge: 'Apply' },
          { label: 'Manage My Bids',      href: '/portal-contractor',     description: 'Access your contractor dashboard' },
        ],
      },
    ],
    featured: { label: 'Start a Project Today', href: '/contact', description: 'Get matched with a vetted contractor in 24 hours' },
  },
  {
    label: 'For Homeowners',
    type:  'dropdown',
    href:  '/homeowners',
    groups: [
      {
        links: [
          { label: 'Start a Project',       href: '/homeowners',         description: 'Renovations, additions, new construction' },
          { label: 'Track My Build',        href: '/portal-owner',       description: 'Monitor progress and milestones' },
          { label: 'Escrow Payments',       href: '/homeowners#payments', description: 'Milestone-based, protected payments' },
          { label: 'AI Project Assistant',  href: '/homeowners#keabot',  description: 'Ask KeaBot Owner anything about your project' },
          { label: 'Pricing',               href: '/pricing',            description: 'Transparent per-project pricing — no subscriptions' },
        ],
      },
    ],
    featured: { label: 'AI Concept Design Package — $585', href: '/concept-package', description: 'Property-specific visuals, design direction, zoning brief + consultation included' },
  },
  {
    label: 'For Developers',
    type:  'dropdown',
    href:  '/developers',
    groups: [
      {
        title: 'Development Tools',
        links: [
          { label: 'Land Intelligence',     href: '/developers#land',         description: 'Parcel analysis, zoning, due diligence' },
          { label: 'Feasibility Studies',   href: '/developers#feasibility',  description: 'Pro forma modeling and scenario analysis' },
          { label: 'Development Finance',   href: '/developers#finance',      description: 'Capital stack, draw tracking, investor reports' },
        ],
      },
      {
        title: 'Management',
        links: [
          { label: 'Portfolio Dashboard',   href: '/portal-developer',     description: 'Multi-project analytics and reporting' },
          { label: 'Digital Twin System',   href: '/developers#ddts',      description: 'Live digital model of every project' },
        ],
      },
    ],
  },
  {
    label: 'For Contractors',
    type:  'dropdown',
    href:  '/contractors',
    groups: [
      {
        links: [
          { label: 'Join the Marketplace',  href: '/contractor/register',   description: 'Get verified and start winning bids', badge: 'Apply' },
          { label: 'Manage Projects',       href: '/portal-contractor',     description: 'Construction OS: schedule, RFIs, punch list' },
          { label: 'Lead Pipeline',         href: '/contractor/leads',      description: 'Track and respond to matched leads' },
          { label: 'KeaBot GC',             href: '/contractors#keabot',    description: 'AI assistant for bids, compliance, crew' },
        ],
      },
    ],
    featured: { label: 'Apply to Join', href: '/contractor/register', description: 'Licensed & insured contractors — apply in minutes' },
  },
  {
    label: 'Architects & Engineers',
    type:  'dropdown',
    href:  '/design-professionals',
    groups: [
      {
        links: [
          { label: 'Project Coordination',  href: '/design-professionals',         description: 'Collaborate across the full project team' },
          { label: 'RFI Management',        href: '/design-professionals#rfis',    description: 'Streamlined request-for-information workflows' },
          { label: 'Drawing Management',    href: '/design-professionals#drawings',description: 'Version control for construction documents' },
          { label: 'Submittals',            href: '/design-professionals#submittals', description: 'Shop drawing review and approval tracking' },
        ],
      },
    ],
  },
  {
    label: 'Government',
    type:  'dropdown',
    href:  '/government',
    groups: [
      {
        links: [
          { label: 'Municipal Dashboard',   href: '/government',                description: 'Oversight tools for permit authorities' },
          { label: 'Permit Coordination',   href: '/government#permits',        description: 'Digital permit tracking and status' },
          { label: 'Affordable Housing',    href: '/government#affordable',     description: 'Tools aligned with housing finance programs' },
          { label: 'Analytics & Reporting', href: '/government#analytics',      description: 'Construction activity data for your jurisdiction' },
        ],
      },
    ],
  },
  {
    label: 'Ops OS',
    type:  'dropdown',
    href:  '/ops',
    groups: [
      {
        title: 'Operations Tiers',
        links: [
          { label: 'Tier A — $1,750/mo',   href: '/pricing#ops',        description: 'Small operators & independents (up to 5 projects)' },
          { label: 'Tier B — $3,750/mo',   href: '/pricing#ops',        description: 'Growing contractors (up to 15 projects)' },
          { label: 'Tier C — $9,500/mo',   href: '/pricing#ops',        description: 'Large GCs & multi-trade operations (up to 50 projects)' },
          { label: 'Tier D — $16,500/mo',  href: '/pricing#ops',        description: 'Enterprise developers & portfolio operators' },
        ],
      },
    ],
    featured: { label: 'View Ops OS pricing', href: '/pricing', description: 'Full platform access for construction businesses' },
  },
  { label: 'About', href: '/about' },
  { label: 'Careers', href: '/careers' },
]

// ── CTA buttons ───────────────────────────────────────────────────────────────

export const NAV_CTA_PRIMARY = { label: 'Request Design Consult', href: '/intake' }
export const NAV_CTA_SECONDARY = { label: 'Join Marketplace', href: '/contractor/register' }
export const NAV_LOGIN = { label: 'Log In', href: '/portal-owner' }

// ── Footer links ──────────────────────────────────────────────────────────────

export const FOOTER_NAV = {
  platform: [
    { label: 'Digital Twins',           href: '/developers#ddts' },
    { label: 'Land Intelligence',        href: '/developers#land' },
    { label: 'Feasibility Studies',      href: '/developers#feasibility' },
    { label: 'Construction OS',          href: '/contractors' },
    { label: 'Payments & Escrow',        href: '/homeowners#payments' },
    { label: 'Marketplace',              href: '/marketplace' },
    { label: 'AI KeaBots',               href: '/#keabots' },
  ],
  solutions: [
    { label: 'For Homeowners',           href: '/homeowners' },
    { label: 'For Developers',           href: '/developers' },
    { label: 'For Contractors',          href: '/contractors' },
    { label: 'For Architects & Engineers', href: '/design-professionals' },
    { label: 'Government',               href: '/government' },
  ],
  portals: [
    { label: 'Owner Portal',             href: '/portal-owner' },
    { label: 'Contractor Portal',        href: '/portal-contractor' },
    { label: 'Developer Portal',         href: '/portal-developer' },
    { label: 'Command Center',           href: '/command-center' },
  ],
  company: [
    { label: 'About Us',                 href: '/about' },
    { label: 'Blog',                     href: '/blog' },
    { label: 'Pricing',                  href: '/pricing' },
    { label: 'Contact',                  href: '/contact' },
  ],
  legal: [
    { label: 'Terms of Service',         href: '/terms' },
    { label: 'Privacy Policy',           href: '/privacy' },
  ],
}
