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
  ArrowRight,
  Check,
  Home,
  Ruler,
  Building2,
  Search,
  MapPin,
  Hammer,
  PaintBucket,
  Wrench,
  Star,
  Phone,
  Mail,
  ShieldCheck,
  Clock,
  Zap,
  Brain,
  MessageSquare,
  CreditCard,
  BadgeCheck,
  ArrowDown,
  Droplets,
  Layers,
  TreePine,
  Flame,
  Warehouse,
  Landmark,
  TrendingUp,
  Sun,
  Lightbulb,
  Thermometer,
} from 'lucide-react';

import {
  MarketingLayout,
  HeroSection,
  SectionLabel,
  FeatureCard,
  brand,
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

// ── Phase 1: Pre-Con / Concept Packages ─────────────────
const preConPackages = [
  {
    tier: 'Starter',
    price: '$199',
    priceNote: 'one-time',
    popular: false,
    description: 'Get started with AI-generated concepts to see what is possible on your lot and budget.',
    includes: [
      '2 AI-generated floor plan options',
      'Basic room layout & dimensions',
      'Rough cost estimate',
      'Up to 5 design revisions with AI',
      '3 final concepts to choose from',
      'Designer review meeting',
    ],
    color: brand.teal,
  },
  {
    tier: 'Standard',
    price: '$499',
    priceNote: 'one-time',
    popular: true,
    description: 'Our most popular option — detailed AI concepts with 3D renderings and material suggestions.',
    includes: [
      '3 AI-generated design concepts',
      'Detailed floor plans with 3D renderings',
      'Material & finish suggestions',
      'Detailed cost breakdown',
      'Up to 5 design revisions with AI',
      '3 final concepts to choose from',
      'Designer review meeting',
      'Site layout & elevation views',
    ],
    color: brand.orange,
  },
  {
    tier: 'Premium',
    price: '$999',
    priceNote: 'one-time',
    popular: false,
    description: 'Full concept package with 5 options, sustainability scoring, and permit-readiness assessment.',
    includes: [
      '5 AI-generated design concepts',
      'Full floor plans, 3D renders & elevations',
      'Material specifications & cost analysis',
      'Energy efficiency & sustainability scoring',
      'Up to 5 design revisions with AI',
      '3 final concepts to choose from',
      'Designer review meeting',
      'Permit-readiness pre-check',
    ],
    color: brand.navy,
  },
];

// ── Phase 2: Architecture / Design Packages ─────────────
const architectPackages = [
  {
    tier: 'Schematic Design',
    price: '$2,995',
    priceNote: 'one-time \u2022 concept fee credited',
    popular: false,
    description: 'Professional architect develops your approved concept into schematic-level drawings.',
    includes: [
      'Licensed architect assigned within 48 hours',
      'Schematic floor plans & elevations',
      'Structural concept layout',
      'Initial code compliance review',
      'Owner review & feedback session',
      'Concept phase fee fully credited',
    ],
    creditNote: 'Your Pre-Con fee ($199\u2013$999) is credited toward this package.',
    color: brand.teal,
  },
  {
    tier: 'Full Design Package',
    price: '$5,995',
    priceNote: 'one-time \u2022 concept fee credited',
    popular: true,
    description: 'Complete architectural drawings from SD through construction documents \u2014 permit-ready.',
    includes: [
      'Everything in Schematic Design',
      'Design Development (DD) drawings',
      'Construction Documents (CD)',
      'Structural engineering coordination',
      'MEP (mechanical, electrical, plumbing) layout',
      'Permit-ready drawing set',
      'Concept phase fee fully credited',
    ],
    creditNote: 'Your Pre-Con fee ($199\u2013$999) is credited toward this package.',
    color: brand.orange,
  },
  {
    tier: 'Premium Architecture',
    price: '$9,995',
    priceNote: 'one-time \u2022 concept fee credited',
    popular: false,
    description: 'Full architectural package with interior design, 3D BIM model, and construction administration.',
    includes: [
      'Everything in Full Design Package',
      'Interior design & finish selections',
      '3D BIM model for visualization',
      'Construction administration support',
      'Contractor RFI response during build',
      'Site visit coordination',
      'Concept phase fee fully credited',
    ],
    creditNote: 'Your Pre-Con fee ($199\u2013$999) is credited toward this package.',
    color: brand.navy,
  },
];

// ── Phase 3: Permit Services Packages ───────────────────
const permitPackages = [
  {
    tier: 'Single Permit',
    price: '$495',
    priceNote: 'one-time',
    popular: false,
    description: 'We handle a single permit application from submission through approval.',
    includes: [
      'Permit application preparation',
      'AI compliance pre-check',
      'Jurisdiction submission & tracking',
      'Plan review correction responses',
      'Approval notification',
    ],
    color: '#059669',
  },
  {
    tier: 'Permit Package',
    price: '$1,295',
    priceNote: 'per project',
    popular: true,
    description: 'All permits your project needs \u2014 building, mechanical, electrical, plumbing \u2014 handled together.',
    includes: [
      'All required permit applications',
      'Multi-discipline coordination',
      'AI compliance pre-check per discipline',
      'Correction responses & resubmissions',
      'Inspection scheduling coordination',
      'Status tracking dashboard',
    ],
    color: '#059669',
  },
  {
    tier: 'Full Permit + Inspection',
    price: '$2,995',
    priceNote: 'per project',
    popular: false,
    description: 'Permits, plan review, all inspections, and certificate of occupancy \u2014 end to end.',
    includes: [
      'Everything in Permit Package',
      'All inspection scheduling & coordination',
      'Inspector liaison & on-site support',
      'Correction follow-up & re-inspections',
      'Certificate of occupancy processing',
      'Final closeout documentation',
    ],
    color: '#059669',
  },
];

// ── How It Works Process Steps ──────────────────────────
const howItWorksSteps = [
  {
    number: 1,
    title: 'Tell Us About Your Project',
    description: 'Describe your vision \u2014 renovation, addition, or new build. Select your preferred style, rooms, and budget range.',
    icon: ClipboardCheck,
    phase: 'Pre-Con',
    color: brand.navy,
  },
  {
    number: 2,
    title: 'AI Designs Your Concepts',
    description: 'Our AI generates floor plans, 3D renders, and cost estimates. You get 5 rounds of revisions, then pick from 3 final options.',
    icon: Brain,
    phase: 'Pre-Con',
    color: brand.navy,
  },
  {
    number: 3,
    title: 'Meet Your Designer',
    description: 'After you approve a concept, you meet with a designer for any minor additions or cleanup before the handoff to a licensed architect.',
    icon: MessageSquare,
    phase: 'Pre-Con',
    color: brand.navy,
  },
  {
    number: 4,
    title: 'Architect Develops Your Plans',
    description: 'A licensed architect is assigned within 48 hours. They develop your approved concept into permit-ready drawings. Your concept fee is credited.',
    icon: Ruler,
    phase: 'Architecture',
    color: brand.teal,
  },
  {
    number: 5,
    title: 'Permits & Approvals',
    description: 'Once plans are complete, we handle all permit applications, plan review, corrections, and inspection coordination through approval.',
    icon: FileCheck,
    phase: 'Permits',
    color: '#059669',
  },
  {
    number: 6,
    title: 'Build with Confidence',
    description: 'Vetted contractors bid on your project. Your PM coordinates everything. Escrow protects every payment. You approve each milestone.',
    icon: Hammer,
    phase: 'Construction',
    color: brand.orange,
  },
];

// ── Why Homeowners Choose Kealee ─────────────────────────
const benefits = [
  {
    icon: ShieldCheck,
    title: 'Escrow Payment Protection',
    description: 'Your money is held in escrow and only released when you approve completed milestones. Never pay for unfinished work.',
  },
  {
    icon: Users,
    title: 'Vetted Contractors',
    description: 'Every contractor in our network is licensed, insured, and reviewed. Our marketplace ensures competitive, fair pricing.',
  },
  {
    icon: CreditCard,
    title: 'Concept Fee Credited',
    description: 'Your pre-con concept fee is fully credited when you purchase an architecture package. You never pay twice for the same work.',
  },
  {
    icon: DollarSign,
    title: 'No Hidden Fees',
    description: 'All pricing is clear upfront. Service fees, contractor costs, and permit fees are all itemized before you commit.',
  },
  {
    icon: Clock,
    title: '48-Hour Architect Assignment',
    description: 'After your concept is approved, a licensed architect is assigned within 48 hours. No waiting, no delays.',
  },
  {
    icon: Zap,
    title: 'One Platform, Everything Connected',
    description: 'Design, permits, contractors, payments, and communication all connected in one place instead of juggling providers.',
  },
];

// ── Package Card Component ──────────────────────────────
function PackageCard({ pkg, ctaHref, ctaLabel }: {
  pkg: (typeof preConPackages)[0] & { creditNote?: string };
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <motion.div
      variants={staggerItem}
      initial="initial"
      whileInView="whileInView"
      viewport={{ once: true }}
      className={`relative bg-white rounded-2xl p-8 flex flex-col ${
        pkg.popular
          ? 'border-2 shadow-2xl scale-[1.02]'
          : 'border border-gray-200 shadow-lg'
      }`}
      style={pkg.popular ? { borderColor: pkg.color } : {}}
    >
      {pkg.popular && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold text-white flex items-center gap-1"
          style={{ backgroundColor: pkg.color }}
        >
          <Star className="w-3.5 h-3.5" /> Most Popular
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900">{pkg.tier}</h3>
      </div>

      <div className="mb-4">
        <div className="text-3xl font-black text-gray-900">{pkg.price}</div>
        <div className="text-sm text-gray-500">{pkg.priceNote}</div>
      </div>

      <p className="text-sm text-gray-600 mb-6">{pkg.description}</p>

      <ul className="space-y-2.5 mb-6 flex-1">
        {pkg.includes.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: pkg.color }} />
            <span className="text-gray-700">{item}</span>
          </li>
        ))}
      </ul>

      {pkg.creditNote && (
        <div className="text-xs text-green-700 bg-green-50 rounded-lg p-3 mb-4 flex items-start gap-2">
          <BadgeCheck className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
          <span>{pkg.creditNote}</span>
        </div>
      )}

      <Link
        href={ctaHref}
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm text-white transition hover:opacity-90"
        style={{ backgroundColor: pkg.color }}
      >
        {ctaLabel}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </motion.div>
  );
}

