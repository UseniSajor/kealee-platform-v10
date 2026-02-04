// apps/m-marketplace/app/page.tsx
// Kealee Platform Main Homepage

import type { Metadata } from 'next';
import { HomeClient } from '../components/HomeClient';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Kealee - End-to-End Design/Build Platform | DC-Baltimore',
  description:
    'The connected construction platform from architecture through permits through construction through closeout. One platform for homeowners, contractors, and professionals in the DC-Baltimore corridor.',
  openGraph: {
    title: 'Kealee - End-to-End Design/Build Platform',
    description:
      'Design. Build. Done. The connected platform for construction projects in DC-Baltimore.',
    url: 'https://kealee.com',
    siteName: 'Kealee',
    images: [
      {
        url: '/og-home.png',
        width: 1200,
        height: 630,
        alt: 'Kealee - Design. Build. Done.',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kealee - End-to-End Design/Build Platform',
    description: 'Design. Build. Done.',
    images: ['/og-home.png'],
  },
};

// Mock data for network profiles
const sampleProfiles = [
  {
    businessName: 'Precision Build Co.',
    ownerName: 'Marcus Johnson',
    type: 'General Contractor',
    trades: ['General Construction', 'Renovation', 'Additions', 'Commercial'],
    rating: 4.9,
    reviews: 127,
    location: 'Bethesda, MD',
    distance: '8 mi',
    stats: { projectsCompleted: 245, yearsExperience: 18, responseTime: '2h' },
    badges: ['Top Rated', 'Verified'],
    availability: 'available' as const,
    ctaHref: '/network/precision-build-co',
  },
  {
    businessName: 'Capital Electric Services',
    ownerName: 'Sarah Chen',
    type: 'Specialty Contractor',
    trades: ['Electrical', 'Panel Upgrades', 'EV Charging', 'Smart Home'],
    rating: 4.8,
    reviews: 89,
    location: 'Silver Spring, MD',
    distance: '5 mi',
    stats: { projectsCompleted: 312, yearsExperience: 12, responseTime: '1h' },
    badges: ['Licensed Master', 'Fast Response'],
    availability: 'available' as const,
    ctaHref: '/network/capital-electric',
  },
  {
    businessName: 'Harbor View Architects',
    ownerName: 'David Park',
    type: 'Architect',
    trades: ['Residential', 'Commercial', 'Historic', 'Sustainable'],
    rating: 4.9,
    reviews: 64,
    location: 'Baltimore, MD',
    distance: '35 mi',
    stats: { projectsCompleted: 89, yearsExperience: 22, responseTime: '4h' },
    badges: ['AIA Member', 'LEED AP'],
    availability: 'busy' as const,
    ctaHref: '/network/harbor-view-architects',
  },
];

// Module showcase data
const moduleCards = {
  projectOwner: {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    title: 'Project Owner Portal',
    subtitle: 'app.kealee.com',
    description: 'Complete visibility and control over your construction project from start to finish.',
    features: [
      'Readiness checklists & milestones',
      'Contract management & e-signing',
      'Escrow-protected payments',
      'Real-time progress tracking',
    ],
    priceAnchor: 'From $49/mo',
    cta: { label: 'Start Project', href: 'https://app.kealee.com' },
    accentColor: '#1A2B4A' as const,
  },
  architect: {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    title: 'Architecture & Design',
    subtitle: 'architect.kealee.com',
    description: 'Licensed architects deliver construction-ready drawings and permit-ready plans.',
    features: [
      'Construction drawings & plans',
      '3D renderings & visualization',
      'Engineering coordination',
      'Permit-ready handoff',
    ],
    priceAnchor: 'From $2,500',
    cta: { label: 'Start Design', href: 'https://architect.kealee.com' },
    accentColor: '#2ABFBF' as const,
  },
  permits: {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'AI Permits & Inspections',
    subtitle: 'permits.kealee.com',
    description: 'AI-powered permit review, auto-form filling, and inspection scheduling.',
    features: [
      'AI code compliance review',
      'Auto form generation',
      'Real-time status tracking',
      'Inspection scheduling',
    ],
    priceAnchor: 'From $495',
    cta: { label: 'Start Permit', href: 'https://permits.kealee.com' },
    accentColor: '#38A169' as const,
  },
};

// Stats data
const stats = [
  { value: '500+', label: 'Projects Completed' },
  { value: '3,000+', label: 'Jurisdictions Covered' },
  { value: '$50M+', label: 'Project Value Managed' },
  { value: '98%', label: 'Client Satisfaction' },
];

// Testimonials
const homeownerTestimonials = [
  {
    quote: "I couldn't believe how smoothly everything went. From design to permits to construction, the platform kept me informed every step of the way. No more chasing contractors for updates.",
    name: 'Jennifer Martinez',
    role: 'Homeowner, Bethesda MD',
    rating: 5,
    projectType: 'Kitchen Renovation',
  },
  {
    quote: "The escrow protection gave me peace of mind. I knew my money was safe until each milestone was completed. The project dashboard made it easy to track everything.",
    name: 'Robert Chen',
    role: 'Property Investor, DC',
    rating: 5,
    projectType: 'Multi-unit Renovation',
  },
];

const contractorTestimonials = [
  {
    quote: "The fair bid rotation system means I'm competing on quality, not just who bids first. My close rate has improved significantly since joining the network.",
    name: 'Marcus Thompson',
    role: 'GC, Thompson Construction',
    rating: 5,
    projectType: 'Network Member',
  },
  {
    quote: "The PM software saves me hours every week. Scheduling, documentation, client updates—it's all in one place. And the permit tracking alone is worth the subscription.",
    name: 'Lisa Park',
    role: 'Owner, Park Builders',
    rating: 5,
    projectType: 'PM Software User',
  },
];

// Comparison data
const comparisonData = {
  leftTitle: 'Without Kealee',
  leftItems: [
    'Juggling 5+ separate tools and spreadsheets',
    'Chasing contractors for updates via text/email',
    'Permit delays from missed requirements',
    'Payment disputes without clear milestones',
    'No visibility into project status',
  ],
  rightTitle: 'With Kealee',
  rightItems: [
    'One connected platform for every phase',
    'Real-time updates and automatic notifications',
    'AI-powered permit review catches issues early',
    'Escrow-protected milestone payments',
    'Complete project visibility 24/7',
  ],
};

// Platform flow phases
const platformPhases = [
  {
    id: 'design',
    name: 'Design',
    app: 'm-architect',
    appLabel: 'Architecture',
    color: '#2ABFBF' as const,
    features: ['Construction Drawings', '3D Renderings', 'Permit-Ready Plans'],
    href: 'https://architect.kealee.com',
  },
  {
    id: 'permit',
    name: 'Permit',
    app: 'm-permits',
    appLabel: 'Permits',
    color: '#38A169' as const,
    features: ['AI Code Review', 'Auto Form Filling', 'Status Tracking'],
    href: 'https://permits.kealee.com',
  },
  {
    id: 'build',
    name: 'Build',
    app: 'm-ops-services',
    appLabel: 'Operations',
    color: '#E8793A' as const,
    features: ['Contractor Network', 'PM Software', 'Scheduling'],
    href: 'https://ops.kealee.com',
  },
  {
    id: 'inspect',
    name: 'Inspect',
    app: 'm-permits',
    appLabel: 'Inspections',
    color: '#38A169' as const,
    features: ['Inspection Scheduling', 'Corrections Tracking', 'Documentation'],
    href: 'https://permits.kealee.com',
  },
  {
    id: 'closeout',
    name: 'Closeout',
    app: 'm-project-owner',
    appLabel: 'Owner Portal',
    color: '#1A2B4A' as const,
    features: ['Final Inspection', 'Documentation', 'Warranty Tracking'],
    href: 'https://app.kealee.com',
  },
];

// Split CTA data
const splitCtaData = [
  {
    title: 'For Homeowners',
    subtitle: 'Start your project with confidence. Full visibility from design to closeout.',
    cta: { label: 'Start Your Project', href: 'https://app.kealee.com/signup' },
    bgVariant: 'white' as const,
  },
  {
    title: 'For Contractors',
    subtitle: 'Access PM tools, estimation services, and qualified leads through the network.',
    cta: { label: 'Join the Network', href: '/network/join' },
    bgVariant: 'white' as const,
  },
  {
    title: 'List Your Business',
    subtitle: 'Get discovered by project owners. Fair bid rotation. No pay-to-play.',
    cta: { label: 'Create Free Profile', href: '/network/register' },
    bgVariant: 'navy' as const,
  },
];

export default function HomePage() {
  return (
    <HomeClient
      sampleProfiles={sampleProfiles}
      moduleCards={moduleCards}
      stats={stats}
      homeownerTestimonials={homeownerTestimonials}
      contractorTestimonials={contractorTestimonials}
      comparisonData={comparisonData}
      platformPhases={platformPhases}
      splitCtaData={splitCtaData}
    />
  );
}
