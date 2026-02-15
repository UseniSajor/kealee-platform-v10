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
} from 'lucide-react';

import {
  MarketingLayout,
  HeroSection,
  SectionLabel,
  FeatureCard,
  ProcessSteps,
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

// ── Construction Process Steps ─────────────────────────────
const constructionProcess = [
  {
    phase: 'Pre-Construction',
    icon: Search,
    color: '#1a1a2e',
    description: 'Planning, feasibility, and getting your project ready',
    services: [
      {
        name: 'Feasibility Study',
        description: 'Evaluate your property, zoning, budget, and project goals to determine what is possible.',
        price: 'From $2,500',
        icon: Search,
      },
      {
        name: 'Site Assessment',
        description: 'Complete site evaluation including surveys, soil reports, and environmental review.',
        price: 'From $1,500',
        icon: MapPin,
      },
      {
        name: 'Budget Planning',
        description: 'Detailed budget development with contingency planning and financing guidance.',
        price: 'From $750',
        icon: DollarSign,
      },
    ],
  },
  {
    phase: 'Design & Architecture',
    icon: Ruler,
    color: '#0d9488',
    description: 'Professional plans and designs for your project',
    services: [
      {
        name: 'Conceptual Design',
        description: 'Initial design concepts, floor plans, and renderings to visualize your project.',
        price: 'From $1,995',
        icon: Palette,
      },
      {
        name: 'Construction Drawings',
        description: 'Complete architectural plans, structural engineering, and MEP drawings for permitting.',
        price: 'From $4,995',
        icon: Ruler,
      },
      {
        name: 'Design Revisions',
        description: 'Refine your plans based on feedback, budget adjustments, and code requirements.',
        price: 'From $500',
        icon: FileText,
      },
    ],
  },
  {
    phase: 'Permits & Approvals',
    icon: FileCheck,
    color: '#059669',
    description: 'Navigate permits, inspections, and regulatory approvals',
    services: [
      {
        name: 'Permit Application',
        description: 'We prepare, submit, and track your permit application through the jurisdiction.',
        price: 'From $495',
        icon: FileCheck,
      },
      {
        name: 'Plan Review Support',
        description: 'Respond to plan review comments, corrections, and resubmissions until approval.',
        price: 'From $350',
        icon: ClipboardCheck,
      },
      {
        name: 'Inspection Coordination',
        description: 'Schedule and coordinate all required inspections throughout your project.',
        price: 'From $150/inspection',
        icon: Shield,
      },
    ],
  },
  {
    phase: 'Construction',
    icon: Hammer,
    color: '#d97706',
    description: 'Professional project management during construction',
    services: [
      {
        name: 'Contractor Selection',
        description: 'We find, vet, and help you select qualified contractors through our marketplace.',
        price: 'Included',
        icon: Users,
      },
      {
        name: 'Project Management',
        description: 'Dedicated PM to coordinate schedules, contractors, and keep your project on track.',
        price: 'From $1,750/mo',
        icon: Calendar,
      },
      {
        name: 'Progress Monitoring',
        description: 'Regular site documentation, progress reports, and quality verification.',
        price: 'From $250/visit',
        icon: BarChart3,
      },
    ],
  },
  {
    phase: 'Closeout & Move-In',
    icon: Home,
    color: '#7c3aed',
    description: 'Final inspections, punch list, and project completion',
    services: [
      {
        name: 'Punch List Management',
        description: 'Document and track completion of all remaining items before final handoff.',
        price: 'From $350',
        icon: ClipboardCheck,
      },
      {
        name: 'Certificate of Occupancy',
        description: 'Coordinate final inspections and obtain your certificate of occupancy.',
        price: 'From $250',
        icon: FileCheck,
      },
      {
        name: 'Warranty Documentation',
        description: 'Compile all warranties, manuals, and maintenance guides for your new space.',
        price: 'From $200',
        icon: Shield,
      },
    ],
  },
];

// ── Service Tier Packages ─────────────────────────────────
const serviceTiers = [
  {
    name: 'Design & Permit Package',
    tagline: 'Plans + Permits',
    price: 'From $5,990',
    priceNote: 'one-time',
    popular: false,
    description: 'Everything you need to go from idea to approved plans ready for construction.',
    includes: [
      'Feasibility consultation',
      'Conceptual & construction drawings',
      'Structural engineering',
      'Permit application & submission',
      'Plan review response & corrections',
      'Permit approval tracking',
    ],
    idealFor: 'Homeowners planning renovations, additions, or new builds who need plans and permits.',
    cta: { label: 'Get Started', href: 'https://marketplace.kealee.com/pricing?tab=permits' },
    color: brand.teal,
  },
  {
    name: 'Full Service Construction',
    tagline: 'Design + Permits + Build',
    price: 'From $9,500',
    priceNote: 'per project + monthly PM fee',
    popular: true,
    description: 'End-to-end project management from design through construction to move-in.',
    includes: [
      'Everything in Design & Permit',
      'Contractor sourcing & vetting',
      'Dedicated project manager',
      'Weekly progress reports with photos',
      'Budget tracking & change orders',
      'Inspection scheduling & coordination',
      'Escrow payment protection',
      'Punch list & closeout',
    ],
    idealFor: 'Homeowners who want a hands-off experience with professional management throughout.',
    cta: { label: 'Start Your Project', href: '/precon/new' },
    color: brand.orange,
  },
  {
    name: 'Permit Only',
    tagline: 'Fast-Track Permits',
    price: 'From $495',
    priceNote: 'per permit',
    popular: false,
    description: 'Already have plans? We handle the permit process from application to approval.',
    includes: [
      'Permit application preparation',
      'AI compliance pre-check',
      'Jurisdiction submission',
      'Status tracking & updates',
      'Correction response',
      'Inspection scheduling',
    ],
    idealFor: 'Homeowners or contractors who have plans ready and just need permit services.',
    cta: { label: 'Order Permits', href: 'https://marketplace.kealee.com/pricing?tab=permits' },
    color: brand.navy,
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
    icon: BarChart3,
    title: 'Real-Time Progress Tracking',
    description: 'See exactly where your project stands with photos, reports, and milestone updates in your owner dashboard.',
  },
  {
    icon: DollarSign,
    title: 'No Hidden Fees',
    description: 'All pricing is clear upfront. Service fees, contractor costs, and permit fees are all itemized before you commit.',
  },
  {
    icon: Clock,
    title: 'Faster Timelines',
    description: 'Our AI-powered permit review catches issues early. Professional coordination keeps contractors on schedule.',
  },
  {
    icon: Zap,
    title: 'One Platform, Everything Connected',
    description: 'Design, permits, contractors, payments, and communication all connected in one place instead of juggling providers.',
  },
];

// ── How It Works ─────────────────────────────────────────
const processSteps = [
  {
    number: 1,
    title: 'Tell Us About Your Project',
    description: 'Describe your project — renovation, addition, new build, or commercial. We assess feasibility and create a plan.',
  },
  {
    number: 2,
    title: 'Design & Get Permits',
    description: 'Our architects create plans. We handle permit applications, reviews, and approvals with your jurisdiction.',
  },
  {
    number: 3,
    title: 'Find Your Contractor',
    description: 'Vetted contractors bid on your project through our marketplace. Choose based on price, reviews, and fit.',
  },
  {
    number: 4,
    title: 'Build with Confidence',
    description: 'Your project manager coordinates everything. Escrow protects your payments. You approve each milestone.',
  },
];

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
        headline="From Plans to Permits to Construction — We Handle It All"
        subheadline="Kealee guides you through every step of your construction project with professional design, permitting, and project management services. No construction experience needed."
        ctas={[
          { label: 'Start Your Project', href: '/precon/new', variant: 'primary' },
          { label: 'See How It Works', href: '#how-it-works', variant: 'outline' },
        ]}
        trustItems={[
          'Escrow protected payments',
          'Licensed & vetted contractors',
          'AI-powered permit review',
        ]}
        bgPattern
      />

      {/* SECTION: THE CONSTRUCTION PROCESS */}
      <motion.section
        {...fadeInUp}
        className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: '#F7FAFC' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <SectionLabel text="YOUR CONSTRUCTION JOURNEY" color="navy" className="mb-4" />
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
            >
              Every Step Has a Service
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Construction can feel overwhelming. We break it down into clear phases, each with professional services
              to handle the work for you.
            </p>
          </div>

          {/* Process Timeline */}
          <div className="space-y-12">
            {constructionProcess.map((phase, phaseIdx) => {
              const PhaseIcon = phase.icon;
              return (
                <motion.div
                  key={phase.phase}
                  variants={staggerItem}
                  initial="initial"
                  whileInView="whileInView"
                  viewport={{ once: true }}
                  className="relative"
                >
                  {/* Phase Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                      style={{ backgroundColor: phase.color }}
                    >
                      <PhaseIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Phase {phaseIdx + 1}
                      </div>
                      <h3 className="text-xl font-bold" style={{ color: phase.color }}>
                        {phase.phase}
                      </h3>
                      <p className="text-sm text-gray-500">{phase.description}</p>
                    </div>
                  </div>

                  {/* Service Cards */}
                  <div className="grid md:grid-cols-3 gap-4 pl-0 md:pl-16">
                    {phase.services.map((service) => {
                      const SvcIcon = service.icon;
                      return (
                        <div
                          key={service.name}
                          className="bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 hover:shadow-md transition group"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${phase.color}10` }}
                            >
                              <SvcIcon className="w-5 h-5" style={{ color: phase.color }} />
                            </div>
                            <span className="text-sm font-bold" style={{ color: phase.color }}>
                              {service.price}
                            </span>
                          </div>
                          <h4 className="font-bold text-gray-900 mb-1">{service.name}</h4>
                          <p className="text-sm text-gray-600 leading-relaxed">{service.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="https://marketplace.kealee.com/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: brand.orange }}
            >
              View All Services & Pricing
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* SECTION: SERVICE TIER PACKAGES */}
      <motion.section
        {...fadeInUp}
        id="packages"
        className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel text="SERVICE PACKAGES" color="orange" className="mb-4" />
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
            >
              Choose Your Level of Service
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Whether you need just permits or full construction management, we have a package for you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {serviceTiers.map((tier) => (
              <motion.div
                key={tier.name}
                variants={staggerItem}
                initial="initial"
                whileInView="whileInView"
                viewport={{ once: true }}
                className={`relative bg-white rounded-2xl p-8 flex flex-col ${
                  tier.popular
                    ? 'border-2 shadow-2xl scale-[1.02]'
                    : 'border border-gray-200 shadow-lg'
                }`}
                style={tier.popular ? { borderColor: tier.color } : {}}
              >
                {tier.popular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold text-white flex items-center gap-1"
                    style={{ backgroundColor: tier.color }}
                  >
                    <Star className="w-3.5 h-3.5" /> Most Popular
                  </div>
                )}

                <div className="mb-4">
                  <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: tier.color }}>
                    {tier.tagline}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                </div>

                <div className="mb-4">
                  <div className="text-3xl font-black text-gray-900">{tier.price}</div>
                  <div className="text-sm text-gray-500">{tier.priceNote}</div>
                </div>

                <p className="text-sm text-gray-600 mb-6">{tier.description}</p>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {tier.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: tier.color }} />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">
                  <strong>Ideal for:</strong> {tier.idealFor}
                </div>

                <Link
                  href={tier.cta.href}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm text-white transition hover:opacity-90"
                  style={{ backgroundColor: tier.color }}
                >
                  {tier.cta.label}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            Need something custom?{' '}
            <Link href="/contact" className="font-semibold hover:underline" style={{ color: brand.orange }}>
              Talk to our team &rarr;
            </Link>
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
              We built Kealee because construction should not be stressful for homeowners.
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

      {/* SECTION: HOW IT WORKS */}
      <motion.section
        {...fadeInUp}
        id="how-it-works"
        className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel text="HOW IT WORKS" color="navy" className="mb-4" />
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
            >
              Four Steps From Idea to Move-In
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We guide you through the entire construction process so you never feel lost.
            </p>
          </div>

          <ProcessSteps steps={processSteps} accentColor="navy" />
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
            Add a dedicated Kealee project manager who coordinates your entire project —
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
              From Kitchens to Custom Homes
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: PaintBucket, title: 'Renovations', desc: 'Kitchen, bathroom, basement, whole-home remodels' },
              { icon: Building2, title: 'Additions', desc: 'Room additions, second stories, ADUs, garages' },
              { icon: Home, title: 'New Construction', desc: 'Custom homes, townhomes, duplexes' },
              { icon: Wrench, title: 'Commercial TI', desc: 'Tenant improvements, retail buildouts, offices' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-white rounded-xl p-6 text-center border border-gray-200 hover:shadow-lg transition"
                >
                  <div
                    className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: `${brand.teal}15` }}
                  >
                    <Icon className="w-7 h-7" style={{ color: brand.teal }} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
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
            Tell us about your project and we will create a plan with clear pricing.
            No commitment, no surprises.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/precon/new"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white transition hover:opacity-90 hover:scale-[1.02]"
              style={{ backgroundColor: brand.orange }}
            >
              Start Your Project
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="https://marketplace.kealee.com/pricing"
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
              Free consultation
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
