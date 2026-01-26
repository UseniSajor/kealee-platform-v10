'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import {
  ArrowRight,
  Check,
  X,
  Zap,
  Shield,
  Users,
  Clock,
  Building2,
  Star,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const pricingTiers = [
  {
    id: 'package-a',
    name: 'Package A',
    subtitle: 'Monitoring',
    description: 'Essential project oversight for contractors who want visibility without full management.',
    price: 299,
    billing: 'per project/month',
    popular: false,
    features: [
      { name: 'Project dashboard access', included: true },
      { name: 'Weekly progress reports', included: true },
      { name: 'Milestone tracking', included: true },
      { name: 'Basic document storage', included: true },
      { name: 'Email support', included: true },
      { name: 'Permit expediting', included: false },
      { name: 'Contractor coordination', included: false },
      { name: 'Client portal', included: false },
      { name: 'Dedicated ops manager', included: false },
    ],
    cta: 'Start Free Trial',
    ctaLink: '/signup?plan=a',
  },
  {
    id: 'package-b',
    name: 'Package B',
    subtitle: 'Operations Support',
    description: 'Hands-on operational support for growing contractors managing multiple projects.',
    price: 599,
    billing: 'per project/month',
    popular: false,
    features: [
      { name: 'Everything in Package A', included: true },
      { name: 'Permit application assistance', included: true },
      { name: 'Inspection scheduling', included: true },
      { name: 'Subcontractor tracking', included: true },
      { name: 'Compliance monitoring', included: true },
      { name: 'Priority email & chat support', included: true },
      { name: 'Full permit expediting', included: false },
      { name: 'Client portal', included: false },
      { name: 'Dedicated ops manager', included: false },
    ],
    cta: 'Start Free Trial',
    ctaLink: '/signup?plan=b',
  },
  {
    id: 'package-c',
    name: 'Package C',
    subtitle: 'Full Service',
    description: 'Complete project operations management. Our most popular package for serious contractors.',
    price: 999,
    billing: 'per project/month',
    popular: true,
    features: [
      { name: 'Everything in Package B', included: true },
      { name: 'Full permit expediting', included: true },
      { name: 'Contractor coordination', included: true },
      { name: 'Material tracking', included: true },
      { name: 'Client communication portal', included: true },
      { name: 'Weekly video updates', included: true },
      { name: 'Budget tracking & alerts', included: true },
      { name: 'Phone support', included: true },
      { name: 'Dedicated ops manager', included: false },
    ],
    cta: 'Get Started',
    ctaLink: '/signup?plan=c',
  },
  {
    id: 'package-d',
    name: 'Package D',
    subtitle: 'Enterprise',
    description: 'White-glove operations with a dedicated manager for high-volume contractors.',
    price: 1999,
    billing: 'per project/month',
    popular: false,
    features: [
      { name: 'Everything in Package C', included: true },
      { name: 'Dedicated ops manager', included: true },
      { name: 'Custom reporting', included: true },
      { name: 'API integrations', included: true },
      { name: 'Multi-project dashboard', included: true },
      { name: '24/7 priority support', included: true },
      { name: 'Quarterly business reviews', included: true },
      { name: 'Custom workflows', included: true },
      { name: 'Volume discounts available', included: true },
    ],
    cta: 'Contact Sales',
    ctaLink: '/contact?plan=d',
  },
];

const faqs = [
  {
    question: 'Can I switch plans later?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle. If you upgrade mid-cycle, we\'ll prorate the difference.',
  },
  {
    question: 'Is there a minimum contract?',
    answer: 'No long-term contracts required. All plans are month-to-month and you can cancel anytime. We believe in earning your business every month.',
  },
  {
    question: 'What happens if I have multiple projects?',
    answer: 'Each project is billed separately. However, we offer volume discounts for contractors managing 5+ concurrent projects. Contact us for custom pricing.',
  },
  {
    question: 'Do you offer a free trial?',
    answer: 'Yes! All plans include a 14-day free trial with full access to features. No credit card required to start. We want you to experience the value before committing.',
  },
  {
    question: 'What\'s included in permit expediting?',
    answer: 'Our team handles the entire permit process: application preparation, submission, revision responses, inspection scheduling, and approval tracking. We work directly with DC, MD, and VA permit offices.',
  },
  {
    question: 'Can you work with my existing tools?',
    answer: 'Absolutely. We integrate with popular construction software like Procore, Buildertrend, CoConstruct, and more. Package D includes custom API integrations.',
  },
];

