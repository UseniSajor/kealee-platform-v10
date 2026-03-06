'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPin,
  Search,
  Building2,
  TreePine,
  Shield,
  FileCheck,
  Zap,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Clock,
  DollarSign,
  Ruler,
  Home,
  Users,
  Layers,
  Scale,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const brand = {
  navy: '#1A2B4A',
  teal: '#0D9488',
  orange: '#C8882A',
  green: '#059669',
};

const features = [
  {
    icon: MapPin,
    title: 'AI Zoning Analysis',
    description: 'Enter any address and get instant zoning classification, setbacks, FAR, density limits, and allowed uses.',
    color: brand.teal,
  },
  {
    icon: Shield,
    title: 'Compliance Check',
    description: 'Check your proposed development against local zoning rules. Get a 0-100 compliance score with detailed violation report.',
    color: brand.navy,
  },
  {
    icon: TreePine,
    title: 'NEPA Exemption Checker',
    description: 'Determine if your project qualifies for NEPA categorical exclusions under the 21st Century Housing Act.',
    color: brand.green,
  },
  {
    icon: FileCheck,
    title: 'Permit Checklist Generator',
    description: 'Auto-generate jurisdiction-specific permit requirements, fees, and estimated timelines.',
    color: brand.orange,
  },
  {
    icon: BarChart3,
    title: 'Density Bonus Calculator',
    description: 'Calculate Sec 209 density bonuses based on affordable unit percentages and housing type.',
    color: brand.teal,
  },
  {
    icon: Zap,
    title: 'Instant Results',
    description: 'AI-powered analysis returns results in seconds, not days. Review zoning data for any parcel nationwide.',
    color: brand.navy,
  },
];

const housingTypes = [
  { icon: Home, label: 'Single Family', units: '1 unit' },
  { icon: Home, label: 'ADU', units: '1 unit' },
  { icon: Building2, label: 'Duplex', units: '2 units' },
  { icon: Building2, label: 'Triplex', units: '3 units' },
  { icon: Building2, label: 'Fourplex', units: '4 units' },
  { icon: Layers, label: 'Townhouse', units: '3-8 units' },
  { icon: Building2, label: 'Small Apartment', units: '5-20 units' },
  { icon: Building2, label: 'Mixed-Use', units: 'Varies' },
];

const howItWorks = [
  { step: 1, title: 'Enter Your Address', description: 'Type any property address in the US. Our AI auto-detects the jurisdiction and zoning district.' },
  { step: 2, title: 'Select Building Type', description: 'Choose your proposed housing type — ADU, duplex, fourplex, apartment, or mixed-use.' },
  { step: 3, title: 'Get Your Report', description: 'Receive a full compliance report with violations, required variances, permit checklist, fees, and timeline.' },
];

