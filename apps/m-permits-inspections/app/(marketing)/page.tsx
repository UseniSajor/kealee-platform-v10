// apps/m-permits-inspections/app/(marketing)/page.tsx
// Permits & Inspections Marketing Landing Page

import type { Metadata } from 'next';
import { PermitsClient } from '../../components/PermitsClient';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Kealee Permits | Get Building Permits Approved, Not Rejected',
  description:
    'AI-powered permit applications with 85% first-try approval rate. 3,000+ jurisdictions in DC-Baltimore corridor. TurboTax for building permits.',
  openGraph: {
    title: 'Kealee Permits - TurboTax for Building Permits',
    description:
      'AI reviews your application in 5 minutes. 85% first-try approval rate. 3,000+ jurisdictions supported.',
    url: 'https://permits.kealee.com',
    siteName: 'Kealee',
    images: [
      {
        url: '/og-permits.png',
        width: 1200,
        height: 630,
        alt: 'Kealee Permits Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kealee Permits - Get Permits Approved Faster',
    description: 'AI-powered permit applications. 85% first-try approval rate.',
    images: ['/og-permits.png'],
  },
};

// Permit types
const permitTypes = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    name: 'Building',
    description: 'New construction & additions',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    name: 'Electrical',
    description: 'Panels, wiring, upgrades',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    name: 'Plumbing',
    description: 'Pipes, fixtures, drains',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      </svg>
    ),
    name: 'Mechanical',
    description: 'HVAC & ventilation',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    name: 'Renovation',
    description: 'Remodels & alterations',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    name: 'Demo',
    description: 'Demolition permits',
  },
];

// Comparison items
const comparison = [
  {
    without: 'Spend hours researching jurisdiction requirements',
    with: 'AI knows requirements for 3,000+ jurisdictions',
  },
  {
    without: 'Submit incomplete applications and wait weeks for rejection',
    with: 'AI review catches errors in 5 minutes before you submit',
  },
  {
    without: 'Play phone tag with permit offices',
    with: 'Real-time status tracking and digital communication',
  },
  {
    without: 'Pay expediter fees of $500-2,000 per permit',
    with: 'Pay once, flat fee starting at $495',
  },
  {
    without: 'Miss critical deadlines and delay projects',
    with: 'Automated timeline management and alerts',
  },
  {
    without: '3-6 week average approval time',
    with: '14 day average approval time',
  },
];

// Features
const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: 'AI Pre-Review',
    description: 'Our AI reviews your application in 5 minutes, catching errors and missing documents before you submit.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Smart Forms',
    description: 'Jurisdiction-specific forms auto-filled with your project data. No more manual paperwork.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: 'Document Checklist',
    description: 'Know exactly what documents you need. Upload once, we format and organize for submission.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    title: 'Status Tracking',
    description: 'Real-time updates on your permit status. Know exactly where you are in the process.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Inspection Scheduling',
    description: 'Schedule inspections directly through the platform. Get reminders and track results.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    title: 'Expert Support',
    description: 'Questions? Our permit specialists are here to help. Chat, call, or email.',
  },
];

// Pricing tiers
const pricingTiers = [
  {
    name: 'DIY',
    price: 495,
    period: 'permit',
    popular: false,
    description: 'For simple permits you want to handle yourself',
    features: [
      'AI application review',
      'Smart form filling',
      'Document checklist',
      'Status tracking',
      'Email support',
    ],
    cta: { label: 'Get Started', href: '/permits/new?plan=diy' },
  },
  {
    name: 'Standard',
    price: 1500,
    period: 'permit',
    popular: true,
    description: 'Most popular for residential projects',
    features: [
      'Everything in DIY',
      'Permit specialist review',
      'Corrections handling',
      'Inspection scheduling',
      'Phone support',
      'Resubmission included',
    ],
    cta: { label: 'Get Started', href: '/permits/new?plan=standard' },
  },
  {
    name: 'Premium',
    price: 3500,
    period: 'permit',
    popular: false,
    description: 'For complex projects requiring expert guidance',
    features: [
      'Everything in Standard',
      'Dedicated permit manager',
      'Multi-permit coordination',
      'Expediting when available',
      'Priority support',
      'Unlimited revisions',
    ],
    cta: { label: 'Get Started', href: '/permits/new?plan=premium' },
  },
  {
    name: 'Enterprise',
    price: 7500,
    period: 'project',
    popular: false,
    description: 'For developers and high-volume contractors',
    features: [
      'Everything in Premium',
      'Volume discounts',
      'Custom workflows',
      'API access',
      'Dedicated account team',
      'SLA guarantees',
    ],
    cta: { label: 'Contact Sales', href: '/contact?plan=enterprise' },
  },
];

