'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Home,
  Building2,
  Layers,
  Search,
  ArrowRight,
  CheckCircle,
  Ruler,
  DollarSign,
  BedDouble,
  Bath,
  FileCheck,
  Star,
  MapPin,
  BookOpen,
  Scale,
  Zap,
  Filter,
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

const housingTypes = [
  { key: 'adu', label: 'ADU', icon: Home, count: 4, desc: 'Accessory Dwelling Units', sqft: '400-800 sq ft', color: brand.teal },
  { key: 'duplex', label: 'Duplex', icon: Building2, count: 3, desc: '2-Unit Residential', sqft: '1,800-2,800 sq ft', color: brand.navy },
  { key: 'triplex', label: 'Triplex', icon: Building2, count: 3, desc: '3-Unit Residential', sqft: '2,700-4,200 sq ft', color: brand.orange },
  { key: 'fourplex', label: 'Fourplex', icon: Building2, count: 3, desc: '4-Unit Residential', sqft: '3,600-5,600 sq ft', color: '#059669' },
  { key: 'townhouse', label: 'Townhouse', icon: Layers, count: 3, desc: 'Attached Row Housing', sqft: '1,400-2,200 sq ft', color: brand.teal },
  { key: 'small-apartment', label: 'Small Apartment', icon: Building2, count: 3, desc: '5-20 Unit Buildings', sqft: '8,000-20,000 sq ft', color: brand.navy },
  { key: 'mixed-use', label: 'Mixed-Use', icon: Building2, count: 3, desc: 'Residential + Commercial', sqft: '6,000-12,000 sq ft', color: brand.orange },
  { key: 'modular', label: 'Modular', icon: Home, count: 2, desc: 'Factory-Built Homes', sqft: '1,000-1,800 sq ft', color: '#059669' },
];

const featuredDesigns = [
  {
    slug: 'coastal-adu-600',
    name: 'Coastal ADU',
    type: 'ADU',
    sqft: 600,
    beds: 1,
    baths: 1,
    costRange: '$95K - $130K',
    style: 'Coastal Modern',
    preApproved: true,
  },
  {
    slug: 'craftsman-duplex-2400',
    name: 'Craftsman Duplex',
    type: 'Duplex',
    sqft: 2400,
    beds: 4,
    baths: 4,
    costRange: '$320K - $420K',
    style: 'Craftsman',
    preApproved: true,
  },
  {
    slug: 'modern-fourplex-4800',
    name: 'Modern Fourplex',
    type: 'Fourplex',
    sqft: 4800,
    beds: 8,
    baths: 8,
    costRange: '$580K - $750K',
    style: 'Modern',
    preApproved: true,
  },
  {
    slug: 'traditional-townhouse-1800',
    name: 'Traditional Townhouse',
    type: 'Townhouse',
    sqft: 1800,
    beds: 3,
    baths: 2.5,
    costRange: '$240K - $320K',
    style: 'Traditional',
    preApproved: true,
  },
  {
    slug: 'contemporary-triplex-3600',
    name: 'Contemporary Triplex',
    type: 'Triplex',
    sqft: 3600,
    beds: 6,
    baths: 6,
    costRange: '$450K - $580K',
    style: 'Contemporary',
    preApproved: false,
  },
  {
    slug: 'modular-home-1400',
    name: 'Modular Home',
    type: 'Modular',
    sqft: 1400,
    beds: 3,
    baths: 2,
    costRange: '$160K - $220K',
    style: 'Modern Farmhouse',
    preApproved: true,
  },
];

