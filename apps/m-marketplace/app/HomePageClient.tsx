'use client';

import { motion } from 'framer-motion';
import {
  Palette,
  FileCheck,
  Wrench,
  User,
  Users,
  Briefcase,
  Gavel,
  Search,
  SlidersHorizontal,
  RotateCw,
} from 'lucide-react';

import {
  MarketingLayout,
  HeroSection,
  SectionLabel,
  PlatformFlowDiagram,
  ModuleShowcaseCard,
  ComparisonSection,
  StatsBar,
  TestimonialCard,
  SplitCTA,
  NetworkProfileCard,
  Badge,
  brand,
  FlowNode,
  CTASection,
  Stat,
} from '@kealee/ui';

interface HomePageClientProps {
  platformFlowNodes: FlowNode[];
  mockNetworkProfiles: Array<{
    businessName: string;
    ownerName?: string;
    type: string;
    trades: string[];
    rating: number;
    reviews: number;
    location: string;
    distance?: string;
    stats?: { projects?: number; responseTime?: string; onTimeRate?: string };
    badges: string[];
    availability: 'available' | 'busy' | 'unavailable';
    ctaHref: string;
  }>;
  comparisonData: {
    leftTitle: string;
    leftItems: string[];
    rightTitle: string;
    rightItems: string[];
  };
  stats: Stat[];
  homeownerTestimonials: Array<{
    quote: string;
    name: string;
    role: string;
    rating: number;
    projectType?: string;
  }>;
  contractorTestimonials: Array<{
    quote: string;
    name: string;
    role: string;
    rating: number;
    projectType?: string;
  }>;
  splitCTASections: CTASection[];
}

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

