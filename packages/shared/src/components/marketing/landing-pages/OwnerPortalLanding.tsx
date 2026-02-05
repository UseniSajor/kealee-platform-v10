// Owner Portal Landing Page
// For: Property Owners + Business Owners
// URL: owner.kealee.com

import React, { useState } from 'react';

// Icons (using Lucide React style - replace with actual imports)
const Icons = {
  Building: () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  HardHat: () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Calculator: () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  FileCheck: () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Wrench: () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    </svg>
  ),
  DollarSign: () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  CheckCircle: () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Users: () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Hammer: () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  Menu: () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  X: () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  ),
  ArrowRight: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  ),
};

// Feature data
const features = [
  {
    icon: Icons.Building,
    title: 'Property Dashboard',
    description: 'Centralized view of all your properties with real-time status tracking',
  },
  {
    icon: Icons.Hammer,
    title: 'Tenant Improvements',
    description: 'Streamline TI project management from request to completion',
  },
  {
    icon: Icons.Wrench,
    title: 'Maintenance Management',
    description: 'Track and schedule building maintenance efficiently',
  },
  {
    icon: Icons.Users,
    title: 'Vendor Network',
    description: 'Build and manage relationships with reliable contractors',
  },
  {
    icon: Icons.DollarSign,
    title: 'Budget Tracking',
    description: 'Monitor CapEx and OpEx across all your properties',
  },
  {
    icon: Icons.CheckCircle,
    title: 'Compliance Tracking',
    description: 'Stay on top of building compliance and regulatory requirements',
  },
];

// Services data
const services = [
  {
    icon: Icons.HardHat,
    title: 'Find Contractors',
    description: 'Access vetted commercial contractors',
    href: '/services/contractors',
  },
  {
    icon: Icons.Calculator,
    title: 'TI Estimates',
    description: 'Accurate tenant improvement estimates',
    href: '/services/estimation',
  },
  {
    icon: Icons.FileCheck,
    title: 'Permit Services',
    description: 'Commercial permit assistance',
    href: '/services/permits',
  },
];

// Stats data
const stats = [
  { value: '1,200+', label: 'Properties Managed' },
  { value: '$180M+', label: 'TI Value' },
  { value: '35%', label: 'Faster Completion' },
];

