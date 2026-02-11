'use client';

import Link from 'next/link';
import {
  Check,
  Building2,
  FileCheck,
  Clock,
  Shield,
  Zap,
  Users,
  BarChart3,
  ShoppingCart,
  MapPin,
  Scale,
  Landmark,
  History,
  Search,
  Globe,
  FileText,
  AlertTriangle,
  ArrowRight,
  Star,
  Phone,
  Mail,
} from 'lucide-react';

const permitPackages = [
  {
    name: 'Package A',
    subtitle: 'Single Permit',
    price: '$495',
    period: 'one-time',
    popular: false,
    features: [
      'Single permit application filing',
      'AI compliance pre-check',
      'Document preparation & review',
      'Status tracking until approval',
      'Basic inspection coordination',
    ],
  },
  {
    name: 'Package B',
    subtitle: 'Builder',
    price: '$1,295',
    period: '/mo',
    popular: true,
    features: [
      'Up to 10 permits per month',
      'Priority AI compliance review',
      'Dedicated permit coordinator',
      'Inspection scheduling & tracking',
      'Zoning verification included',
      'Historic district permit guidance',
      'Weekly status reports',
    ],
  },
  {
    name: 'Package C',
    subtitle: 'Enterprise',
    price: '$2,995',
    period: '/mo',
    popular: false,
    features: [
      'Up to 50 permits per month',
      'Multi-jurisdiction coverage',
      'Full compliance management',
      'Dedicated account manager',
      'Expedited processing (48-72 hr)',
      'Zoning change monitoring',
      'Custom reporting & analytics',
      'API access & integrations',
    ],
  },
  {
    name: 'Package D',
    subtitle: 'Portfolio',
    price: '$7,500',
    period: '/mo',
    popular: false,
    features: [
      'Unlimited permits',
      'All jurisdictions covered',
      'White-glove concierge service',
      'SLA-guaranteed turnaround',
      'Historic district compliance research',
      'Variance & zoning applications',
      'Executive dashboard & reporting',
      'Dedicated team of specialists',
    ],
  },
];

const services = [
  {
    icon: FileCheck,
    title: 'Permit Applications',
    description:
      'Complete digital application filing with AI pre-review that catches errors before submission. Residential, commercial, and specialty permits.',
  },
  {
    icon: Clock,
    title: 'Inspection Scheduling',
    description:
      'Calendar-based scheduling with route optimization, mobile inspector integration, and real-time result notifications.',
  },
  {
    icon: Shield,
    title: 'Code Compliance',
    description:
      'Automated building code compliance checks against local, state, and federal requirements. Stay current with code updates.',
  },
  {
    icon: Scale,
    title: 'Zoning Verification',
    description:
      'Verify zoning classifications, permitted uses, setback requirements, and density allowances before starting your project.',
  },
  {
    icon: Landmark,
    title: 'Zoning Changes & Variances',
    description:
      'Navigate rezoning applications, conditional use permits, special exceptions, and variance requests with expert guidance.',
  },
  {
    icon: History,
    title: 'Historic District Permits',
    description:
      'Navigate permits for properties in designated historic areas. We handle landmark commission reviews, preservation requirements, and district-specific compliance.',
  },
  {
    icon: Users,
    title: 'Plan Review Management',
    description:
      'PDF markup, discipline-specific review workflows, comment threading, and revision tracking for efficient plan reviews.',
  },
  {
    icon: Globe,
    title: 'Multi-Jurisdiction Filing',
    description:
      'File permits across multiple jurisdictions from a single platform. We handle jurisdiction-specific requirements and forms.',
  },
  {
    icon: FileText,
    title: 'Certificate of Occupancy',
    description:
      'Manage CO applications, final inspections, and occupancy certificates. Track requirements and outstanding items to completion.',
  },
  {
    icon: AlertTriangle,
    title: 'Violation Resolution',
    description:
      'Address code violations, open permits, and compliance issues. We help you clear violations and get back on track.',
  },
  {
    icon: Search,
    title: 'Property Due Diligence',
    description:
      'Comprehensive permit and zoning research for property acquisitions. Open permits, violations, zoning restrictions, and entitlements.',
  },
  {
    icon: BarChart3,
    title: 'Reporting & Analytics',
    description:
      'Real-time dashboards, permit status tracking, processing time analytics, and custom reports for your portfolio.',
  },
];

