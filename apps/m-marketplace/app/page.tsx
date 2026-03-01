/**
 * Kealee Marketplace Homepage — Message Layering Strategy
 *
 * The homepage uses four headline versions, each at a different scroll depth
 * to match the visitor's psychological state.
 *
 * SCROLL JOURNEY:
 *
 * [HERO]          → Version B: "The Construction Platform for the Entire Project."
 *                   Purpose: Authority. Name the category. Stripe-style infrastructure claim.
 *
 * [PHASE SHOWCASE]→ Version C: "Construction Has Always Had Too Many Handoffs."
 *                   Purpose: Name the pain. Then show the 5-phase solution.
 *
 * [AUDIENCES]     → Version A: "Build Without Blindspots."
 *                   Purpose: Universal truth for all 3 roles. Homeowners fear
 *                   being taken advantage of. GCs fear non-payment. Pros fear
 *                   unclear scope. "Blindspots" captures all three.
 *
 * [HOW IT WORKS]  → Functional: "One Platform. Six Connected Phases."
 *                   Purpose: Logical, step-by-step. Visitor is now convinced
 *                   of the why — now they want to understand the how.
 *
 * [BUILDER NETWORK]→ Version D: "Every Project Needs a Room Where Everyone Belongs."
 *                   Purpose: Community and belonging. Airbnb-style emotional close.
 *                   Warmest section of the page. Converts hesitant visitors.
 *
 * [FINAL CTA]     → B+A Combined: "The Construction Platform Built for Everyone."
 *                   Purpose: Restate authority (B) then close with urgency (A).
 *                   "Start anywhere. Build without blindspots."
 *
 * All messages are sourced from @/lib/messages.ts — edit there, not here.
 */