export function ProjectOwnerLandingClient() {
  return (
    <MarketingLayout
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Homeowner & Project Owner Services' },
      ]}
      activeSection="owner"
    >
      {/* HERO SECTION */}
      <HeroSection
        eyebrow="For Homeowners & Project Owners"
        eyebrowColor="navy"
        headline="From Concept to Keys &mdash; We Handle Every Step"
        subheadline="Kealee guides you from AI-powered design concepts through professional architecture, permitting, and build. Start with a concept &mdash; your fee is credited when you move to the next phase."
        ctas={[
          { label: 'Start Your Project', href: '/owner/precon/new', variant: 'primary' },
          { label: 'See How It Works', href: '#how-it-works', variant: 'outline' },
        ]}
        trustItems={[
          'Concept fee credited to architecture phase',
          'Licensed architect assigned in 48 hours',
          'Escrow protected payments',
        ]}
        bgPattern
      />

      {/* SECTION: HOW IT WORKS — THE FULL PROCESS */}
      <motion.section
        {...fadeInUp}
        id="how-it-works"
        className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: '#F7FAFC' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <SectionLabel text="HOW IT WORKS" color="navy" className="mb-4" />
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
            >
              Six Steps From Idea to Move-In
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Every project flows through these phases. We guide you through each one
              so you never feel lost.
            </p>
          </div>

          {/* Process Steps */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 hidden lg:block" />

            <div className="space-y-8 lg:space-y-12">
              {howItWorksSteps.map((step, idx) => {
                const StepIcon = step.icon;
                const isNewPhase = idx === 0 || howItWorksSteps[idx - 1].phase !== step.phase;
                return (
                  <div key={step.number}>
                    {/* Phase Label */}
                    {isNewPhase && (
                      <div className="flex items-center gap-3 mb-4 lg:ml-20">
                        <span
                          className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full text-white"
                          style={{ backgroundColor: step.color }}
                        >
                          {step.phase}
                        </span>
                        {step.phase === 'Pre-Con' && (
                          <span className="text-xs text-gray-500">From $199</span>
                        )}
                        {step.phase === 'Architecture' && (
                          <span className="text-xs text-gray-500">From $2,995 &bull; concept fee credited</span>
                        )}
                        {step.phase === 'Permits' && (
                          <span className="text-xs text-gray-500">From $495</span>
                        )}
                        {step.phase === 'Construction' && (
                          <span className="text-xs text-gray-500">PM from $1,750/mo</span>
                        )}
                      </div>
                    )}

                    <motion.div
                      variants={staggerItem}
                      initial="initial"
                      whileInView="whileInView"
                      viewport={{ once: true }}
                      className="flex items-start gap-6"
                    >
                      {/* Step Number Circle */}
                      <div
                        className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg"
                        style={{ backgroundColor: step.color }}
                      >
                        <StepIcon className="w-7 h-7" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-bold text-gray-400">Step {step.number}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                        <p className="text-gray-600">{step.description}</p>
                      </div>
                    </motion.div>

                    {/* Arrow between phases */}
                    {idx < howItWorksSteps.length - 1 && howItWorksSteps[idx + 1].phase !== step.phase && (
                      <div className="flex justify-center lg:justify-start lg:ml-6 my-4">
                        <div className="flex items-center gap-2 text-gray-400">
                          <ArrowDown className="w-5 h-5" />
                          {step.phase === 'Pre-Con' && (
                            <span className="text-xs text-green-600 font-medium">Concept fee credited to next phase</span>
                          )}
                          {step.phase === 'Architecture' && (
                            <span className="text-xs text-green-600 font-medium">Permit services offered at completion</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.section>

      {/* SECTION: PHASE 1 — PRE-CON / CONCEPT PRICING */}
      <motion.section
        {...fadeInUp}
        id="precon-pricing"
        className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <SectionLabel text="PHASE 1 &mdash; PRE-CONSTRUCTION" color="navy" className="mb-4" />
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
            >
              Start With Concepts
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-2">
              See your project come to life before hiring an architect. AI generates floor plans,
              3D renders, and cost estimates based on your vision.
            </p>
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-4 py-2 rounded-full">
              <BadgeCheck className="w-4 h-4" />
              This fee is fully credited when you purchase an Architecture package
            </div>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {preConPackages.map((pkg) => (
              <PackageCard key={pkg.tier} pkg={pkg} ctaHref="/owner/precon/new" ctaLabel="Start Concept" />
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              5 AI revision rounds &bull; 3 final options to choose from &bull; Designer meeting included
            </p>
          </div>
        </div>
      </motion.section>

      {/* CREDIT BRIDGE */}
      <div className="py-6 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 flex items-center gap-6">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-green-900 text-lg">Your Concept Fee Is Credited</h3>
              <p className="text-green-700 text-sm mt-1">
                When you purchase an Architecture package, your Pre-Con concept fee ($199&ndash;$999)
                is applied as a credit. You never pay twice for the same project.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: PHASE 2 — ARCHITECTURE / DESIGN PRICING */}
      <motion.section
        {...fadeInUp}
        id="architecture-pricing"
        className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: '#F7FAFC' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel text="PHASE 2 &mdash; ARCHITECTURE &amp; DESIGN" color="teal" className="mb-4" />
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
            >
              Professional Architect, Permit-Ready Plans
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              A licensed architect is assigned within 48 hours of your concept approval.
              They develop your design into full construction documents.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {architectPackages.map((pkg) => (
              <PackageCard
                key={pkg.tier}
                pkg={pkg}
                ctaHref="/owner/precon/new"
                ctaLabel="Get Started"
              />
            ))}
          </div>
        </div>
      </motion.section>

      {/* SECTION: PHASE 3 — PERMIT SERVICES (offered after arch completes) */}
      <motion.section
        {...fadeInUp}
        id="permit-pricing"
        className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel text="PHASE 3 &mdash; PERMITS &amp; APPROVALS" color="orange" className="mb-4" />
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
            >
              We Handle Permits So You Don&apos;t Have To
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              After your architecture phase is complete, we offer permit services as a seamless
              handoff. From application to approval, we manage the entire process.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {permitPackages.map((pkg) => (
              <PackageCard
                key={pkg.tier}
                pkg={pkg}
                ctaHref="https://marketplace.kealee.com/pricing?tab=permits"
                ctaLabel="Learn More"
              />
            ))}
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            Already have plans? You can purchase permit services directly without a concept or architecture package.
          </p>
        </div>
      </motion.section>

      {/* SECTION: WHY HOMEOWNERS CHOOSE KEALEE */}
      <motion.section
        {...fadeInUp}
        className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: '#F7FAFC' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel text="WHY KEALEE" color="teal" className="mb-4" />
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
            >
              Built to Protect Homeowners
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We built Kealee because building should not be stressful for homeowners.
              Here is how we make it better.
            </p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {benefits.map((benefit) => (
              <motion.div key={benefit.title} variants={staggerItem}>
                <FeatureCard
                  icon={benefit.icon}
                  title={benefit.title}
                  description={benefit.description}
                  accentColor="teal"
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* SECTION: DEDICATED PM OPTION */}
      <motion.section
        {...fadeInUp}
        className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: brand.navy }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <SectionLabel text="OPTIONAL: DEDICATED PROJECT MANAGER" color="white" className="mb-4" />
          <h2
            className="text-3xl lg:text-4xl font-bold mb-4 text-white"
            style={{ fontFamily: '"Clash Display", sans-serif' }}
          >
            Want Someone to Handle Everything?
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
            Add a dedicated Kealee project manager who coordinates your entire project &mdash;
            scheduling, contractor management, weekly reporting, and permit tracking.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {['Scheduling', 'Contractor Coordination', 'Progress Reporting', 'Permit Tracking'].map((feature) => (
              <div key={feature} className="flex items-center gap-2 justify-center text-white/90 text-sm">
                <Check className="w-4 h-4" style={{ color: brand.teal }} />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="bg-white/10 rounded-xl p-6 mb-8 inline-block">
            <p className="text-white/80 text-sm mb-2">PM packages start at</p>
            <p className="text-3xl font-bold text-white">
              $1,750<span className="text-lg font-normal text-white/60">/mo</span>
            </p>
          </div>

          <div className="block">
            <Link
              href="https://marketplace.kealee.com/pricing?tab=pm-services"
              className="inline-flex items-center gap-2 text-white font-semibold hover:underline"
            >
              View PM Service Packages
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* SECTION: PROJECT TYPES WE SERVE */}
      <motion.section
        {...fadeInUp}
        className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: '#F7FAFC' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel text="PROJECTS WE SERVE" color="teal" className="mb-4" />
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
            >
              From Kitchens to Custom Homes &mdash; and Everything In Between
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Whatever you are building, we have the professional services, technology, and contractor network to deliver it on time and on budget.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: PaintBucket, title: 'Kitchen Remodels', desc: 'Full kitchen renovations — cabinets, countertops, appliances, and layout changes' },
              { icon: Droplets, title: 'Bathroom Renovations', desc: 'Complete bath remodels with tile, fixtures, vanities, and plumbing upgrades' },
              { icon: Layers, title: 'Basement Finishing', desc: 'Transform unfinished basements into living rooms, bedrooms, or home offices' },
              { icon: Home, title: 'Whole-Home Remodels', desc: 'Complete home transformations — structural changes, finishes, and systems' },
              { icon: Building2, title: 'Room Additions', desc: 'Expand your footprint with new rooms, sunrooms, or bump-out extensions' },
              { icon: TrendingUp, title: 'Second Story Additions', desc: 'Add a full second level to maximize lot value and living space' },
              { icon: Landmark, title: 'ADU / In-Law Suites', desc: 'Accessory dwelling units, granny flats, guest houses, and detached studios' },
              { icon: Warehouse, title: 'Garage Conversions', desc: 'Convert attached or detached garages into living space, studios, or apartments' },
              { icon: Hammer, title: 'Custom Home Builds', desc: 'New construction single-family homes designed and built to your specifications' },
              { icon: Building2, title: 'Townhomes & Duplexes', desc: 'Multi-unit residential new construction for investment or owner-occupied' },
              { icon: TreePine, title: 'Decks & Outdoor Living', desc: 'Decks, patios, pergolas, outdoor kitchens, and hardscaping projects' },
              { icon: Flame, title: 'Roofing & Siding', desc: 'Roof replacement, siding installation, windows, and exterior envelope work' },
              { icon: Lightbulb, title: 'Electrical Upgrades', desc: 'Panel upgrades, rewiring, EV charger installation, and smart home systems' },
              { icon: Thermometer, title: 'HVAC & Plumbing', desc: 'New systems, replacements, ductwork, water heaters, and radiant heating' },
              { icon: Sun, title: 'Energy & Solar', desc: 'Solar panel installation, insulation upgrades, and energy efficiency retrofits' },
              { icon: Wrench, title: 'Commercial TI', desc: 'Tenant improvements, retail buildouts, office renovations, and restaurant fit-outs' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition"
                >
                  <div
                    className="w-12 h-12 rounded-xl mb-3 flex items-center justify-center"
                    style={{ backgroundColor: `${brand.teal}15` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: brand.teal }} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 text-sm">{item.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* SECTION: FINAL CTA */}
      <motion.section
        {...fadeInUp}
        className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="text-3xl lg:text-4xl font-bold mb-4"
            style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
          >
            Ready to Start Your Project?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Start with a concept for as little as $199. Your fee is credited when you move to
            the architecture phase. No commitment, no surprises.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/owner/precon/new"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white transition hover:opacity-90 hover:scale-[1.02]"
              style={{ backgroundColor: brand.orange }}
            >
              Start Your Project
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#precon-pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold transition hover:bg-gray-50"
              style={{
                backgroundColor: 'transparent',
                color: brand.navy,
                border: `2px solid ${brand.navy}`,
              }}
            >
              View Pricing
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-green-500" />
              Concept fee credited to architecture
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-green-500" />
              Clear pricing upfront
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-green-500" />
              Escrow protected payments
            </span>
          </div>

          {/* Contact Info */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-600">
            <a href="tel:+13015758777" className="flex items-center gap-2 hover:text-gray-900 transition">
              <Phone className="w-4 h-4" />
              (301) 575-8777
            </a>
            <a href="mailto:getstarted@kealee.com" className="flex items-center gap-2 hover:text-gray-900 transition">
              <Mail className="w-4 h-4" />
              getstarted@kealee.com
            </a>
          </div>
        </div>
      </motion.section>
    </MarketingLayout>
  );
}