export default function ZoningLandingPage() {
  const [address, setAddress] = useState('');

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold" style={{ color: brand.navy }}>
              Kealee
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-medium" style={{ color: brand.teal }}>Zoning Accelerator</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/permits" className="text-sm text-gray-600 hover:text-gray-900">Permits</Link>
            <Link href="/zoning/analyze" className="text-sm font-semibold text-white px-4 py-2 rounded-lg" style={{ backgroundColor: brand.teal }}>
              Analyze Zoning
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        {...fadeInUp}
        className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 text-center"
        style={{ background: 'linear-gradient(135deg, #F0FDFA 0%, #F7FAFC 50%, #FEF3E2 100%)' }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6" style={{ backgroundColor: `${brand.teal}15`, color: brand.teal }}>
            <Scale className="w-4 h-4" />
            21st Century ROAD to Housing Act — Sec 203 & 209
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}>
            Know Your Zoning<br />
            <em className="italic" style={{ color: brand.teal }}>Before You Design</em>
          </h1>

          <p className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto mb-10" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            AI-powered zoning analysis, compliance checking, and permit checklists for any address in the US.
            Stop guessing — start building with confidence.
          </p>

          {/* Address Search */}
          <div className="max-w-xl mx-auto mb-8">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter a property address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <Link
                href={`/zoning/analyze${address ? `?address=${encodeURIComponent(address)}` : ''}`}
                className="px-6 py-4 rounded-xl font-semibold text-white flex items-center gap-2 hover:opacity-90 transition"
                style={{ backgroundColor: brand.teal }}
              >
                <Search className="w-5 h-5" />
                Analyze
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" style={{ color: brand.green }} /> Free address lookup
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" style={{ color: brand.green }} /> 3,000+ jurisdictions
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" style={{ color: brand.green }} /> Results in seconds
            </span>
          </div>
        </div>
      </motion.section>

      {/* Housing Types Grid */}
      <motion.section {...fadeInUp} className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold mb-3" style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}>
              Analyze Any Housing Type
            </h2>
            <p className="text-gray-600">From single-family homes to mixed-use developments</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {housingTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Link
                  key={type.label}
                  href={`/zoning/analyze?type=${encodeURIComponent(type.label.toLowerCase().replace(/\s/g, '_'))}`}
                  className="bg-white rounded-xl p-5 border-2 border-gray-100 hover:border-teal-300 hover:shadow-md transition text-center group"
                >
                  <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: `${brand.teal}10` }}>
                    <Icon className="w-6 h-6 group-hover:scale-110 transition" style={{ color: brand.teal }} />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">{type.label}</h3>
                  <p className="text-xs text-gray-500 mt-1">{type.units}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Features Grid */}
      <motion.section {...fadeInUp} className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4" style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}>
              Everything You Need to Navigate Zoning
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powered by AI and aligned with the 21st Century ROAD to Housing Act
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition">
                  <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center" style={{ backgroundColor: `${feature.color}15` }}>
                    <Icon className="w-6 h-6" style={{ color: feature.color }} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* How It Works */}
      <motion.section {...fadeInUp} className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4" style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}>
              Three Steps to Zoning Clarity
            </h2>
          </div>
          <div className="space-y-8">
            {howItWorks.map((step) => (
              <div key={step.step} className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ backgroundColor: brand.teal }}>
                  {step.step}
                </div>
                <div className="flex-1 bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Sample Report Preview */}
      <motion.section {...fadeInUp} className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}>
              What You Get in Every Report
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: MapPin, title: 'Zoning District', desc: 'R1, R2, MX, TOD classification with dimensional standards' },
              { icon: Ruler, title: 'Setbacks & FAR', desc: 'Front, side, rear setbacks plus floor area ratio limits' },
              { icon: AlertTriangle, title: 'Violations Found', desc: 'Detailed list of code violations with severity ratings' },
              { icon: CheckCircle, title: 'Compliance Score', desc: '0-100 score with pass/fail on each zoning requirement' },
              { icon: DollarSign, title: 'Permit Fees', desc: 'Estimated permit fees by type for your jurisdiction' },
              { icon: Clock, title: 'Timeline Estimate', desc: 'Expected review and approval timeline in business days' },
              { icon: Users, title: 'Density Analysis', desc: 'Allowed units, density bonus eligibility, parking requirements' },
              { icon: FileCheck, title: 'Permit Checklist', desc: 'Required permits, documents, and submission requirements' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-white rounded-xl p-5 border border-gray-200">
                  <Icon className="w-5 h-5 mb-3" style={{ color: brand.teal }} />
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        {...fadeInUp}
        className="py-20 lg:py-24 px-4 sm:px-6 lg:px-8 text-center"
        style={{ background: `linear-gradient(135deg, ${brand.navy} 0%, #1B3A6B 60%, #1F4A8A 100%)` }}
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6" style={{ fontFamily: '"Clash Display", sans-serif' }}>
            Ready to Analyze Your Site?
          </h2>
          <p className="text-lg text-white/70 mb-8 max-w-xl mx-auto">
            Get AI-powered zoning analysis, compliance reports, and permit checklists in minutes — not weeks.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/zoning/analyze"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: brand.teal }}
            >
              Start Zoning Analysis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/zoning/nepa"
              className="inline-flex items-center px-8 py-4 rounded-xl text-base font-semibold border border-white/30 text-white hover:bg-white/10 transition"
            >
              Check NEPA Exemption
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Kealee. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/permits" className="hover:text-gray-900">Permits</Link>
            <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-900">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
