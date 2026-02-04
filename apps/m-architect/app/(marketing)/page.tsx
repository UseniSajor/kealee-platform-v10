// apps/m-architect/app/(marketing)/page.tsx
// Architect Hub Marketing Landing Page

import type { Metadata } from 'next';
import { ArchitectClient } from '../../components/ArchitectClient';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Kealee Architect Hub | Professional Design Project Management',
  description:
    'Manage design projects, deliverables, client reviews, and team collaboration. Seamless integration with permits, engineering, and construction teams.',
  keywords:
    'architect software, design project management, architectural deliverables, plan review, design collaboration, construction design',
  openGraph: {
    title: 'Kealee Architect Hub - Professional Design Project Management',
    description:
      'Streamline your design workflow with integrated project management, client collaboration, and seamless handoff to permits and construction.',
    url: 'https://architect.kealee.com',
    siteName: 'Kealee',
    images: [
      {
        url: '/og-architect.png',
        width: 1200,
        height: 630,
        alt: 'Kealee Architect Hub',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kealee Architect Hub',
    description: 'Professional design project management for architects.',
    images: ['/og-architect.png'],
  },
};

// Features
const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    title: 'Phase Management',
    description:
      'Organize projects by phases: Pre-Design, Schematic Design, Design Development, and Construction Documents.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Deliverable Tracking',
    description:
      'Track all design deliverables with status, versions, and approval workflows. Never lose track of where things stand.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Team Collaboration',
    description:
      'Assign roles (Principal, Project Architect, Designer, Drafter) with appropriate permissions and visibility.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    title: 'Client Review Portal',
    description:
      'Share designs with clients for review and feedback. Collect comments directly on deliverables with full audit trail.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    title: 'Seamless Handoff',
    description:
      'Direct integration with Kealee Permits. Submit permit applications with one click from completed designs.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Project Integration',
    description:
      'Link to Project Owner projects for budget, timeline, and milestone visibility. Stay aligned with your clients.',
  },
];

// Process steps
const processSteps = [
  {
    number: 1,
    title: 'Project Setup',
    description:
      'Link to existing Project Owner projects or create standalone design projects. Define project type, phases, and assign team members.',
  },
  {
    number: 2,
    title: 'Phase-by-Phase Design',
    description:
      'Progress through design phases with clear milestones. Track deliverables, manage versions, and maintain design history.',
  },
  {
    number: 3,
    title: 'Client Collaboration',
    description:
      'Invite clients to review portal for feedback. Collect comments directly on deliverables with a clear audit trail.',
  },
  {
    number: 4,
    title: 'Permit Submission',
    description:
      'When designs are complete, submit directly to Kealee Permits. No file exports—seamless handoff to permit processing.',
  },
];

// Platform integrations
const integrations = [
  {
    name: 'Kealee Permits',
    description: 'One-click permit submission from completed designs',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    name: 'Project Owner',
    description: 'Sync with client projects for budget and timeline',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    name: 'Network',
    description: 'Find engineers, contractors, and consultants',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
  },
  {
    name: 'Escrow',
    description: 'Secure milestone payments for design work',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
];

// Pricing tiers
const pricingTiers = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    popular: false,
    description: 'For individual architects getting started',
    features: [
      'Up to 3 active projects',
      'Basic deliverable tracking',
      'Client review portal',
      'Email support',
    ],
    cta: { label: 'Get Started', href: '/signup' },
  },
  {
    name: 'Professional',
    price: '3%',
    period: 'of project value',
    popular: true,
    description: 'For architects with active client projects',
    features: [
      'Unlimited projects',
      'Advanced phase management',
      'Team collaboration',
      'Permit integration',
      'Payment processing',
      'Priority support',
    ],
    cta: { label: 'Get Started', href: '/signup?plan=pro' },
  },
  {
    name: 'Firm',
    price: 'Custom',
    period: '',
    popular: false,
    description: 'For architecture firms with multiple architects',
    features: [
      'Everything in Professional',
      'Multiple team members',
      'Firm-wide analytics',
      'Custom workflows',
      'API access',
      'Dedicated support',
    ],
    cta: { label: 'Contact Sales', href: '/contact?plan=firm' },
  },
];

// FAQs
const faqs = [
  {
    question: "What's the 3% platform fee?",
    answer:
      "When you process client payments through Kealee, we charge a 3% platform fee. This covers payment processing, escrow services, and all platform features. If you don't use our payment processing, there's no fee—the platform is free to use for project management.",
  },
  {
    question: 'How does permit integration work?',
    answer:
      'When your designs are complete, you can submit permit applications directly through Kealee with one click. Your drawings, specifications, and project data are automatically packaged for the jurisdiction. No more exporting files and uploading to different portals.',
  },
  {
    question: 'Can I use Kealee for projects outside the DC-Baltimore corridor?',
    answer:
      'Yes! The design and project management features work anywhere. However, our permit integration is currently limited to the DC-Baltimore corridor (3,000+ jurisdictions). We're expanding coverage continuously.',
  },
  {
    question: 'How does client collaboration work?',
    answer:
      'You can invite clients to a review portal where they can view designs, leave comments on specific deliverables, and approve phases. All feedback is tracked with timestamps, creating a clear audit trail of design decisions.',
  },
  {
    question: 'Can I add team members to projects?',
    answer:
      'Yes! You can assign team members with different roles: Principal, Project Architect, Designer, and Drafter. Each role has appropriate permissions for viewing, editing, and approving deliverables.',
  },
  {
    question: 'Does Kealee replace my CAD software?',
    answer:
      "No, Kealee complements your existing design tools (Revit, AutoCAD, SketchUp, etc.). You create designs in your preferred software and upload deliverables to Kealee for tracking, collaboration, and handoff. We're focused on project management, not design creation.",
  },
];

export default function ArchitectLandingPage() {
  return (
    <ArchitectClient
      features={features}
      processSteps={processSteps}
      integrations={integrations}
      pricingTiers={pricingTiers}
      faqs={faqs}
    />
  );
}