export default function PermitsLanding() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">
                Kealee <span className="text-emerald-600">Permits</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition"
              >
                Home
              </Link>
              <a
                href="#services"
                className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition"
              >
                Services
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition"
              >
                Pricing
              </a>
              <a
                href="#how-it-works"
                className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition"
              >
                How It Works
              </a>
              <a
                href="tel:+13015758777"
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-emerald-600 transition"
              >
                <Phone className="h-4 w-4" />
                (301) 575-8777
              </a>
              <button
                id="cart-trigger"
                className="relative text-gray-700 hover:text-emerald-600 transition"
                aria-label="Cart"
              >
                <ShoppingCart className="h-5 w-5" />
              </button>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition"
              >
                Log In
              </Link>
              <Link
                href="/permits/new"
                className="inline-flex items-center px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-20 bg-gradient-to-br from-emerald-50 via-white to-green-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-6">
              <Zap className="h-4 w-4" />
              AI-Powered — Get Approved 40% Faster
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-gray-900">
              Permits, Inspections &
              <span className="block text-emerald-600 mt-2">
                Zoning Made Simple
              </span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              From initial zoning verification to certificate of occupancy—we handle every step of the permitting process. AI catches errors before you submit, and we track everything until approval.
            </p>

            {/* Stats */}
            <div className="mt-8 flex flex-wrap justify-center gap-8">
              <div>
                <div className="text-3xl font-black text-emerald-600">40%</div>
                <div className="mt-1 text-sm text-gray-600">Faster approvals</div>
              </div>
              <div>
                <div className="text-3xl font-black text-emerald-600">60%</div>
                <div className="mt-1 text-sm text-gray-600">Fewer rejections</div>
              </div>
              <div>
                <div className="text-3xl font-black text-emerald-600">14 days</div>
                <div className="mt-1 text-sm text-gray-600">Avg. approval time</div>
              </div>
              <div>
                <div className="text-3xl font-black text-emerald-600">500+</div>
                <div className="mt-1 text-sm text-gray-600">Jurisdictions</div>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/permits/new"
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-8 py-4 text-base font-bold text-white shadow-lg transition hover:bg-emerald-700 gap-2"
              >
                Start Your Permit Application
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/permits/status"
                className="inline-flex items-center justify-center rounded-2xl border-2 border-gray-200 bg-white px-8 py-4 text-base font-bold text-gray-900 shadow-sm transition hover:border-emerald-600"
              >
                Check Permit Status
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Takes 5 minutes to start &bull; AI reviews instantly &bull; No payment until submission
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black tracking-tight text-gray-900">
              Complete Permit & Zoning Services
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need for permits, inspections, zoning, historic districts, and compliance—all in one platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.title}
                  className="p-6 bg-white rounded-2xl border border-gray-200 hover:border-emerald-500 hover:shadow-lg transition group"
                >
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition">
                    <Icon className="h-6 w-6 text-emerald-600 group-hover:text-white transition" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {service.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {service.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-emerald-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black tracking-tight text-gray-900">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              From application to approval in four simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: '1',
                title: 'Submit Your Application',
                description:
                  'Fill out the digital application form. Our AI pre-reviews for errors and missing info before submission.',
              },
              {
                step: '2',
                title: 'We Handle the Filing',
                description:
                  'We file with the correct jurisdiction, pay fees, and coordinate with reviewers on your behalf.',
              },
              {
                step: '3',
                title: 'Track Every Step',
                description:
                  'Monitor plan reviews, respond to comments, schedule inspections, and get real-time status updates.',
              },
              {
                step: '4',
                title: 'Get Your Permit',
                description:
                  'Receive your approved permit. We coordinate final inspections through certificate of occupancy.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-black text-white">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Permit Packages */}
      <section id="pricing" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black tracking-tight text-gray-900">
              Permit Service Packages
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the level of permit support that matches your project volume
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {permitPackages.map((pkg) => (
              <div
                key={pkg.name}
                className={
                  pkg.popular
                    ? 'rounded-2xl border-2 border-emerald-500 bg-white p-6 shadow-xl relative'
                    : 'rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'
                }
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-1 text-xs font-bold text-white">
                      <Star className="h-3 w-3" /> MOST POPULAR
                    </span>
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-lg font-black text-gray-900">
                    {pkg.name}
                  </h3>
                  <p className="text-sm text-gray-500">{pkg.subtitle}</p>
                  <div className="mt-3">
                    <span className="text-3xl font-black text-emerald-600">
                      {pkg.price}
                    </span>
                    <span className="text-sm text-gray-500">
                      {pkg.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/permits/new"
                  className={
                    pkg.popular
                      ? 'block w-full py-3 text-center rounded-xl bg-emerald-600 text-white font-bold text-sm transition hover:bg-emerald-700'
                      : 'block w-full py-3 text-center rounded-xl bg-gray-900 text-white font-bold text-sm transition hover:bg-gray-800'
                  }
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              All packages include AI compliance pre-check and real-time tracking.{' '}
              <Link href="/permits/new" className="text-emerald-600 font-semibold hover:underline">
                Contact us for custom enterprise solutions &rarr;
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Zoning & Historic Districts Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-gray-900">
                Zoning Research & Historic Districts
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Don&apos;t start a project without knowing the full permitting history. Our research services give you complete visibility into any property.
              </p>

              <div className="mt-8 space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Zoning Classification Lookup</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Verify current zoning, permitted uses, density allowances, setback requirements, and overlay districts.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Landmark className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Rezoning & Variance Applications</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Navigate the rezoning process, conditional use permits, special exceptions, and variance hearings.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <History className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Historic District Permits</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Permits for properties in designated historic areas—landmark commission reviews, preservation requirements, and district-specific approvals.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Open Permits & Violations</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Discover open permits, unresolved violations, and outstanding compliance issues before closing on a property.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Property Due Diligence Report</h3>
                <ul className="space-y-3">
                  {[
                    'Current zoning classification & permitted uses',
                    'Complete permit history (all years)',
                    'Open permits & code violations',
                    'Inspection results & compliance status',
                    'Zoning overlay districts & restrictions',
                    'Pending zoning changes in the area',
                    'Environmental & historic district flags',
                    'Utility & infrastructure connections',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/permits/new"
                  className="mt-6 block w-full py-3 text-center rounded-xl bg-emerald-600 text-white font-bold text-sm transition hover:bg-emerald-700"
                >
                  Order Due Diligence Report
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black tracking-tight text-gray-900">
              Built for Everyone in Construction
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Whether you are a contractor, builder, building department, or property owner
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Building Departments
              </h3>
              <ul className="space-y-3">
                {[
                  'Replace legacy permit systems',
                  'Digital application intake & processing',
                  'Inspection scheduling & route optimization',
                  'Public search & status portal',
                  'Analytics & processing metrics',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-emerald-50 p-8 rounded-2xl border-2 border-emerald-500">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Contractors & Builders
              </h3>
              <ul className="space-y-3">
                {[
                  'Online permit applications with AI review',
                  'Real-time status tracking & alerts',
                  'Expedited processing options',
                  'Zoning verification before bidding',
                  'Historic district permit guidance',
                  'Multi-project portfolio management',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Property Owners & Developers
              </h3>
              <ul className="space-y-3">
                {[
                  'Track all project permits in one place',
                  'Property due diligence reports',
                  'Zoning change notifications',
                  'Automatic compliance gates',
                  'Linked to project timelines',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black tracking-tight text-gray-900">
              Why Choose Kealee Permits?
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Zap className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">AI Pre-Review</h3>
                <p className="text-sm text-gray-600">
                  Catches common code violations and missing documents before submission—reducing rejections by 60%.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Globe className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Multi-Jurisdiction</h3>
                <p className="text-sm text-gray-600">
                  File across 500+ jurisdictions from a single platform. We handle local requirements automatically.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Expedited Processing</h3>
                <p className="text-sm text-gray-600">
                  48-72 hour review guarantees available. Digital workflows eliminate paperwork delays.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Building2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Platform Integration</h3>
                <p className="text-sm text-gray-600">
                  Connects with Kealee Architect, Project Owner, and Finance for seamless project management.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Compliance Monitoring</h3>
                <p className="text-sm text-gray-600">
                  Stay current with code updates. Automatic notifications when regulations change affecting your permits.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Real-Time Dashboard</h3>
                <p className="text-sm text-gray-600">
                  Track every permit, inspection, and review from a single dashboard. Never miss a deadline.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 to-green-700">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-black tracking-tight text-white">
            Ready to Streamline Your Permit Process?
          </h2>
          <p className="mt-4 text-lg text-emerald-50 max-w-2xl mx-auto">
            Join contractors, builders, and building departments using Kealee Permits to save time, reduce rejections, and get approvals faster.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/permits/new"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-8 py-4 text-base font-bold text-gray-900 shadow-lg transition hover:bg-gray-50 gap-2"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/permits/status"
              className="inline-flex items-center justify-center rounded-2xl border-2 border-white px-8 py-4 text-base font-bold text-white transition hover:bg-white/10"
            >
              Search Permits
            </Link>
          </div>

          <p className="mt-6 text-sm text-emerald-100">
            No credit card required &bull; Full access to Package B features &bull; Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">
                  Kealee <span className="text-emerald-400">Permits</span>
                </span>
              </div>
              <p className="text-sm text-gray-400">
                Modern permit and inspection management for contractors, builders, building departments, and property owners.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#services" className="hover:text-white transition">
                    Permit Applications
                  </a>
                </li>
                <li>
                  <a href="#services" className="hover:text-white transition">
                    Inspection Scheduling
                  </a>
                </li>
                <li>
                  <a href="#services" className="hover:text-white transition">
                    Zoning Verification
                  </a>
                </li>
                <li>
                  <a href="#services" className="hover:text-white transition">
                    Historic District Permits
                  </a>
                </li>
                <li>
                  <a href="#services" className="hover:text-white transition">
                    Code Compliance
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#how-it-works" className="hover:text-white transition">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition">
                    Pricing
                  </a>
                </li>
                <li>
                  <Link href="/permits/status" className="hover:text-white transition">
                    Permit Status Search
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Contact</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="mailto:permits@kealee.com" className="hover:text-white transition flex items-center gap-2">
                    <Mail className="h-4 w-4" /> permits@kealee.com
                  </a>
                </li>
                <li>
                  <a href="tel:+13015758777" className="hover:text-white transition flex items-center gap-2">
                    <Phone className="h-4 w-4" /> (301) 575-8777
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} Kealee LLC. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="/privacy" className="hover:text-white transition">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition">
                Terms
              </Link>
              <a href="https://kealee.com" className="hover:text-white transition">
                kealee.com
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