// Sample jurisdictions
const jurisdictions = [
  { name: 'Washington', state: 'DC', permitTypes: 24, avgApprovalDays: 12 },
  { name: 'Montgomery County', state: 'MD', permitTypes: 18, avgApprovalDays: 14 },
  { name: 'Baltimore City', state: 'MD', permitTypes: 22, avgApprovalDays: 16 },
  { name: 'Fairfax County', state: 'VA', permitTypes: 20, avgApprovalDays: 11 },
  { name: "Prince George's County", state: 'MD', permitTypes: 19, avgApprovalDays: 15 },
  { name: 'Arlington County', state: 'VA', permitTypes: 17, avgApprovalDays: 10 },
  { name: 'Howard County', state: 'MD', permitTypes: 16, avgApprovalDays: 13 },
  { name: 'Anne Arundel County', state: 'MD', permitTypes: 18, avgApprovalDays: 14 },
];

// FAQs
const faqs = [
  {
    question: 'How does the AI review work?',
    answer: 'Our AI analyzes your application against jurisdiction-specific requirements, checking for missing information, incorrect formats, and common errors. It compares your documents to successful permits and flags potential issues. The review takes about 5 minutes and gives you a detailed report.',
  },
  {
    question: 'What\'s your success rate?',
    answer: 'We have an 85% first-try approval rate across all permit types. For permits that require revisions, we handle the corrections and resubmission at no extra cost (Standard plan and above).',
  },
  {
    question: 'How long does approval take?',
    answer: 'Average approval time is 14 days through Kealee, compared to 3-6 weeks for traditional submissions. Times vary by jurisdiction and permit type. Our platform tracks your application and sends real-time updates.',
  },
  {
    question: 'Do you work with my jurisdiction?',
    answer: 'We support 3,000+ jurisdictions in the DC-Baltimore corridor, including all major counties in Maryland, Virginia, and Washington DC. Check our jurisdiction map or start an application to see if we cover your area.',
  },
  {
    question: 'What if my permit gets rejected?',
    answer: 'If your permit is rejected, we have a money-back guarantee. For Standard and Premium plans, we also handle corrections and resubmission at no additional cost. Our permit specialists will guide you through any required changes.',
  },
  {
    question: 'Do I need to provide architectural drawings?',
    answer: 'It depends on the permit type. Simple permits (like water heater replacement) may only need photos. Complex permits (like additions) require professional drawings. Our checklist tells you exactly what you need, and we can connect you with Kealee Architect if you need design help.',
  },
  {
    question: 'Can I use Kealee if I\'m not a contractor?',
    answer: 'Absolutely! Kealee is designed for homeowners, contractors, architects, and property managers. Our platform guides you through the process regardless of your experience level.',
  },
  {
    question: 'How do I schedule inspections?',
    answer: 'Once your permit is approved, you can schedule inspections directly through the Kealee platform. We integrate with jurisdiction calendars where available and handle scheduling requests for you where we don\'t.',
  },
];

export default function PermitsLandingPage() {
  return (
    <PermitsClient
      permitTypes={permitTypes}
      comparison={comparison}
      features={features}
      pricingTiers={pricingTiers}
      jurisdictions={jurisdictions}
      faqs={faqs}
    />
  );
}
