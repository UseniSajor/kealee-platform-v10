'use client';

import { useEffect, useState, useRef } from 'react';
import {
  FileCheck,
  Clock,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Brain,
  Shield,
  Zap,
  Building2,
  FileText,
  Video,
  MapPin,
  Play,
  Star,
  ChevronRight,
  Cpu,
  Eye,
  ClipboardCheck,
  Timer,
  Award,
  Users,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@kealee/ui';
import Script from 'next/script';

// Animated counter component
function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 2000,
  decimals = 0,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
}) {
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(value * easeOutQuart);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isVisible, value, duration]);

  const displayValue = decimals > 0 ? count.toFixed(decimals) : Math.round(count).toLocaleString();

  return (
    <span ref={countRef}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}

// JSON-LD Structured Data for SEO
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Kealee Permits & Inspections',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'AI-powered construction permit application platform with automated document review, compliance checking, and inspection scheduling for 3,000+ jurisdictions.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free permit application with AI review',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '2847',
    bestRating: '5',
    worstRating: '1',
  },
  featureList: [
    'AI-Powered Document Review',
    'Real-time Compliance Checking',
    'Video Inspection Support',
    '3,000+ Jurisdiction Coverage',
    'Automated Permit Tracking',
  ],
  provider: {
    '@type': 'Organization',
    name: 'Kealee',
    url: 'https://kealee.com',
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Kealee',
  description: 'Modern construction technology platform for permits, inspections, and project management.',
  url: 'https://kealee.com',
  logo: 'https://kealee.com/logo.png',
  sameAs: ['https://linkedin.com/company/kealee', 'https://twitter.com/kealee'],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+1-800-555-1234',
    contactType: 'customer service',
    availableLanguage: 'English',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How fast can I get my permit approved?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'With our AI-powered review system, applications are pre-checked in 5 minutes. Complete permit approvals average 14 days, which is 40% faster than traditional methods.',
      },
    },
    {
      '@type': 'Question',
      name: 'What types of permits does Kealee support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Kealee supports building permits, electrical permits, plumbing permits, mechanical permits, demolition permits, and special use permits across 3,000+ jurisdictions.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does AI review work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our AI analyzes your documents against local building codes, zoning requirements, and common compliance issues. It catches 85% of common errors before submission, significantly improving first-try approval rates.',
      },
    },
  ],
};

