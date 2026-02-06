// apps/m-marketplace/app/page.tsx
// Kealee Platform Main Homepage - kealee.com

import { Metadata } from 'next';
import { HomePageClient } from './HomePageClient';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Kealee | DC-Baltimore\'s End-to-End Design/Build Platform',
  description: 'The connected platform that takes your construction project from architecture through permits through construction through closeout. One platform. Zero gaps.',
  keywords: ['construction', 'design build', 'permits', 'architecture', 'DC', 'Baltimore', 'contractors'],
  openGraph: {
    title: 'Kealee | DC-Baltimore\'s End-to-End Design/Build Platform',
    description: 'Design. Build. Done. The connected platform for construction projects.',
    url: 'https://kealee.com',
    siteName: 'Kealee',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Kealee - End-to-End Design/Build Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kealee | End-to-End Design/Build Platform',
    description: 'Design. Build. Done.',
    images: ['/og-image.png'],
  },
};

// Static data for the page
const platformFlowNodes = [
  {
    id: 'design',
    phase: 'Design',
    app: 'm-architect',
    appBadge: 'm-architect',
    features: ['Construction Drawings', '3D Renderings', 'Engineering'],
    href: '/architect',
    color: 'teal' as const,
  },
  {
    id: 'permit',
    phase: 'Permit',
    app: 'm-permits',
    appBadge: 'm-permits',
    features: ['AI Review', 'Auto Form Filling', 'Status Tracking'],
    href: '/permits',
    color: 'green' as const,
  },
  {
    id: 'build',
    phase: 'Build',
    app: 'm-ops-services',
    appBadge: 'm-ops',
    features: ['PM Software', 'Operations', 'Estimation'],
    href: '/ops',
    color: 'orange' as const,
  },
  {
    id: 'inspect',
    phase: 'Inspect',
    app: 'm-permits',
    appBadge: 'm-permits',
    features: ['Scheduling', 'Checklists', 'Results'],
    href: '/permits/inspections',
    color: 'green' as const,
  },
  {
    id: 'closeout',
    phase: 'Closeout',
    app: 'm-project-owner',
    appBadge: 'm-owner',
    features: ['Final Walkthrough', 'Warranty', 'Documents'],
    href: '/project-owner',
    color: 'navy' as const,
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
    cta: { label: 'Start Your Project', href: '/project-owner' },
    bgVariant: 'white' as const,
    ctaColor: 'orange' as const,
  },
  {
    title: 'For Contractors',
    subtitle: 'Grow your business with PM tools, leads, and streamlined operations.',
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

export default function HomePage() {
  return (
    <HomePageClient
      platformFlowNodes={platformFlowNodes}
      mockNetworkProfiles={mockNetworkProfiles}
      comparisonData={comparisonData}
      stats={stats}
      homeownerTestimonials={homeownerTestimonials}
      contractorTestimonials={contractorTestimonials}
      splitCTASections={splitCTASections}
    />
  );
}
