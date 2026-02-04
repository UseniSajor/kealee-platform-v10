// apps/m-marketplace/components/HomeClient.tsx
// Client-side interactive homepage component

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MarketingLayout,
  HeroSection,
  PlatformFlowDiagram,
  SectionLabel,
  NetworkProfileCard,
  ModuleShowcaseCard,
  ComparisonSection,
  StatsBar,
  TestimonialCard,
  SplitCTA,
  TrustBar,
  FeatureCard,
} from '@kealee/ui';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

interface HomeClientProps {
  sampleProfiles: Array<{
    businessName: string;
    ownerName?: string;
    type: string;
    trades: string[];
    rating: number;
    reviews: number;
    location: string;
    distance?: string;
    stats?: {
      projectsCompleted?: number;
      yearsExperience?: number;
      responseTime?: string;
    };
    badges?: string[];
    availability: 'available' | 'busy' | 'unavailable';
    ctaHref: string;
  }>;
  moduleCards: {
    projectOwner: {
      icon: React.ReactNode;
      title: string;
      subtitle: string;
      description: string;
      features: string[];
      priceAnchor: string;
      cta: { label: string; href: string };
      accentColor: string;
    };
    architect: {
      icon: React.ReactNode;
      title: string;
      subtitle: string;
      description: string;
      features: string[];
      priceAnchor: string;
      cta: { label: string; href: string };
      accentColor: string;
    };
    permits: {
      icon: React.ReactNode;
      title: string;
      subtitle: string;
      description: string;
      features: string[];
      priceAnchor: string;
      cta: { label: string; href: string };
      accentColor: string;
    };
  };
  stats: Array<{ value: string; label: string }>;
  homeownerTestimonials: Array<{
    quote: string;
    name: string;
    role: string;
    rating: number;
    projectType: string;
  }>;
  contractorTestimonials: Array<{
    quote: string;
    name: string;
    role: string;
    rating: number;
    projectType: string;
  }>;
  comparisonData: {
    leftTitle: string;
    leftItems: string[];
    rightTitle: string;
    rightItems: string[];
  };
  platformPhases: Array<{
    id: string;
    name: string;
    app: string;
    appLabel: string;
    color: string;
    features: string[];
    href: string;
  }>;
  splitCtaData: Array<{
    title: string;
    subtitle: string;
    cta: { label: string; href: string };
    bgVariant: 'navy' | 'orange' | 'teal' | 'white' | 'gray';
  }>;
}

