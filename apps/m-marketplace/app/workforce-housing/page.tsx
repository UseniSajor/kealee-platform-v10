'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Home,
  Building2,
  DollarSign,
  Users,
  Search,
  ArrowRight,
  CheckCircle,
  FileCheck,
  Scale,
  Landmark,
  Shield,
  MapPin,
  Filter,
  Star,
  ChevronRight,
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

const grantPrograms = [
  {
    name: 'Housing Innovation Fund',
    section: 'Sec 209',
    amount: 'Up to $500K/project',
    description: '$200M annual fund for missing-middle housing. Pattern book designs get bonus points.',
    eligible: ['ADU', 'Duplex', 'Triplex', 'Fourplex', 'Townhouse', 'Modular'],
    color: brand.teal,
  },
  {
    name: 'HOME Program',
    section: 'HOME Modernization',
    amount: 'Varies by jurisdiction',
    description: 'Federal workforce housing subsidies for projects serving households at 80% AMI or below.',
    eligible: ['All residential types', '20%+ affordable units required'],
    color: brand.navy,
  },
  {
    name: 'CDBG New Construction',
    section: 'CDBG Expansion',
    amount: 'Varies by entitlement',
    description: 'New construction now eligible under CDBG. Must benefit 51%+ low-moderate income households.',
    eligible: ['All housing types', 'LMI benefit required'],
    color: brand.orange,
  },
  {
    name: 'LIHTC Credits',
    section: '4% & 9% Credits',
    amount: '$10B+ annual',
    description: 'Tax credits for affordable rental housing. 9% competitive, 4% with bonds.',
    eligible: ['5+ unit multifamily', 'Income restrictions apply'],
    color: '#059669',
  },
];

const financingPrograms = [
  { name: 'FHA 203(b)', units: '1-4', ltv: '96.5%', term: '30 yr', desc: 'Standard FHA mortgage' },
  { name: 'FHA 221(d)(4)', units: '5+', ltv: '85%', term: '40 yr', desc: 'New construction multifamily' },
  { name: 'FHA 223(f)', units: '5+', ltv: '85%', term: '35 yr', desc: 'Refinance / acquisition' },
  { name: 'Fannie/Freddie', units: '5+', ltv: '75%', term: '5-30 yr', desc: 'Agency multifamily lending' },
  { name: 'USDA Rural', units: 'All', ltv: '100%', term: '30-40 yr', desc: 'Rural area housing' },
];

const amiFilters = [
  { label: '30% AMI', desc: 'Extremely Low Income' },
  { label: '50% AMI', desc: 'Very Low Income' },
  { label: '60% AMI', desc: 'LIHTC Threshold' },
  { label: '80% AMI', desc: 'Low Income (HOME)' },
  { label: '120% AMI', desc: 'Workforce Housing' },
];

export default function WorkforceHousingPage() {
  const [selectedAMI, setSelectedAMI] = useState('80% AMI');

  return (
    <>
      <Header />
      <main className="pt-16">
        {/* Hero */}
        <motion.section
          {...fadeInUp}
          className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 text-center"
          style={{ background: 'linear-gradient(135deg, #F0FDFA 0%, #F7FAFC 50%, #EDE9FE 100%)' }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6" style={{ backgroundColor: `${brand.navy}15`, color: brand.navy }}>
              <Scale className="w-4 h-4" />
              HOME Program · CDBG · Innovation Fund · LIHTC
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}>
              Workforce Housing<br />
              <em className="italic" style={{ color: brand.teal }}>Financing & Grants</em>
            </h1>

            <p className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto mb-10" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              Find grants, financing programs, and tax credits for affordable and workforce housing.
              Check eligibility for FHA, HOME, CDBG, Innovation Fund, and LIHTC programs.
            </p>

            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/finance/hud/eligibility"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: brand.teal }}
              >
                Check Eligibility <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#grants"
                className="inline-flex items-center px-8 py-4 rounded-xl text-base font-semibold border-2 transition hover:bg-gray-50"
                style={{ color: brand.navy, borderColor: brand.navy }}
              >
                Browse Grants
              </Link>
            </div>
          </div>
        </motion.section>

        {/* AMI Income Filters */}
        <motion.section {...fadeInUp} className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}>
                Filter by Income Target
              </h2>
              <p className="text-gray-600">Programs vary by Area Median Income (AMI) threshold</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {amiFilters.map(f => (
                <button
                  key={f.label}
                  onClick={() => setSelectedAMI(f.label)}
                  className={`px-5 py-3 rounded-xl border-2 text-sm font-medium transition ${
                    selectedAMI === f.label
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-200 text-gray-600 hover:border-teal-300'
                  }`}
                >
                  <div className="font-bold">{f.label}</div>
                  <div className="text-xs text-gray-500">{f.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Grant Programs */}
        <motion.section id="grants" {...fadeInUp} className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#F7FAFC' }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4" style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}>
                Available Grant Programs
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Federal programs aligned with the 21st Century Housing Act
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {grantPrograms.map(grant => (
                <div key={grant.name} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{grant.name}</h3>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block" style={{ backgroundColor: `${grant.color}15`, color: grant.color }}>
                        {grant.section}
                      </span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: grant.color }}>{grant.amount}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{grant.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {grant.eligible.map(e => (
                      <span key={e} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{e}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Financing Directory */}
        <motion.section {...fadeInUp} className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}>
                Financing Programs
              </h2>
              <p className="text-gray-600">Federal loan programs for multifamily and workforce housing</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-5 font-medium text-gray-500">Program</th>
                    <th className="text-left py-3 px-5 font-medium text-gray-500">Units</th>
                    <th className="text-left py-3 px-5 font-medium text-gray-500">Max LTV</th>
                    <th className="text-left py-3 px-5 font-medium text-gray-500">Term</th>
                    <th className="text-left py-3 px-5 font-medium text-gray-500">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {financingPrograms.map(p => (
                    <tr key={p.name} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-5 font-semibold text-gray-900">{p.name}</td>
                      <td className="py-3 px-5 text-gray-600">{p.units}</td>
                      <td className="py-3 px-5 text-gray-600">{p.ltv}</td>
                      <td className="py-3 px-5 text-gray-600">{p.term}</td>
                      <td className="py-3 px-5 text-gray-600">{p.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6" style={{ fontFamily: '"Clash Display", sans-serif' }}>
              Check Your Project&apos;s Eligibility
            </h2>
            <p className="text-lg text-white/70 mb-8 max-w-xl mx-auto">
              Enter your project details and instantly see which federal programs you qualify for — FHA, HOME, CDBG, Innovation Fund, and LIHTC.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/finance/hud/eligibility"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: brand.teal }}
              >
                Check Eligibility <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/pattern-book"
                className="inline-flex items-center px-8 py-4 rounded-xl text-base font-semibold border border-white/30 text-white hover:bg-white/10 transition"
              >
                Browse Pattern Book
              </Link>
            </div>
          </div>
        </motion.section>
      </main>
      <Footer />
    </>
  );
}