const comparisons = [
  { feature: 'Dashboard & Reporting', a: true, b: true, c: true, d: true },
  { feature: 'Milestone Tracking', a: true, b: true, c: true, d: true },
  { feature: 'Document Storage', a: '5GB', b: '25GB', c: '100GB', d: 'Unlimited' },
  { feature: 'Permit Assistance', a: false, b: 'Basic', c: 'Full', d: 'Full + Priority' },
  { feature: 'Contractor Coordination', a: false, b: false, c: true, d: true },
  { feature: 'Client Portal', a: false, b: false, c: true, d: 'Custom Branded' },
  { feature: 'Support Level', a: 'Email', b: 'Email + Chat', c: 'Phone', d: '24/7 Priority' },
  { feature: 'Dedicated Ops Manager', a: false, b: false, c: false, d: true },
  { feature: 'API Access', a: false, b: false, c: false, d: true },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billingAnnual, setBillingAnnual] = useState(false);

  return (
    <>
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 backdrop-blur-xl border border-blue-400/30 rounded-full text-blue-200 text-sm font-medium mb-6">
              <Zap size={16} />
              Simple, Transparent Pricing
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Choose Your Ops Package
            </h1>
            <p className="text-xl text-blue-100/80 mb-8 max-w-2xl mx-auto">
              From basic monitoring to full-service operations management. Start with a 14-day free trial - no credit card required.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={`text-sm font-medium ${!billingAnnual ? 'text-white' : 'text-slate-400'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingAnnual(!billingAnnual)}
                className="relative w-14 h-7 bg-blue-500/30 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    billingAnnual ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${billingAnnual ? 'text-white' : 'text-slate-400'}`}>
                Annual <span className="text-emerald-400">(Save 20%)</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-24 bg-slate-50 -mt-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {pricingTiers.map((tier) => {
              const displayPrice = billingAnnual
                ? Math.round(tier.price * 0.8)
                : tier.price;

              return (
                <div
                  key={tier.id}
                  className={`relative bg-white rounded-3xl p-8 shadow-sm border-2 transition-all hover:shadow-xl ${
                    tier.popular
                      ? 'border-blue-600 shadow-lg scale-105 lg:scale-110'
                      : 'border-slate-100'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
                      Most Popular
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-900">{tier.name}</h3>
                    <p className="text-blue-600 font-medium">{tier.subtitle}</p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-slate-900">${displayPrice}</span>
                      <span className="text-slate-500">/{tier.billing.split('/')[1]}</span>
                    </div>
                    {billingAnnual && (
                      <p className="text-sm text-emerald-600 mt-1">
                        Save ${(tier.price * 12 * 0.2).toLocaleString()}/year
                      </p>
                    )}
                  </div>

                  <p className="text-slate-600 text-sm mb-6 min-h-[60px]">
                    {tier.description}
                  </p>

                  <Link
                    href={tier.ctaLink}
                    className={`block w-full text-center py-3 rounded-xl font-semibold transition-all mb-8 ${
                      tier.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {tier.cta}
                  </Link>

                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        {feature.included ? (
                          <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="h-3 w-3 text-emerald-600" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <X className="h-3 w-3 text-slate-400" />
                          </div>
                        )}
                        <span className={feature.included ? 'text-slate-700' : 'text-slate-400'}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Compare All Features
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              See exactly what's included in each package
            </p>
          </div>

          <div className="max-w-5xl mx-auto overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-4 px-4 text-left text-slate-600 font-medium">Feature</th>
                  <th className="py-4 px-4 text-center text-slate-900 font-semibold">Package A</th>
                  <th className="py-4 px-4 text-center text-slate-900 font-semibold">Package B</th>
                  <th className="py-4 px-4 text-center text-slate-900 font-semibold bg-blue-50 rounded-t-xl">Package C</th>
                  <th className="py-4 px-4 text-center text-slate-900 font-semibold">Package D</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((row, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    <td className="py-4 px-4 text-slate-700">{row.feature}</td>
                    <td className="py-4 px-4 text-center">
                      {typeof row.a === 'boolean' ? (
                        row.a ? (
                          <Check className="h-5 w-5 text-emerald-600 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-slate-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-slate-600">{row.a}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {typeof row.b === 'boolean' ? (
                        row.b ? (
                          <Check className="h-5 w-5 text-emerald-600 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-slate-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-slate-600">{row.b}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center bg-blue-50">
                      {typeof row.c === 'boolean' ? (
                        row.c ? (
                          <Check className="h-5 w-5 text-emerald-600 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-slate-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-blue-600 font-medium">{row.c}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {typeof row.d === 'boolean' ? (
                        row.d ? (
                          <Check className="h-5 w-5 text-emerald-600 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-slate-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-slate-600">{row.d}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">Secure & Compliant</h3>
                <p className="text-sm text-slate-600">SOC 2 certified</p>
              </div>
              <div>
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">14-Day Free Trial</h3>
                <p className="text-sm text-slate-600">No credit card required</p>
              </div>
              <div>
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">150+ Contractors</h3>
                <p className="text-sm text-slate-600">Trust Kealee Ops</p>
              </div>
              <div>
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Star className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">4.8/5 Rating</h3>
                <p className="text-sm text-slate-600">From our customers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-slate-600">
                Everything you need to know about our pricing
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left"
                  >
                    <span className="font-semibold text-slate-900">{faq.question}</span>
                    {openFaq === index ? (
                      <ChevronUp className="h-5 w-5 text-slate-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-500" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-5">
                      <p className="text-slate-600">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-blue-700 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Still Have Questions?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Schedule a free consultation and we'll help you find the right package for your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
              >
                Start Free Trial
                <ArrowRight size={20} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-500/20 text-white font-semibold rounded-xl border border-white/20 hover:bg-blue-500/30 transition-all"
              >
                Talk to Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