// Topbar Navigation Component
function TopbarNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8793A]">
            <Icons.Building />
          </div>
          <span className="text-xl font-semibold text-[#4A90D9]">Kealee Owner</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:items-center lg:gap-x-8">
          <a href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-[#4A90D9]">
            Dashboard
          </a>

          {/* Features Dropdown */}
          <div className="relative">
            <button
              onClick={() => setFeaturesOpen(!featuresOpen)}
              className="flex items-center gap-x-1 text-sm font-medium text-gray-700 hover:text-[#4A90D9]"
            >
              Features
              <Icons.ChevronDown />
            </button>
            {featuresOpen && (
              <div className="absolute left-0 top-full mt-2 w-[480px] rounded-xl bg-white p-4 shadow-lg ring-1 ring-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Property Management
                    </h4>
                    <div className="space-y-3">
                      <a href="/properties" className="block rounded-lg p-2 hover:bg-gray-50">
                        <p className="text-sm font-medium text-gray-900">My Properties</p>
                        <p className="text-xs text-gray-500">View all your properties</p>
                      </a>
                      <a href="/tenant-improvements" className="block rounded-lg p-2 hover:bg-gray-50">
                        <p className="text-sm font-medium text-gray-900">Tenant Improvements</p>
                        <p className="text-xs text-gray-500">TI project management</p>
                      </a>
                      <a href="/maintenance" className="block rounded-lg p-2 hover:bg-gray-50">
                        <p className="text-sm font-medium text-gray-900">Maintenance</p>
                        <p className="text-xs text-gray-500">Building maintenance tracking</p>
                      </a>
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Vendors & Finance
                    </h4>
                    <div className="space-y-3">
                      <a href="/vendors" className="block rounded-lg p-2 hover:bg-gray-50">
                        <p className="text-sm font-medium text-gray-900">Vendor Management</p>
                        <p className="text-xs text-gray-500">Your contractor network</p>
                      </a>
                      <a href="/budget" className="block rounded-lg p-2 hover:bg-gray-50">
                        <p className="text-sm font-medium text-gray-900">Budget Tracking</p>
                        <p className="text-xs text-gray-500">CapEx & OpEx monitoring</p>
                      </a>
                      <a href="/compliance" className="block rounded-lg p-2 hover:bg-gray-50">
                        <p className="text-sm font-medium text-gray-900">Compliance</p>
                        <p className="text-xs text-gray-500">Building compliance tracking</p>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Services Dropdown */}
          <div className="relative">
            <button
              onClick={() => setServicesOpen(!servicesOpen)}
              className="flex items-center gap-x-1 text-sm font-medium text-gray-700 hover:text-[#4A90D9]"
            >
              Services
              <Icons.ChevronDown />
            </button>
            {servicesOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 rounded-xl bg-white p-4 shadow-lg ring-1 ring-gray-200">
                <div className="space-y-3">
                  {services.map((service) => (
                    <a
                      key={service.title}
                      href={service.href}
                      className="flex items-start gap-3 rounded-lg p-2 hover:bg-gray-50"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-[#E8793A]">
                        <service.icon />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{service.title}</p>
                        <p className="text-xs text-gray-500">{service.description}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="hidden lg:flex lg:items-center lg:gap-x-4">
          <a href="/login" className="text-sm font-medium text-gray-700 hover:text-[#4A90D9]">
            Log in
          </a>
          <a
            href="/signup?portal=owner"
            className="rounded-lg bg-[#E8793A] px-4 py-2 text-sm font-medium text-white hover:bg-[#d66a2e]"
          >
            Start Free
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden rounded-lg p-2 text-gray-700 hover:bg-gray-100"
        >
          {mobileMenuOpen ? <Icons.X /> : <Icons.Menu />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white px-4 py-4">
          <div className="space-y-4">
            <a href="/dashboard" className="block text-base font-medium text-gray-900">
              Dashboard
            </a>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Features</p>
              <div className="mt-2 space-y-2 pl-4">
                <a href="/properties" className="block text-sm text-gray-700">My Properties</a>
                <a href="/tenant-improvements" className="block text-sm text-gray-700">Tenant Improvements</a>
                <a href="/maintenance" className="block text-sm text-gray-700">Maintenance</a>
                <a href="/vendors" className="block text-sm text-gray-700">Vendor Management</a>
                <a href="/budget" className="block text-sm text-gray-700">Budget Tracking</a>
                <a href="/compliance" className="block text-sm text-gray-700">Compliance</a>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Services</p>
              <div className="mt-2 space-y-2 pl-4">
                {services.map((service) => (
                  <a key={service.title} href={service.href} className="block text-sm text-gray-700">
                    {service.title}
                  </a>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <a href="/login" className="block text-base font-medium text-gray-900">Log in</a>
              <a
                href="/signup?portal=owner"
                className="mt-3 block w-full rounded-lg bg-[#E8793A] px-4 py-2 text-center text-sm font-medium text-white"
              >
                Start Free
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// Hero Section
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1.5 text-sm font-medium text-[#E8793A]">
            <Icons.Building />
            Property & Business Owner Platform
          </div>

          {/* Headline */}
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Commercial Property,
            <span className="block text-[#E8793A]">Simplified</span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 sm:text-xl">
            Manage tenant improvements, building maintenance, and contractor relationships
            from a single platform designed for property and business owners.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/signup?portal=owner"
              className="inline-flex items-center gap-2 rounded-lg bg-[#E8793A] px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-[#d66a2e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8793A]"
            >
              Start Free
              <Icons.ArrowRight />
            </a>
            <a
              href="/demo/owner"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              See Demo
            </a>
          </div>

          {/* Stats */}
          <div className="mt-16 flex flex-col items-center justify-center gap-8 border-t border-gray-200 pt-8 sm:flex-row sm:gap-16">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-[#E8793A] sm:text-4xl">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Features Section
function FeaturesSection() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything You Need to Manage Your Properties
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Purpose-built tools for property and business owners managing their buildings
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-orange-200 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-[#E8793A] transition-colors group-hover:bg-[#E8793A] group-hover:text-white">
                <feature.icon />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// How It Works Section
function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Add Your Properties',
      description: 'Import or manually add your commercial and residential buildings',
    },
    {
      number: '02',
      title: 'Manage Projects',
      description: 'Track TI, maintenance, and capital projects in one place',
    },
    {
      number: '03',
      title: 'Stay Compliant',
      description: 'Monitor compliance requirements and generate reports',
    },
  ];

  return (
    <section className="bg-gray-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Get started in minutes, not weeks
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {index < steps.length - 1 && (
                <div className="absolute left-1/2 top-16 hidden h-0.5 w-full bg-orange-200 lg:block" />
              )}
              <div className="relative flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E8793A] text-2xl font-bold text-white">
                  {step.number}
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Services Section
function ServicesSection() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-br from-[#E8793A] to-orange-600 p-8 sm:p-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Services Available
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-orange-100">
              Expert services to support your property management needs
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {services.map((service) => (
              <a
                key={service.title}
                href={service.href}
                className="group rounded-xl bg-white/10 p-6 backdrop-blur transition-all hover:bg-white/20"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-white">
                  <service.icon />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{service.title}</h3>
                <p className="mt-2 text-sm text-orange-100">{service.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-white group-hover:gap-2 transition-all">
                  Learn more <Icons.ArrowRight />
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Testimonial Section
function TestimonialSection() {
  return (
    <section className="bg-gray-50 py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <figure className="text-center">
          <svg className="mx-auto h-12 w-12 text-orange-200" fill="currentColor" viewBox="0 0 32 32">
            <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
          </svg>
          <blockquote className="mt-8">
            <p className="text-xl font-medium text-gray-900 sm:text-2xl">
              &ldquo;Finally, a platform that understands commercial building operations.
              We&apos;ve reduced our TI project timelines by 40%.&rdquo;
            </p>
          </blockquote>
          <figcaption className="mt-6">
            <p className="font-semibold text-gray-900">Sandra Williams</p>
            <p className="text-sm text-gray-600">Building Operations Manager</p>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

// CTA Section
function CTASection() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-[#E8793A] px-8 py-12 text-center sm:px-12 sm:py-16">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to Simplify Property Management?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-orange-100">
            Join hundreds of property owners who trust Kealee
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/signup?portal=owner"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-[#E8793A] shadow-sm hover:bg-orange-50"
            >
              Start Free Trial
              <Icons.ArrowRight />
            </a>
            <a
              href="/demo/owner"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-base font-semibold text-white hover:bg-white/10"
            >
              Schedule Demo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="bg-gray-900 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8793A] text-white">
              <Icons.Building />
            </div>
            <span className="text-lg font-semibold text-white">Kealee Owner</span>
          </div>
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Kealee Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// Main Component
export default function OwnerPortalLanding() {
  return (
    <div className="min-h-screen bg-white">
      <TopbarNav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <ServicesSection />
        <TestimonialSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

// Export individual components for flexibility
export {
  TopbarNav,
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  ServicesSection,
  TestimonialSection,
  CTASection,
  Footer,
};
