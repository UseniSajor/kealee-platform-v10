// apps/m-marketplace/components/PricingOverviewClient.tsx
// Comprehensive Pricing Overview Page with All Modules

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { MarketingLayout, SectionLabel, FAQAccordion } from '@kealee/ui';

type Module =
  | 'all'
  | 'architect'
  | 'permits'
  | 'ops-software'
  | 'ops-services'
  | 'estimation'
  | 'pm-operations'
  | 'project-owner';

interface ModuleTab {
  id: Module;
  label: string;
  domain: string;
  color: string;
}

const moduleTabs: ModuleTab[] = [
  { id: 'all', label: 'All Modules', domain: '', color: 'bg-gray-500' },
  { id: 'architect', label: 'Architect', domain: 'architect.kealee.com', color: 'bg-[#2ABFBF]' },
  { id: 'permits', label: 'Permits', domain: 'permits.kealee.com', color: 'bg-[#38A169]' },
  { id: 'ops-software', label: 'PM Software', domain: 'ops.kealee.com', color: 'bg-[#E8793A]' },
  { id: 'ops-services', label: 'Operations Services', domain: 'ops.kealee.com', color: 'bg-[#2ABFBF]' },
  { id: 'estimation', label: 'Estimation Services', domain: 'ops.kealee.com', color: 'bg-[#E8793A]' },
  { id: 'pm-operations', label: 'PM Operations', domain: 'ops.kealee.com', color: 'bg-[#4A90D9]' },
  { id: 'project-owner', label: 'Project Owner', domain: 'app.kealee.com', color: 'bg-[#E8793A]' },
];

