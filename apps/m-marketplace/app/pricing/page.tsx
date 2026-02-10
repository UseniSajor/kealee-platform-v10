'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Check, HelpCircle, ArrowRight, Zap, Star, Building2, Briefcase, Crown, Users, Wrench } from 'lucide-react';
import Link from 'next/link';

/**
 * PRICING PAGE - Two distinct pricing models:
 *
 * 1. PLATFORM ACCESS (SaaS) - For software/tool access
 *    - Essentials: $99/user/mo
 *    - Performance: $199/user/mo
 *    - Scale: $349/user/mo
 *    - Enterprise: Custom
 *
 * 2. PM MANAGED SERVICES (A/B/C/D Packages) - For GC/Builder/Contractors
 *    - Package A - Starter: $1,750/month
 *    - Package B - Professional: $3,750/month
 *    - Package C - Premium: $9,500/month (MOST POPULAR)
 *    - Package D - Enterprise: $16,500/month
 *
 * 3. PERMIT SERVICES (A/B/C/D Packages)
 *    - Permit A - Basic: $495 one-time
 *    - Permit B - Full Service: $1,295/month (up to 10 permits/month) (MOST POPULAR)
 *    - Permit C - Premium: $2,995/month (up to 50 permits/month)
 *    - Permit D - Enterprise: $7,500/month (custom permits/month)
 */

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<'platform' | 'pm-services' | 'permits' | 'operations'>('platform');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  // PLATFORM ACCESS - SaaS pricing for software tools
  const platformPlans = [
    {
      name: 'Essentials',
      description: 'For small teams getting started',
      price: billingPeriod === 'monthly' ? 99 : 79,
      period: '/user/mo',
      icon: Zap,
      color: 'gray',
      features: [
        'Up to 5 users',
        'Up to 3 active projects',
        'Project dashboard',
        'Document storage (10GB)',
        'Basic reporting',
        'Email support',
      ],
      cta: { label: 'Start Free Trial', href: 'https://app.kealee.com/signup' },
    },
    {
      name: 'Performance',
      description: 'For growing construction firms',
      price: billingPeriod === 'monthly' ? 199 : 159,
      period: '/user/mo',
      icon: Building2,
      color: 'blue',
      popular: true,
      features: [
        'Up to 20 users',
        'Up to 10 active projects',
        'Everything in Essentials',
        'Budget tracking & forecasting',
        'RFI & submittal management',
        'Client portal access',
        'Advanced reporting',
        'Document storage (100GB)',
        'Phone support',
      ],
      cta: { label: 'Start Free Trial', href: 'https://app.kealee.com/signup' },
    },
    {
      name: 'Scale',
      description: 'For established contractors',
      price: billingPeriod === 'monthly' ? 349 : 279,
      period: '/user/mo',
      icon: Briefcase,
      color: 'purple',
      features: [
        'Up to 50 users',
        'Up to 20 active projects',
        'Everything in Performance',
        'Custom workflows',
        'API access',
        'SSO integration',
        'Document storage (500GB)',
        'Priority support',
        'Dedicated success manager',
      ],
      cta: { label: 'Start Free Trial', href: 'https://app.kealee.com/signup' },
    },
    {
      name: 'Enterprise',
      description: 'For large organizations',
      price: null,
      priceLabel: 'Custom',
      icon: Crown,
      color: 'gray',
      features: [
        'Unlimited users',
        'Unlimited projects',
        'Everything in Scale',
        'Custom integrations',
        'On-premise deployment option',
        'Unlimited storage',
        'SLA guarantee',
        '24/7 premium support',
        'Custom training',
      ],
      cta: { label: 'Contact Sales', href: '/contact' },
    },
  ];

  // PM MANAGED SERVICES - A/B/C/D packages for GC/Builder/Contractors
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

  // PERMIT SERVICES - A/B/C/D packages
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

  // OPERATIONS SERVICES - Individual
  const operationsServices = [
    {
      category: 'Project Controls',
      services: [
        { name: 'Project Scheduling (CPM)', price: 125, unit: '/project' },
        { name: 'Document Control Setup', price: 150, unit: '/project' },
        { name: 'RFI Management', price: 175, unit: '/project' },
        { name: 'Submittal Management', price: 175, unit: '/project' },
      ],
    },
    {
      category: 'Estimation',
      services: [
        { name: 'Conceptual Estimate', price: 195, unit: '/estimate' },
        { name: 'Schematic Estimate', price: 495, unit: '/estimate' },
        { name: 'Detailed Estimate', price: 1495, unit: '/estimate' },
        { name: 'Value Engineering', price: 1995, unit: '/analysis' },
      ],
    },
    {
      category: 'Quality & Safety',
      services: [
        { name: 'Quality Control Inspection', price: 225, unit: '/inspection' },
        { name: 'Safety Plan Development', price: 250, unit: '/plan' },
        { name: 'OSHA Compliance Review', price: 295, unit: '/review' },
      ],
    },
    {
      category: 'Specialized',
      services: [
        { name: 'BIM Coordination', price: 495, unit: '/model' },
        { name: 'Site Logistics Planning', price: 595, unit: '/plan' },
        { name: 'Closeout Documentation', price: 395, unit: '/project' },
      ],
    },
  ];

  const faqs = [
    {
      q: 'What\'s the difference between Platform Access and PM Services?',
      a: 'Platform Access gives you software tools to manage projects yourself. PM Services provide a dedicated project manager who handles everything for you - ideal for GCs, builders, and contractors who want hands-off management.',
    },
    {
      q: 'Can I use both Platform Access and PM Services?',
      a: 'Yes! Many clients use Platform Access for internal tracking while PM Services handle day-to-day project management. Contact sales for bundle pricing.',
    },
    {
      q: 'Can I switch plans or packages anytime?',
      a: 'Yes! You can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle.',
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept all major credit cards (Visa, Mastercard, Amex), ACH transfers, and can arrange invoicing for Enterprise customers.',
    },
    {
      q: 'Are there any hidden fees?',
      a: 'No hidden fees. All applicable fees are clearly displayed at checkout based on the Suggested Retail Price (SRP).',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">

          {/* Hero */}
          <div className="text-center mb-16 max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Clear Pricing, Real Results
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Choose software access or full-service management. No hidden fees, cancel anytime.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <Check className="text-green-500" size={16} />
                No setup fees
              </span>
              <span className="flex items-center gap-2">
                <Check className="text-green-500" size={16} />
                Cancel anytime
              </span>
              <span className="flex items-center gap-2">
                <Check className="text-green-500" size={16} />
                30-day money-back
              </span>
            </div>
          </div>

          {/* Product Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-gray-100 rounded-xl p-1 flex-wrap justify-center gap-1">
              {[
                { id: 'platform', label: 'Platform Access', icon: Users, description: 'Software tools' },
                { id: 'pm-services', label: 'PM Services', icon: Wrench, description: 'Managed by experts' },
                { id: 'permits', label: 'Permit Services', icon: Building2, description: 'Permit handling' },
                { id: 'operations', label: 'Operations', icon: Briefcase, description: 'Individual' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-4 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <tab.icon size={18} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Description */}
          <div className="text-center mb-12">
            {activeTab === 'platform' && (
              <div className="bg-blue-50 text-blue-800 px-6 py-4 rounded-xl inline-block max-w-2xl">
                <p className="font-medium">
                  <Users className="inline mr-2" size={18} />
                  <strong>Platform Access</strong> - Software subscription for your team to manage projects with our tools.
                  Ideal for firms who want to self-manage using powerful PM software.
                </p>
              </div>
            )}
            {activeTab === 'pm-services' && (
              <div className="bg-green-50 text-green-800 px-6 py-4 rounded-xl inline-block max-w-2xl">
                <p className="font-medium">
                  <Wrench className="inline mr-2" size={18} />
                  <strong>PM Managed Services</strong> - A dedicated project manager handles everything for you.
                  Ideal for GCs, builders, and contractors who want hands-off project management.
                </p>
              </div>
            )}
            {activeTab === 'permits' && (
              <div className="bg-orange-50 text-orange-800 px-6 py-4 rounded-xl inline-block max-w-2xl">
                <p className="font-medium">
                  <Building2 className="inline mr-2" size={18} />
                  <strong>Permit Services</strong> - We handle permit applications, submissions, and inspections.
                  Choose individual permits or monthly packages.
                </p>
              </div>
            )}
            {activeTab === 'operations' && (
              <div className="bg-purple-50 text-purple-800 px-6 py-4 rounded-xl inline-block max-w-2xl">
                <p className="font-medium">
                  <Briefcase className="inline mr-2" size={18} />
                  <strong>Operations Services</strong> - Individual professional services.
                  Pay only for what you need with no subscriptions or minimums.
                </p>
              </div>
            )}
          </div>

          {/* PLATFORM ACCESS - SaaS Plans */}
          {activeTab === 'platform' && (
            <>
              {/* Billing Toggle */}
              <div className="flex justify-center items-center gap-4 mb-12">
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

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-20">
                {platformPlans.map((plan, idx) => (
                  <div
                    key={idx}
                    className={`relative bg-white rounded-2xl border-2 p-8 ${
                      plan.popular ? 'border-blue-500 shadow-xl' : 'border-gray-200'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <span className="px-4 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${
                        plan.popular ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <plan.icon className={plan.popular ? 'text-blue-600' : 'text-gray-600'} size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-500">{plan.description}</p>
                    </div>

                    <div className="text-center mb-6">
                      {plan.price ? (
                        <>
                          <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                          <span className="text-gray-500">{plan.period}</span>
                        </>
                      ) : (
                        <span className="text-4xl font-bold text-gray-900">{plan.priceLabel}</span>
                      )}
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-3 text-sm text-gray-600">
                          <Check className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={plan.cta.href}
                      className={`block w-full py-3 text-center font-semibold rounded-xl transition ${
                        plan.popular
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      }`}
                    >
                      {plan.cta.label}
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* PM MANAGED SERVICES - A/B/C/D Packages */}
          {activeTab === 'pm-services' && (
            <>
              {/* Billing Toggle */}
              <div className="flex justify-center items-center gap-4 mb-12">
                <span className={`font-medium ${billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
                  Monthly
                </span>
                <button
                  onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
                  className={`w-14 h-8 rounded-full p-1 transition ${
                    billingPeriod === 'annual' ? 'bg-green-600' : 'bg-gray-300'
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

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-20">
              {pmPackages.map((pkg, idx) => (
                <div
                  key={idx}
                  className={`
                    relative
                    bg-white rounded-2xl p-6
                    border-2
                    transition-all duration-300
                    flex flex-col
                    ${pkg.popular
                      ? 'border-green-600 shadow-2xl scale-[1.02]'
                      : 'border-gray-200 shadow-lg hover:shadow-xl hover:border-gray-300'
                    }
                  `}
                >
                  {/* Popular Badge */}
                  {pkg.popular && (
                    <div className="
                      absolute -top-3 left-1/2 -translate-x-1/2
                      bg-green-600 text-white
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
                    <div className="text-sm font-semibold text-green-600 uppercase tracking-wide">
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

                  {/* Package Details */}
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
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                      }
                    `}
                  >
                    {pkg.cta}
                  </Link>
                </div>
              ))}
            </div>
            </>
          )}

          {/* PERMIT SERVICES - A/B/C/D Packages */}
          {activeTab === 'permits' && (
            <>
              {/* Billing Toggle */}
              <div className="flex justify-center items-center gap-4 mb-12">
                <span className={`font-medium ${billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
                  Monthly
                </span>
                <button
                  onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
                  className={`w-14 h-8 rounded-full p-1 transition ${
                    billingPeriod === 'annual' ? 'bg-orange-500' : 'bg-gray-300'
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

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-20">
              {permitPackages.map((pkg, idx) => (
                <div
                  key={idx}
                  className={`
                    relative
                    bg-white rounded-2xl p-6
                    border-2
                    transition-all duration-300
                    flex flex-col
                    ${pkg.popular
                      ? 'border-orange-500 shadow-2xl scale-[1.02]'
                      : 'border-gray-200 shadow-lg hover:shadow-xl hover:border-gray-300'
                    }
                  `}
                >
                  {/* Popular Badge */}
                  {pkg.popular && (
                    <div className="
                      absolute -top-3 left-1/2 -translate-x-1/2
                      bg-orange-500 text-white
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
                    <div className="text-sm font-semibold text-orange-500 uppercase tracking-wide">
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

                  {/* Turnaround */}
                  <div className="flex items-center gap-2 bg-green-50 text-green-700 rounded-lg p-3 mb-4 text-sm font-medium">
                    <Zap size={16} />
                    {pkg.turnaround}
                  </div>

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
                        ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                      }
                    `}
                  >
                    {pkg.cta}
                  </Link>
                </div>
              ))}
            </div>
            </>
          )}

          {/* OPERATIONS SERVICES - Individual */}
          {activeTab === 'operations' && (
            <div className="max-w-5xl mx-auto mb-20">
              <div className="grid md:grid-cols-2 gap-8">
                {operationsServices.map((category, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border-2 border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">{category.category}</h3>
                    <div className="space-y-3">
                      {category.services.map((service, sIdx) => (
                        <div key={sIdx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <span className="text-gray-700">{service.name}</span>
                          <span className="font-semibold text-gray-900">
                            ${service.price}{service.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-green-50 rounded-xl p-6 text-center">
                <h4 className="font-bold text-gray-900 mb-2">Volume Discounts Available</h4>
                <p className="text-gray-600 text-sm">
                  5+ services: 10% off | 10+ services: 15% off | 25+ services: 20% off
                </p>
              </div>

              <div className="mt-8 text-center">
                <Link
                  href="https://ops.kealee.com"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition"
                >
                  Browse All Services
                  <ArrowRight size={20} />
                </Link>
              </div>
            </div>
          )}

          {/* Comparison note */}
          <div className="max-w-4xl mx-auto bg-gray-50 rounded-2xl p-6 mb-20">
            <h4 className="font-semibold text-gray-900 mb-3">Which option is right for you?</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-900 mb-1">Choose Platform Access if:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>You have internal PM staff</li>
                  <li>You want software tools for self-management</li>
                  <li>You need multiple team members with access</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Choose PM Services if:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>You want hands-off project management</li>
                  <li>You're a GC, builder, or contractor</li>
                  <li>You need a dedicated PM to handle everything</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Fair Bidding System Note */}
          <div className="max-w-4xl mx-auto bg-blue-50 rounded-2xl p-6 mb-20">
            <h4 className="font-semibold text-gray-900 mb-3">Fair Bidding System</h4>
            <p className="text-sm text-gray-600">
              Our fair rotation algorithm ensures all qualified contractors get opportunities.
              Contractors bid competitively based on Suggested Retail Price (SRP), and all applicable
              fees are clearly displayed at checkout.
            </p>
          </div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-2 flex items-start gap-3">
                    <HelpCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                    {faq.q}
                  </h3>
                  <p className="text-gray-600 pl-8">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-blue-600 rounded-3xl p-12 text-center text-white max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              Not Sure Which Option Is Right?
            </h2>
            <p className="text-blue-100 text-lg mb-8">
              Our team can help you find the perfect solution for your needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition"
              >
                Talk to Sales
              </Link>
              <Link
                href="https://app.kealee.com/signup"
                className="px-8 py-4 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl transition"
              >
                Start Free Trial
              </Link>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