function DesignCard({ design }: { design: (typeof featuredDesigns)[0] }) {
  return (
    <Link
      href={`/pattern-book/${design.slug}`}
      className="bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-teal-300 transition group overflow-hidden"
    >
      {/* Placeholder Image */}
      <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
        <Building2 className="w-16 h-16 text-gray-300" />
        {design.preApproved && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            <CheckCircle className="w-3 h-3" /> Pre-Approved
          </div>
        )}
        <div className="absolute top-3 left-3 bg-white/90 text-xs font-medium px-2.5 py-1 rounded-full text-gray-700">
          {design.type}
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-bold text-gray-900 mb-1 group-hover:text-teal-700 transition">{design.name}</h3>
        <p className="text-xs text-gray-500 mb-3">{design.style}</p>

        <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
          <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" /> {design.sqft.toLocaleString()} sq ft</span>
          <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {design.beds} bed</span>
          <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {design.baths} bath</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-bold" style={{ color: brand.navy }}>{design.costRange}</span>
          <span className="text-xs font-medium text-teal-600 group-hover:underline flex items-center gap-1">
            View Details <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function PatternBookPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const totalDesigns = housingTypes.reduce((sum, t) => sum + t.count, 0);

  return (
    <>
      <Header />
      <main className="pt-16">
        {/* Hero */}
        <motion.section
          {...fadeInUp}
          className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 text-center"
          style={{ background: 'linear-gradient(135deg, #F0FDFA 0%, #F7FAFC 50%, #FEF3E2 100%)' }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6" style={{ backgroundColor: `${brand.teal}15`, color: brand.teal }}>
              <Scale className="w-4 h-4" />
              21st Century Housing Act — Sec 210: Accelerating Home Building
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}>
              Pre-Approved Housing<br />
              <em className="italic" style={{ color: brand.teal }}>Ready to Build</em>
            </h1>

            <p className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto mb-10" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              Browse {totalDesigns} pre-approved housing designs from ADUs to apartments. Get cost estimates, permit checklists, and start building faster with pattern book designs.
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto mb-8">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search designs by name, type, or style..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <button className="px-5 py-4 rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition">
                  <Filter className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-600" /> Free to browse</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-600" /> Pre-approved designs</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-600" /> Location-adjusted costs</span>
            </div>
          </div>
        </motion.section>

        {/* Housing Type Grid */}
        <motion.section {...fadeInUp} className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4" style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}>
                Browse by Housing Type
              </h2>
              <p className="text-lg text-gray-600">Missing-middle housing designs for every community</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {housingTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Link
                    key={type.key}
                    href={`/pattern-book/type/${type.key}`}
                    className="bg-white rounded-xl p-5 border-2 border-gray-100 hover:shadow-md transition text-center group"
                    style={{ ['--hover-border' as string]: type.color }}
                  >
                    <div className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: `${type.color}15` }}>
                      <Icon className="w-7 h-7 group-hover:scale-110 transition" style={{ color: type.color }} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">{type.label}</h3>
                    <p className="text-xs text-gray-500 mt-1">{type.desc}</p>
                    <p className="text-xs text-gray-400 mt-1">{type.sqft}</p>
                    <span className="inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${type.color}15`, color: type.color }}>
                      {type.count} designs
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </motion.section>

        {/* Featured Designs */}
        <motion.section {...fadeInUp} className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#F7FAFC' }}>
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}>
                  Featured Designs
                </h2>
                <p className="text-gray-600">Popular pre-approved designs ready for your next project</p>
              </div>
              <Link href="/pattern-book/type/all" className="hidden sm:flex items-center gap-1 text-sm font-semibold hover:underline" style={{ color: brand.teal }}>
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredDesigns.map((design) => (
                <DesignCard key={design.slug} design={design} />
              ))}
            </div>
          </div>
        </motion.section>

        {/* How It Works */}
        <motion.section {...fadeInUp} className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4" style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}>
                How Pattern Book Works
              </h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-8">
              {[
                { step: 1, icon: BookOpen, title: 'Browse Designs', desc: 'Explore pre-approved housing designs by type, style, size, and cost range. All designs are publicly available per Sec 210.' },
                { step: 2, icon: MapPin, title: 'Get Local Costs', desc: 'Enter your zip code for location-adjusted cost estimates using state-level construction cost multipliers.' },
                { step: 3, icon: FileCheck, title: 'Start Building', desc: 'Select a design, get your jurisdiction-specific permit checklist, and submit for expedited review.' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="text-center">
                    <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: brand.teal }}>
                      {item.step}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.section>

        {/* Benefits */}
        <motion.section {...fadeInUp} className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#F7FAFC' }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}>
                Why Use Pattern Book Designs?
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Zap, title: 'Faster Permitting', desc: 'Pre-approved designs often qualify for expedited permit review — saving weeks.' },
                { icon: DollarSign, title: 'Known Costs', desc: 'Every design includes assembly-level cost estimates adjusted for your location.' },
                { icon: Scale, title: 'Act Compliant', desc: 'Aligned with Sec 210 of the 21st Century Housing Act for pattern book housing.' },
                { icon: Star, title: 'Proven Designs', desc: 'Each design has been reviewed by licensed architects and meets building codes.' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="bg-white rounded-xl p-6 border border-gray-200 text-center">
                    <Icon className="w-8 h-8 mx-auto mb-3" style={{ color: brand.teal }} />
                    <h3 className="font-bold text-gray-900 mb-2 text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-600">{item.desc}</p>
                  </div>
                );
              })}
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
              Ready to Build Missing-Middle Housing?
            </h2>
            <p className="text-lg text-white/70 mb-8 max-w-xl mx-auto">
              Browse pre-approved designs, get instant cost estimates, and start the permitting process today.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/pattern-book/type/all"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: brand.teal }}
              >
                Browse All Designs <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/zoning/analyze"
                className="inline-flex items-center px-8 py-4 rounded-xl text-base font-semibold border border-white/30 text-white hover:bg-white/10 transition"
              >
                Check Zoning First
              </Link>
            </div>
          </div>
        </motion.section>
      </main>
      <Footer />
    </>
  );
}