import { Metadata } from 'next';
import { HomePageClient } from './HomePageClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Kealee — The Construction Platform for the Entire Project',
  description:
    'From the first concept drawing to the final lien waiver — Kealee connects owners, builders, and professionals on one platform. Design, estimate, permit, build, and closeout. No handoffs. No gaps.',
  keywords: [
    'construction platform', 'design build platform', 'construction management', 'architecture services',
    'engineering services', 'building permits', 'cost estimation software', 'project management construction',
    'operations services contractors', 'escrow construction', 'contractor network', 'permit automation',
    'structural engineering', 'MEP design', 'construction estimation', 'general contractor tools',
    'homeowner project management', 'construction finance', 'trust accounting construction',
  ],
  openGraph: {
    title: 'Kealee — Build Without Blindspots',
    description:
      'The construction platform for the entire project. Design through closeout — one connected system for everyone in the room.',
    url: 'https://kealee.com',
    siteName: 'Kealee Marketplace',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Kealee — The Construction Platform for the Entire Project',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kealee — The Construction Platform for the Entire Project',
    description:
      'Design → Estimate → Permit → Build → Closeout. One platform. No gaps. Every professional verified. Every payment protected.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://kealee.com',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// Static data for the page
const platformFlowNodes = [
  {
    id: 'design',
    phase: 'Design',
    app: 'Architecture & Engineering',
    appBadge: 'Design',
    features: ['Architectural Drawings', 'Structural Engineering', 'MEP Design'],
    href: '/architect',
    color: 'teal' as const,
  },
  {
    id: 'estimate',
    phase: 'Estimate',
    app: 'Cost Estimation',
    appBadge: 'Estimation',
    features: ['AI Takeoff', 'Assembly Pricing', 'Bid Reports'],
    href: '/estimation',
    color: 'orange' as const,
  },
  {
    id: 'permit',
    phase: 'Permit',
    app: 'Permits & Inspections',
    appBadge: 'Permits',
    features: ['AI Review', 'Auto Form Filling', 'Status Tracking'],
    href: '/permits',
    color: 'green' as const,
  },
  {
    id: 'build',
    phase: 'Build',
    app: 'Ops & PM Services',
    appBadge: 'Build',
    features: ['PM Software', 'Operations', 'Team Coordination'],
    href: '/ops',
    color: 'orange' as const,
  },
  {
    id: 'closeout',
    phase: 'Closeout',
    app: 'Finance & Trust',
    appBadge: 'Finance',
    features: ['Escrow Payments', 'Final Walkthrough', 'Documents'],
    href: '/finance',
    color: 'navy' as const,
  },
  {
    id: 'opportunities',
    phase: 'Opportunities',
    app: 'Workforce & Procurement',
    appBadge: 'Opportunities',
    features: ['PM Marketplace', 'Trade Apprenticeship', 'Gov\'t Contracts'],
    href: '/opportunities',
    color: 'orange' as const,
  },
];

const mockNetworkProfiles = [
  {
    businessName: 'Capital City Builders',
    ownerName: 'James Rodriguez',
    type: 'General Contractor',
    trades: ['Residential', 'Commercial', 'Renovations'],
    rating: 4.9,
    reviews: 127,
    location: 'Bethesda, MD',
    distance: '12 miles',
    stats: { projects: 85, responseTime: '< 2 hrs', onTimeRate: '98%' },
    badges: ['licensed', 'insured', 'background', 'verified'],
    availability: 'available' as const,
    ctaHref: '/network/capital-city-builders',
  },
  {
    businessName: 'DMV Electric Pro',
    ownerName: 'Sarah Chen',
    type: 'Specialty Contractor',
    trades: ['Electrical', 'EV Charging', 'Smart Home'],
    rating: 4.8,
    reviews: 89,
    location: 'Arlington, VA',
    distance: '8 miles',
    stats: { projects: 120, responseTime: '< 1 hr', onTimeRate: '99%' },
    badges: ['licensed', 'insured', 'verified'],
    availability: 'busy' as const,
    ctaHref: '/network/dmv-electric-pro',
  },
  {
    businessName: 'Chesapeake Architecture',
    ownerName: 'Michael Thompson',
    type: 'Architect',
    trades: ['Modern Design', 'Historic', 'Sustainable'],
    rating: 5.0,
    reviews: 45,
    location: 'Washington, DC',
    distance: '3 miles',
    stats: { projects: 62, responseTime: '< 4 hrs' },
    badges: ['licensed', 'verified'],
    availability: 'available' as const,
    ctaHref: '/network/chesapeake-architecture',
  },
];

const comparisonData = {
  leftTitle: 'Without Kealee',
  leftItems: [
    'Coordinate between 5+ disconnected tools',
    'Re-enter project data at every phase',
    'Chase down permit status manually',
    'Lose track of change orders and approvals',
    'Pay multiple platform fees',
  ],
  rightTitle: 'With Kealee',
  rightItems: [
    'One platform from design to closeout',
    'Data flows automatically between phases',
    'Real-time permit tracking and AI review',
    'Centralized change order management',
    'Single subscription, all features included',
  ],
};

const stats = [
  { value: '500+', label: 'Projects Completed' },
  { value: '3,000+', label: 'Jurisdictions Covered' },
  { value: '$50M+', label: 'Project Value Managed' },
  { value: '98%', label: 'Client Satisfaction' },
];

const homeownerTestimonials = [
  {
    quote: 'Kealee made our kitchen renovation so much easier. Having design, permits, and contractor management in one place saved us weeks of coordination.',
    name: 'Jennifer Martinez',
    role: 'Homeowner',
    rating: 5,
    projectType: 'Kitchen Renovation',
  },
  {
    quote: 'As a first-time homebuyer doing a gut renovation, I was overwhelmed. Kealee\'s platform and the dedicated PM service kept everything on track.',
    name: 'David Kim',
    role: 'Homeowner',
    rating: 5,
    projectType: 'Whole Home Renovation',
  },
];

const contractorTestimonials = [
  {
    quote: 'The estimation tools alone have saved us 15+ hours per week. Combined with the permit automation, we\'re closing more jobs with less overhead.',
    name: 'Robert Williams',
    role: 'Owner, Williams Construction',
    rating: 5,
    projectType: 'General Contractor',
  },
  {
    quote: 'Fair bid rotation actually works. We\'ve landed 3 new commercial clients through the network in the past quarter.',
    name: 'Amanda Torres',
    role: 'CEO, Torres Electric',
    rating: 5,
    projectType: 'Specialty Contractor',
  },
];

const splitCTASections = [
  {
    title: 'For Homeowners',
    subtitle: 'Start your project with confidence. Get design, permits, and trusted contractors.',
    cta: { label: 'Start Your Project', href: '/owner' },
    bgVariant: 'white' as const,
    ctaColor: 'orange' as const,
  },
  {
    title: 'For Contractors',
    subtitle: 'Grow your business with PM tools, estimation, and streamlined operations.',
    cta: { label: 'Explore Tools', href: '/ops' },
    bgVariant: 'white' as const,
    ctaColor: 'navy' as const,
  },
  {
    title: 'Join the Network',
    subtitle: 'List your business, bid on projects, connect with clients.',
    cta: { label: 'List Your Business', href: '/network/list' },
    bgVariant: 'dark' as const,
    ctaColor: 'white' as const,
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Kealee',
  url: 'https://kealee.com',
  description: 'End-to-end design/build platform for the DC-Baltimore corridor. Architecture, engineering, estimation, permits, project management, operations, and finance.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    lowPrice: '49',
    offerCount: '9',
  },
  featureList: [
    'Architectural Design Services',
    'Structural, MEP, Civil & Geotechnical Engineering',
    'AI-Powered Cost Estimation',
    'Permit Application & Tracking',
    'Inspection Scheduling',
    'Project Management Software',
    'Operations Services',
    'Escrow & Finance Management',
    'Contractor Network & Fair Bid Rotation',
    'PM Marketplace & Trade Apprenticeship',
    'Government Procurement Tracking',
  ],
  areaServed: {
    '@type': 'GeoCircle',
    geoMidpoint: {
      '@type': 'GeoCoordinates',
      latitude: 39.0,
      longitude: -76.8,
    },
    geoRadius: '100 miles',
  },
  provider: {
    '@type': 'Organization',
    name: 'Kealee',
    url: 'https://kealee.com',
    logo: 'https://kealee.com/kealee-logo-600w.png',
    sameAs: [],
  },
};

const servicesJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Kealee Platform Services',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Architecture', url: 'https://kealee.com/architect' },
    { '@type': 'ListItem', position: 2, name: 'Engineering', url: 'https://kealee.com/engineer' },
    { '@type': 'ListItem', position: 3, name: 'Cost Estimation', url: 'https://kealee.com/estimation' },
    { '@type': 'ListItem', position: 4, name: 'Permits & Inspections', url: 'https://kealee.com/permits' },
    { '@type': 'ListItem', position: 5, name: 'Project Management', url: 'https://kealee.com/pm' },
    { '@type': 'ListItem', position: 6, name: 'Operations Services', url: 'https://kealee.com/ops' },
    { '@type': 'ListItem', position: 7, name: 'Finance & Escrow', url: 'https://kealee.com/finance' },
    { '@type': 'ListItem', position: 8, name: 'Contractor Network', url: 'https://kealee.com/network' },
    { '@type': 'ListItem', position: 9, name: 'Opportunities', url: 'https://kealee.com/opportunities' },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesJsonLd) }}
      />
      <HomePageClient
        platformFlowNodes={platformFlowNodes}
        mockNetworkProfiles={mockNetworkProfiles}
        comparisonData={comparisonData}
        stats={stats}
        homeownerTestimonials={homeownerTestimonials}
        contractorTestimonials={contractorTestimonials}
        splitCTASections={splitCTASections}
      />
    </>
  );
}
