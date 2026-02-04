// apps/m-ops-services/components/OpsServicesClient.tsx
// Client-side interactive ops services landing page - THE LARGEST PAGE

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MarketingLayout,
  HeroSection,
  SectionLabel,
  FeatureCard,
  PricingTierCard,
  ServiceCard,
  FAQAccordion,
  TrustBar,
  MarketingBadge,
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

interface OpsServicesClientProps {
  pmSoftwareFeatures: {
    icon: React.ReactNode;
    title: string;
    description: string;
  }[];
  saasPricing: {
    name: string;
    price: number | string;
    period: string;
    popular: boolean;
    features: string[];
    cta: { label: string; href: string };
  }[];
  operationsServices: {
    name: string;
    price: number;
    description: string;
    icon: React.ReactNode;
  }[];
  estimationServices: {
    name: string;
    price: number;
    description: string;
    popular?: boolean;
    icon: React.ReactNode;
  }[];
  pmOpsPricing: {
    name: string;
    price: number | string;
    period: string;
    popular: boolean;
    features: string[];
    cta: { label: string; href: string };
  }[];
  audienceCards: {
    title: string;
    description: string;
    icon: React.ReactNode;
  }[];
  faqItems: {
    question: string;
    answer: string;
  }[];
}

export function OpsServicesClient({
  pmSoftwareFeatures,
  saasPricing,
  operationsServices,
  estimationServices,
  pmOpsPricing,
  audienceCards,
  faqItems,
}: OpsServicesClientProps) {
  return (
    <MarketingLayout
      breadcrumbs={[
        { label: 'Home', href: 'https://kealee.com' },
        { label: 'Ops & PM Services', href: '/' },
      ]}
      showSearch={false}
    >
      {/* SECTION 1: HERO */}
      <section className="bg-white">
        <HeroSection
          eyebrow="For GCs • Builders • Contractors • Owners/RE Developers • Specialty Contractors"
          eyebrowColor="orange"
          headline="The Complete Construction Operations Platform"
          subheadline="Project management software you run yourself, professional estimation services, and on-demand operations support. Don't want to manage your own projects? Add Kealee's PM team to do it for you."
          ctas={[
            { label: 'See SaaS Plans', variant: 'primary', href: '#saas-plans' },
            { label: 'Browse Services', variant: 'outline', href: '#services' },
            { label: 'Learn About PM Operations', variant: 'ghost', href: '#pm-operations' },
          ]}
          trustItems={[
            'Self-Service PM Software',
            'À La Carte Services',
            'Optional PM Team Add-On',
          ]}
        />
      </section>

      {/* SECTION 2: PM SOFTWARE (SaaS Plans) — FLAGSHIP */}
      <motion.section
        id="saas-plans"
        className="py-16 md:py-24 bg-gray-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp}>
            <SectionLabel text="PROJECT MANAGEMENT SOFTWARE — SaaS" color="orange" />
            <h2
              className="text-3xl md:text-4xl font-bold text-[#1A2B4A] mt-4 mb-4"
              style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
            >
              Run Your Projects from One Dashboard
            </h2>
          </motion.div>

          {/* Callout Box */}
          <motion.div
            variants={fadeInUp}
            className="mb-10 p-5 bg-[#E8793A]/10 border border-[#E8793A]/20 rounded-xl max-w-3xl"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#E8793A]/20 rounded-lg">
                <svg className="w-5 h-5 text-[#E8793A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-[#1A2B4A]">PM Software = YOU run your projects</p>
                <p className="text-sm text-gray-600 mt-1">
                  This is self-service software. Your team uses the tools. No Kealee PM team involved.
                  <strong> Want Kealee's team to manage for you?</strong> See PM Operations below.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12" variants={staggerContainer}>
            {pmSoftwareFeatures.map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <FeatureCard
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* SaaS Pricing */}
          <motion.div variants={fadeInUp}>
            <h3 className="text-2xl font-bold text-[#1A2B4A] mb-6 text-center">SaaS Plans</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {saasPricing.map((tier, index) => (
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
            <p className="text-center text-gray-500 text-sm">
              SaaS = self-service software. PM Operations is a separate add-on. <a href="#pm-operations" className="text-[#E8793A] underline">See below</a>.
            </p>
          </motion.div>

          {/* Dashboard Mockup Placeholder */}
          <motion.div
            variants={fadeInUp}
            className="mt-12 bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center"
          >
            <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center">
              <div className="text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="font-medium">PM Dashboard Preview</p>
                <p className="text-sm">Interactive demo coming soon</p>
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div variants={fadeInUp} className="mt-10 text-center">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#E8793A] text-white font-bold rounded-lg text-lg hover:bg-[#d16a2f] transition-colors"
            >
              Subscribe to PM Software
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* SECTION 3: OPERATIONS SERVICES */}
      <motion.section
        id="services"
        className="py-16 md:py-24 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeInUp}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionLabel text="OPERATIONS SERVICES — À LA CARTE" color="navy" />
          <h2
            className="text-3xl md:text-4xl font-bold text-[#1A2B4A] mt-4 mb-10"
            style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
          >
            Professional Operations Services
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {operationsServices.map((service, index) => (
              <ServiceCard
                key={index}
                icon={service.icon}
                name={service.name}
                price={service.price}
                description={service.description}
                ctaHref="/services/operations"
              />
            ))}
          </div>

          {/* Discount Callout */}
          <div className="p-4 bg-[#2ABFBF]/10 border border-[#2ABFBF]/20 rounded-xl text-center">
            <p className="text-[#1A2B4A] font-medium">
              <span className="text-[#2ABFBF] font-bold">Volume Discounts:</span> Order 3+ services and save 10%. Order 5+ and save 15%.
            </p>
          </div>
        </div>
      </motion.section>

      {/* SECTION 4: ESTIMATION SERVICES */}
      <motion.section
        className="py-16 md:py-24 bg-gray-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeInUp}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionLabel text="ESTIMATION SERVICES — À LA CARTE" color="teal" />
          <h2
            className="text-3xl md:text-4xl font-bold text-[#1A2B4A] mt-4 mb-10"
            style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
          >
            Professional Estimation Services
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {estimationServices.map((service, index) => (
              <div
                key={index}
                className={`bg-white rounded-xl p-6 border ${service.popular ? 'border-[#E8793A] ring-2 ring-[#E8793A]/20' : 'border-gray-200'} hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#2ABFBF]/10 rounded-lg text-[#2ABFBF]">
                      {service.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[#1A2B4A]">{service.name}</h3>
                        {service.popular && (
                          <MarketingBadge text="Popular" color="orange" size="sm" />
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    className="text-xl font-bold text-[#E8793A]"
                    style={{ fontFamily: '"JetBrains Mono", monospace' }}
                  >
                    ${service.price.toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                <Link
                  href="/services/estimation"
                  className="text-sm font-medium text-[#2ABFBF] hover:underline"
                >
                  Order Now →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* SECTION 5: PM OPERATIONS ADD-ON */}
      <motion.section
        id="pm-operations"
        className="py-16 md:py-24 bg-[#1A2B4A]"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeInUp}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <SectionLabel text="PM OPERATIONS — KEALEE'S PM TEAM MANAGES FOR YOU" color="teal" />
            <MarketingBadge text="ADD-ON" color="orange" size="sm" />
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold text-white mb-6"
            style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
          >
            Don't Want to Manage It Yourself?
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mb-12">
            Let Kealee's PM team handle project coordination for you. We work remotely through the platform — scheduling, contractor coordination, reporting, and more.
          </p>

          {/* Visual Comparison Table */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* PM Software Column */}
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="p-2 bg-[#E8793A]/20 rounded-lg">
                  <svg className="w-5 h-5 text-[#E8793A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                PM Software (SaaS)
              </h3>
              <p className="text-gray-400 text-sm mb-4">The TOOLS to manage your own projects</p>
              <ul className="space-y-3">
                {['You run the software', 'Your team does the work', 'Full platform access', 'No Kealee PM team', 'No site services'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-200">
                    <svg className="w-4 h-4 text-[#38A169]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-4 border-t border-white/10">
                <p className="text-white font-semibold">Included in SaaS plan</p>
                <p className="text-gray-400 text-sm">From $99/mo</p>
              </div>
            </div>

            {/* PM Operations Column */}
            <div className="bg-[#2ABFBF]/20 backdrop-blur rounded-xl p-6 border-2 border-[#2ABFBF]/30">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="p-2 bg-[#2ABFBF]/30 rounded-lg">
                  <svg className="w-5 h-5 text-[#2ABFBF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </span>
                PM Operations (os-pm)
              </h3>
              <p className="text-gray-300 text-sm mb-4">Kealee's TEAM manages for you</p>
              <ul className="space-y-3">
                {['Dedicated PM assigned', 'Contractor coordination', 'Remote progress reporting', 'Permit tracking & scheduling', 'Change order management', 'Document management'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-200">
                    <svg className="w-4 h-4 text-[#2ABFBF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-4 border-t border-white/10">
                <p className="text-white font-semibold">Separate monthly packages</p>
                <p className="text-[#2ABFBF] font-mono">$1,750 - $16,500/mo</p>
              </div>
            </div>
          </div>

          {/* What PM Operations Includes */}
          <div className="mb-12">
            <h3 className="text-xl font-bold text-white mb-6">What PM Operations Includes (All Remote)</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: '👥', label: 'Contractor Coordination' },
                { icon: '📊', label: 'Progress Reporting' },
                { icon: '📝', label: 'Change Order Management' },
                { icon: '🔨', label: 'Subcontractor Management' },
                { icon: '📋', label: 'Permit Tracking' },
                { icon: '📁', label: 'Document Management' },
                { icon: '✅', label: 'Punch List Tracking' },
                { icon: '🏁', label: 'Project Closeout Docs' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-gray-200 text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* What PM Operations Does NOT Include */}
          <div className="mb-12 p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              What PM Operations Does NOT Include
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                'On-site supervision',
                'Site walkthroughs/visits',
                'Physical inspections',
                'On-site contractor oversight',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-red-300">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-gray-400 text-sm mt-4">
              PM Operations is remote/platform-based only. We do not provide any on-site services.
            </p>
          </div>

          {/* PM Ops Pricing */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {pmOpsPricing.map((tier, index) => (
              <div
                key={index}
                className={`bg-white rounded-xl p-6 ${tier.popular ? 'ring-2 ring-[#2ABFBF]' : ''}`}
              >
                {tier.popular && (
                  <div className="mb-3">
                    <MarketingBadge text="Most Popular" color="teal" size="sm" />
                  </div>
                )}
                <h4 className="font-bold text-[#1A2B4A] text-lg">{tier.name}</h4>
                <div className="my-3">
                  <span
                    className="text-3xl font-bold text-[#E8793A]"
                    style={{ fontFamily: '"JetBrains Mono", monospace' }}
                  >
                    {typeof tier.price === 'number' ? `$${tier.price.toLocaleString()}` : tier.price}
                  </span>
                  {tier.period && <span className="text-gray-500 text-sm">/{tier.period}</span>}
                </div>
                <ul className="space-y-2 mb-6">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-[#38A169] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.cta.href}
                  className={`block w-full py-2.5 text-center rounded-lg font-semibold transition-colors ${
                    tier.popular
                      ? 'bg-[#2ABFBF] text-white hover:bg-[#25a8a8]'
                      : 'bg-gray-100 text-[#1A2B4A] hover:bg-gray-200'
                  }`}
                >
                  {tier.cta.label}
                </Link>
              </div>
            ))}
          </div>

          {/* Note */}
          <div className="text-center text-gray-400 text-sm">
            <p>
              Requires active SaaS plan. SaaS included with PM Ops — no double billing.
              <br />
              Remote/platform-based only — no site services.
            </p>
          </div>
        </div>
      </motion.section>

      {/* SECTION 6: WHO THIS IS FOR */}
      <motion.section
        className="py-16 md:py-20 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeInUp}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2
              className="text-3xl md:text-4xl font-bold text-[#1A2B4A] mb-4"
              style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
            >
              Built for Construction Professionals
            </h2>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory md:grid md:grid-cols-5 md:overflow-visible">
            {audienceCards.map((card, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-56 md:w-auto snap-start bg-gray-50 rounded-xl p-5 border border-gray-200"
              >
                <div className="mb-3 text-[#E8793A]">{card.icon}</div>
                <h3 className="font-bold text-[#1A2B4A] mb-1">{card.title}</h3>
                <p className="text-sm text-gray-600">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* SECTION 7: FAQ */}
      <motion.section
        className="py-16 md:py-24 bg-gray-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeInUp}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2
              className="text-3xl md:text-4xl font-bold text-[#1A2B4A] mb-4"
              style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
            >
              Frequently Asked Questions
            </h2>
          </div>
          <FAQAccordion items={faqItems} />
        </div>
      </motion.section>

      {/* SECTION 8: FINAL CTA */}
      <motion.section
        className="py-16 md:py-20 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeInUp}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2
            className="text-3xl md:text-4xl font-bold text-[#1A2B4A] mb-6"
            style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
          >
            Ready to Streamline Your Operations?
          </h2>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
            Whether you want to run your own projects with powerful tools or let our team handle the coordination — we've got you covered.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#E8793A] text-white font-bold rounded-lg text-lg hover:bg-[#d16a2f] transition-colors"
            >
              See SaaS Plans
            </Link>
            <Link
              href="#services"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#1A2B4A] text-white font-semibold rounded-lg text-lg hover:bg-[#1A2B4A]/90 transition-colors"
            >
              Browse Services
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Trust bar */}
      <div className="bg-gray-50 py-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <TrustBar />
        </div>
      </div>
    </MarketingLayout>
  );
}
