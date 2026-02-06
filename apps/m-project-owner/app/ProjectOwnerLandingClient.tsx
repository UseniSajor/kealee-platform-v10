'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ClipboardCheck,
  FileText,
  Shield,
  Calendar,
  Users,
  BarChart3,
  Palette,
  FileCheck,
  DollarSign,
  Network,
  ArrowRight,
  Check,
  Play,
} from 'lucide-react';

import {
  MarketingLayout,
  HeroSection,
  SectionLabel,
  FeatureCard,
  PricingTierCard,
  ProcessSteps,
  Badge,
  brand,
  shadows,
} from '@kealee/ui';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  initial: {},
  whileInView: {
    transition: {
      staggerChildren: 0.1,
    },
  },
  viewport: { once: true },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

// Core Features Data
const coreFeatures = [
  {
    icon: ClipboardCheck,
    title: 'Readiness Checklists',
    description: 'Know exactly what\'s needed before construction starts. Interactive checklists ensure nothing is missed.',
    accentColor: 'navy' as const,
  },
  {
    icon: FileText,
    title: 'Contract Management',
    description: 'All contracts, change orders, and amendments in one place. Digital signatures and version history included.',
    accentColor: 'navy' as const,
  },
  {
    icon: Shield,
    title: 'Escrow Protection',
    description: 'Funds are held securely and only released when you approve completed milestones. Bank-level security.',
    accentColor: 'teal' as const,
  },
  {
    icon: Calendar,
    title: 'Project Timeline',
    description: 'Visual timeline of every phase and milestone. Get notified of upcoming deadlines and delays.',
    accentColor: 'navy' as const,
  },
  {
    icon: Users,
    title: 'Team Coordination',
    description: 'Architects, contractors, and inspectors all connected. One communication hub for your entire team.',
    accentColor: 'navy' as const,
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    description: 'Real-time updates with photos and reports. See exactly where your project stands at any moment.',
    accentColor: 'teal' as const,
  },
];

// Owner Packages Data
const ownerPackages = [
  {
    name: 'Starter',
    price: 49,
    period: 'mo',
    description: 'Perfect for small renovations and single projects.',
    features: [
      '1 active project',
      'Readiness checklists',
      'Basic timeline tracking',
      'Document storage (1GB)',
      'Email support',
    ],
    cta: { label: 'Get Started', href: '/signup?plan=starter' },
    accentColor: 'navy' as const,
  },
  {
    name: 'Growth',
    price: 149,
    period: 'mo',
    description: 'For homeowners with multiple projects or phases.',
    popular: true,
    features: [
      'Up to 3 active projects',
      'Everything in Starter',
      'Contract management',
      'Milestone payments',
      'Team collaboration',
      'Priority support',
    ],
    cta: { label: 'Start Free Trial', href: '/signup?plan=growth' },
    accentColor: 'orange' as const,
  },
  {
    name: 'Professional',
    price: 299,
    period: 'mo',
    description: 'For investors and multi-property owners.',
    features: [
      'Up to 10 active projects',
      'Everything in Growth',
      'Advanced reporting',
      'Custom workflows',
      'API access',
      'Dedicated account manager',
    ],
    cta: { label: 'Get Started', href: '/signup?plan=professional' },
    accentColor: 'navy' as const,
  },
  {
    name: 'Enterprise',
    price: 999,
    period: 'mo',
    description: 'For developers and property management companies.',
    features: [
      'Unlimited projects',
      'Everything in Professional',
      'White-label options',
      'Custom integrations',
      'SLA guarantees',
      'Onboarding & training',
    ],
    cta: { label: 'Contact Sales', href: '/contact?plan=enterprise' },
    accentColor: 'navy' as const,
  },
];

// Process Steps Data
const processSteps = [
  {
    number: 1,
    title: 'Create Project',
    description: 'Tell us about your project in a few simple steps. We\'ll set up your dashboard.',
  },
  {
    number: 2,
    title: 'Complete Readiness',
    description: 'Work through our guided checklists to ensure everything is in place before construction.',
  },
  {
    number: 3,
    title: 'Approve Contracts',
    description: 'Review and digitally sign contracts with your contractors. All tracked in one place.',
  },
  {
    number: 4,
    title: 'Track Progress',
    description: 'Monitor milestones, approve payments, and stay informed every step of the way.',
  },
];

// Integration Cards Data
const integrationCards = [
  {
    icon: Palette,
    from: 'Architecture',
    to: 'Owner Portal',
    description: 'Design specs flow directly into your project dashboard.',
  },
  {
    icon: FileCheck,
    from: 'Permits',
    to: 'Owner Portal',
    description: 'Permit status and inspection results update in real-time.',
  },
  {
    icon: DollarSign,
    from: 'Escrow',
    to: 'Owner Portal',
    description: 'Secure payments linked to milestone approvals.',
  },
  {
    icon: Network,
    from: 'Network',
    to: 'Owner Portal',
    description: 'Access vetted contractors directly from your project.',
  },
];

