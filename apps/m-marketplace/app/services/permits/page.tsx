'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FileCheck, CheckCircle, ArrowRight, Clock, Zap, MapPin, Shield, Calendar, Brain, FileText } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Review',
    description: 'Our AI analyzes your plans in minutes, catching issues before submission',
  },
  {
    icon: MapPin,
    title: '3,000+ Jurisdictions',
    description: 'Nationwide coverage with jurisdiction-specific requirements built in',
  },
  {
    icon: Clock,
    title: 'Fast-Track Approval',
    description: '85% first-pass approval rate saves weeks of back-and-forth',
  },
  {
    icon: Calendar,
    title: 'Inspection Scheduling',
    description: 'Automated scheduling and tracking for all inspection types',
  },
];

const pricing = [
  {
    name: 'Basic Review',
    price: '$50',
    per: 'per permit',
    features: [
      'AI compliance check',
      'Issue identification',
      'Fix recommendations',
      'Email support',
    ],
  },
  {
    name: 'Full Service',
    price: '$150',
    per: 'per permit',
    features: [
      'Everything in Basic',
      'Document preparation',
      'Jurisdiction submission',
      'Status tracking',
      'Revision handling',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    per: 'volume pricing',
    features: [
      'Everything in Full Service',
      'Dedicated account manager',
      'API access',
      'Custom integrations',
      'Priority processing',
    ],
  },
];

export default function PermitsPage() {
  return (
    <>
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-purple-900 via-purple-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-purple-500/20 backdrop-blur text-purple-300 px-4 py-2 rounded-full text-sm font-semibold mb-8">
              <FileCheck size={16} />
              Permits & Inspections
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              AI-Powered Permit
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500"> Approval</span>
            </h1>
            <p className="text-xl text-purple-100/80 mb-10 max-w-2xl mx-auto">
              Get permit approval faster with our AI review system. Covering 3,000+ jurisdictions
              with an 85% first-pass approval rate.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-900 font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all"
              >
                Start Free Review
                <ArrowRight size={20} />
              </Link>
              <Link
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '85%', label: 'First-Pass Approval' },
              { value: '5 min', label: 'AI Review Time' },
              { value: '3,000+', label: 'Jurisdictions' },
              { value: '10,000+', label: 'Permits Processed' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-4xl font-bold text-purple-600">{stat.value}</div>
                <div className="text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-xl text-slate-600">Streamlined permit approval in four simple steps</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="text-purple-600" size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Simple Pricing</h2>
            <p className="text-xl text-slate-600">Pay per permit or choose volume pricing for enterprises</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl p-8 border-2 transition-all hover:shadow-xl ${
                  plan.popular ? 'border-purple-600 shadow-lg' : 'border-slate-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    RECOMMENDED
                  </div>
                )}

                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                </div>
                <div className="text-slate-500 mb-6">{plan.per}</div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-700">
                      <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={`block w-full py-3 text-center font-semibold rounded-xl transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
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

      <Footer />
    </>
  );
}
