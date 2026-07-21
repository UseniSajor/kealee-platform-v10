'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Ruler,
  BedDouble,
  Bath,
  CheckCircle,
  Search,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { brand } from '@kealee/ui';

// Mock designs — in production these come from GET /pattern-book/designs?housingType=X
const allDesigns = [
  { slug: 'coastal-adu-600', name: 'Coastal ADU', type: 'adu', style: 'Coastal Modern', sqft: 600, beds: 1, baths: 1, costRange: '$95K - $130K', preApproved: true },
  { slug: 'modern-adu-500', name: 'Modern Studio ADU', type: 'adu', style: 'Modern', sqft: 500, beds: 0, baths: 1, costRange: '$75K - $105K', preApproved: true },
  { slug: 'cottage-adu-750', name: 'Cottage ADU', type: 'adu', style: 'Cottage', sqft: 750, beds: 1, baths: 1, costRange: '$110K - $155K', preApproved: true },
  { slug: 'urban-adu-450', name: 'Urban Micro ADU', type: 'adu', style: 'Contemporary', sqft: 450, beds: 0, baths: 1, costRange: '$68K - $95K', preApproved: false },
  { slug: 'craftsman-duplex-2400', name: 'Craftsman Duplex', type: 'duplex', style: 'Craftsman', sqft: 2400, beds: 4, baths: 4, costRange: '$320K - $420K', preApproved: true },
  { slug: 'modern-duplex-2200', name: 'Modern Duplex', type: 'duplex', style: 'Modern', sqft: 2200, beds: 4, baths: 4, costRange: '$290K - $380K', preApproved: true },
  { slug: 'stacked-duplex-2800', name: 'Stacked Flat Duplex', type: 'duplex', style: 'Traditional', sqft: 2800, beds: 4, baths: 4, costRange: '$360K - $470K', preApproved: false },
  { slug: 'contemporary-triplex-3600', name: 'Contemporary Triplex', type: 'triplex', style: 'Contemporary', sqft: 3600, beds: 6, baths: 6, costRange: '$450K - $580K', preApproved: true },
  { slug: 'garden-triplex-3200', name: 'Garden Court Triplex', type: 'triplex', style: 'Traditional', sqft: 3200, beds: 6, baths: 6, costRange: '$400K - $520K', preApproved: true },
  { slug: 'urban-triplex-3800', name: 'Urban Infill Triplex', type: 'triplex', style: 'Modern', sqft: 3800, beds: 6, baths: 6, costRange: '$480K - $620K', preApproved: false },
  { slug: 'modern-fourplex-4800', name: 'Modern Fourplex', type: 'fourplex', style: 'Modern', sqft: 4800, beds: 8, baths: 8, costRange: '$580K - $750K', preApproved: true },
  { slug: 'colonial-fourplex-5200', name: 'Colonial Fourplex', type: 'fourplex', style: 'Colonial', sqft: 5200, beds: 8, baths: 8, costRange: '$620K - $810K', preApproved: true },
  { slug: 'courtyard-fourplex-4400', name: 'Courtyard Fourplex', type: 'fourplex', style: 'Courtyard', sqft: 4400, beds: 8, baths: 8, costRange: '$540K - $690K', preApproved: false },
  { slug: 'traditional-townhouse-1800', name: 'Traditional Townhouse', type: 'townhouse', style: 'Traditional', sqft: 1800, beds: 3, baths: 2.5, costRange: '$240K - $320K', preApproved: true },
  { slug: 'modern-townhouse-2000', name: 'Modern Townhouse', type: 'townhouse', style: 'Modern', sqft: 2000, beds: 3, baths: 2.5, costRange: '$265K - $350K', preApproved: true },
  { slug: 'row-townhouse-1600', name: 'Row House', type: 'townhouse', style: 'Urban', sqft: 1600, beds: 2, baths: 2, costRange: '$210K - $280K', preApproved: true },
  { slug: 'compact-apartment-10000', name: 'Compact 12-Unit', type: 'small-apartment', style: 'Modern', sqft: 10000, beds: 18, baths: 12, costRange: '$1.2M - $1.6M', preApproved: true },
  { slug: 'garden-apartment-14000', name: 'Garden 16-Unit', type: 'small-apartment', style: 'Garden', sqft: 14000, beds: 24, baths: 16, costRange: '$1.7M - $2.2M', preApproved: false },
  { slug: 'urban-apartment-8000', name: 'Urban 8-Unit', type: 'small-apartment', style: 'Contemporary', sqft: 8000, beds: 12, baths: 8, costRange: '$960K - $1.3M', preApproved: true },
  { slug: 'mixed-use-corner-8000', name: 'Corner Mixed-Use', type: 'mixed-use', style: 'Urban', sqft: 8000, beds: 6, baths: 6, costRange: '$1.1M - $1.4M', preApproved: true },
  { slug: 'mixed-use-main-st-10000', name: 'Main Street Mixed-Use', type: 'mixed-use', style: 'Traditional', sqft: 10000, beds: 8, baths: 8, costRange: '$1.3M - $1.7M', preApproved: true },
  { slug: 'mixed-use-live-work-6000', name: 'Live-Work Mixed-Use', type: 'mixed-use', style: 'Modern', sqft: 6000, beds: 4, baths: 4, costRange: '$820K - $1.1M', preApproved: false },
  { slug: 'modular-home-1400', name: 'Modular Ranch', type: 'modular', style: 'Modern Farmhouse', sqft: 1400, beds: 3, baths: 2, costRange: '$160K - $220K', preApproved: true },
  { slug: 'modular-cottage-1000', name: 'Modular Cottage', type: 'modular', style: 'Cottage', sqft: 1000, beds: 2, baths: 1, costRange: '$115K - $160K', preApproved: true },
];

