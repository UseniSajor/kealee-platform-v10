'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Building2, CheckCircle, ArrowRight, Clock, Users, FileText, Phone, Calendar, TrendingUp, Shield } from 'lucide-react';

const packages = [
  {
    name: 'Package A',
    subtitle: 'Starter',
    price: '$1,750',
    period: '/month',
    hours: '5-10 hours/week',
    description: 'Perfect for small projects needing basic PM support',
    features: [
      'Ops intake + planning',
      'Vendor shortlist curation',
      'Monthly check-ins',
      'Basic reporting dashboard',
      'Email support',
    ],
    popular: false,
  },
  {
    name: 'Package B',
    subtitle: 'Professional',
    price: '$4,500',
    period: '/month',
    hours: '15-20 hours/week',
    description: 'Ideal for medium projects with active management needs',
    features: [
      'Everything in Package A',
      'Dedicated ops support',
      'Weekly progress updates',
      'Permit tracking assistance',
      'Vendor coordination',
      'Priority phone support',
    ],
    popular: true,
  },
  {
    name: 'Package C',
    subtitle: 'Premium',
    price: '$8,500',
    period: '/month',
    hours: '25-35 hours/week',
    description: 'For complex projects requiring comprehensive management',
    features: [
      'Everything in Package B',
      'Priority response SLA',
      'Full vendor operations',
      'Risk tracking & mitigation',
      'Weekly reporting + escalation',
      'Dedicated PM assigned',
    ],
    popular: false,
  },
  {
    name: 'Package D',
    subtitle: 'Enterprise',
    price: '$16,500',
    period: '/month',
    hours: '40+ hours/week',
    description: 'Multi-project program management for enterprises',
    features: [
      'Everything in Package C',
      'Multi-project coordination',
      'Custom SLA terms',
      'Program-level reporting',
      'Dedicated support channel',
      'Executive reviews',
    ],
    popular: false,
  },
];

const benefits = [
  {
    icon: Clock,
    title: 'Save 40% on PM Costs',
    description: 'Reduce overhead compared to hiring full-time project managers',
  },
  {
    icon: Users,
    title: 'Expert Team',
    description: 'Access experienced construction PMs with diverse project backgrounds',
  },
  {
    icon: TrendingUp,
    title: '25% Faster Delivery',
    description: 'Streamlined processes and proactive issue resolution',
  },
  {
    icon: Shield,
    title: 'Risk Mitigation',
    description: 'Early warning systems and contingency planning',
  },
];

export default function OpsServicesPage() {
  return (
    <>
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 backdrop-blur text-blue-300 px-4 py-2 rounded-full text-sm font-semibold mb-8">
              <Building2 size={16} />
              Ops Services
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Full-Service Construction
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500"> Project Management</span>
            </h1>
            <p className="text-xl text-blue-100/80 mb-10 max-w-2xl mx-auto">
              Dedicated PM support for your construction projects. From planning to completion,
              we handle the details so you can focus on building.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-900 font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all"
              >
                Get Started
                <ArrowRight size={20} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
              >
                <Phone size={20} />
                Talk to Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="text-blue-600" size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{benefit.title}</h3>
                <p className="text-slate-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Choose Your Package</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Flexible plans designed to match your project needs and budget
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {packages.map((pkg, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl p-8 shadow-lg border-2 transition-all hover:shadow-xl ${
                  pkg.popular ? 'border-blue-600' : 'border-transparent'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    MOST POPULAR
                  </div>
                )}

                <div className="text-sm font-semibold text-blue-600 mb-2">{pkg.subtitle}</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{pkg.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-slate-900">{pkg.price}</span>
                  <span className="text-slate-500">{pkg.period}</span>
                </div>
                <div className="text-sm text-blue-600 font-medium mb-4">{pkg.hours}</div>
                <p className="text-slate-600 text-sm mb-6">{pkg.description}</p>

                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                      <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={`block w-full py-3 text-center font-semibold rounded-xl transition-all ${
                    pkg.popular
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to streamline your project management?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Schedule a free consultation to discuss your project needs.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all"
          >
            <Calendar size={20} />
            Schedule Consultation
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
