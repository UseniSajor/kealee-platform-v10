'use client';

import Link from 'next/link';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import {
  ArrowRight,
  Check,
  Clock,
  DollarSign,
  FileText,
  Users,
  Shield,
  TrendingUp,
  Zap,
  Building2,
  Briefcase,
  Award,
  HeartHandshake,
  Target,
  BarChart3,
  Calendar,
  MessageSquare,
} from 'lucide-react';

const painPoints = [
  {
    icon: Clock,
    title: 'Drowning in Admin Work',
    description: "You didn't start a construction business to push paper. Permit applications, compliance reports, scheduling coordination - it never ends.",
  },
  {
    icon: Users,
    title: 'Coordination Chaos',
    description: 'Juggling subcontractors, material deliveries, and inspections across multiple job sites leaves no time for actually building.',
  },
  {
    icon: FileText,
    title: 'Permit Headaches',
    description: "Permit delays can cost $1,000-$5,000 per week in project delays. You can't afford to wait for bureaucracy.",
  },
  {
    icon: DollarSign,
    title: 'Profit Margin Pressure',
    description: 'Administrative overhead eats into your margins. Every hour on paperwork is an hour not generating revenue.',
  },
];

const benefits = [
  {
    icon: Zap,
    title: 'Reclaim Your Time',
    stat: '20+ hrs/week',
    description: 'Stop doing admin work. Our ops team handles scheduling, permits, compliance, and coordination so you can focus on the job site.',
  },
  {
    icon: TrendingUp,
    title: 'Grow Without Overhead',
    stat: '3x capacity',
    description: 'Scale your project volume without hiring back-office staff. Our services flex with your workload.',
  },
  {
    icon: Shield,
    title: 'Stay Compliant',
    stat: '98% approval',
    description: 'Never miss a permit deadline or compliance requirement. We track everything and keep you inspection-ready.',
  },
  {
    icon: DollarSign,
    title: 'Boost Margins',
    stat: '15-20%',
    description: 'Lower overhead costs + faster project completion = better profit margins on every job.',
  },
];

const services = [
  {
    icon: FileText,
    title: 'Permit Expediting',
    description: 'We navigate the permit process for you - applications, revisions, inspections, and approvals.',
  },
  {
    icon: Calendar,
    title: 'Schedule Management',
    description: 'Coordinate subcontractors, materials, and inspections to keep projects on track.',
  },
  {
    icon: BarChart3,
    title: 'Progress Reporting',
    description: 'Weekly reports with photos, milestones, and budget tracking for you and your clients.',
  },
  {
    icon: MessageSquare,
    title: 'Client Communication',
    description: 'Professional updates and a client portal so homeowners stay informed (and stop calling you).',
  },
  {
    icon: Shield,
    title: 'Compliance Monitoring',
    description: 'Track insurance, licenses, safety requirements, and inspection schedules automatically.',
  },
  {
    icon: HeartHandshake,
    title: 'Vendor Coordination',
    description: 'Manage supplier relationships, material orders, and delivery schedules.',
  },
];

const idealFor = [
  'General Contractors scaling to 5+ projects',
  'Renovation specialists in DC, MD, VA',
  'Custom home builders seeking white-glove operations',
  'Commercial contractors managing multiple sites',
  'Growing firms without dedicated ops staff',
];

const testimonials = [
  {
    quote: "I was spending 25+ hours a week on admin. Now I'm back on job sites where I belong, and my business has never run smoother.",
    author: 'Mike Thompson',
    role: 'Thompson Construction',
    metric: '25hrs saved/week',
  },
  {
    quote: "The permit expediting alone has saved me over $30K in avoided delays this year. Best investment I've made.",
    author: 'Rachel Green',
    role: 'Green Renovations LLC',
    metric: '$30K+ saved',
  },
  {
    quote: "My clients love the weekly reports and project portal. It's elevated our professional image significantly.",
    author: 'James Wilson',
    role: 'Wilson & Sons Builders',
    metric: '12 referrals',
  },
];

export default function ContractorsPage() {
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
              <Building2 size={16} />
              Built for Contractors, By Construction Experts
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Stop Doing Paperwork.<br />Start Building More.
            </h1>
            <p className="text-xl text-blue-100/80 mb-8 max-w-2xl mx-auto">
              Kealee Ops handles the operational heavy lifting so you can focus on what you do best -
              delivering quality construction projects.
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
                href="/how-it-works"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-500/20 text-white font-semibold rounded-xl border border-white/20 hover:bg-blue-500/30 transition-all"
              >
                See How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Sound Familiar?
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              These are the challenges every growing contractor faces
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {painPoints.map((point, index) => (
              <div
                key={index}
                className="bg-slate-50 rounded-2xl p-8 border border-slate-100"
              >
                <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                  <point.icon className="h-7 w-7 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{point.title}</h3>
                <p className="text-slate-600">{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution/Benefits Section */}
      <section className="py-24 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              The Kealee Ops Advantage
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Your dedicated operations team, without the overhead
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
              >
                <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <benefit.icon className="h-7 w-7 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-blue-400 mb-2">{benefit.stat}</div>
                <h3 className="text-xl font-bold text-white mb-3">{benefit.title}</h3>
                <p className="text-slate-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              What We Handle For You
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Comprehensive operations support tailored to construction
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                  <service.icon className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h3>
                <p className="text-slate-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ideal For Section */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-600 text-sm font-medium mb-6">
                  <Target size={16} />
                  Perfect Fit
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                  Is Kealee Ops Right for You?
                </h2>
                <p className="text-lg text-slate-600 mb-8">
                  Kealee Ops is designed for contractors who are ready to grow but don't want
                  to get buried in administrative work. If you're any of these, we should talk:
                </p>
                <ul className="space-y-4">
                  {idealFor.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="text-slate-700 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">Quick ROI Calculator</h3>
                <div className="space-y-6">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="text-sm text-slate-500 mb-1">Hours spent on admin per week</div>
                    <div className="text-3xl font-bold text-slate-900">20+ hours</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="text-sm text-slate-500 mb-1">Your hourly value</div>
                    <div className="text-3xl font-bold text-slate-900">$75-150</div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                    <div className="text-sm text-blue-600 mb-1">Monthly value reclaimed</div>
                    <div className="text-3xl font-bold text-blue-600">$6,000-12,000</div>
                  </div>
                  <Link
                    href="/signup"
                    className="block w-full text-center py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Start Saving Today
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Trusted by Contractors Across the DMV
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-slate-50 rounded-2xl p-8 border border-slate-100"
              >
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Award key={i} className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-slate-700 mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{testimonial.author}</p>
                    <p className="text-sm text-slate-600">{testimonial.role}</p>
                  </div>
                  <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                    {testimonial.metric}
                  </div>
                </div>
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
              Ready to Get Back to Building?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Schedule a free consultation and see how Kealee Ops can transform your business.
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
                href="/case-studies"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-500/20 text-white font-semibold rounded-xl border border-white/20 hover:bg-blue-500/30 transition-all"
              >
                View Case Studies
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
