// apps/m-ops-services/app/(marketing)/page.tsx
// Ops & PM Services Landing Page - THE LARGEST PAGE

import type { Metadata } from 'next';
import { OpsServicesClient } from '../../components/OpsServicesClient';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Kealee Ops & PM Services | Construction Operations Platform',
  description:
    'Project management software, professional estimation services, and on-demand operations support for GCs, builders, and contractors. SaaS plans from $99/mo.',
  openGraph: {
    title: 'Kealee Ops & PM Services',
    description:
      'The complete construction operations platform. PM software, estimation services, and optional PM team.',
    url: 'https://ops.kealee.com',
    siteName: 'Kealee',
    images: [
      {
        url: '/og-ops.png',
        width: 1200,
        height: 630,
        alt: 'Kealee Ops & PM Services',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

// PM Software Features
const pmSoftwareFeatures = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
    title: 'Project Dashboard',
    description: 'Unified view of all projects, tasks, and milestones.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Scheduling & CPM',
    description: 'Gantt charts, critical path, and resource planning.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Budget & Cost Tracking',
    description: 'Real-time budget monitoring and cost breakdowns.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Document Management',
    description: 'Centralized docs, drawings, and specs storage.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    title: 'RFIs & Submittals',
    description: 'Track RFIs, submittals, and design clarifications.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    title: 'Daily Logs & Field Reports',
    description: 'Mobile-friendly daily logs with photo attachments.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Quality & Safety',
    description: 'QC checklists, safety plans, and inspection logs.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    title: 'Change Order Management',
    description: 'Track, price, and approve change orders.',
  },
];

// SaaS Pricing
const saasPricing = [
  {
    name: 'Starter',
    price: 99,
    period: 'mo',
    popular: false,
    features: ['1-3 active projects', 'Up to 5 team members', 'Basic scheduling', 'Document storage (5GB)', 'Email support'],
    cta: { label: 'Start Free Trial', href: '/signup?plan=starter' },
  },
  {
    name: 'Professional',
    price: 249,
    period: 'mo',
    popular: true,
    features: ['Up to 10 projects', 'Up to 15 team members', 'Gantt & CPM scheduling', 'RFI/Submittal tracking', 'Storage (25GB)', 'Priority support'],
    cta: { label: 'Start Free Trial', href: '/signup?plan=professional' },
  },
  {
    name: 'Business',
    price: 499,
    period: 'mo',
    popular: false,
    features: ['Up to 25 projects', 'Unlimited team members', 'Advanced reporting', 'Custom workflows', 'Storage (100GB)', 'Phone support'],
    cta: { label: 'Start Free Trial', href: '/signup?plan=business' },
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    popular: false,
    features: ['Unlimited projects', 'Custom integrations', 'Dedicated success manager', 'SSO & advanced security', 'Unlimited storage', 'SLA guarantee'],
    cta: { label: 'Contact Sales', href: '/contact?plan=enterprise' },
  },
];

// Operations Services
const operationsServices = [
  { name: 'Site Analysis', price: 125, description: 'Site conditions assessment and feasibility review.', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg> },
  { name: 'Scope of Work', price: 195, description: 'Detailed SOW document with specifications.', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  { name: 'Material Takeoff', price: 250, description: 'Comprehensive material quantities from plans.', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
  { name: 'Project Schedule', price: 295, description: 'CPM schedule with milestones and dependencies.', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
  { name: 'Safety Plan', price: 195, description: 'Site-specific safety plan and protocols.', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
  { name: 'QC Plan', price: 225, description: 'Quality control procedures and checklists.', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> },
  { name: 'Sub Bid Package', price: 350, description: 'Complete bid package for subcontractors.', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
  { name: 'Permit Prep', price: 395, description: 'Permit application preparation and review.', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  { name: 'Change Order Analysis', price: 175, description: 'CO review, pricing validation, and impact analysis.', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> },
  { name: 'Closeout Docs', price: 295, description: 'Project closeout documentation package.', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg> },
  { name: 'Punch List', price: 125, description: 'Punch list compilation and tracking.', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
];

// Estimation Services
const estimationServices = [
  { name: 'Quick Estimate', price: 195, description: 'Ballpark estimate for budgeting and feasibility. 24-48 hour turnaround.', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
  { name: 'Detailed Estimate', price: 595, description: 'Line-by-line estimate with labor, materials, and subs breakdown.', popular: true, icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> },
  { name: 'Bid Estimate', price: 795, description: 'Competitive bid-ready estimate with markup and contingency.', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  { name: 'Design-Phase Estimate', price: 1295, description: 'Early-stage estimate for design development and value engineering.', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg> },
  { name: 'Value Engineering', price: 995, description: 'Cost optimization analysis with alternative recommendations.', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { name: 'Estimate Review', price: 495, description: 'Third-party review and validation of existing estimate.', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> },
  { name: 'Portfolio Package', price: 5995, description: 'Full estimation support for multiple projects. Includes 10 estimates.', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
];

// PM Ops Pricing
const pmOpsPricing = [
  {
    name: 'Starter',
    price: 1750,
    period: 'mo',
    popular: false,
    features: ['1 active project', 'Permit tracking', 'Weekly status updates', 'Basic coordination', 'Document organization'],
    cta: { label: 'Get Started', href: '/pm-operations?plan=starter' },
  },
  {
    name: 'Growth',
    price: 3500,
    period: 'mo',
    popular: false,
    features: ['2-3 active projects', 'Full permit management', 'Bi-weekly calls', 'Contractor coordination', 'Change order tracking'],
    cta: { label: 'Get Started', href: '/pm-operations?plan=growth' },
  },
  {
    name: 'Professional',
    price: 6500,
    period: 'mo',
    popular: true,
    features: ['4-6 active projects', 'Dedicated PM', 'Weekly executive reports', 'Full coordination suite', 'Priority escalations'],
    cta: { label: 'Get Started', href: '/pm-operations?plan=professional' },
  },
  {
    name: 'Enterprise',
    price: 16500,
    period: 'mo',
    popular: false,
    features: ['7+ active projects', 'PM team assignment', 'Daily check-ins', 'Custom workflows', 'SLA guarantees', '24/7 support'],
    cta: { label: 'Contact Sales', href: '/contact?plan=pm-enterprise' },
  },
];

// Audience Cards
const audienceCards = [
  { title: 'General Contractors', description: 'Full project oversight and multi-trade coordination.', icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
  { title: 'Builders', description: 'Residential and commercial construction management.', icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { title: 'Trade Contractors', description: 'Specialty trade project tracking and billing.', icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg> },
  { title: 'Owners/RE Developers', description: 'Portfolio management and development oversight.', icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
  { title: 'Specialty Contractors', description: 'Niche trade management and compliance.', icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg> },
];

// FAQ Items
const faqItems = [
  { question: 'What\'s the difference between PM Software and PM Operations?', answer: 'PM Software (SaaS) gives you the tools to manage your own projects — you and your team do the work. PM Operations is a separate add-on where Kealee\'s PM team manages your projects for you, remotely through the platform. These are two different things.' },
  { question: 'Does PM Operations include on-site supervision?', answer: 'No. PM Operations is 100% remote/platform-based. We coordinate contractors, track permits, generate reports, and manage documentation — all from our platform. We do NOT provide any on-site services, site visits, or physical presence.' },
  { question: 'Can I use PM Software without PM Operations?', answer: 'Absolutely. PM Software is a standalone SaaS product. You can subscribe to PM Software and run your own projects without any involvement from Kealee\'s PM team.' },
  { question: 'Do I need PM Software to use PM Operations?', answer: 'Yes. PM Operations requires an active SaaS subscription because our team works through the platform. However, SaaS is included with PM Ops — you won\'t be double-billed.' },
  { question: 'How do Operations Services differ from PM Operations?', answer: 'Operations Services are one-time à la carte deliverables (like a Safety Plan or Material Takeoff). PM Operations is ongoing monthly project coordination by our team. You can use Operations Services independently or alongside PM Software/Operations.' },
  { question: 'What\'s included in the SaaS plans?', answer: 'All SaaS plans include the core PM Software features: project dashboard, scheduling, budget tracking, document management, RFI tracking, daily logs, quality/safety tools, and change order management. Higher tiers add more projects, team members, storage, and support levels.' },
  { question: 'Can I switch between PM Operations packages?', answer: 'Yes. You can upgrade or downgrade your PM Operations package based on your active project count. Changes take effect at the next billing cycle.' },
  { question: 'What jurisdictions do you support for permit services?', answer: 'We support 3,000+ jurisdictions across the DC-Baltimore corridor and expanding. Our permit prep services work with any jurisdiction — we research requirements and prepare compliant applications.' },
];

export default function OpsServicesPage() {
  return (
    <OpsServicesClient
      pmSoftwareFeatures={pmSoftwareFeatures}
      saasPricing={saasPricing}
      operationsServices={operationsServices}
      estimationServices={estimationServices}
      pmOpsPricing={pmOpsPricing}
      audienceCards={audienceCards}
      faqItems={faqItems}
    />
  );
}