export function HomePageClient({
  platformFlowNodes,
  mockNetworkProfiles,
  comparisonData,
  stats,
  homeownerTestimonials,
  contractorTestimonials,
  splitCTASections,
}: HomePageClientProps) {
  return (
    <MarketingLayout breadcrumbs={[{ label: 'Home' }]} activeSection="owner">
      {/* SECTION 1 - HERO */}
      <HeroSection
        eyebrow="DC-Baltimore's End-to-End Design/Build Platform"
        eyebrowColor="teal"
        headline="Design. Build. Done."
        subheadline="The connected platform that takes your construction project from architecture through permits through construction through closeout. One platform. Zero gaps."
        ctas={[
          { label: 'Start Your Project', href: '/project-owner', variant: 'primary' },
          { label: 'Find a Professional', href: '/network', variant: 'outline' },
          { label: 'List Your Business', href: '/network/list', variant: 'ghost' },
        ]}
        trustItems={[
          'Licensed & Insured',
          '20+ Years Experience',
          'DC-Baltimore Corridor',
          'Escrow Protected',
        ]}
        bgPattern
      />

      {/* SECTION 2 - END-TO-END PLATFORM FLOW */}
      <motion.section {...fadeInUp} className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-[#F7FAFC]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
            >
              One Connected Platform, Every Phase
            </h2>
            <p
              className="text-lg text-gray-600 max-w-2xl mx-auto"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            >
              Your project data flows seamlessly from design through closeout.
              No re-entering information. No data silos. No gaps.
            </p>
          </div>

          <PlatformFlowDiagram nodes={platformFlowNodes} />

          <p
            className="text-center text-sm text-gray-500 mt-8 max-w-xl mx-auto"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            Each phase automatically inherits data from the previous phase.
            Your design specs flow into permits, permits flow into construction,
            and everything is tracked through closeout.
          </p>
        </div>
      </motion.section>

      {/* SECTION 3 - KEALEE CONSTRUCTION NETWORK */}
      <motion.section {...fadeInUp} className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel text="KEALEE CONSTRUCTION NETWORK" color="teal" className="mb-4" />
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
            >
              Find the Right Partner for Every Project
            </h2>
          </div>

          {/* Three Column Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div
                className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${brand.teal}15` }}
              >
                <Users className="w-7 h-7" style={{ color: brand.teal }} />
              </div>
              <h3
                className="text-lg font-bold mb-2"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: brand.navy }}
              >
                Discover Professionals
              </h3>
              <p className="text-sm text-gray-600">
                Search verified GCs, architects, engineers, and specialty contractors in the DC-Baltimore corridor.
              </p>
            </div>
            <div className="text-center">
              <div
                className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${brand.orange}15` }}
              >
                <Briefcase className="w-7 h-7" style={{ color: brand.orange }} />
              </div>
              <h3
                className="text-lg font-bold mb-2"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: brand.navy }}
              >
                List Your Business
              </h3>
              <p className="text-sm text-gray-600">
                Create your profile, showcase your work, and get discovered by project owners and GCs.
              </p>
            </div>
            <div className="text-center">
              <div
                className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${brand.navy}15` }}
              >
                <Gavel className="w-7 h-7" style={{ color: brand.navy }} />
              </div>
              <h3
                className="text-lg font-bold mb-2"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: brand.navy }}
              >
                Bid on Projects
              </h3>
              <p className="text-sm text-gray-600">
                Access open bid invitations with fair rotation. Win projects based on merit.
              </p>
            </div>
          </div>

          {/* Network Preview */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by trade, name, or specialty..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <SlidersHorizontal className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">Filters</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge text="General Contractor" color="teal" variant="subtle" />
              <Badge text="Residential" color="gray" variant="subtle" />
              <Badge text="4+ Stars" color="gray" variant="subtle" />
              <Badge text="Available Now" color="green" variant="subtle" />
            </div>

            {/* Profile Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              {mockNetworkProfiles.map((profile) => (
                <NetworkProfileCard key={profile.businessName} {...profile} />
              ))}
            </div>
          </div>

          {/* Fair Bid Rotation Callout */}
          <div
            className="rounded-xl p-6 text-center"
            style={{ backgroundColor: `${brand.teal}10` }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <RotateCw className="w-5 h-5" style={{ color: brand.teal }} />
              <span
                className="font-semibold"
                style={{ color: brand.teal, fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                Fair Bid Rotation
              </span>
            </div>
            <p className="text-sm text-gray-600 max-w-lg mx-auto">
              Our bid rotation system ensures all qualified contractors get equal opportunity
              to bid on projects. No pay-to-play. Just quality work.
            </p>
          </div>
        </div>
      </motion.section>

      {/* SECTION 4 - FOR HOMEOWNERS & PROJECT OWNERS */}
      <motion.section {...fadeInUp} className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel text="FOR HOMEOWNERS & PROJECT OWNERS" color="navy" className="mb-4" />
            <h2
              className="text-3xl lg:text-4xl font-bold"
              style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
            >
              Build with Confidence from Day One
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <ModuleShowcaseCard
              icon={User}
              title="Project Owner Portal"
              subtitle="m-project-owner"
              description="Your command center for managing your construction project from start to finish."
              features={[
                'Readiness Checklists',
                'Milestone Tracking',
                'Contract Management',
                'Escrow Payments',
              ]}
              priceAnchor={{ amount: 49, period: 'mo', showFrom: true }}
              cta={{ label: 'Start Project', href: '/project-owner' }}
              accentColor="navy"
            />
            <ModuleShowcaseCard
              icon={Palette}
              title="Architecture & Design"
              subtitle="m-architect"
              description="Professional design services from licensed architects in the DC-Baltimore area."
              features={[
                'Construction Drawings',
                '3D Renderings',
                'Design Consultation',
                'Permit Handoff',
              ]}
              priceAnchor={{ amount: 2500, showFrom: true }}
              cta={{ label: 'Start Design', href: '/architect' }}
              accentColor="teal"
            />
            <ModuleShowcaseCard
              icon={FileCheck}
              title="Permits & Inspections"
              subtitle="m-permits"
              description="AI-powered permit review and submission for faster approvals."
              features={[
                'AI Compliance Review',
                'Auto Form Filling',
                'Status Tracking',
                'Inspection Scheduling',
              ]}
              priceAnchor={{ amount: 495, showFrom: true }}
              cta={{ label: 'Start Permit', href: '/permits' }}
              accentColor="green"
            />
          </div>
        </div>
      </motion.section>

      {/* SECTION 5 - FOR CONTRACTORS & PROFESSIONALS */}
      <motion.section
        {...fadeInUp}
        className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: '#F7FAFC' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel
              text="FOR GCs • BUILDERS • CONTRACTORS • OWNERS/RE DEVELOPERS • SPECIALTY CONTRACTORS"
              color="orange"
              className="mb-4"
            />
            <h2
              className="text-3xl lg:text-4xl font-bold"
              style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
            >
              The Complete Construction Operations Platform
            </h2>
          </div>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* Ops Services - 3 columns */}
            <div className="lg:col-span-3">
              <div
                className="bg-white rounded-xl overflow-hidden h-full"
                style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}
              >
                <div className="h-1" style={{ backgroundColor: brand.orange }} />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${brand.orange}15` }}
                    >
                      <Wrench className="w-6 h-6" style={{ color: brand.orange }} />
                    </div>
                    <div>
                      <h3
                        className="text-lg font-bold"
                        style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
                      >
                        Ops & PM Services
                      </h3>
                      <span className="text-sm text-gray-500">m-ops-services</span>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
                    {['PM Software', 'Operations (11)', 'Estimation (7)'].map((tab, i) => (
                      <button
                        key={tab}
                        className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                          i === 0
                            ? 'border-b-2 text-orange-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                        style={{ borderColor: i === 0 ? brand.orange : 'transparent' }}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    Self-service project management software with scheduling, budgeting,
                    document management, and team collaboration tools.
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Essentials</span>
                      <span className="font-mono font-semibold" style={{ color: brand.orange }}>
                        $99/mo
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Performance</span>
                      <span className="font-mono font-semibold" style={{ color: brand.orange }}>
                        $199/mo
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Scale</span>
                      <span className="font-mono font-semibold" style={{ color: brand.orange }}>
                        $349/mo
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Enterprise</span>
                      <span className="font-mono font-semibold" style={{ color: brand.orange }}>
                        Custom
                      </span>
                    </div>
                  </div>

                  {/* PM Operations Add-on */}
                  <div
                    className="mt-6 p-4 rounded-lg"
                    style={{ backgroundColor: `${brand.orange}08`, border: `1px dashed ${brand.orange}40` }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge text="Optional Add-On" color="orange" size="sm" />
                    </div>
                    <p className="text-sm font-semibold text-gray-800">
                      PM Operations (os-pm) — Remote coordination only
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Dedicated PM team for remote project coordination. From $1,750/mo.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Permits - 2 columns */}
            <div className="lg:col-span-2">
              <ModuleShowcaseCard
                icon={FileCheck}
                title="Permits for Contractors"
                subtitle="m-permits"
                description="Streamline permit applications across 3,000+ jurisdictions with AI pre-review."
                features={[
                  'Bulk Applications',
                  'Jurisdiction Database',
                  'Contractor Dashboard',
                  'Corrections Tracking',
                ]}
                priceAnchor={{ amount: 495, showFrom: true }}
                cta={{ label: 'Explore Permits', href: '/permits' }}
                accentColor="green"
                className="h-full"
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* SECTION 6 - WHY KEALEE vs POINT SOLUTIONS */}
      <motion.section {...fadeInUp} className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl lg:text-4xl font-bold"
              style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
            >
              Why One Platform Beats Point Solutions
            </h2>
          </div>

          <ComparisonSection
            leftTitle={comparisonData.leftTitle}
            leftItems={comparisonData.leftItems}
            rightTitle={comparisonData.rightTitle}
            rightItems={comparisonData.rightItems}
          />
        </div>
      </motion.section>

      {/* SECTION 7 - STATS BAR */}
      <StatsBar stats={stats} />

      {/* SECTION 8 - TESTIMONIALS */}
      <motion.section {...fadeInUp} className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Homeowners */}
          <div className="mb-12">
            <SectionLabel text="HOMEOWNERS & OWNERS" color="navy" className="mb-4" />
            <div className="grid md:grid-cols-2 gap-6">
              {homeownerTestimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.name} {...testimonial} />
              ))}
            </div>
          </div>

          {/* Contractors */}
          <div>
            <SectionLabel text="CONTRACTORS & PROFESSIONALS" color="orange" className="mb-4" />
            <div className="grid md:grid-cols-2 gap-6">
              {contractorTestimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.name} {...testimonial} />
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* SECTION 9 - FINAL CTAs */}
      <SplitCTA sections={splitCTASections} />

      {/* SECTION 10 - FOOTER (included in MarketingLayout) */}
    </MarketingLayout>
  );
}
