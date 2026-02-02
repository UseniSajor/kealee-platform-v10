'use client';

import Link from 'next/link';
import {
  Home,
  HardHat,
  Palette,
  Calculator,
  FileCheck,
  Wallet,
  ArrowRight,
  Building2,
  Users
} from 'lucide-react';

/**
 * SOP v2 - PASS-THROUGH ROUTING
 *
 * m-marketplace is the CENTRAL HUB - all traffic flows through it
 * This component routes users to the appropriate client-facing app based on their role:
 *
 * - "I'm a Homeowner" -> m-project-owner
 * - "I'm a Contractor/GC/Builder" -> m-ops-services
 * - "I need Design Services" -> m-architect
 * - "I need Engineering" -> m-engineer (not built per user request)
 * - "I need Permits" -> m-permits-inspections
 * - "Manage Payments" -> m-finance-trust
 */

const USER_ROUTES = [
  {
    id: 'homeowner',
    title: "I'm a Homeowner",
    description: 'Plan your project, find contractors, and manage construction with full visibility.',
    icon: Home,
    href: '/project-owner',
    color: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    features: ['AI Design Concepts', 'Find Contractors', 'Escrow Protection', 'Project Dashboard'],
  },
  {
    id: 'contractor',
    title: "I'm a Contractor",
    description: 'Get qualified leads, manage bids, and access PM services to grow your business.',
    icon: HardHat,
    href: '/ops-services',
    color: 'bg-purple-600',
    hoverColor: 'hover:bg-purple-700',
    lightColor: 'bg-purple-50',
    textColor: 'text-purple-600',
    features: ['Fair Bid Rotation', 'PM Packages A-D', 'Lead Marketplace', 'Queue Position'],
  },
  {
    id: 'design',
    title: 'I Need Design',
    description: 'Connect with licensed architects for residential and commercial design services.',
    icon: Palette,
    href: '/architect',
    color: 'bg-indigo-600',
    hoverColor: 'hover:bg-indigo-700',
    lightColor: 'bg-indigo-50',
    textColor: 'text-indigo-600',
    features: ['Licensed Architects', 'AI-Assisted Design', 'Construction Docs', 'Code Compliance'],
  },
  {
    id: 'permits',
    title: 'I Need Permits',
    description: 'Fast-track your permit applications with AI review and jurisdiction coordination.',
    icon: FileCheck,
    href: '/permits-inspections',
    color: 'bg-violet-600',
    hoverColor: 'hover:bg-violet-700',
    lightColor: 'bg-violet-50',
    textColor: 'text-violet-600',
    features: ['AI Pre-Review', 'Multi-Jurisdiction', 'Inspection Scheduling', '90% First-Time Approval'],
  },
  {
    id: 'payments',
    title: 'Manage Payments',
    description: 'Secure escrow services, milestone payments, and financial protection for all parties.',
    icon: Wallet,
    href: '/finance-trust',
    color: 'bg-emerald-600',
    hoverColor: 'hover:bg-emerald-700',
    lightColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    features: ['Escrow Protection', 'Milestone Releases', 'Dispute Resolution', 'Payment Tracking'],
  },
];

export function UserTypeRouting() {
  return (
    <section className="py-20 bg-gray-50" id="get-started">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Building2 size={16} />
            Your Construction Hub
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Where Do You Want to Start?
          </h2>
          <p className="text-xl text-gray-600">
            Kealee connects all parties in the construction ecosystem.
            Select your role to access the right tools and services.
          </p>
        </div>

        {/* User Type Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {USER_ROUTES.map((route) => {
            const Icon = route.icon;
            return (
              <Link
                key={route.id}
                href={route.href}
                className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:border-gray-300 transition-all duration-300"
              >
                {/* Icon */}
                <div className={`w-14 h-14 ${route.lightColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={route.textColor} size={28} />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {route.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 mb-4 text-sm">
                  {route.description}
                </p>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {route.features.map((feature) => (
                    <span
                      key={feature}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className={`flex items-center gap-2 ${route.textColor} font-semibold text-sm`}>
                  Get Started
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}

          {/* For Businesses Card */}
          <Link
            href="/ops-services/enterprise"
            className="group bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-sm p-6 hover:shadow-xl transition-all duration-300 text-white lg:col-span-3 md:col-span-2"
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
                <Users className="text-white" size={32} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2">
                  Enterprise & Multi-Project Teams
                </h3>
                <p className="text-gray-300 mb-4">
                  Portfolio management, custom integrations, dedicated account managers, and white-glove service
                  for builders, developers, and construction companies managing multiple projects.
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <span className="text-xs bg-white/10 px-3 py-1 rounded-full">Package D Enterprise</span>
                  <span className="text-xs bg-white/10 px-3 py-1 rounded-full">$16,500/month</span>
                  <span className="text-xs bg-white/10 px-3 py-1 rounded-full">Premium Support</span>
                  <span className="text-xs bg-white/10 px-3 py-1 rounded-full">Dedicated PM Team</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-xl font-semibold group-hover:bg-orange-500 group-hover:text-white transition-colors">
                Contact Sales
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm mb-6">
            Trusted by contractors, homeowners, and design professionals across the DMV
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-gray-400">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-700">500+</span>
              <span className="text-sm">Projects Managed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-700">$50M+</span>
              <span className="text-sm">In Escrow Protected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-700">90%</span>
              <span className="text-sm">Permit Approval Rate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-700">4.9/5</span>
              <span className="text-sm">Client Satisfaction</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