const typeLabels: Record<string, string> = {
  all: 'All Designs',
  adu: 'ADU Designs',
  duplex: 'Duplex Designs',
  triplex: 'Triplex Designs',
  fourplex: 'Fourplex Designs',
  townhouse: 'Townhouse Designs',
  'small-apartment': 'Small Apartment Designs',
  'mixed-use': 'Mixed-Use Designs',
  modular: 'Modular Home Designs',
};

export default function PatternBookTypePage({ params }: { params: { type: string } }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [preApprovedOnly, setPreApprovedOnly] = useState(false);

  const filteredDesigns = useMemo(() => {
    let designs = params.type === 'all' ? allDesigns : allDesigns.filter(d => d.type === params.type);
    if (preApprovedOnly) designs = designs.filter(d => d.preApproved);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      designs = designs.filter(d => d.name.toLowerCase().includes(q) || d.style.toLowerCase().includes(q));
    }
    return designs;
  }, [params.type, searchQuery, preApprovedOnly]);

  const typeLabel = typeLabels[params.type] || 'Designs';

  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm text-gray-500">
            <Link href="/pattern-book" className="hover:text-gray-900">Pattern Book</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900 font-medium">{typeLabel}</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: brand.navy }}>{typeLabel}</h1>
              <p className="text-sm text-gray-500 mt-1">{filteredDesigns.length} design{filteredDesigns.length !== 1 ? 's' : ''} available</p>
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search designs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
              <button
                onClick={() => setPreApprovedOnly(!preApprovedOnly)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition ${
                  preApprovedOnly ? 'bg-green-50 border-green-300 text-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <CheckCircle className="w-4 h-4" /> Pre-Approved
              </button>
            </div>
          </div>

          {/* Type Filter Pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {Object.entries(typeLabels).map(([key, label]) => (
              <Link
                key={key}
                href={`/pattern-book/type/${key}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  params.type === key ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                style={params.type === key ? { backgroundColor: brand.teal } : {}}
              >
                {label.replace(' Designs', '')}
              </Link>
            ))}
          </div>

          {/* Design Grid */}
          {filteredDesigns.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDesigns.map((design) => (
                <Link
                  key={design.slug}
                  href={`/pattern-book/${design.slug}`}
                  className="bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-teal-300 transition group overflow-hidden"
                >
                  <div className="h-44 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                    <Building2 className="w-14 h-14 text-gray-300" />
                    {design.preApproved && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Pre-Approved
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-white/90 text-xs font-medium px-2 py-1 rounded-full text-gray-700 capitalize">
                      {design.type.replace('-', ' ')}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 mb-1 group-hover:text-teal-700 transition">{design.name}</h3>
                    <p className="text-xs text-gray-500 mb-3">{design.style}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                      <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" /> {design.sqft.toLocaleString()} sf</span>
                      <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {design.beds}</span>
                      <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {design.baths}</span>
                    </div>
                    <div className="text-sm font-bold" style={{ color: brand.navy }}>{design.costRange}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">No designs found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search or filters.</p>
              <Link href="/pattern-book" className="text-sm font-semibold hover:underline" style={{ color: brand.teal }}>
                Back to Pattern Book
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
