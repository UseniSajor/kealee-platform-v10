'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Star, Zap } from 'lucide-react';

/**
 * SOP v2 - PM MANAGED SERVICE PACKAGES (A/B/C/D)
 *
 * Package A - Starter: $1,750/month (5-10 hrs/week, 1 project)
 * Package B - Professional: $3,750/month (15-20 hrs/week, 3 projects)
 * Package C - Premium: $9,500/month (30-40 hrs/week, unlimited) - MOST POPULAR
 * Package D - Enterprise: $16,500/month (40+ hrs/week, portfolio)
 */

type PricingTab = 'pm' | 'permits';

export function Pricing() {
  const [activeTab, setActiveTab] = useState<PricingTab>('pm');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  const pmPackages = [
    {
      name: 'Package A',
      tier: 'Starter',
      price: billingPeriod === 'monthly' ? 1750 : 1400,
      period: 'month',
      hours: '5-10 hrs/week',
      projects: '1 concurrent',
      support: 'Email (48hr)',
      description: 'Basic PM support for smaller projects',
      features: [
        'Weekly progress reports',
        'Basic task tracking',
        'Contractor coordination',
        'Budget monitoring',
        'Document organization',
        'Monthly check-in call (30 min)',
      ],
      automation: '40%',
      cta: 'Get Started',
      href: '/ops-services?package=A',
      popular: false,
    },
    {
      name: 'Package B',
      tier: 'Professional',
      price: billingPeriod === 'monthly' ? 3750 : 3000,
      period: 'month',
      hours: '15-20 hrs/week',
      projects: 'Up to 3',
      support: 'Priority (24hr)',
      description: 'Full PM support for active projects',
      features: [
        'Everything in Package A',
        'Bi-weekly progress reports',
        'Advanced project tracking',
        'Full contractor coordination',
        'Budget optimization',
        'Risk management',
        'Weekly check-in calls',
      ],
      automation: '50%',
      cta: 'Get Started',
      href: '/ops-services?package=B',
      popular: false,
    },
    {
      name: 'Package C',
      tier: 'Premium',
      price: billingPeriod === 'monthly' ? 9500 : 7600,
      period: 'month',
      hours: '30-40 hrs/week',
      projects: 'Up to 20',
      support: '24/7 Priority',
      description: 'Complete PM service with full support',
      features: [
        'Everything in Package B',
        'Daily progress reports with photos',
        'Dedicated PM assigned',
        'Permit management included',
        'Inspection coordination',
        'Site visits (2-4/month)',
        'Change order management',
        'Payment approval recommendations',
        'Premium support included',
      ],
      automation: '60%',
      cta: 'Most Popular',
      href: '/ops-services?package=C',
      popular: true,
    },
    {
      name: 'Package D',
      tier: 'Enterprise',
      price: billingPeriod === 'monthly' ? 16500 : 13200,
      period: 'month',
      hours: '40+ hrs/week',
      projects: 'Portfolio',
      support: 'Dedicated Manager',
      description: 'White-glove service for portfolios',
      features: [
        'Everything in Package C',
        'We hire contractors for you',
        'We handle all payments',
        'Daily updates',
        'Custom reporting & analytics',
        'Multi-project coordination',
        'Design coordination',
        'Warranty management',
        'Complete hands-off experience',
      ],
      automation: '70%',
      cta: 'Contact Sales',
      href: '/contact?package=D',
      popular: false,
    },
  ];

  const permitPackages = [
    {
      name: 'Permit A',
      tier: 'Basic',
      price: 495,
      period: 'one-time',
      description: 'Single permit application',
      features: [
        '1 permit application',
        'Application review & prep',
        'Document compilation',
        'Jurisdiction submission',
        'Follow-up communications',
        'Resubmittal support',
      ],
      turnaround: '2-3 business days',
      cta: 'Get Started',
      href: '/permits-inspections?package=A',
      popular: false,
    },
    {
      name: 'Permit B',
      tier: 'Full Service',
      price: billingPeriod === 'monthly' ? 1295 : 1036,
      period: 'month',
      description: 'Up to 10 permits per month with AI review',
      features: [
        'Up to 10 permits per month',
        'AI document review',
        'Complete application prep',
        'Expedited processing',
        '1 resubmittal included per permit',
        'Inspection scheduling',
        'Approval guarantee',
      ],
      turnaround: '1-2 business days',
      cta: 'Most Popular',
      href: '/permits-inspections?package=B',
      popular: true,
    },
    {
      name: 'Permit C',
      tier: 'Premium',
      price: billingPeriod === 'monthly' ? 2995 : 2396,
      period: 'month',
      description: 'Up to 50 permits per month with full coordination',
      features: [
        'Up to 50 permits per month',
        'Full AI analysis',
        'Architect/engineer coordination',
        'Jurisdiction liaison',
        'Unlimited resubmittals',
        'All inspection scheduling',
        'On-site inspection support',
        'Certificate of occupancy',
        'Dedicated coordinator',
      ],
      turnaround: 'Same-day processing',
      cta: 'Get Started',
      href: '/permits-inspections?package=C',
      popular: false,
    },
    {
      name: 'Permit D',
      tier: 'Enterprise',
      price: billingPeriod === 'monthly' ? 7500 : 6000,
      period: 'month',
      description: 'Custom permits per month for portfolios',
      features: [
        'Custom permit volume',
        'Dedicated permit team',
        'Multi-jurisdiction expertise',
        'Portfolio dashboard',
        'Bulk processing',
        'Compliance monitoring',
        'Relationship management',
        'Approval guarantees',
        'Monthly reporting',
        'Strategic planning',
      ],
      turnaround: 'Priority processing',
      cta: 'Contact Sales',
      href: '/contact?package=permit-D',
      popular: false,
    },
  ];

  const activePackages = activeTab === 'pm' ? pmPackages : permitPackages;

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Clear Pricing, Real Results
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Choose the service level that fits your project. No hidden fees, cancel anytime.
          </p>

          {/* Tab Switcher */}
          <div className="inline-flex items-center bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('pm')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'pm'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              PM Services
            </button>
            <button
              onClick={() => setActiveTab('permits')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'permits'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Permit Services
            </button>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <span className={`font-medium ${billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
              className={`w-14 h-8 rounded-full p-1 transition ${
                billingPeriod === 'annual' ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div className={`w-6 h-6 bg-white rounded-full transition transform ${
                billingPeriod === 'annual' ? 'translate-x-6' : ''
              }`} />
            </button>
            <span className={`font-medium ${billingPeriod === 'annual' ? 'text-gray-900' : 'text-gray-500'}`}>
              Annual
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-sm rounded-full">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {activePackages.map((pkg, i) => (
            <div
              key={i}
              className={`
                relative
                bg-white rounded-2xl p-6
                border-2
                transition-all duration-300
                flex flex-col
                ${pkg.popular
                  ? 'border-blue-600 shadow-2xl scale-[1.02]'
                  : 'border-gray-200 shadow-lg hover:shadow-xl hover:border-gray-300'
                }
              `}
            >
              {/* Popular Badge */}
              {pkg.popular && (
                <div className="
                  absolute -top-3 left-1/2 -translate-x-1/2
                  bg-blue-600 text-white
                  px-4 py-1
                  rounded-full text-sm font-semibold
                  shadow-lg
                  flex items-center gap-1
                ">
                  <Star size={14} />
                  Most Popular
                </div>
              )}

              {/* Package Name */}
              <div className="mb-4">
                <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                  {pkg.name}
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {pkg.tier}
                </h3>
              </div>

              {/* Price */}
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    ${pkg.price.toLocaleString()}
                  </span>
                  <span className="text-gray-600">/{pkg.period}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-4">
                {pkg.description}
              </p>

              {/* Package Details (PM only) */}
              {activeTab === 'pm' && 'hours' in pkg && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hours:</span>
                    <span className="font-medium">{pkg.hours}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Projects:</span>
                    <span className="font-medium">{pkg.projects}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Support:</span>
                    <span className="font-medium">{pkg.support}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Automation:</span>
                    <span className="font-medium text-green-600">{pkg.automation}</span>
                  </div>
                </div>
              )}

              {/* Turnaround (Permits only) */}
              {activeTab === 'permits' && 'turnaround' in pkg && (
                <div className="flex items-center gap-2 bg-green-50 text-green-700 rounded-lg p-3 mb-4 text-sm font-medium">
                  <Zap size={16} />
                  {pkg.turnaround}
                </div>
              )}

              {/* Features */}
              <ul className="space-y-2 mb-6 flex-1">
                {pkg.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <Check className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                    <span className="text-gray-700">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={pkg.href}
                className={`
                  block w-full py-3 text-center
                  font-semibold
                  rounded-lg
                  transition-all duration-200
                  ${pkg.popular
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }
                `}
              >
                {pkg.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* How Bidding Works Note */}
        <div className="mt-12 max-w-4xl mx-auto bg-gray-50 rounded-2xl p-6">
          <h4 className="font-semibold text-gray-900 mb-3">Fair Bidding System</h4>
          <p className="text-sm text-gray-600">
            Our fair rotation algorithm ensures all qualified contractors get opportunities.
            Contractors bid competitively based on Suggested Retail Price (SRP), and all applicable
            fees are clearly displayed at checkout.
          </p>
        </div>

        {/* Compare Plans */}
        <div className="text-center mt-8">
          <Link
            href="/pricing"
            className="
              inline-flex items-center gap-2
              text-blue-600 hover:text-blue-700 font-semibold
            "
          >
            View full pricing details & compare features
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
}