export default function PermitsLanding() {
  return (
    <>
      {/* Structured Data Scripts */}
      <Script
        id="software-application-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0">
            {/* Base gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" />

            {/* Mesh gradient overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-orange-500/15 via-transparent to-transparent" />

            {/* Animated gradient orbs */}
            <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-orange-500/15 rounded-full blur-3xl animate-pulse animation-delay-2000" />

            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left Column - Content */}
              <div className="max-w-2xl">
                {/* AI Badge */}
                <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 text-white px-5 py-2.5 rounded-full text-sm font-semibold mb-8 shadow-lg">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-orange-400 animate-pulse" size={18} />
                    <span className="text-orange-400">AI-Powered</span>
                  </div>
                  <span className="h-4 w-px bg-white/30" />
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} size={12} className="text-amber-400" fill="currentColor" />
                      ))}
                    </div>
                    <span>4.8/5 Rating</span>
                  </div>
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
                  Get Your Permits{' '}
                  <span className="relative inline-block">
                    <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400">
                      40% Faster
                    </span>
                    <svg
                      className="absolute -bottom-2 left-0 w-full h-3 text-orange-500/50"
                      viewBox="0 0 200 12"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M0 9c40-6 80-6 120-2s80 6 80 0"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>{' '}
                  <br />
                  <span className="text-blue-100">with AI Review</span>
                </h1>

                {/* Subheadline */}
                <p className="text-lg sm:text-xl text-blue-100/80 mb-8 leading-relaxed max-w-xl">
                  Our AI reviews your permit application in <strong className="text-white">5 minutes</strong>, catches
                  common errors, and ensures compliance across{' '}
                  <strong className="text-white">3,000+ jurisdictions</strong> in the DC-Baltimore corridor.
                </p>

                {/* Key Value Props */}
                <div className="grid sm:grid-cols-2 gap-3 mb-10">
                  {[
                    { icon: Brain, text: 'AI Document Analysis', color: 'blue' },
                    { icon: Shield, text: '85% First-Try Approval', color: 'green' },
                    { icon: Video, text: 'Video Inspections', color: 'purple' },
                    { icon: MapPin, text: '3,000+ Jurisdictions', color: 'orange' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg bg-${item.color}-500/20 flex items-center justify-center flex-shrink-0`}
                      >
                        <item.icon className={`text-${item.color}-400`} size={20} />
                      </div>
                      <span className="font-medium text-white/90">{item.text}</span>
                    </div>
                  ))}
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Link
                    href="/permits/new"
                    className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-lg rounded-xl shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    Start Application
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                  </Link>

                  <button
                    onClick={() => {
                      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/10 backdrop-blur border border-white/20 text-white font-semibold text-lg rounded-xl hover:bg-white/20 transition-all duration-300"
                  >
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Play className="text-white ml-0.5" size={18} fill="white" />
                    </div>
                    Watch Demo
                  </button>
                </div>

                {/* Trust Signals */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-blue-200/70">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-green-400" size={16} />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-green-400" size={16} />
                    <span>5-minute AI review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-green-400" size={16} />
                    <span>Free compliance check</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Dashboard Preview */}
              <div className="relative hidden lg:block">
                {/* Main Card - Glassmorphism */}
                <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-bold text-white">Permit Application</h3>
                      <p className="text-blue-200/70 text-sm">AI Review in Progress</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-full">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-green-400 text-sm font-medium">Live Analysis</span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                      { label: 'Documents', value: '12', color: 'blue' },
                      { label: 'Compliance', value: '94%', color: 'green' },
                      { label: 'Time Left', value: '2min', color: 'orange' },
                    ].map((stat, i) => (
                      <div key={i} className={`p-4 rounded-xl bg-${stat.color}-500/10 border border-${stat.color}-500/20`}>
                        <div className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</div>
                        <div className="text-xs text-white/60">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white/80">AI Review Progress</span>
                      <span className="text-sm font-semibold text-orange-400">78%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full w-[78%] bg-gradient-to-r from-orange-500 to-orange-400 rounded-full animate-pulse" />
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="space-y-3">
                    {[
                      { text: 'Site plans verified', done: true },
                      { text: 'Zoning compliance checked', done: true },
                      { text: 'Building codes validated', done: true },
                      { text: 'Final review in progress...', done: false },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                        {item.done ? (
                          <CheckCircle className="text-green-400" size={20} />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
                        )}
                        <span className={item.done ? 'text-white/80' : 'text-orange-400'}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating Cards */}
                <div className="absolute -top-6 -right-6 bg-white rounded-xl shadow-2xl p-4 animate-float border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="text-green-600" size={24} />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Permit Approved!</div>
                      <div className="text-sm text-slate-500">14 days (40% faster)</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-2xl p-4 animate-float animation-delay-2000 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Brain className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">8 Issues Caught</div>
                      <div className="text-sm text-slate-500">Before submission</div>
                    </div>
                  </div>
                </div>

                {/* AI Badge */}
                <div className="absolute top-1/2 -left-8 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl shadow-xl p-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} />
                    <span className="text-xs font-bold">AI POWERED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2 text-blue-200/50">
            <span className="text-xs font-medium uppercase tracking-wider">Scroll to explore</span>
            <div className="w-6 h-10 border-2 border-blue-200/30 rounded-full flex justify-center pt-2">
              <div className="w-1.5 h-3 bg-blue-200/50 rounded-full animate-bounce" />
            </div>
          </div>
        </section>

        {/* Trusted By Section */}
        <section className="py-12 bg-slate-50 border-y border-slate-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-medium text-slate-500 mb-6">
              TRUSTED BY LEADING CONSTRUCTION FIRMS & MUNICIPALITIES
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6">
              {['Montgomery County', 'Baltimore City', 'DC Building Dept', 'Prince George\'s County', 'Howard County'].map(
                (name, i) => (
                  <div key={i} className="text-slate-400 font-semibold text-lg">
                    {name}
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-blue-50/50 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <TrendingUp size={16} />
                Proven Results
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                Numbers That{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700">Speak</span>
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Our platform has helped thousands of contractors and homeowners navigate the permit process faster
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {[
                {
                  value: 40,
                  suffix: '%',
                  label: 'Faster Approvals',
                  description: 'Average time saved',
                  icon: Clock,
                  gradient: 'from-blue-500 to-blue-600',
                },
                {
                  value: 85,
                  suffix: '%',
                  label: 'First-Try Approval',
                  description: 'Success rate',
                  icon: Award,
                  gradient: 'from-green-500 to-green-600',
                },
                {
                  value: 3000,
                  suffix: '+',
                  label: 'Jurisdictions',
                  description: 'Nationwide coverage',
                  icon: MapPin,
                  gradient: 'from-orange-500 to-orange-600',
                },
                {
                  value: 50000,
                  suffix: '+',
                  label: 'Permits Processed',
                  description: 'And counting',
                  icon: FileText,
                  gradient: 'from-purple-500 to-purple-600',
                },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-100 hover:border-transparent overflow-hidden"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />

                  <div className="relative z-10">
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:bg-white/20 transition-colors`}
                    >
                      <stat.icon className="text-white" size={28} />
                    </div>

                    <div className="text-4xl lg:text-5xl font-bold text-slate-900 group-hover:text-white transition-colors mb-2">
                      <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    </div>

                    <div className="text-lg font-semibold text-slate-700 group-hover:text-white/90 transition-colors mb-1">
                      {stat.label}
                    </div>

                    <div className="text-sm text-slate-500 group-hover:text-white/70 transition-colors">
                      {stat.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Features Section */}
        <section className="py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-white/10">
                <Cpu size={16} className="text-orange-400" />
                AI-Powered Technology
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                Intelligent Permit{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">
                  Processing
                </span>
              </h2>
              <p className="text-xl text-blue-100/80 max-w-2xl mx-auto">
                Our AI technology transforms the permit application process from weeks to minutes
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: Brain,
                  title: 'Smart Document Analysis',
                  description:
                    'AI analyzes your blueprints, site plans, and documents against local building codes in real-time, identifying potential issues before submission.',
                  color: 'blue',
                },
                {
                  icon: Eye,
                  title: 'Code Compliance Scanning',
                  description:
                    'Automatically checks your application against 10,000+ building codes and zoning requirements specific to your jurisdiction.',
                  color: 'green',
                },
                {
                  icon: Video,
                  title: 'AI Video Inspections',
                  description:
                    'Remote video inspections with AI-assisted analysis reduce inspection times and eliminate scheduling delays.',
                  color: 'purple',
                },
                {
                  icon: ClipboardCheck,
                  title: 'Auto-Fill Applications',
                  description:
                    'Intelligent form completion extracts information from your documents and pre-fills application forms with 95% accuracy.',
                  color: 'orange',
                },
                {
                  icon: Timer,
                  title: 'Predictive Timeline',
                  description:
                    'AI estimates approval timelines based on historical data, permit type, and current jurisdiction workload.',
                  color: 'pink',
                },
                {
                  icon: Zap,
                  title: 'Instant Error Detection',
                  description:
                    'Catch missing signatures, incomplete forms, and document discrepancies before they cause rejection.',
                  color: 'amber',
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300"
                >
                  <div className={`w-14 h-14 bg-${feature.color}-500/20 rounded-xl flex items-center justify-center mb-6`}>
                    <feature.icon className={`text-${feature.color}-400`} size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-blue-100/70 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-50 rounded-full blur-3xl opacity-50" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <FileCheck size={16} />
                Simple Process
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                Four Steps to{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700">
                  Permit Approval
                </span>
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Our streamlined process makes permit applications simple and fast
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-4 gap-8 relative">
                {/* Connection Line */}
                <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200" />

                {[
                  {
                    step: '01',
                    title: 'Enter Location',
                    desc: 'Enter your project address and our AI identifies the jurisdiction and requirements',
                    icon: MapPin,
                    color: 'blue',
                  },
                  {
                    step: '02',
                    title: 'Select Permit Type',
                    desc: 'Choose from building, electrical, plumbing, mechanical, or special permits',
                    icon: FileText,
                    color: 'green',
                  },
                  {
                    step: '03',
                    title: 'Upload & AI Review',
                    desc: 'Upload documents and get instant AI analysis with error detection',
                    icon: Brain,
                    color: 'orange',
                  },
                  {
                    step: '04',
                    title: 'Submit & Track',
                    desc: 'Submit with confidence and track your application in real-time',
                    icon: CheckCircle,
                    color: 'purple',
                  },
                ].map((item, i) => (
                  <div key={i} className="relative text-center">
                    <div
                      className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 text-white rounded-2xl flex items-center justify-center shadow-lg relative z-10`}
                    >
                      <item.icon size={36} />
                    </div>
                    <div className="inline-block bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full mb-3">
                      STEP {item.step}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-slate-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Permit Types Section */}
        <section className="py-24 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Building2 size={16} />
                Full Coverage
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                Every Permit Type{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
                  Covered
                </span>
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                From simple renovations to complex commercial builds, we support all permit categories
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { name: 'Building Permits', desc: 'New construction, additions, renovations', icon: Building2 },
                { name: 'Electrical Permits', desc: 'Wiring, panels, fixtures', icon: Zap },
                { name: 'Plumbing Permits', desc: 'Pipes, fixtures, water heaters', icon: FileCheck },
                { name: 'Mechanical Permits', desc: 'HVAC, ventilation systems', icon: Shield },
                { name: 'Demolition Permits', desc: 'Partial or complete teardowns', icon: FileText },
                { name: 'Special Use Permits', desc: 'Zoning variances, conditional use', icon: Award },
              ].map((type, i) => (
                <Link
                  key={i}
                  href="/permits/new"
                  className="group flex items-start gap-4 p-6 bg-white rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-500 rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                    <type.icon className="text-blue-600 group-hover:text-white transition-colors" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {type.name}
                    </h3>
                    <p className="text-slate-600 text-sm">{type.desc}</p>
                  </div>
                  <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Users size={16} />
                Customer Stories
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                Trusted by{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-700">
                  Thousands
                </span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  quote:
                    'The AI review caught 3 errors in my application that would have caused rejection. Saved me weeks of back and forth.',
                  author: 'Michael Chen',
                  role: 'General Contractor',
                  company: 'Chen Construction LLC',
                  rating: 5,
                },
                {
                  quote:
                    'We reduced our permit processing time from 6 weeks to 2 weeks. The video inspection feature is a game changer.',
                  author: 'Sarah Williams',
                  role: 'Project Manager',
                  company: 'Urban Development Co',
                  rating: 5,
                },
                {
                  quote:
                    'As a homeowner doing my first renovation, the platform made the permit process actually understandable.',
                  author: 'David Park',
                  role: 'Homeowner',
                  company: 'Bethesda, MD',
                  rating: 5,
                },
              ].map((testimonial, i) => (
                <div key={i} className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, j) => (
                      <Star key={j} size={16} className="text-amber-400" fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-slate-700 mb-6 leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.author
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{testimonial.author}</div>
                      <div className="text-sm text-slate-500">
                        {testimonial.role}, {testimonial.company}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" />

          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
          </div>

          {/* Grid Pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-semibold mb-8 border border-white/10">
                <Sparkles size={16} className="text-orange-400" />
                Start Building Today
              </div>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Ready to Get Your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">
                  Permit Approved?
                </span>
              </h2>

              <p className="text-xl text-blue-100/80 max-w-2xl mx-auto mb-10">
                Join thousands of contractors and homeowners who have streamlined their permit process with AI-powered
                review.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
                <Link
                  href="/permits/new"
                  className="group inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-lg rounded-xl shadow-2xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 transform hover:scale-[1.02]"
                >
                  Start Free Application
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </Link>

                <Link
                  href="/contact"
                  className="group inline-flex items-center justify-center gap-3 px-10 py-5 bg-white/10 backdrop-blur border border-white/20 text-white font-semibold text-lg rounded-xl hover:bg-white/20 transition-all duration-300"
                >
                  <Calendar size={20} />
                  Schedule a Demo
                </Link>
              </div>

              {/* Trust Signals */}
              <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-blue-200/70">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-400" size={16} />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-400" size={16} />
                  <span>5-minute AI review</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-400" size={16} />
                  <span>85% approval rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-400" size={16} />
                  <span>24/7 support</span>
                </div>
              </div>
            </div>

            {/* Contact Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-16">
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors">
                <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6">
                  <Mail className="text-blue-400" size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Email Support</h3>
                <p className="text-blue-200/70 mb-4">Get a response within 2 hours</p>
                <a
                  href="mailto:permits@kealee.com"
                  className="text-lg font-semibold text-orange-400 hover:text-orange-300 transition-colors"
                >
                  permits@kealee.com
                </a>
              </div>

              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors">
                <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center mb-6">
                  <Phone className="text-green-400" size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Call Us</h3>
                <p className="text-blue-200/70 mb-4">Mon-Fri from 8am to 6pm EST</p>
                <a
                  href="tel:+18005551234"
                  className="text-lg font-semibold text-orange-400 hover:text-orange-300 transition-colors"
                >
                  1-800-555-1234
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 bg-slate-900 border-t border-slate-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <FileCheck className="text-white" size={24} />
                </div>
                <span className="text-xl font-bold text-white">Kealee Permits</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
                <Link href="/support" className="hover:text-white transition-colors">
                  Support
                </Link>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </div>

              <div className="text-sm text-slate-500">&copy; {new Date().getFullYear()} Kealee. All rights reserved.</div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
