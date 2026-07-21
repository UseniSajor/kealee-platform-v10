'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPin,
  Ruler,
  Brain,
  DollarSign,
  FileCheck,
  Shield,
  ArrowRight,
  Check,
  Zap,
  Clock,
  BarChart3,
  Layers,
  Building2,
  Download,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { brand } from '@kealee/ui';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const packageSteps = [
  {
    number: 1,
    title: 'Zoning Analysis',
    description: 'AI parses your parcel zoning — district classification, setbacks, FAR, height limits, allowed uses, parking requirements, and density bonuses.',
    icon: MapPin,
    color: brand.navy,
  },
  {
    number: 2,
    title: 'Compliance Check',
    description: 'Your proposed building is checked against zoning limits. Violations, variances needed, and a compliance score (0–100) are generated instantly.',
    icon: Shield,
    color: brand.teal,
  },
  {
    number: 3,
    title: 'NEPA Assessment',
    description: 'Infill and small-scale projects may qualify for categorical exclusion under the 21st Century Housing Act. We check automatically.',
    icon: FileCheck,
    color: '#059669',
  },
  {
    number: 4,
    title: 'Pattern Book Match',
    description: 'Pre-approved housing designs from our pattern book are matched to your lot — or AI generates custom concepts tailored to your zoning.',
    icon: Building2,
    color: brand.orange,
  },
  {
    number: 5,
    title: 'Cost Estimate',
    description: 'Assembly-level cost breakdown with regional pricing adjustments for all 50 states. See materials, labor, and soft costs itemized.',
    icon: DollarSign,
    color: brand.navy,
  },
  {
    number: 6,
    title: 'Pro Forma',
    description: 'Investment analysis with NOI, cap rate, cash-on-cash return, DSCR, and break-even occupancy. Sized to your financing scenario.',
    icon: BarChart3,
    color: brand.teal,
  },
  {
    number: 7,
    title: 'Permit Checklist',
    description: 'Jurisdiction-specific permit requirements, estimated fees, required documents, and timeline — generated from our 500+ jurisdiction database.',
    icon: Layers,
    color: '#059669',
  },
  {
    number: 8,
    title: 'Compiled Package',
    description: 'Everything compiled into a single downloadable package — ready to share with lenders, investors, partners, or your municipality.',
    icon: Download,
    color: brand.orange,
  },
];

const useCases = [
  {
    title: 'Homeowners',
    desc: 'Explore what you can build on your lot before hiring an architect. Get cost estimates and zoning analysis in minutes.',
    color: brand.navy,
  },
  {
    title: 'Real Estate Investors',
    desc: 'Run feasibility on multifamily deals instantly. Pro forma, zoning, and cost estimates to screen opportunities fast.',
    color: brand.teal,
  },
  {
    title: 'Developers',
    desc: 'Generate lender-ready packages for workforce housing projects. Check Innovation Fund, HOME, and CDBG eligibility.',
    color: brand.orange,
  },
  {
    title: 'Municipalities',
    desc: 'Pre-screen housing proposals for zoning compliance, density bonuses, and grant eligibility before formal submission.',
    color: '#059669',
  },
];

