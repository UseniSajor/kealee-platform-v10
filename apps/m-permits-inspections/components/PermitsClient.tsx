// apps/m-permits-inspections/components/PermitsClient.tsx
// Permits & Inspections Landing Page Client Component

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  MarketingLayout,
  HeroSection,
  SectionLabel,
  StatsBar,
  PricingTierCard,
  FAQAccordion,
} from '@kealee/ui';

interface PermitType {
  icon: React.ReactNode;
  name: string;
  description: string;
}

interface ComparisonItem {
  without: string;
  with: string;
}

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
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

interface Jurisdiction {
  name: string;
  state: string;
  permitTypes: number;
  avgApprovalDays: number;
}

interface FAQ {
  question: string;
  answer: string;
}

interface PermitsClientProps {
  permitTypes: PermitType[];
  comparison: ComparisonItem[];
  features: Feature[];
  pricingTiers: PricingTier[];
  jurisdictions: Jurisdiction[];
  faqs: FAQ[];
}

const stats = [
  { value: '85%', label: 'First-Try Approval' },
  { value: '40%', label: 'Faster Than Traditional' },
  { value: '3,000+', label: 'Jurisdictions' },
  { value: '5 min', label: 'AI Review Time' },
];

export function PermitsClient({
  permitTypes,
  comparison,
  features,
  pricingTiers,
  jurisdictions,
  faqs,
}: PermitsClientProps) {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <HeroSection
        eyebrow="TurboTax for Building Permits"
        eyebrowColor="green"
        title="Get Permits Approved, Not Rejected"
        subtitle="AI reviews your application in 5 minutes and catches common errors before submission. No more back-and-forth with permit offices. No more wasted time."
        primaryCTA={{ label: 'Start Application', href: '/permits/new' }}
        secondaryCTA={{ label: 'See How It Works', href: '#comparison' }}
        trustIndicators={[
          '85% first-try approval rate',
          '3,000+ jurisdictions supported',
          'Money-back guarantee',
        ]}
      />

      {/* Stats Bar */}
      <StatsBar stats={stats} />

      {/* Comparison Section - Without vs With Kealee */}
      <section id="comparison" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <SectionLabel>The Kealee Difference</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold text-[#4A90D9] mb-4">
              Stop Fighting the Permit Process
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See how Kealee transforms the most frustrating part of construction
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Without Kealee */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-red-50 border border-red-200 rounded-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-red-800">Without Kealee</h3>
              </div>
              <ul className="space-y-4">
                {comparison.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-red-800">{item.without}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* With Kealee */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-green-50 border border-green-200 rounded-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-green-800">With Kealee</h3>
              </div>
              <ul className="space-y-4">
                {comparison.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-800">{item.with}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <SectionLabel color="green">Platform Features</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold text-[#4A90D9] mb-4">
              Everything You Need to Get Approved
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From application to approval, we handle the complexity so you don't have to
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
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-[#38A169]/10 text-[#38A169] flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-[#4A90D9] mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Permit Types Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <SectionLabel>Permit Types</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold text-[#4A90D9] mb-4">
              All Major Permit Types Supported
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From simple repairs to major construction, we've got you covered
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {permitTypes.map((type, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-gray-50 rounded-xl p-4 text-center hover:bg-[#38A169]/5 hover:border-[#38A169] border border-transparent transition-all cursor-pointer"
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-[#4A90D9]/10 text-[#4A90D9] flex items-center justify-center mb-3">
                  {type.icon}
                </div>
                <h3 className="font-semibold text-[#4A90D9] text-sm">{type.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{type.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Jurisdiction Map Section */}
      <section className="py-20 bg-[#4A90D9] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="inline-block px-3 py-1 bg-[#38A169] text-white text-sm font-medium rounded-full mb-4">
              Coverage Area
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              3,000+ Jurisdictions in DC-Baltimore Corridor
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              We know every permit office, every form, every requirement
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {jurisdictions.map((jurisdiction, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur rounded-xl p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-white">{jurisdiction.name}</h3>
                    <p className="text-sm text-gray-400">{jurisdiction.state}</p>
                  </div>
                  <span className="px-2 py-1 bg-[#38A169] text-white text-xs rounded-full">
                    Active
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-3 pt-3 border-t border-white/10">
                  <span className="text-gray-400">{jurisdiction.permitTypes} permit types</span>
                  <span className="text-gray-400">~{jurisdiction.avgApprovalDays} day avg</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/jurisdictions"
              className="inline-flex items-center gap-2 text-[#2ABFBF] hover:text-white transition-colors font-medium"
            >
              View all jurisdictions
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <SectionLabel color="green">Pricing</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold text-[#4A90D9] mb-4">
              Simple, Project-Based Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Pay per permit application. No monthly fees. No hidden costs.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <PricingTierCard tier={tier} accentColor="green" />
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-green-800 font-medium">
                Money-back guarantee if your permit isn't approved
              </span>
            </div>
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
              Common Questions
            </h2>
          </motion.div>

          <FAQAccordion items={faqs} />
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-[#38A169]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Get Your Permit Approved?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              AI reviews your application in 5 minutes. Start now and submit today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/permits/new"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#38A169] font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
              >
                Start Application
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-white/10 transition-colors"
              >
                Talk to an Expert
              </Link>
            </div>
            <p className="text-white/70 text-sm mt-6">
              No account required to start. Free AI review included.
            </p>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}