export function HomeClient({
  sampleProfiles,
  moduleCards,
  stats,
  homeownerTestimonials,
  contractorTestimonials,
  comparisonData,
  platformPhases,
  splitCtaData,
}: HomeClientProps) {
  return (
    <MarketingLayout
      breadcrumbs={[{ label: 'Home', href: '/' }]}
      showSearch={true}
      searchPlaceholder="Search services, professionals, or features..."
    >
      {/* SECTION 1: HERO */}
      <section className="bg-white">
        <HeroSection
          eyebrow="DC-Baltimore's End-to-End Design/Build Platform"
          eyebrowColor="teal"
          headline="Design. Build. Done."
          subheadline="The connected platform that takes your construction project from architecture through permits through construction through closeout. One platform. Zero gaps."
          ctas={[
            { label: 'Start Your Project', variant: 'primary', href: 'https://app.kealee.com/signup' },
            { label: 'Find a Professional', variant: 'outline', href: '/network' },
            { label: 'List Your Business', variant: 'ghost', href: '/network/register' },
          ]}
          trustItems={[
            'Licensed & Insured',
            '20+ Years Experience',
            'DC-Baltimore Corridor',
            'Escrow Protected',
          ]}
        />
      </section>

      {/* SECTION 2: END-TO-END PLATFORM FLOW */}
      <motion.section
        className="py-16 md:py-24 bg-gray-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeInUp}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl font-bold text-[#1A2B4A] mb-4"
              style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
            >
              One Connected Platform, Every Phase
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Data flows seamlessly between each phase. No gaps, no handoff meetings, no lost information.
            </p>
          </div>

          <PlatformFlowDiagram phases={platformPhases} />

          <p className="text-center text-gray-500 mt-8 max-w-3xl mx-auto">
            Your project data, documents, and communications flow automatically from design through
            permitting through construction through closeout. Everyone stays in sync.
          </p>
        </div>
      </motion.section>

      {/* SECTION 3: KEALEE CONSTRUCTION NETWORK */}
      <motion.section
        className="py-16 md:py-24 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeInUp}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionLabel text="KEALEE CONSTRUCTION NETWORK" color="teal" />
          <h2
            className="text-3xl md:text-4xl font-bold text-[#1A2B4A] mb-4 mt-4"
            style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
          >
            Find the Right Partner for Every Project
          </h2>

          {/* Three columns */}
          <div className="grid md:grid-cols-3 gap-6 mt-10 mb-12">
            <FeatureCard
              icon={
                <svg className="w-6 h-6 text-[#2ABFBF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              title="Discover Professionals"
              description="Search verified GCs, specialty contractors, architects, and engineers. Filter by trade, rating, location, and availability."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6 text-[#E8793A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
              title="List Your Business"
              description="Create a free profile, showcase your work, and get discovered by project owners looking for your expertise."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6 text-[#1A2B4A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              title="Bid on Projects"
              description="Access qualified project leads with our fair rotation system. Compete on quality, not just who bids first."
            />
          </div>

          {/* Network Preview */}
          <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
            {/* Search Bar Mockup */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-grow relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by trade, name, or specialty..."
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2ABFBF] focus:border-transparent"
                />
              </div>
              <select className="px-4 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2ABFBF]">
                <option>DC-Baltimore Area</option>
                <option>Washington, DC</option>
                <option>Baltimore, MD</option>
                <option>Northern Virginia</option>
              </select>
              <button className="px-6 py-3 bg-[#2ABFBF] text-white font-semibold rounded-lg hover:bg-[#25a8a8] transition-colors">
                Search
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {['General Contractor', 'Electrical', 'Plumbing', 'HVAC', 'Roofing', 'Architect'].map((filter) => (
                <button
                  key={filter}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-[#2ABFBF] hover:text-[#2ABFBF] transition-colors"
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Sample Profile Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              {sampleProfiles.map((profile, index) => (
                <NetworkProfileCard key={index} {...profile} />
              ))}
            </div>

            {/* Fair Bid Rotation Callout */}
            <div className="mt-6 p-4 bg-[#2ABFBF]/10 border border-[#2ABFBF]/20 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-[#2ABFBF] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <p className="font-semibold text-[#1A2B4A]">Fair Bid Rotation</p>
                  <p className="text-sm text-gray-600">
                    Our rotation system ensures qualified contractors get equal opportunities to bid.
                    No pay-to-play. Compete on quality and reputation.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center mt-8">
              <Link
                href="/network"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A2B4A] text-white font-semibold rounded-lg hover:bg-[#1A2B4A]/90 transition-colors"
              >
                Browse the Network
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

      {/* SECTION 4: FOR HOMEOWNERS & PROJECT OWNERS */}
      <motion.section
        className="py-16 md:py-24 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp}>
            <SectionLabel text="FOR HOMEOWNERS & PROJECT OWNERS" color="navy" />
            <h2
              className="text-3xl md:text-4xl font-bold text-[#1A2B4A] mb-4 mt-4"
              style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
            >
              Build with Confidence from Day One
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mb-10">
              Whether you're renovating a kitchen or building your dream home, we give you the tools and
              visibility to manage your project with confidence.
            </p>
          </motion.div>

          <motion.div className="grid md:grid-cols-3 gap-6" variants={staggerContainer}>
            <motion.div variants={fadeInUp}>
              <ModuleShowcaseCard {...moduleCards.projectOwner} />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <ModuleShowcaseCard {...moduleCards.architect} />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <ModuleShowcaseCard {...moduleCards.permits} />
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* SECTION 5: FOR CONTRACTORS & PROFESSIONALS */}
      <motion.section
        className="py-16 md:py-24 bg-[#F7FAFC]"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeInUp}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionLabel text="FOR GCs • BUILDERS • CONTRACTORS • OWNERS/RE DEVELOPERS • SPECIALTY CONTRACTORS" color="orange" />
          <h2
            className="text-3xl md:text-4xl font-bold text-[#1A2B4A] mb-10 mt-4"
            style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
          >
            The Complete Construction Operations Platform
          </h2>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* Main Ops Card - 65% */}
            <div className="lg:col-span-3 bg-white rounded-xl border-t-4 border-[#E8793A] shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#E8793A]/10 rounded-lg">
                  <svg className="w-6 h-6 text-[#E8793A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-[#1A2B4A] text-xl">Ops & PM Services</h3>
                  <p className="text-sm text-gray-500">ops.kealee.com</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <div className="flex gap-6">
                  {['PM Software', 'Operations (11)', 'Estimation (7)'].map((tab, i) => (
                    <button
                      key={tab}
                      className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                        i === 0
                          ? 'border-[#E8793A] text-[#E8793A]'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* PM Software Content */}
              <div>
                <p className="text-gray-600 mb-4">
                  Self-service project management tools for construction professionals.
                  Scheduling, documentation, client updates, and more.
                </p>
                <ul className="grid grid-cols-2 gap-2 mb-6">
                  {['Scheduling & Calendar', 'Document Management', 'Client Portal', 'Budget Tracking', 'Change Orders', 'RFI Management'].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-[#38A169]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-2xl font-bold text-[#E8793A]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    From $49/mo
                  </span>
                  <span className="text-sm text-gray-500">SaaS subscription</span>
                </div>
              </div>

              {/* PM Operations Add-on Callout */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Optional Add-On</span>
                </div>
                <p className="font-semibold text-[#1A2B4A]">PM Operations (os-pm)</p>
                <p className="text-sm text-gray-600 mb-2">
                  Remote coordination only. Our PM team handles scheduling, contractor coordination,
                  reporting, and permit tracking through the platform. No site supervision.
                </p>
                <span className="text-sm font-mono text-[#E8793A]">From $500/mo</span>
              </div>

              <Link
                href="https://ops.kealee.com"
                className="mt-6 inline-flex items-center gap-2 text-[#E8793A] font-semibold hover:underline"
              >
                Browse All Services
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            {/* Permits Card - 35% */}
            <div className="lg:col-span-2 bg-white rounded-xl border-t-4 border-[#38A169] shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#38A169]/10 rounded-lg">
                  <svg className="w-6 h-6 text-[#38A169]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-[#1A2B4A] text-xl">Permits & Inspections</h3>
                  <p className="text-sm text-gray-500">permits.kealee.com</p>
                </div>
              </div>

              <p className="text-gray-600 mb-4">
                For contractors: streamline your permit workflow. AI reviews, auto-form filling,
                and real-time tracking across 3,000+ jurisdictions.
              </p>

              <ul className="space-y-2 mb-6">
                {['AI Code Compliance', 'Auto Form Generation', 'Multi-Jurisdiction Support', 'Inspection Scheduling', 'Correction Tracking'].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-[#38A169]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-2xl font-bold text-[#38A169]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  From $495
                </span>
                <span className="text-sm text-gray-500">per permit</span>
              </div>

              <Link
                href="https://permits.kealee.com"
                className="block w-full py-3 text-center bg-[#38A169] text-white font-semibold rounded-lg hover:bg-[#2f8a57] transition-colors"
              >
                Start Permit
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

      {/* SECTION 6: WHY KEALEE vs POINT SOLUTIONS */}
      <motion.section
        className="py-16 md:py-24 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeInUp}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl font-bold text-[#1A2B4A] mb-4"
              style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
            >
              Why Choose a Connected Platform?
            </h2>
          </div>
          <ComparisonSection {...comparisonData} />
        </div>
      </motion.section>

      {/* SECTION 7: STATS BAR */}
      <StatsBar stats={stats} />

      {/* SECTION 8: TESTIMONIALS */}
      <motion.section
        className="py-16 md:py-24 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Homeowner Testimonials */}
          <motion.div variants={fadeInUp} className="mb-16">
            <SectionLabel text="HOMEOWNERS & OWNERS" color="navy" />
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              {homeownerTestimonials.map((testimonial, index) => (
                <TestimonialCard key={index} {...testimonial} />
              ))}
            </div>
          </motion.div>

          {/* Contractor Testimonials */}
          <motion.div variants={fadeInUp}>
            <SectionLabel text="CONTRACTORS & PROFESSIONALS" color="orange" />
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              {contractorTestimonials.map((testimonial, index) => (
                <TestimonialCard key={index} {...testimonial} />
              ))}
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* SECTION 9: FINAL CTAs */}
      <motion.section
        className="py-16 md:py-24 bg-gray-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeInUp}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl font-bold text-[#1A2B4A] mb-4"
              style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
            >
              Ready to Get Started?
            </h2>
            <p className="text-lg text-gray-600">
              Choose your path. We'll guide you from there.
            </p>
          </div>
          <SplitCTA sections={splitCtaData} />
        </div>
      </motion.section>

      {/* Trust bar before footer */}
      <div className="bg-white py-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <TrustBar />
        </div>
      </div>
    </MarketingLayout>
  );
}
