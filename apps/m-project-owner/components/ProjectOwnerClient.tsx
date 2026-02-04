// apps/m-project-owner/components/ProjectOwnerClient.tsx
// Client-side interactive project owner landing page

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MarketingLayout,
  HeroSection,
  SectionLabel,
  FeatureCard,
  PricingTierCard,
  ProcessSteps,
  SplitCTA,
  TrustBar,
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

interface ProjectOwnerClientProps {
  coreFeatures: {
    icon: React.ReactNode;
    title: string;
    description: string;
  }[];
  pricingTiers: {
    name: string;
    price: number;
    period: string;
    popular: boolean;
    features: string[];
    cta: { label: string; href: string };
  }[];
  processSteps: {
    number: number;
    title: string;
    description: string;
  }[];
  integrations: {
    from: string;
    to: string;
    description: string;
  }[];
}

export function ProjectOwnerClient({
  coreFeatures,
  pricingTiers,
  processSteps,
  integrations,
}: ProjectOwnerClientProps) {
  return (
    <MarketingLayout
      breadcrumbs={[
        { label: 'Home', href: 'https://kealee.com' },
        { label: 'Project Owner Portal', href: '/' },
      ]}
      showSearch={false}
    >
      {/* SECTION 1: HERO */}
      <section className="bg-white">
        <HeroSection
          eyebrow="For Homeowners & Project Owners"
          eyebrowColor="navy"
          headline="Complete Project Control, Complete Confidence"
          subheadline="Full visibility over your construction project — from readiness checklists to milestone payments, everything in one place."
          ctas={[
            { label: 'Start Your Project', variant: 'primary', href: '/signup' },
            { label: 'View Demo', variant: 'outline', href: '/demo' },
          ]}
          trustItems={[
            'No setup fees',
            'From $49/mo',
            '3% platform fee',
          ]}
        />
      </section>

      {/* SECTION 2: CORE FEATURES */}
      <motion.section
        className="py-16 md:py-24 bg-gray-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl font-bold text-[#4A90D9] mb-4"
              style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
            >
              Everything You Need to Manage Your Project
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              You're in control. We give you the visibility and tools to manage your construction project with confidence.
            </p>
          </motion.div>

          <motion.div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" variants={staggerContainer}>
            {coreFeatures.map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <FeatureCard
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* SECTION 3: OWNER PACKAGES */}
      <motion.section
        className="py-16 md:py-24 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeInUp}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <SectionLabel text="OWNER PACKAGES" color="navy" />
            <h2
              className="text-3xl md:text-4xl font-bold text-[#4A90D9] mt-4 mb-4"
              style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
            >
              Simple, Clear Pricing
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the plan that fits your project needs. Upgrade or downgrade anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingTiers.map((tier, index) => (
              <PricingTierCard
                key={index}
                name={tier.name}
                price={tier.price}
                period={tier.period}
                popular={tier.popular}
                features={tier.features}
                cta={tier.cta}
              />
            ))}
          </div>
        </div>
      </motion.section>

      {/* SECTION 4: PM SERVICES */}
      <motion.section
        className="py-16 md:py-24 bg-[#4A90D9]"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeInUp}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SectionLabel text="OPTIONAL: DEDICATED PROJECT MANAGEMENT" color="teal" />
          <h2
            className="text-3xl md:text-4xl font-bold text-white mt-4 mb-6"
            style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
          >
            Want Someone to Handle Everything?
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-8">
            Kealee's PM team (os-pm) coordinates remotely through the platform. Scheduling, contractor coordination,
            reporting, and permit tracking — all handled for you.
          </p>

          <div className="bg-white/10 backdrop-blur rounded-xl p-6 md:p-8 max-w-2xl mx-auto mb-8">
            <div className="flex items-start gap-4 text-left">
              <div className="p-2 bg-[#E8793A]/20 rounded-lg">
                <svg className="w-6 h-6 text-[#E8793A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold mb-1">Remote Coordination Only</p>
                <p className="text-gray-300 text-sm">
                  Our PM services are platform-based and remote. We coordinate scheduling, handle communications,
                  track permits, and generate reports. We do NOT provide on-site supervision or physical presence.
                </p>
              </div>
            </div>
          </div>

          <Link
            href="https://pm.kealee.com"
            className="inline-flex items-center gap-2 text-[#2ABFBF] font-semibold text-lg hover:underline"
          >
            Learn About PM Services
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </motion.section>

      {/* SECTION 5: CONNECTED TO PLATFORM */}
      <motion.section
        className="py-16 md:py-24 bg-gray-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <SectionLabel text="PLATFORM INTEGRATIONS" color="teal" />
            <h2
              className="text-3xl md:text-4xl font-bold text-[#4A90D9] mt-4 mb-4"
              style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
            >
              Connected to the Entire Platform
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your project portal connects seamlessly with every other Kealee service.
            </p>
          </motion.div>

          <motion.div className="grid md:grid-cols-2 gap-4" variants={staggerContainer}>
            {integrations.map((integration, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-[#2ABFBF]/10 text-[#2ABFBF] rounded-full text-sm font-medium">
                    {integration.from}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span className="px-3 py-1 bg-[#4A90D9]/10 text-[#4A90D9] rounded-full text-sm font-medium">
                    {integration.to}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">{integration.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* SECTION 6: HOW IT WORKS */}
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
            <SectionLabel text="HOW IT WORKS" color="orange" />
            <h2
              className="text-3xl md:text-4xl font-bold text-[#4A90D9] mt-4 mb-4"
              style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
            >
              Get Started in Four Simple Steps
            </h2>
          </div>

          <ProcessSteps steps={processSteps} />
        </div>
      </motion.section>

      {/* SECTION 7: CTA */}
      <motion.section
        className="py-16 md:py-24 bg-gray-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeInUp}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2
            className="text-3xl md:text-4xl font-bold text-[#4A90D9] mb-6"
            style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
          >
            Ready to Take Control?
          </h2>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
            Start your project today. No credit card required. Get your dashboard set up in minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#E8793A] text-white font-bold rounded-lg text-lg hover:bg-[#d16a2f] transition-colors shadow-lg"
            >
              Start Your Project
              <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#4A90D9] font-semibold rounded-lg text-lg border-2 border-[#4A90D9] hover:bg-[#4A90D9] hover:text-white transition-colors"
            >
              Watch Demo
            </Link>
          </div>
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
