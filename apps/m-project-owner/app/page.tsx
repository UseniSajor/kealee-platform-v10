'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import {
  Check,
  Home,
  Shield,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  FileCheck,
  BarChart3,
  Zap,
  Star,
  ArrowRight,
  CheckCircle,
  Play,
  Building2,
  Award,
  Lock,
  Eye,
  AlertTriangle,
  Percent,
  Calendar,
  MessageSquare,
  FileText,
  ChevronDown,
  Quote,
} from 'lucide-react';

// JSON-LD Structured Data for SEO
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Kealee Project Owner Portal',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'Complete construction project management platform for property owners. Manage readiness checklists, contracts, milestones, escrow payments, and track progress from start to finish.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free to start. 3% platform fee on transactions.',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '342',
    bestRating: '5',
    worstRating: '1',
  },
  featureList: [
    'Project Readiness Checklists',
    'Digital Contract Management',
    'Milestone-Based Payments',
    'Secure Escrow Protection',
    'Real-Time Progress Tracking',
    'Automatic Compliance Gates',
    'Team Coordination Tools',
    'Document Management',
  ],
  provider: {
    '@type': 'Organization',
    name: 'Kealee Platform',
    url: 'https://kealee.com',
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Kealee',
  url: 'https://kealee.com',
  logo: 'https://kealee.com/logo.png',
  sameAs: ['https://linkedin.com/company/kealee', 'https://twitter.com/kealee'],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+1-800-KEALEE',
    contactType: 'customer service',
  },
};

// Animated Counter Component
function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 2000,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
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

  const displayValue = value < 10 ? count.toFixed(1) : Math.round(count).toLocaleString();

  return (
    <span ref={countRef}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}