// All pricing data
const pricingData = {
  architect: {
    title: 'Architect Hub',
    subtitle: 'Design project management for architecture professionals',
    tiers: [
      {
        name: 'Free',
        price: 0,
        period: 'forever',
        features: ['Up to 3 active projects', 'Basic deliverable tracking', 'Client review portal', 'Email support'],
        cta: 'Get Started',
      },
      {
        name: 'Professional',
        price: '3%',
        period: 'of project value',
        popular: true,
        features: [
          'Unlimited projects',
          'Advanced phase management',
          'Team collaboration',
          'Permit integration',
          'Payment processing',
          'Priority support',
        ],
        cta: 'Get Started',
      },
      {
        name: 'Firm',
        price: 'Custom',
        period: '',
        features: [
          'Multiple team members',
          'Firm-wide analytics',
          'Custom workflows',
          'API access',
          'Dedicated support',
        ],
        cta: 'Contact Sales',
      },
    ],
  },
  permits: {
    title: 'Permits & Inspections',
    subtitle: 'AI-powered permit applications with 85% first-try approval',
    tiers: [
      {
        name: 'DIY',
        price: 495,
        period: 'per permit',
        features: ['AI application review', 'Smart form filling', 'Document checklist', 'Status tracking', 'Email support'],
        cta: 'Get Started',
      },
      {
        name: 'Standard',
        price: 1500,
        period: 'per permit',
        popular: true,
        features: [
          'Everything in DIY',
          'Permit specialist review',
          'Corrections handling',
          'Inspection scheduling',
          'Phone support',
          'Resubmission included',
        ],
        cta: 'Get Started',
      },
      {
        name: 'Premium',
        price: 3500,
        period: 'per permit',
        features: [
          'Everything in Standard',
          'Dedicated permit manager',
          'Multi-permit coordination',
          'Expediting when available',
          'Priority support',
          'Unlimited revisions',
        ],
        cta: 'Get Started',
      },
      {
        name: 'Enterprise',
        price: 7500,
        period: 'per project',
        features: ['Everything in Premium', 'Volume discounts', 'Custom workflows', 'API access', 'SLA guarantees'],
        cta: 'Contact Sales',
      },
    ],
  },
  'ops-software': {
    title: 'PM Software (SaaS)',
    subtitle: 'Project management software for construction professionals',
    tiers: [
      {
        name: 'Starter',
        price: 99,
        period: '/month',
        features: ['5 active projects', 'Basic scheduling', 'Document storage (5GB)', 'Mobile app', 'Email support'],
        cta: 'Start Trial',
      },
      {
        name: 'Professional',
        price: 249,
        period: '/month',
        popular: true,
        features: [
          '25 active projects',
          'Advanced scheduling',
          'Budget tracking',
          'Subcontractor portal',
          'Document storage (25GB)',
          'Phone support',
        ],
        cta: 'Start Trial',
      },
      {
        name: 'Business',
        price: 499,
        period: '/month',
        features: [
          'Unlimited projects',
          'Resource management',
          'Custom reports',
          'API access',
          'Document storage (100GB)',
          'Priority support',
        ],
        cta: 'Start Trial',
      },
      {
        name: 'Enterprise',
        price: 'Custom',
        period: '',
        features: ['Multi-team support', 'SSO integration', 'Custom integrations', 'Dedicated success manager', 'SLA'],
        cta: 'Contact Sales',
      },
    ],
  },
  'ops-services': {
    title: 'Operations Services',
    subtitle: 'Professional project support services (à la carte)',
    services: [
      { name: 'Site Analysis Report', price: 125 },
      { name: 'Scope of Work Development', price: 195 },
      { name: 'Permit Requirements Research', price: 95 },
      { name: 'Contractor Vetting & Verification', price: 175 },
      { name: 'Bid Leveling & Analysis', price: 245 },
      { name: 'Construction Contract Review', price: 295 },
      { name: 'Draw Request Review', price: 145 },
      { name: 'Punch List Development', price: 225 },
      { name: 'Project Closeout Review', price: 175 },
      { name: 'Warranty Claim Assistance', price: 150 },
      { name: 'Permit Application Preparation', price: 295 },
    ],
  },
  estimation: {
    title: 'Estimation Services',
    subtitle: 'Professional cost estimation services',
    services: [
      { name: 'Quick Estimate', price: 195, note: 'flat' },
      { name: 'Detailed Construction Estimate', price: 595, note: 'from' },
      { name: 'Contractor Bid Estimate', price: 795, note: 'from' },
      { name: 'Value Engineering Analysis', price: 495, note: 'flat' },
      { name: 'Change Order Pricing Review', price: 175, note: 'flat' },
      { name: 'Insurance Claim Estimate', price: 395, note: 'from' },
      { name: 'Project Feasibility Analysis', price: 695, note: 'flat' },
    ],
  },
  'pm-operations': {
    title: 'PM Operations Add-on',
    subtitle: 'Remote project management services (requires PM Software)',
    tiers: [
      {
        name: 'Starter',
        price: 1750,
        period: '/month',
        features: [
          '1 active project',
          'Weekly status reports',
          'Budget monitoring',
          'Schedule updates',
          'Email communication',
        ],
        cta: 'Get Started',
      },
      {
        name: 'Growth',
        price: 3500,
        period: '/month',
        popular: true,
        features: [
          '3 active projects',
          'Bi-weekly calls',
          'Subcontractor coordination',
          'RFI management',
          'Change order tracking',
        ],
        cta: 'Get Started',
      },
      {
        name: 'Professional',
        price: 6500,
        period: '/month',
        features: [
          '5 active projects',
          'Weekly calls',
          'Full PM services',
          'Vendor management',
          'Quality tracking',
        ],
        cta: 'Get Started',
      },
      {
        name: 'Enterprise',
        price: 16500,
        period: '/month',
        features: [
          '10+ active projects',
          'Dedicated PM team',
          'Custom reporting',
          'Executive dashboards',
          'SLA guarantees',
        ],
        cta: 'Contact Sales',
      },
    ],
  },
  'project-owner': {
    title: 'Project Owner',
    subtitle: 'Construction project management for property owners',
    tiers: [
      {
        name: 'Basic',
        price: 0,
        period: 'free',
        features: ['1 project', 'Basic dashboard', 'Document storage', 'Contractor messaging'],
        cta: 'Get Started',
      },
      {
        name: 'Premium',
        price: 49,
        period: '/month',
        popular: true,
        features: [
          '5 projects',
          'Budget tracking',
          'Payment management',
          'Photo timeline',
          'Milestone alerts',
          'Priority support',
        ],
        cta: 'Get Started',
      },
      {
        name: 'Portfolio',
        price: 199,
        period: '/month',
        features: [
          'Unlimited projects',
          'Multi-property dashboard',
          'Team access',
          'Advanced analytics',
          'Custom reports',
          'Dedicated support',
        ],
        cta: 'Get Started',
      },
    ],
  },
};

