'use client';

import Link from 'next/link';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import {
  ArrowRight,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  Building,
  CheckCircle,
  Quote,
  Star,
  Award,
} from 'lucide-react';

const caseStudies = [
  {
    id: 'metro-builders',
    company: 'Metro Builders DC',
    logo: 'MB',
    industry: 'Residential Construction',
    location: 'Washington, DC',
    projectType: 'Multi-Unit Residential',
    challenge: 'Managing 12 concurrent renovation projects across DC with limited administrative staff, leading to permit delays and missed milestones.',
    solution: 'Implemented Kealee Ops Package C for full project coordination, permit expediting, and weekly progress reporting.',
    results: [
      { metric: '35%', label: 'Reduction in permit processing time' },
      { metric: '22hrs', label: 'Admin time saved per week' },
      { metric: '18%', label: 'Improvement in project margins' },
      { metric: '100%', label: 'On-time project completion rate' },
    ],
    quote: "Kealee Ops transformed how we manage our projects. We went from drowning in paperwork to focusing entirely on what we do best - building quality homes.",
    author: 'Marcus Johnson',
    role: 'Owner, Metro Builders DC',
    featured: true,
  },
  {
    id: 'capital-renovations',
    company: 'Capital Renovations Group',
    logo: 'CR',
    industry: 'Commercial Renovation',
    location: 'Baltimore, MD',
    projectType: 'Office & Retail Spaces',
    challenge: 'Struggling with contractor coordination and compliance documentation across multiple commercial renovation sites.',
    solution: 'Adopted Kealee Ops Package B for service request management and compliance monitoring.',
    results: [
      { metric: '40%', label: 'Faster contractor onboarding' },
      { metric: '28%', label: 'Reduction in compliance issues' },
      { metric: '$45K', label: 'Annual cost savings' },
      { metric: '4.9/5', label: 'Client satisfaction score' },
    ],
    quote: "The compliance monitoring alone has paid for the service ten times over. We haven't had a single inspection failure since working with Kealee.",
    author: 'Sarah Chen',
    role: 'Operations Director',
    featured: true,
  },
  {
    id: 'heritage-homes',
    company: 'Heritage Homes LLC',
    logo: 'HH',
    industry: 'Custom Home Building',
    location: 'Northern Virginia',
    projectType: 'Luxury Custom Homes',
    challenge: 'High-touch clients demanding constant updates while managing complex subcontractor schedules and material deliveries.',
    solution: 'Deployed Kealee Ops Package D with dedicated ops manager and real-time client reporting portal.',
    results: [
      { metric: '60%', label: 'Fewer client status calls' },
      { metric: '15%', label: 'Reduction in material waste' },
      { metric: '3x', label: 'Increase in project capacity' },
      { metric: '12', label: 'New referrals in 6 months' },
    ],
    quote: "Our clients now get weekly video updates and real-time milestone tracking. The level of transparency has become our biggest competitive advantage.",
    author: 'David Williams',
    role: 'Founder & CEO',
    featured: false,
  },
  {
    id: 'dmv-contractors',
    company: 'DMV General Contractors',
    logo: 'DG',
    industry: 'General Contracting',
    location: 'DC Metro Area',
    projectType: 'Mixed Residential & Commercial',
    challenge: 'Scaling from 5 to 20 projects annually without proportionally increasing overhead costs.',
    solution: 'Started with Package A monitoring, upgraded to Package C as project volume grew.',
    results: [
      { metric: '4x', label: 'Project volume growth' },
      { metric: '12%', label: 'Overhead cost reduction' },
      { metric: '98%', label: 'Permit approval rate' },
      { metric: '2wks', label: 'Faster project starts' },
    ],
    quote: "Kealee Ops let us scale without hiring a full back-office team. We quadrupled our project volume with the same core team.",
    author: 'Robert Martinez',
    role: 'Managing Partner',
    featured: false,
  },
];

const stats = [
  { value: '150+', label: 'Projects Managed', icon: Building },
  { value: '$50M+', label: 'Project Value Supported', icon: DollarSign },
  { value: '98%', label: 'Client Retention', icon: Users },
  { value: '4.8/5', label: 'Average Rating', icon: Star },
];

export default function CaseStudiesPage() {
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
              <Award size={16} />
              Real Results from Real Contractors
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Case Studies
            </h1>
            <p className="text-xl text-blue-100/80 mb-8 max-w-2xl mx-auto">
              See how construction businesses across the DMV area have transformed their operations
              and grown their profits with Kealee Ops.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-1">{stat.value}</div>
                <div className="text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Case Studies */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Featured Success Stories
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Deep dives into how our clients achieved measurable results
            </p>
          </div>

          <div className="space-y-16">
            {caseStudies.filter(cs => cs.featured).map((study, index) => (
              <div
                key={study.id}
                className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 items-center`}
              >
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                      {study.logo}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{study.company}</h3>
                      <p className="text-slate-600">{study.industry} • {study.location}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">The Challenge</h4>
                    <p className="text-slate-700">{study.challenge}</p>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Our Solution</h4>
                    <p className="text-slate-700">{study.solution}</p>
                  </div>

                  {/* Quote */}
                  <div className="bg-slate-50 rounded-2xl p-6 border-l-4 border-blue-600">
                    <Quote className="h-8 w-8 text-blue-600/30 mb-3" />
                    <p className="text-slate-700 italic mb-4">"{study.quote}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center text-slate-600 font-semibold text-sm">
                        {study.author.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{study.author}</p>
                        <p className="text-sm text-slate-600">{study.role}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Results Card */}
                <div className="flex-1 w-full">
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white">
                    <h4 className="text-lg font-semibold text-blue-400 mb-6">Results Achieved</h4>
                    <div className="grid grid-cols-2 gap-6">
                      {study.results.map((result, i) => (
                        <div key={i} className="text-center p-4 bg-white/5 rounded-2xl">
                          <div className="text-3xl font-bold text-white mb-1">{result.metric}</div>
                          <div className="text-sm text-slate-400">{result.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-700">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle size={20} />
                        <span className="font-medium">Verified Results</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* More Case Studies Grid */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              More Success Stories
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {caseStudies.filter(cs => !cs.featured).map((study) => (
              <div
                key={study.id}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold">
                    {study.logo}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{study.company}</h3>
                    <p className="text-slate-600 text-sm">{study.industry}</p>
                  </div>
                </div>

                <p className="text-slate-600 mb-6">{study.challenge}</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {study.results.slice(0, 2).map((result, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{result.metric}</div>
                      <div className="text-xs text-slate-500">{result.label}</div>
                    </div>
                  ))}
                </div>

                <blockquote className="text-slate-600 italic text-sm border-l-2 border-blue-600 pl-4">
                  "{study.quote.substring(0, 100)}..."
                </blockquote>
              </div>
            ))}
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
              Ready to Write Your Success Story?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join these contractors and start transforming your operations today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
              >
                Get Started Free
                <ArrowRight size={20} />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-500/20 text-white font-semibold rounded-xl border border-white/20 hover:bg-blue-500/30 transition-all"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