export function ProjectOwnerLandingClient() {
  return (
    <MarketingLayout
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Project Owner Portal' },
      ]}
      activeSection="owner"
    >
      {/* SECTION 1 - HERO */}
      <HeroSection
        eyebrow="For Homeowners & Project Owners"
        eyebrowColor="navy"
        headline="Complete Project Control, Complete Confidence"
        subheadline="Full visibility over your construction project — from readiness checklists to milestone payments, everything in one place."
        ctas={[
          { label: 'Start Your Project', href: '/signup', variant: 'primary' },
          { label: 'View Demo', href: '/demo', variant: 'outline' },
        ]}
        trustItems={[
          'No setup fees',
          'From $49/mo',
          '3% platform fee',
        ]}
        bgPattern
      />

      {/* SECTION 2 - CORE FEATURES */}
      <motion.section
        {...fadeInUp}
        className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: '#F7FAFC' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel text="CORE FEATURES" color="navy" className="mb-4" />
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
            >
              Everything You Need to Stay in Control
            </h2>
            <p
              className="text-lg text-gray-600 max-w-2xl mx-auto"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            >
              You're in control. We give you visibility into every aspect of your construction project.
            </p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {coreFeatures.map((feature) => (
              <motion.div key={feature.title} variants={staggerItem}>
                <FeatureCard
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  accentColor={feature.accentColor}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* SECTION 3 - OWNER PACKAGES */}
      <motion.section
        {...fadeInUp}
        className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel text="OWNER PACKAGES" color="orange" className="mb-4" />
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
            >
              Choose the Plan That Fits Your Project
            </h2>
            <p
              className="text-lg text-gray-600 max-w-2xl mx-auto"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            >
              Start small and scale as your needs grow. All plans include our core platform features.
            </p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {ownerPackages.map((pkg) => (
              <motion.div key={pkg.name} variants={staggerItem}>
                <PricingTierCard
                  name={pkg.name}
                  price={pkg.price}
                  period={pkg.period}
                  description={pkg.description}
                  popular={pkg.popular}
                  features={pkg.features}
                  cta={pkg.cta}
                  accentColor={pkg.accentColor}
                />
              </motion.div>
            ))}
          </motion.div>

          <p
            className="text-center text-sm text-gray-500 mt-8"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            All plans include a 14-day free trial. No credit card required to start.
          </p>
        </div>
      </motion.section>

      {/* SECTION 4 - PM SERVICES (Advertised Separately) */}
      <motion.section
        {...fadeInUp}
        className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: brand.navy }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <SectionLabel text="OPTIONAL: DEDICATED PROJECT MANAGEMENT" color="white" className="mb-4" />
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4 text-white"
              style={{ fontFamily: '"Clash Display", sans-serif' }}
            >
              Want Someone to Handle Everything?
            </h2>
            <p
              className="text-lg text-gray-300 max-w-2xl mx-auto mb-8"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            >
              Kealee's PM team (os-pm) coordinates your project remotely through the platform.
              Scheduling, contractor coordination, reporting, and permit tracking — all handled for you.
            </p>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {['Scheduling', 'Contractor Coordination', 'Progress Reporting', 'Permit Tracking'].map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 justify-center text-white/90 text-sm"
                >
                  <Check className="w-4 h-4" style={{ color: brand.teal }} />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {/* Important Note */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-8"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              <span className="text-gray-300">
                <strong className="text-white">Note:</strong> Remote/platform-based coordination only. No on-site supervision.
              </span>
            </div>

            {/* Pricing Preview */}
            <div className="bg-white/10 rounded-xl p-6 mb-8">
              <p className="text-white/80 text-sm mb-2">PM Operations packages start at</p>
              <p
                className="text-3xl font-bold text-white"
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
              >
                $1,750<span className="text-lg font-normal text-white/60">/mo</span>
              </p>
            </div>

            <Link
              href="/ops#pm-operations"
              className="inline-flex items-center gap-2 text-white font-semibold hover:underline"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            >
              Learn About PM Services
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* SECTION 5 - CONNECTED TO PLATFORM */}
      <motion.section
        {...fadeInUp}
        className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel text="CONNECTED PLATFORM" color="teal" className="mb-4" />
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
            >
              Everything Flows Into Your Dashboard
            </h2>
            <p
              className="text-lg text-gray-600 max-w-2xl mx-auto"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            >
              The Owner Portal connects to every part of the Kealee platform, giving you a single source of truth.
            </p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {integrationCards.map((card) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.from}
                  variants={staggerItem}
                  className="bg-white rounded-xl p-5 text-center"
                  style={{ boxShadow: shadows.level1 }}
                >
                  <div
                    className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: `${brand.teal}15` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: brand.teal }} />
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span
                      className="font-semibold text-sm"
                      style={{ color: brand.navy, fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                    >
                      {card.from}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span
                      className="font-semibold text-sm"
                      style={{ color: brand.navy, fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                    >
                      Owner
                    </span>
                  </div>
                  <p
                    className="text-xs text-gray-500"
                    style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                  >
                    {card.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.section>

      {/* SECTION 6 - HOW IT WORKS */}
      <motion.section
        {...fadeInUp}
        className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: '#F7FAFC' }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel text="HOW IT WORKS" color="navy" className="mb-4" />
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
            >
              Four Steps to Project Control
            </h2>
          </div>

          <ProcessSteps steps={processSteps} accentColor="navy" />
        </div>
      </motion.section>

      {/* SECTION 7 - FINAL CTA */}
      <motion.section
        {...fadeInUp}
        className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="text-3xl lg:text-4xl font-bold mb-4"
            style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
          >
            Ready to Take Control?
          </h2>
          <p
            className="text-lg text-gray-600 mb-8"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            Start your free trial today. No credit card required.
            See why homeowners trust Kealee for their construction projects.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02]"
              style={{ backgroundColor: brand.orange, fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            >
              Start Your Project
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-semibold transition-all hover:bg-gray-50"
              style={{
                backgroundColor: 'transparent',
                color: brand.navy,
                border: `2px solid ${brand.navy}`,
                fontFamily: '"Plus Jakarta Sans", sans-serif',
              }}
            >
              <Play className="w-5 h-5" />
              Watch Demo
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-green-500" />
              14-day free trial
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-green-500" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-green-500" />
              Cancel anytime
            </span>
          </div>
        </div>
      </motion.section>
    </MarketingLayout>
  );
}
