// apps/m-architect/components/ArchitectClient.tsx
// Architect Hub Landing Page Client Component

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  MarketingLayout,
  HeroSection,
  SectionLabel,
  StatsBar,
  ProcessSteps,
  PricingTierCard,
  FAQAccordion,
} from '@kealee/ui';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface ProcessStep {
  number: number;
  title: string;
  description: string;
}

interface Integration {
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface PricingTier {
  name: string;
  price: number | string;
  period?: string;
  popular?: boolean;
  description?: string;
  features: string[];
  cta: { label: string; href: string };
}

interface FAQ {
  question: string;
  answer: string;
}

interface ArchitectClientProps {
  features: Feature[];
  processSteps: ProcessStep[];
  integrations: Integration[];
  pricingTiers: PricingTier[];
  faqs: FAQ[];
}

const stats = [
  { value: '40%', label: 'Less Admin Time' },
  { value: '3%', label: 'Platform Fee Only' },
  { value: '10,000+', label: 'Projects Managed' },
  { value: '4.9', label: 'Architect Rating' },
];

export function ArchitectClient({
  features,
  processSteps,
  integrations,
  pricingTiers,
  faqs,
}: ArchitectClientProps) {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <HeroSection
        eyebrow="For Design Professionals"
        eyebrowColor="teal"
        title="Design Projects Done Right"
        subtitle="The only design platform built for architects working in construction. Manage phases, deliverables, client reviews, and seamlessly hand off to permits—all in one place."
        primaryCTA={{ label: 'Start Design Project', href: '/projects/new' }}
        secondaryCTA={{ label: 'View Demo', href: '/demo' }}
        trustIndicators={[
          'Free for architects',
          '3% platform fee on projects',
          'Seamless permit integration',
        ]}
      />

      {/* Stats Bar */}
      <StatsBar stats={stats} />

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <SectionLabel color="teal">Platform Features</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold text-[#4A90D9] mb-4">
              Built for Professional Architects
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage design projects from pre-design through construction documents
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-50 rounded-xl p-6 hover:bg-[#2ABFBF]/5 hover:border-[#2ABFBF] border border-transparent transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-[#2ABFBF]/10 text-[#2ABFBF] flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-[#4A90D9] mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <SectionLabel>Workflow</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold text-[#4A90D9] mb-4">
              Your Complete Design Workflow
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From project setup to permit submission, streamlined
            </p>
          </motion.div>

          <ProcessSteps steps={processSteps} />
        </div>
      </section>

      {/* Platform Integrations Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <SectionLabel color="teal">Integrations</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold text-[#4A90D9] mb-4">
              Seamless Platform Integration
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Kealee Architect connects with the entire construction ecosystem
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {integrations.map((integration, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 mx-auto rounded-full bg-[#4A90D9]/10 text-[#4A90D9] flex items-center justify-center mb-4">
                  {integration.icon}
                </div>
                <h3 className="font-bold text-[#4A90D9] mb-2">{integration.name}</h3>
                <p className="text-sm text-gray-600">{integration.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-[#4A90D9]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="inline-block px-3 py-1 bg-[#2ABFBF] text-white text-sm font-medium rounded-full mb-4">
              Simple Pricing
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Free to Use, Pay When You Get Paid
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              No monthly fees. Just a 3% platform fee on project payments.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <PricingTierCard tier={tier} accentColor="teal" darkMode />
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 text-center"
          >
            <p className="text-gray-400">
              Need custom pricing for your firm? {' '}
              <Link href="/contact" className="text-[#2ABFBF] hover:text-white transition-colors">
                Contact us
              </Link>
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold text-[#4A90D9] mb-4">
              Questions from Architects
            </h2>
          </motion.div>

          <FAQAccordion items={faqs} />
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-[#2ABFBF]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Streamline Your Design Workflow?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join architects managing design projects more efficiently with Kealee.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/projects/new"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#4A90D9] font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
              >
                Start Design Project
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-white/10 transition-colors"
              >
                View Demo
              </Link>
            </div>
            <p className="text-white/70 text-sm mt-6">
              Free to start. No credit card required.
            </p>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}
