// apps/m-project-owner/app/page.tsx
// Project Owner Portal Landing Page

import type { Metadata } from 'next';
import { ProjectOwnerClient } from '../components/ProjectOwnerClient';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Kealee Project Owner Portal | Complete Project Control',
  description:
    'Full visibility over your construction project — from readiness checklists to milestone payments, everything in one place. No setup fees. From $49/mo.',
  openGraph: {
    title: 'Kealee Project Owner Portal',
    description:
      'Complete project control and confidence. Full visibility from design to closeout.',
    url: 'https://app.kealee.com',
    siteName: 'Kealee',
    images: [
      {
        url: '/og-owner.png',
        width: 1200,
        height: 630,
        alt: 'Kealee Project Owner Portal',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kealee Project Owner Portal',
    description: 'Complete project control and confidence.',
    images: ['/og-owner.png'],
  },
};

// Feature data
const coreFeatures = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: 'Readiness Checklists',
    description: 'Never start unprepared. Our checklists ensure everything is in place before work begins.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Contract Management',
    description: 'Digital contracts with e-signing. Clear scope, timeline, and payment milestones.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Escrow Protection',
    description: 'Your funds are held securely. Payment released only when milestones are approved.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Project Timeline',
    description: 'Visual timeline with milestones. See what\'s happening and what\'s coming up.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: 'Team Coordination',
    description: 'All your contractors, designers, and inspectors in one place. Easy communication.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Progress Tracking',
    description: 'Real-time updates on your project. Photos, status, and next steps at a glance.',
  },
];

// Pricing tiers
const pricingTiers = [
  {
    name: 'Starter',
    price: 49,
    period: 'mo',
    popular: false,
    features: [
      '1 active project',
      'Basic readiness checklists',
      'Contract e-signing',
      'Milestone tracking',
      'Email support',
    ],
    cta: { label: 'Get Started', href: '/signup?plan=starter' },
  },
  {
    name: 'Growth',
    price: 149,
    period: 'mo',
    popular: true,
    features: [
      '3 active projects',
      'Advanced checklists',
      'Escrow payment protection',
      'Document storage (5GB)',
      'Team coordination',
      'Priority support',
    ],
    cta: { label: 'Get Started', href: '/signup?plan=growth' },
  },
  {
    name: 'Professional',
    price: 299,
    period: 'mo',
    popular: false,
    features: [
      '10 active projects',
      'Custom checklists',
      'Advanced escrow features',
      'Document storage (25GB)',
      'Contractor network access',
      'Phone support',
    ],
    cta: { label: 'Get Started', href: '/signup?plan=professional' },
  },
  {
    name: 'Enterprise',
    price: 999,
    period: 'mo',
    popular: false,
    features: [
      'Unlimited projects',
      'White-label portal',
      'Custom integrations',
      'Unlimited storage',
      'API access',
      'Dedicated account manager',
    ],
    cta: { label: 'Contact Sales', href: '/contact?plan=enterprise' },
  },
];

// Process steps
const processSteps = [
  {
    number: 1,
    title: 'Create Project',
    description: 'Tell us about your project. We\'ll set up your dashboard and checklists.',
  },
  {
    number: 2,
    title: 'Complete Readiness',
    description: 'Work through our checklists. Ensure permits, contracts, and financing are ready.',
  },
  {
    number: 3,
    title: 'Approve Contracts',
    description: 'Review and e-sign contracts. Payment milestones are automatically set.',
  },
  {
    number: 4,
    title: 'Track Progress',
    description: 'Watch your project come to life. Approve milestones and release payments.',
  },
];

// Integration cards
const integrations = [
  {
    from: 'Architecture',
    to: 'Owner Portal',
    description: 'Design documents and plans flow directly into your project dashboard.',
  },
  {
    from: 'Permits',
    to: 'Owner Portal',
    description: 'Permit status, approvals, and inspection results sync automatically.',
  },
  {
    from: 'Escrow',
    to: 'Owner Portal',
    description: 'Secure payments with automatic milestone tracking and release.',
  },
  {
    from: 'Network',
    to: 'Owner Portal',
    description: 'Find verified contractors and add them directly to your project.',
  },
];

export default function ProjectOwnerLandingPage() {
  return (
    <ProjectOwnerClient
      coreFeatures={coreFeatures}
      pricingTiers={pricingTiers}
      processSteps={processSteps}
      integrations={integrations}
    />
  );
}
