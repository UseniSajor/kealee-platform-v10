'use client';

import Link from 'next/link';
import { Wallet, Shield, FileCheck, BarChart3, ArrowRight, Building2, Users, Banknote } from 'lucide-react';

const services = [
  {
    icon: Wallet,
    title: 'Construction Escrow',
    description: 'Purpose-built escrow accounts for construction projects with milestone-based fund management.',
    features: ['Custom milestone setup', 'Multi-party disbursements', 'Automated compliance'],
    href: '/escrow',
    color: 'emerald',
  },
  {
    icon: Shield,
    title: 'Payment Protection',
    description: 'Protect contractors and owners with verified payment releases tied to work completion.',
    features: ['Work verification', 'Lien waiver management', 'Dispute resolution'],
    href: '/payments',
    color: 'blue',
  },
  {
    icon: FileCheck,
    title: 'Compliance & Audit',
    description: 'Stay compliant with automated reporting, audit trails, and regulatory documentation.',
    features: ['Real-time audit trail', 'Tax documentation', 'Regulatory reports'],
    href: '/compliance',
    color: 'amber',
  },
  {
    icon: BarChart3,
    title: 'Financial Analytics',
    description: 'Comprehensive dashboards and reports for complete visibility into project finances.',
    features: ['Cash flow forecasting', 'Budget tracking', 'Custom reports'],
    href: '/analytics',
    color: 'purple',
  },
];

const additionalFeatures = [
  {
    icon: Building2,
    title: 'Multi-Project Management',
    description: 'Manage escrow accounts across multiple projects from a single dashboard.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Invite team members with role-based access and approval workflows.',
  },
  {
    icon: Banknote,
    title: 'ACH & Wire Support',
    description: 'Multiple funding options with same-day processing available.',
  },
];

export function Services() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Complete Escrow Solutions
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Everything you need to manage secure financial transactions for construction projects
          </p>
        </div>

        {/* Main Services */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {services.map((service, index) => (
            <Link
              key={index}
              href={service.href}
              className={`group relative p-8 rounded-2xl border-2 border-slate-200 hover:border-${service.color}-300 bg-gradient-to-br from-white to-${service.color}-50/30 hover:shadow-xl transition-all duration-300`}
            >
              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl bg-${service.color}-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <service.icon className={`text-${service.color}-600`} size={32} />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">
                {service.title}
              </h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                {service.description}
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-6">
                {service.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-500">
                    <div className={`w-1.5 h-1.5 rounded-full bg-${service.color}-500`} />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className={`flex items-center gap-2 text-${service.color}-600 font-semibold group-hover:gap-3 transition-all`}>
                Learn more
                <ArrowRight size={18} />
              </div>
            </Link>
          ))}
        </div>

        {/* Additional Features */}
        <div className="bg-slate-50 rounded-3xl p-8 lg:p-12">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              Plus More Features
            </h3>
            <p className="text-slate-600">
              Additional capabilities to streamline your financial operations
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {additionalFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="text-emerald-600" size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">{feature.title}</h4>
                  <p className="text-sm text-slate-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
