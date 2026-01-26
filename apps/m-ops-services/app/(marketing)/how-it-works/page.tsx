'use client';

import Link from 'next/link';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import {
  UserPlus,
  FolderOpen,
  ClipboardCheck,
  BarChart3,
  ArrowRight,
  Check,
  Zap,
  Clock,
  Shield,
  Users,
  FileText,
  Calendar,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Sign Up & Choose Your Plan',
    description: 'Create your account and select the service package that fits your project needs. From basic monitoring to full-service project management.',
    details: [
      'Choose from 4 service tiers (A-D)',
      'Customize services to your needs',
      'No long-term contracts required',
      'Start with a free consultation',
    ],
    color: 'blue',
  },
  {
    number: '02',
    icon: FolderOpen,
    title: 'Connect Your Projects',
    description: 'Link your construction projects to the Kealee platform. We integrate with your existing tools and workflows seamlessly.',
    details: [
      'Import project data easily',
      'Connect contractors and vendors',
      'Set up milestone schedules',
      'Configure communication preferences',
    ],
    color: 'purple',
  },
  {
    number: '03',
    icon: ClipboardCheck,
    title: 'Submit Service Requests',
    description: 'Request specific services as needed - from permit expediting to contractor coordination. Our team handles the operational heavy lifting.',
    details: [
      'One-click service requests',
      'Real-time status tracking',
      'Direct communication with ops team',
      'Automated task assignments',
    ],
    color: 'emerald',
  },
  {
    number: '04',
    icon: BarChart3,
    title: 'Track Progress & Reports',
    description: 'Monitor project progress through our dashboard. Receive weekly reports, milestone updates, and actionable insights.',
    details: [
      'Real-time project dashboards',
      'Weekly progress reports',
      'Budget tracking & forecasting',
      'Risk alerts & recommendations',
    ],
    color: 'orange',
  },
];

const features = [
  {
    icon: Clock,
    title: 'Save 20+ Hours Weekly',
    description: 'Eliminate administrative tasks and focus on what matters most - your business.',
  },
  {
    icon: Shield,
    title: 'Reduce Project Risks',
    description: 'Proactive monitoring and compliance tracking to prevent costly delays.',
  },
  {
    icon: TrendingUp,
    title: 'Improve Margins',
    description: 'Streamlined operations mean lower overhead and better project profitability.',
  },
  {
    icon: Users,
    title: 'Expert Support',
    description: 'Dedicated ops team with construction industry expertise at your service.',
  },
];

const colorMap: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  blue: { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-600', gradient: 'from-blue-600 to-blue-500' },
  purple: { bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-600', gradient: 'from-purple-600 to-purple-500' },
  emerald: { bg: 'bg-emerald-100', border: 'border-emerald-500', text: 'text-emerald-600', gradient: 'from-emerald-600 to-emerald-500' },
  orange: { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-600', gradient: 'from-orange-600 to-orange-500' },
};

export default function HowItWorksPage() {
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
              Simple 4-Step Process
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              How Kealee Ops Works
            </h1>
            <p className="text-xl text-blue-100/80 mb-8 max-w-2xl mx-auto">
              From signup to project success in four simple steps. Let us handle the operations
              while you focus on building.
            </p>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {steps.map((step, index) => {
              const colors = colorMap[step.color];
              return (
                <div key={step.number} className="relative">
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-8 top-24 bottom-0 w-0.5 bg-gradient-to-b from-slate-300 to-slate-100 hidden md:block" />
                  )}

                  <div className="flex flex-col md:flex-row gap-8 mb-16 last:mb-0">
                    {/* Step Number */}
                    <div className="flex-shrink-0">
                      <div className={`w-16 h-16 bg-gradient-to-br ${colors.gradient} rounded-2xl flex items-center justify-center shadow-lg relative z-10`}>
                        <step.icon className="h-8 w-8 text-white" />
                      </div>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <span className={`text-sm font-bold ${colors.text} ${colors.bg} px-3 py-1 rounded-full`}>
                          Step {step.number}
                        </span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                        {step.title}
                      </h3>
                      <p className="text-lg text-slate-600 mb-6">
                        {step.description}
                      </p>
                      <ul className="grid sm:grid-cols-2 gap-3">
                        {step.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <div className={`w-5 h-5 ${colors.bg} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                              <Check className={`h-3 w-3 ${colors.text}`} />
                            </div>
                            <span className="text-slate-700">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Why Contractors Choose Kealee Ops
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Real results for real construction businesses
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
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
              Ready to Streamline Your Operations?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join hundreds of contractors who've transformed their project management with Kealee Ops.
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