export default function ProjectOwnerLandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const stats = [
    {
      value: 1250,
      suffix: '+',
      label: 'Projects Managed',
      description: 'Successfully completed',
      icon: Building2,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      value: 4.2,
      prefix: '$',
      suffix: 'M',
      label: 'Funds Protected',
      description: 'In secure escrow',
      icon: Shield,
      gradient: 'from-emerald-500 to-emerald-600',
    },
    {
      value: 98,
      suffix: '%',
      label: 'Satisfaction Rate',
      description: 'Happy homeowners',
      icon: Award,
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      value: 45,
      suffix: '%',
      label: 'Faster Completion',
      description: 'Average time saved',
      icon: Clock,
      gradient: 'from-purple-500 to-purple-600',
    },
  ];

  const features = [
    {
      icon: FileCheck,
      title: 'Readiness Checklists',
      description:
        'Comprehensive pre-construction checklists ensure every requirement is met before breaking ground. Never miss a permit or inspection requirement.',
      color: 'blue',
    },
    {
      icon: Shield,
      title: 'Contract Protection',
      description:
        'Digital contracts with milestone gates ensure work is verified complete before payment. Full legal protection built-in.',
      color: 'emerald',
    },
    {
      icon: Lock,
      title: 'Escrow Security',
      description:
        'Funds held in secure escrow with automatic release gates. Your money is protected until milestones pass inspection.',
      color: 'amber',
    },
    {
      icon: BarChart3,
      title: 'Visual Timeline',
      description:
        'Real-time project timeline from design through completion. Automatic updates from all integrated modules keep you informed.',
      color: 'purple',
    },
    {
      icon: Users,
      title: 'Team Coordination',
      description:
        'Connect with architects, engineers, contractors, and inspectors. All communication documented in one central place.',
      color: 'rose',
    },
    {
      icon: Eye,
      title: 'Complete Visibility',
      description:
        'Real-time updates on every aspect: milestones, inspections, permits, and payments. No more guessing or calling for updates.',
      color: 'cyan',
    },
  ];

  const testimonials = [
    {
      name: 'Jennifer Martinez',
      role: 'Homeowner',
      location: 'Austin, TX',
      content:
        'After a bad experience with a previous renovation, I was nervous about my kitchen remodel. Kealee gave me complete peace of mind. The escrow protection meant my money was safe, and I could track every milestone in real-time.',
      rating: 5,
      project: '$85,000 Kitchen Renovation',
    },
    {
      name: 'David Thompson',
      role: 'Property Developer',
      location: 'Denver, CO',
      content:
        "Managing 8 renovation projects used to be a nightmare. With Kealee's dashboard, I have visibility into every project at once. We've reduced delays by 40% and our contractors love the clear milestone structure.",
      rating: 5,
      project: 'Multi-Property Portfolio',
    },
    {
      name: 'Sarah Kim',
      role: 'First-Time Builder',
      location: 'Seattle, WA',
      content:
        "Building our dream home was daunting, but Kealee walked us through every step. The readiness checklists caught issues we never would have known about. Worth every penny of the platform fee.",
      rating: 5,
      project: '$450,000 New Home Build',
    },
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Create Your Project',
      description: 'Set up your project with details, timeline, budget, and requirements. Our wizard guides you through every step.',
      icon: FileText,
    },
    {
      step: 2,
      title: 'Complete Readiness Gates',
      description: 'Work through smart checklists that ensure permits, insurance, and requirements are in place before construction.',
      icon: CheckCircle,
    },
    {
      step: 3,
      title: 'Fund & Approve Contracts',
      description: 'Review contractor proposals, approve contracts with milestone gates, and fund secure escrow accounts.',
      icon: DollarSign,
    },
    {
      step: 4,
      title: 'Track & Release Payments',
      description: 'Monitor progress in real-time. Approve milestones and release payments only when work is verified complete.',
      icon: TrendingUp,
    },
  ];

  const trustLogos = [
    'National Home Builders Association',
    'Construction Safety Council',
    'Better Business Bureau A+',
    'Escrow Certified',
    'SSL Secured',
  ];

  const faqs = [
    {
      question: 'How does the escrow protection work?',
      answer:
        'When you fund a project, your money goes into a secure third-party escrow account. Funds are only released to contractors when specific milestones are completed and verified. If there\'s a dispute, the funds remain protected until resolution.',
    },
    {
      question: 'What is the platform fee?',
      answer:
        'Kealee charges a 3% platform fee on project transactions. This covers escrow protection, compliance monitoring, dispute resolution services, and full platform access. There are no hidden fees or monthly subscriptions.',
    },
    {
      question: 'Can I use my own contractors?',
      answer:
        'Absolutely! You can invite any licensed contractor to join your project on Kealee. They\'ll get their own portal to submit milestones, upload documentation, and receive payments. We also have a marketplace of pre-vetted contractors if you need recommendations.',
    },
    {
      question: 'What if there\'s a dispute with my contractor?',
      answer:
        'Kealee provides built-in dispute resolution. If you disagree about milestone completion, an independent review process examines the evidence. Funds remain in escrow until the dispute is resolved, protecting both parties.',
    },
    {
      question: 'How long does setup take?',
      answer:
        'Most homeowners complete project setup in under 15 minutes. The readiness checklist phase varies based on your project complexity—simple renovations might take a few days, while new construction can take a few weeks to gather all permits and documentation.',
    },
  ];

  const integrations = [
    {
      name: 'Architect Hub',
      description: 'Automatic updates when designs are complete. Direct handoff to permits module.',
      icon: Building2,
    },
    {
      name: 'Permits & Inspections',
      description: 'Permits linked to timeline. Inspection results automatically gate milestone approvals.',
      icon: FileCheck,
    },
    {
      name: 'Finance & Trust',
      description: 'Secure escrow with automatic release gates. Milestone payments when work passes inspection.',
      icon: Lock,
    },
    {
      name: 'Contractor Marketplace',
      description: 'Find verified contractors, track performance, and manage contracts in one place.',
      icon: Users,
    },
  ];

  return (
    <>
      {/* JSON-LD Structured Data */}
      <Script
        id="json-ld-software"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Script
        id="json-ld-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-transparent'
          }`}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 lg:h-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Home className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold text-slate-900">Kealee</span>
                  <span className="text-xs font-medium text-slate-500 block -mt-0.5">Project Owner</span>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  Features
                </a>
                <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  How It Works
                </a>
                <a href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  Testimonials
                </a>
                <a href="#faq" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  FAQ
                </a>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/projects/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
                >
                  Start Project
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/50" />
            <div
              className="absolute inset-0 opacity-[0.015]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
            <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-400/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-amber-300/10 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-12">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left Column - Content */}
              <div className="max-w-2xl">
                {/* Trust Badge */}
                <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur border border-slate-200/50 text-slate-700 px-4 py-2 rounded-full text-sm font-medium mb-8 shadow-sm">
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <Lock className="w-4 h-4 text-blue-600" />
                  </div>
                  <span>
                    <span className="font-bold text-emerald-600">$4.2M+</span> Protected in Escrow
                  </span>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={12} fill="currentColor" />
                    ))}
                  </div>
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-[1.1] tracking-tight">
                  Build Your Dream.{' '}
                  <span className="relative">
                    <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800">
                      Protected.
                    </span>
                    <svg
                      className="absolute -bottom-2 left-0 w-full h-3 text-emerald-400/50"
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
                  </span>
                </h1>

                {/* Subheadline */}
                <p className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed max-w-xl">
                  The only construction management platform that puts homeowners in control. Secure escrow, milestone
                  gates, and complete visibility from first permit to final walkthrough.
                </p>

                {/* Key Value Props */}
                <div className="grid sm:grid-cols-2 gap-4 mb-10">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-white/60 backdrop-blur border border-slate-200/50">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Lock className="text-emerald-600" size={20} />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Escrow Protection</div>
                      <div className="text-sm text-slate-500">Money safe until verified</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-white/60 backdrop-blur border border-slate-200/50">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Eye className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Full Visibility</div>
                      <div className="text-sm text-slate-500">Real-time project tracking</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-white/60 backdrop-blur border border-slate-200/50">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="text-amber-600" size={20} />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Compliance Gates</div>
                      <div className="text-sm text-slate-500">Auto-block non-compliance</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-white/60 backdrop-blur border border-slate-200/50">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Percent className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">3% Platform Fee</div>
                      <div className="text-sm text-slate-500">Transparent pricing</div>
                    </div>
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Link
                    href="/projects/new"
                    className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-lg rounded-xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    Start Your Project Free
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                  </Link>

                  <Link
                    href="/login"
                    className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-lg rounded-xl transition-all duration-300"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
                      <Play className="text-white ml-0.5" size={18} fill="white" />
                    </div>
                    Watch Demo
                  </Link>
                </div>

                {/* Trust Signals */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-emerald-500" size={16} />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-emerald-500" size={16} />
                    <span>Setup in 15 minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-emerald-500" size={16} />
                    <span>Dispute protection included</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Dashboard Preview */}
              <div className="relative hidden lg:block">
                {/* Main Dashboard Card */}
                <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden">
                  {/* Browser Chrome */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="px-4 py-1 bg-white rounded-md text-xs text-slate-400 border border-slate-200">
                        owner.kealee.com/dashboard
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Content */}
                  <div className="p-6 space-y-6">
                    {/* Project Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-500">Active Project</div>
                        <div className="text-xl font-bold text-slate-900">Kitchen Renovation</div>
                      </div>
                      <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
                        On Track
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <div className="text-2xl font-bold">$42,500</div>
                        <div className="text-sm text-blue-100">In Escrow</div>
                      </div>
                      <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                        <div className="text-2xl font-bold">4/6</div>
                        <div className="text-sm text-emerald-100">Milestones</div>
                      </div>
                      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                        <div className="text-2xl font-bold">67%</div>
                        <div className="text-sm text-amber-100">Complete</div>
                      </div>
                    </div>

                    {/* Milestones List */}
                    <div className="space-y-3">
                      {[
                        { name: 'Demolition Complete', status: 'Approved', amount: '$8,500', done: true },
                        { name: 'Electrical Rough-In', status: 'Approved', amount: '$6,200', done: true },
                        { name: 'Plumbing Rough-In', status: 'In Review', amount: '$7,800', pending: true },
                        { name: 'Cabinet Installation', status: 'Upcoming', amount: '$12,000', upcoming: true },
                      ].map((milestone, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              milestone.done
                                ? 'bg-emerald-100'
                                : milestone.pending
                                ? 'bg-amber-100'
                                : 'bg-slate-200'
                            }`}
                          >
                            {milestone.done ? (
                              <Check className="text-emerald-600" size={16} />
                            ) : milestone.pending ? (
                              <Clock className="text-amber-600" size={16} />
                            ) : (
                              <Calendar className="text-slate-400" size={16} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-900 text-sm">{milestone.name}</div>
                            <div className="text-xs text-slate-500">{milestone.status}</div>
                          </div>
                          <div className="text-sm font-semibold text-slate-700">{milestone.amount}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating Cards */}
                <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-xl border border-slate-200/50 p-4 animate-bounce" style={{ animationDuration: '3s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="text-emerald-600" size={24} />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Milestone Approved!</div>
                      <div className="text-sm text-slate-500">$6,200 released</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-xl border border-slate-200/50 p-4 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Shield className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Funds Protected</div>
                      <div className="text-sm text-slate-500">100% secure escrow</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2 text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Scroll to explore</span>
            <div className="w-6 h-10 border-2 border-slate-300 rounded-full flex justify-center pt-2">
              <div className="w-1.5 h-3 bg-slate-400 rounded-full animate-bounce" />
            </div>
          </div>
        </section>

        {/* Trusted By Section */}
        <section className="py-12 bg-white border-y border-slate-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-medium text-slate-500 mb-8 uppercase tracking-wider">
              Trusted by Homeowners & Property Professionals Nationwide
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
              {trustLogos.map((logo, i) => (
                <div key={i} className="text-slate-400 font-semibold text-sm lg:text-base opacity-60 hover:opacity-100 transition-opacity">
                  {logo}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-blue-50/50 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <TrendingUp size={16} />
                Proven Results
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                Numbers That{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700">
                  Build Trust
                </span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Join thousands of homeowners who have successfully managed their construction projects with Kealee.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {stats.map((stat, index) => (
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
                      <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
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

        {/* Features Grid */}
        <section id="features" className="py-20 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Zap size={16} />
                Powerful Features
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                Everything You Need to{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700">
                  Manage Your Project
                </span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Built specifically for property owners who want complete control and visibility over their construction projects.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {features.map((feature, index) => {
                const colorClasses = {
                  blue: 'bg-blue-100 text-blue-600',
                  emerald: 'bg-emerald-100 text-emerald-600',
                  amber: 'bg-amber-100 text-amber-600',
                  purple: 'bg-purple-100 text-purple-600',
                  rose: 'bg-rose-100 text-rose-600',
                  cyan: 'bg-cyan-100 text-cyan-600',
                }[feature.color];

                return (
                  <div
                    key={index}
                    className="group p-8 bg-white rounded-2xl border border-slate-200 hover:border-transparent hover:shadow-2xl transition-all duration-300"
                  >
                    <div className={`w-14 h-14 ${colorClasses} rounded-xl flex items-center justify-center mb-6`}>
                      <feature.icon size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <BarChart3 size={16} />
                Simple Process
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                How Kealee{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700">Works</span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                From project creation to final walkthrough, we guide you every step of the way.
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {howItWorks.map((step, index) => (
                  <div key={index} className="relative">
                    {/* Connector Line */}
                    {index < howItWorks.length - 1 && (
                      <div className="hidden lg:block absolute top-10 left-[60%] w-full h-0.5 bg-gradient-to-r from-blue-300 to-blue-100" />
                    )}

                    <div className="text-center relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/25 relative z-10">
                        <step.icon size={32} />
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-sm font-bold text-blue-600 shadow-lg border-2 border-blue-100">
                          {step.step}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits / Why Choose Us */}
        <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 backdrop-blur">
                  <Shield size={16} />
                  Why Property Owners Choose Kealee
                </div>
                <h2 className="text-4xl lg:text-5xl font-bold mb-4">
                  Built for{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                    Your Protection
                  </span>
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="p-8 bg-white/5 backdrop-blur rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center mb-6">
                    <Lock className="text-white" size={28} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Escrow Protection</h3>
                  <p className="text-slate-300 leading-relaxed">
                    Your funds are held in secure third-party escrow. Money only releases when milestones are verified complete.
                    If theres a dispute, funds stay protected until resolution.
                  </p>
                </div>

                <div className="p-8 bg-white/5 backdrop-blur rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center mb-6">
                    <AlertTriangle className="text-white" size={28} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Automatic Compliance</h3>
                  <p className="text-slate-300 leading-relaxed">
                    Escrow wont release if permits expire. Milestones cant be approved without passing inspections. Your
                    project stays compliant automatically.
                  </p>
                </div>

                <div className="p-8 bg-white/5 backdrop-blur rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mb-6">
                    <MessageSquare className="text-white" size={28} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Dispute Resolution</h3>
                  <p className="text-slate-300 leading-relaxed">
                    Built-in dispute resolution with independent review. All communication and evidence documented. Fair
                    resolution for both parties.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-20 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Star size={16} fill="currentColor" />
                Customer Stories
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                Trusted by{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700">
                  Real Homeowners
                </span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                See what our customers say about managing their construction projects with Kealee.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-slate-100"
                >
                  {/* Rating */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} size={20} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  {/* Quote Icon */}
                  <Quote className="text-blue-100 mb-4" size={40} />

                  {/* Content */}
                  <p className="text-slate-700 mb-6 leading-relaxed">{testimonial.content}</p>

                  {/* Project Badge */}
                  <div className="inline-flex px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full mb-6">
                    {testimonial.project}
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{testimonial.name}</div>
                      <div className="text-sm text-slate-500">
                        {testimonial.role} - {testimonial.location}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Integrations */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 bg-cyan-100 text-cyan-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                  <Zap size={16} />
                  Fully Integrated
                </div>
                <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                  Connect with the{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700">
                    Entire Ecosystem
                  </span>
                </h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  Seamlessly integrated with all Kealee modules for a complete construction management experience.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {integrations.map((integration, index) => (
                  <div
                    key={index}
                    className="flex gap-6 p-6 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                      <integration.icon className="text-blue-600" size={28} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{integration.name}</h3>
                      <p className="text-slate-600">{integration.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                  <MessageSquare size={16} />
                  FAQ
                </div>
                <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                  Common{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700">
                    Questions
                  </span>
                </h2>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <button
                      className="w-full px-6 py-5 flex items-center justify-between text-left"
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    >
                      <span className="font-semibold text-slate-900 pr-4">{faq.question}</span>
                      <ChevronDown
                        className={`text-slate-400 flex-shrink-0 transition-transform ${
                          openFaq === index ? 'rotate-180' : ''
                        }`}
                        size={20}
                      />
                    </button>
                    {openFaq === index && (
                      <div className="px-6 pb-5">
                        <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-white/10 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                Ready to Build with Confidence?
              </h2>
              <p className="text-xl text-blue-100 mb-10 leading-relaxed">
                Join thousands of homeowners who trust Kealee to protect their investment and manage their construction
                projects from start to finish.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link
                  href="/projects/new"
                  className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-blue-700 font-semibold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                >
                  Start Your Project Free
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/10 text-white border-2 border-white/20 font-semibold text-lg rounded-xl hover:bg-white/20 transition-all duration-300 backdrop-blur"
                >
                  View Demo
                </Link>
              </div>
              <p className="text-blue-200 text-sm">
                No credit card required - 3% platform fee - Escrow protection included
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                    <Home className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="text-xl font-bold text-white">Kealee</span>
                    <span className="text-xs font-medium text-slate-500 block -mt-0.5">Project Owner</span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed mb-6 max-w-md">
                  Complete construction project management for property owners. Secure escrow, milestone gates, and full
                  visibility from first permit to final walkthrough.
                </p>
                <div className="flex gap-4">
                  <div className="px-3 py-1 bg-slate-800 rounded text-xs font-medium text-slate-300">
                    BBB A+ Rated
                  </div>
                  <div className="px-3 py-1 bg-slate-800 rounded text-xs font-medium text-slate-300">
                    SSL Secured
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Product</h4>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link href="/projects/new" className="hover:text-white transition-colors">
                      Create Project
                    </Link>
                  </li>
                  <li>
                    <Link href="/login" className="hover:text-white transition-colors">
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <a href="#features" className="hover:text-white transition-colors">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Pricing
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Resources</h4>
                <ul className="space-y-3 text-sm">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a href="#faq" className="hover:text-white transition-colors">
                      FAQ
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Blog
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Company</h4>
                <ul className="space-y-3 text-sm">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      About Us
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Contact
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Terms of Service
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm">&copy; {new Date().getFullYear()} Kealee Platform. All rights reserved.</p>
              <div className="flex items-center gap-6 text-sm">
                <a href="#" className="hover:text-white transition-colors">
                  Privacy
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  Terms
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  Cookies
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