const faqs = [
  {
    question: 'Can I mix and match services from different modules?',
    answer:
      'Absolutely! Kealee is designed as an integrated platform. You can use PM Software for project management, add Operations Services for specific tasks, and get permits through our Permits module—all connected to the same project.',
  },
  {
    question: 'What\'s the difference between PM Software and PM Operations?',
    answer:
      'PM Software is a SaaS subscription that gives you project management tools to manage your own projects. PM Operations is an add-on service where our team actively manages your projects remotely—think of it as outsourced project management. PM Operations requires a PM Software subscription.',
  },
  {
    question: 'Do I need to commit to annual contracts?',
    answer:
      'Most of our subscriptions are month-to-month with no long-term commitment. Operations and Estimation services are pay-per-project. Enterprise plans may offer discounts for annual commitments.',
  },
  {
    question: 'Are there volume discounts for multiple projects?',
    answer:
      'Yes! For permit packages and operations services, we offer discounts for bundled services and high-volume customers. Contact our sales team for custom pricing.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards, ACH bank transfers, and wire transfers for enterprise accounts. All payments are processed securely through Stripe.',
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer:
      'Yes, you can change your plan at any time. Upgrades take effect immediately with prorated billing. Downgrades take effect at the start of your next billing cycle.',
  },
];

function PricingCard({
  tier,
  accentColor = 'bg-[#E8793A]',
}: {
  tier: {
    name: string;
    price: number | string;
    period?: string;
    popular?: boolean;
    features: string[];
    cta: string;
  };
  accentColor?: string;
}) {
  const displayPrice = typeof tier.price === 'number' ? `$${tier.price.toLocaleString()}` : tier.price;

  return (
    <div
      className={`relative bg-white rounded-xl border p-6 ${
        tier.popular ? 'border-[#E8793A] ring-2 ring-[#E8793A]/20' : 'border-gray-200'
      }`}
    >
      {tier.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#E8793A] text-white text-xs font-semibold rounded-full">
          Most Popular
        </span>
      )}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-[#4A90D9]">{tier.name}</h3>
        <div className="mt-2">
          <span className="text-3xl font-bold font-mono text-[#4A90D9]">{displayPrice}</span>
          {tier.period && <span className="text-gray-500 text-sm ml-1">{tier.period}</span>}
        </div>
      </div>
      <ul className="space-y-2 mb-6">
        {tier.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-[#38A169] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
      <button
        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
          tier.popular
            ? 'bg-[#E8793A] text-white hover:bg-[#d16a2f]'
            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        {tier.cta}
      </button>
    </div>
  );
}

function ServiceList({
  services,
}: {
  services: { name: string; price: number; note?: string }[];
}) {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {services.map((service, i) => (
        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-700">{service.name}</span>
          <span className="font-mono font-semibold text-[#4A90D9]">
            {service.note === 'from' ? 'From ' : ''}${service.price}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PricingOverviewClient() {
  const [selectedModule, setSelectedModule] = useState<Module>('all');

  const filteredModules =
    selectedModule === 'all'
      ? Object.keys(pricingData)
      : [selectedModule];

  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="bg-[#4A90D9] py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Pricing Overview</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Transparent pricing across all Kealee modules. Mix and match to build your perfect construction toolkit.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Module Tabs */}
      <section className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-4 -mx-4 px-4">
            {moduleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedModule(tab.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  selectedModule === tab.id
                    ? 'bg-[#4A90D9] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Sections */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedModule}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-16"
            >
              {filteredModules.map((moduleKey) => {
                const module = pricingData[moduleKey as keyof typeof pricingData];
                const tabConfig = moduleTabs.find((t) => t.id === moduleKey);

                return (
                  <div key={moduleKey} id={moduleKey} className="scroll-mt-24">
                    <div className="mb-8">
                      <div className="flex items-center gap-3 mb-2">
                        {tabConfig && (
                          <span className={`px-2 py-1 ${tabConfig.color} text-white text-xs font-medium rounded`}>
                            {tabConfig.label}
                          </span>
                        )}
                        {tabConfig?.domain && (
                          <span className="text-xs text-gray-400">{tabConfig.domain}</span>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold text-[#4A90D9]">{module.title}</h2>
                      <p className="text-gray-600 mt-1">{module.subtitle}</p>
                    </div>

                    {'tiers' in module ? (
                      <div className={`grid gap-6 ${module.tiers.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
                        {module.tiers.map((tier, i) => (
                          <PricingCard key={i} tier={tier} />
                        ))}
                      </div>
                    ) : (
                      <ServiceList services={module.services} />
                    )}
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="text-3xl font-bold text-[#4A90D9]">Pricing Questions</h2>
          </div>
          <FAQAccordion items={faqs} />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#E8793A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-white/90 mb-8">
            Start with a free account and upgrade as your needs grow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-white text-[#E8793A] font-semibold rounded-xl hover:bg-gray-100 transition-colors"
            >
              Create Free Account
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-transparent text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-white/10 transition-colors"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
