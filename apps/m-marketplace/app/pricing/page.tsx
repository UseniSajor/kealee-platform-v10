'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Check, HelpCircle, ArrowRight, Zap, Building2, Briefcase, Crown } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [activeTab, setActiveTab] = useState<'pm' | 'permits' | 'operations'>('pm');

  const pmPlans = [
    {
      name: 'Starter',
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
      name: 'Professional',
      description: 'For growing construction firms',
      price: billingPeriod === 'monthly' ? 199 : 159,
      period: '/user/mo',
      icon: Building2,
      color: 'blue',
      popular: true,
      features: [
        'Up to 20 users',
        'Up to 15 active projects',
        'Everything in Starter',
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
      name: 'Business',
      description: 'For established contractors',
      price: billingPeriod === 'monthly' ? 349 : 279,
      period: '/user/mo',
      icon: Briefcase,
      color: 'purple',
      features: [
        'Up to 50 users',
        'Unlimited projects',
        'Everything in Professional',
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
        'Everything in Business',
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

  const permitPlans = [
    {
      name: 'DIY Review',
      description: 'AI-powered self-service',
      price: 495,
      period: '/permit',
      features: [
        'AI document analysis',
        'Error detection report',
        'Compliance checklist',
        'Jurisdiction guide',
        'Email support',
      ],
      cta: { label: 'Get Started', href: 'https://permits.kealee.com' },
    },
    {
      name: 'Standard',
      description: 'Full-service processing',
      price: 1500,
      period: '/permit',
      popular: true,
      features: [
        'Everything in DIY Review',
        'Application preparation',
        'Submission handling',
        'Status tracking',
        'Up to 2 revision rounds',
        'Phone support',
      ],
      cta: { label: 'Get Started', href: 'https://permits.kealee.com' },
    },
    {
      name: 'Premium',
      description: 'Expedited processing',
      price: 3500,
      period: '/permit',
      features: [
        'Everything in Standard',
        'Priority processing',
        'Unlimited revisions',
        'Inspector coordination',
        'Video inspection support',
        'Dedicated specialist',
      ],
      cta: { label: 'Get Started', href: 'https://permits.kealee.com' },
    },
    {
      name: 'Enterprise',
      description: 'Multi-permit projects',
      price: null,
      priceLabel: 'Custom',
      features: [
        'Everything in Premium',
        'Multi-permit coordination',
        'Phased approval strategy',
        'Agency relationship mgmt',
        'Expediting services',
        'SLA guarantee',
      ],
      cta: { label: 'Contact Sales', href: '/contact' },
    },
  ];

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
      q: 'Can I switch plans anytime?',
      a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.',
    },
    {
      q: 'Is there a free trial?',
      a: 'Yes, we offer a 14-day free trial for our Project Management platform. No credit card required.',
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept all major credit cards (Visa, Mastercard, Amex), ACH transfers, and can arrange invoicing for Enterprise customers.',
    },
    {
      q: 'Do you offer discounts for annual billing?',
      a: 'Yes! Pay annually and save 20% on all subscription plans.',
    },
    {
      q: 'What happens to my data if I cancel?',
      a: 'Your data remains accessible for 30 days after cancellation. You can export everything before your account is closed.',
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
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              No hidden fees. No long-term contracts. Start free and pay only for what you use.
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
            <div className="inline-flex bg-gray-100 rounded-xl p-1">
              {[
                { id: 'pm', label: 'Project Management' },
                { id: 'permits', label: 'Permits' },
                { id: 'operations', label: 'Operations Services' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-6 py-3 rounded-lg font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-white text-gray-900 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Billing Toggle for PM */}
          {activeTab === 'pm' && (
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
          )}

          {/* PM Plans */}
          {activeTab === 'pm' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-20">
              {pmPlans.map((plan, idx) => (
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
          )}

          {/* Permit Plans */}
          {activeTab === 'permits' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-20">
              {permitPlans.map((plan, idx) => (
                <div
                  key={idx}
                  className={`relative bg-white rounded-2xl border-2 p-8 ${
                    plan.popular ? 'border-orange-500 shadow-xl' : 'border-gray-200'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 bg-orange-500 text-white text-sm font-medium rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-500">{plan.description}</p>
                  </div>

                  <div className="text-center mb-6">
                    {plan.price ? (
                      <>
                        <span className="text-4xl font-bold text-gray-900">${plan.price.toLocaleString()}</span>
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
                        ? 'bg-orange-500 hover:bg-orange-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    {plan.cta.label}
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Operations Services */}
          {activeTab === 'operations' && (
            <div className="max-w-5xl mx-auto mb-20">
              <div className="text-center mb-8">
                <p className="text-gray-600">
                  Pay only for what you need. No subscriptions, no minimums.
                </p>
              </div>

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
                  className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition"
                >
                  Browse All Services
                  <ArrowRight size={20} />
                </Link>
              </div>
            </div>
          )}

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
              Not Sure Which Plan Is Right?
            </h2>
            <p className="text-blue-100 text-lg mb-8">
              Our team can help you find the perfect solution for your business.
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