export default function DevelopmentPackageLandingPage() {
  return (
    <>
      <Header />
      <main className="pt-16">
        {/* Hero */}
        <motion.section
          {...fadeInUp}
          className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 text-center"
          style={{ background: `linear-gradient(135deg, ${brand.navy} 0%, #1B3A6B 60%, #1F4A8A 100%)` }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6 bg-white/10 text-white/90">
              <Zap className="w-4 h-4" />
              AI-Powered &middot; 8 Analyses in One Click
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white"
              style={{ fontFamily: '"Clash Display", sans-serif' }}
            >
              AI Development<br />
              <em className="italic" style={{ color: brand.teal }}>Package Generator</em>
            </h1>

            <p className="text-lg lg:text-xl text-white/70 max-w-2xl mx-auto mb-10">
              Enter an address and building type. Get zoning analysis, compliance check, concept plans,
              cost estimate, pro forma, and permit checklist — all generated in minutes.
            </p>

            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/owner/development-package/new"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: brand.teal }}
              >
                Generate Your Package <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center px-8 py-4 rounded-xl text-base font-semibold border border-white/30 text-white hover:bg-white/10 transition"
              >
                See How It Works
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-white/60">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-teal-400" /> No account needed for preview
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-400" /> Results in under 5 minutes
              </span>
              <span className="flex items-center gap-1.5">
                <Download className="w-4 h-4 text-teal-400" /> Download as PDF
              </span>
            </div>
          </div>
        </motion.section>

        {/* What You Get */}
        <motion.section
          {...fadeInUp}
          id="how-it-works"
          className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2
                className="text-3xl lg:text-4xl font-bold mb-4"
                style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
              >
                8 Analyses, One Package
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Every development package runs through 8 automated steps — from zoning parsing
                to a compiled PDF you can hand to a lender.
              </p>
            </div>

            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 hidden lg:block" />
              <div className="space-y-6">
                {packageSteps.map((step) => {
                  const StepIcon = step.icon;
                  return (
                    <motion.div
                      key={step.number}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: step.number * 0.05 }}
                      className="flex items-start gap-6"
                    >
                      <div
                        className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg"
                        style={{ backgroundColor: step.color }}
                      >
                        <StepIcon className="w-7 h-7" />
                      </div>
                      <div className="flex-1 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-bold text-gray-400">Step {step.number}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                        <p className="text-gray-600">{step.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Who It's For */}
        <motion.section
          {...fadeInUp}
          className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8"
          style={{ backgroundColor: '#F7FAFC' }}
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2
                className="text-3xl lg:text-4xl font-bold mb-4"
                style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
              >
                Built For Every Stage of Development
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {useCases.map((uc) => (
                <div key={uc.title} className="bg-white rounded-xl p-6 border border-gray-200">
                  <div
                    className="w-3 h-3 rounded-full mb-4"
                    style={{ backgroundColor: uc.color }}
                  />
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{uc.title}</h3>
                  <p className="text-sm text-gray-600">{uc.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Sample Output Preview */}
        <motion.section {...fadeInUp} className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2
                className="text-3xl font-bold mb-4"
                style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
              >
                Sample Package Output
              </h2>
              <p className="text-gray-600">Here is what a generated package looks like</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
              <div className="p-6 border-b border-gray-100" style={{ backgroundColor: `${brand.navy}05` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">1234 Main Street, Denver, CO</h3>
                    <p className="text-sm text-gray-500">Fourplex &middot; 4,800 SF &middot; R-3 Multi-Family</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#059669' }}>
                    Score: 87/100
                  </span>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 divide-x divide-gray-100">
                {[
                  { label: 'Zoning', value: 'R-3', sub: 'Multi-Family Residential' },
                  { label: 'Est. Cost', value: '$842K', sub: '$175/SF all-in' },
                  { label: 'NOI', value: '$68,400', sub: '7.2% Cap Rate' },
                  { label: 'Permits', value: '4 Required', sub: 'Est. 8-12 weeks' },
                ].map((stat) => (
                  <div key={stat.label} className="p-5 text-center">
                    <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section
          {...fadeInUp}
          className="py-20 lg:py-24 px-4 sm:px-6 lg:px-8 text-center"
          style={{ background: `linear-gradient(135deg, ${brand.navy} 0%, #1B3A6B 60%, #1F4A8A 100%)` }}
        >
          <div className="max-w-3xl mx-auto">
            <Brain className="w-12 h-12 text-teal-400 mx-auto mb-6" />
            <h2
              className="text-3xl lg:text-4xl font-bold text-white mb-6"
              style={{ fontFamily: '"Clash Display", sans-serif' }}
            >
              Generate Your Development Package
            </h2>
            <p className="text-lg text-white/70 mb-8 max-w-xl mx-auto">
              Enter an address, select a building type, and get a complete feasibility package
              in under 5 minutes. No obligation, no account required for preview.
            </p>
            <Link
              href="/owner/development-package/new"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: brand.teal }}
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.section>
      </main>
      <Footer />
    </>
  );
}
