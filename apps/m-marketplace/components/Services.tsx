'use client';

import Link from 'next/link';
import { Building2, Users, Pencil, FileCheck, ArrowRight, CheckCircle, Zap, Shield, Clock } from 'lucide-react';

const services = [
  {
    icon: Building2,
    title: 'Ops Services',
    subtitle: 'Full-Service Project Management',
    description: 'Dedicated PM support with weekly reports, vendor coordination, and milestone tracking.',
    pricing: 'From $1,750/month',
    features: [
      '5-40+ hours/week PM time',
      'Multiple project tier options',
      'Weekly progress reports',
      '24/7 priority support',
    ],
    link: '/services/ops',
    gradient: 'from-blue-500 to-blue-600',
    lightBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    popular: false,
  },
  {
    icon: Users,
    title: 'Project Owner Portal',
    subtitle: 'Complete Project Visibility',
    description: 'Track milestones, approve payments, and manage your construction projects in real-time.',
    pricing: '3% platform fee',
    features: [
      'Real-time project tracking',
      'Milestone approval workflow',
      'Contractor management',
      'Secure payment processing',
    ],
    link: '/services/portal',
    gradient: 'from-orange-500 to-orange-600',
    lightBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    popular: true,
  },
  {
    icon: Pencil,
    title: 'Architect Services',
    subtitle: 'Professional Design Solutions',
    description: 'Permit-ready plans from licensed architects with 3D renderings and unlimited revisions.',
    pricing: 'From $3,500',
    features: [
      'Permit-ready drawings',
      '3D renderings included',
      'Licensed architects',
      'Unlimited revisions',
    ],
    link: '/services/architect',
    gradient: 'from-green-500 to-green-600',
    lightBg: 'bg-green-50',
    iconColor: 'text-green-600',
    popular: false,
  },
  {
    icon: FileCheck,
    title: 'Permits & Inspections',
    subtitle: 'AI-Powered Compliance',
    description: 'Get permit approval fast with our AI review system covering 3,000+ jurisdictions.',
    pricing: 'From $50/permit',
    features: [
      'AI review in 5 minutes',
      '3,000+ jurisdictions',
      'Inspection scheduling',
      '85% first-try pass rate',
    ],
    link: '/services/permits',
    gradient: 'from-purple-500 to-purple-600',
    lightBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    popular: false,
  },
];

export function Services() {
  return (
    <section id="services" className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-slate-100" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-100/30 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Zap size={16} />
            Complete Construction Solutions
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            Everything You Need to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700">
              Succeed
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            From project planning to final inspection, our integrated platform handles every aspect of
            construction management so you can focus on building.
          </p>
        </div>

        {/* Service Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {services.map((service, index) => (
            <Link
              key={index}
              href={service.link}
              className="group relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-200/50 hover:border-transparent overflow-hidden"
            >
              {/* Popular Badge */}
              {service.popular && (
                <div className="absolute top-6 right-6">
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    MOST POPULAR
                  </div>
                </div>
              )}

              {/* Gradient Overlay on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

              {/* Icon */}
              <div className="relative mb-6">
                <div className={`w-16 h-16 rounded-2xl ${service.lightBg} flex items-center justify-center ${service.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon size={32} />
                </div>
                <div className={`absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br ${service.gradient} rounded-lg opacity-20`} />
              </div>

              {/* Content */}
              <div className="relative">
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {service.subtitle}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {service.title}
                </h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  {service.description}
                </p>

                {/* Pricing */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${service.lightBg} mb-6`}>
                  <span className={`text-lg font-bold ${service.iconColor}`}>{service.pricing}</span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700">
                      <div className={`w-5 h-5 rounded-full ${service.lightBg} flex items-center justify-center flex-shrink-0`}>
                        <CheckCircle className={service.iconColor} size={14} />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className={`flex items-center gap-2 font-semibold ${service.iconColor} group-hover:gap-4 transition-all duration-300`}>
                  Learn More
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 bg-white rounded-2xl shadow-lg border border-slate-200/50">
            <div className="flex items-center gap-3">
              <Shield className="text-green-600" size={24} />
              <span className="text-slate-700 font-medium">
                Not sure which service you need?
              </span>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25"
            >
              Talk to an Expert
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
