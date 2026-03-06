'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Ruler,
  BedDouble,
  Bath,
  DollarSign,
  MapPin,
  CheckCircle,
  FileCheck,
  Download,
  Star,
  Clock,
  Layers,
  ChevronRight,
  Car,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { brand } from '@kealee/ui';

// Mock design data (would come from API)
const designData = {
  slug: 'coastal-adu-600',
  name: 'Coastal ADU',
  type: 'ADU',
  style: 'Coastal Modern',
  sqft: 600,
  beds: 1,
  baths: 1,
  stories: 1,
  parking: 1,
  costRange: '$95,000 - $130,000',
  costPerSqft: '$158 - $217',
  preApproved: true,
  description: 'A compact, modern accessory dwelling unit designed for coastal and suburban lots. Features open-concept living, full kitchen, and covered patio. Ideal for rental income, aging-in-place, or guest quarters.',
  specs: {
    lotSize: '2,500 sq ft min',
    width: '24 ft',
    depth: '30 ft (incl. patio)',
    height: '14 ft',
    foundation: 'Slab-on-grade',
    roofPitch: '4:12',
    construction: 'Wood frame',
    energyRating: 'ENERGY STAR',
  },
  rooms: [
    { name: 'Living/Dining', sqft: 200 },
    { name: 'Kitchen', sqft: 80 },
    { name: 'Bedroom', sqft: 150 },
    { name: 'Bathroom', sqft: 60 },
    { name: 'Entry/Storage', sqft: 40 },
    { name: 'Covered Patio', sqft: 70 },
  ],
  compliance: [
    'IRC 2021 Residential Building Code',
    'ADA accessible design option available',
    'Energy code compliant (IECC 2021)',
    'Meets Appendix Q ADU requirements',
  ],
  usageCount: 47,
  avgRating: 4.8,
};

export default function PatternBookDetailPage({ params }: { params: { slug: string } }) {
  const [activeTab, setActiveTab] = useState<'plans' | 'cost' | 'permits'>('plans');
  const [zipCode, setZipCode] = useState('');
  const [costEstimate, setCostEstimate] = useState<{ low: number; high: number; multiplier: number } | null>(null);

  const handleCostEstimate = () => {
    if (!zipCode) return;
    // Simulated location adjustment
    const baseLow = 95000;
    const baseHigh = 130000;
    const stateMultiplier = 1.15; // MD multiplier
    setCostEstimate({
      low: Math.round(baseLow * stateMultiplier),
      high: Math.round(baseHigh * stateMultiplier),
      multiplier: stateMultiplier,
    });
  };

  const tabs = [
    { key: 'plans' as const, label: 'Plans & Specs' },
    { key: 'cost' as const, label: 'Cost Estimate' },
    { key: 'permits' as const, label: 'Permits' },
  ];

  return (
    <>
      <Header />
      <main className="pt-16">
        {/* Breadcrumb */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm text-gray-500">
            <Link href="/pattern-book" className="hover:text-gray-900">Pattern Book</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/pattern-book/type/${designData.type.toLowerCase()}`} className="hover:text-gray-900">{designData.type}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900 font-medium">{designData.name}</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left - Image + Tabs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Design Image Placeholder */}
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl h-80 flex items-center justify-center relative">
                <Building2 className="w-24 h-24 text-gray-300" />
                {designData.preApproved && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-green-600 text-white text-sm font-bold px-3 py-1.5 rounded-full">
                    <CheckCircle className="w-4 h-4" /> Pre-Approved Design
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <div className="flex gap-6">
                  {tabs.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`pb-3 text-sm font-medium border-b-2 transition ${
                        activeTab === tab.key ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab: Plans & Specs */}
              {activeTab === 'plans' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold mb-4" style={{ color: brand.navy }}>Room Schedule</h2>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-3 px-4 font-medium text-gray-500">Room</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-500">Area</th>
                          </tr>
                        </thead>
                        <tbody>
                          {designData.rooms.map(room => (
                            <tr key={room.name} className="border-t border-gray-100">
                              <td className="py-3 px-4 text-gray-900">{room.name}</td>
                              <td className="py-3 px-4 text-right text-gray-600">{room.sqft} sq ft</td>
                            </tr>
                          ))}
                          <tr className="border-t-2 border-gray-200 font-bold">
                            <td className="py-3 px-4 text-gray-900">Total</td>
                            <td className="py-3 px-4 text-right" style={{ color: brand.navy }}>{designData.sqft} sq ft</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold mb-4" style={{ color: brand.navy }}>Building Specifications</h2>
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="grid sm:grid-cols-2 gap-4">
                        {Object.entries(designData.specs).map(([key, value]) => (
                          <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="text-sm font-medium text-gray-900">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold mb-4" style={{ color: brand.navy }}>Code Compliance</h2>
                    <div className="space-y-2">
                      {designData.compliance.map(item => (
                        <div key={item} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="text-gray-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Cost Estimate */}
              {activeTab === 'cost' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-bold mb-2" style={{ color: brand.navy }}>Location-Adjusted Cost Estimate</h2>
                    <p className="text-sm text-gray-600 mb-6">Enter your zip code for a cost estimate adjusted to your local construction market.</p>

                    <div className="flex gap-3 mb-6">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Enter ZIP code"
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          maxLength={5}
                          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      <button
                        onClick={handleCostEstimate}
                        disabled={!zipCode || zipCode.length < 5}
                        className="px-6 py-3 rounded-xl font-semibold text-white disabled:opacity-50 hover:opacity-90 transition"
                        style={{ backgroundColor: brand.teal }}
                      >
                        Calculate
                      </button>
                    </div>

                    {costEstimate && (
                      <div className="bg-teal-50 rounded-xl p-6 border border-teal-200">
                        <h3 className="font-bold text-teal-900 mb-4">Estimated Construction Cost</h3>
                        <div className="text-3xl font-bold mb-2" style={{ color: brand.navy }}>
                          ${costEstimate.low.toLocaleString()} - ${costEstimate.high.toLocaleString()}
                        </div>
                        <p className="text-sm text-teal-700">
                          Location multiplier: {costEstimate.multiplier}x | Base: {designData.costRange}
                        </p>
                        <p className="text-xs text-teal-600 mt-2">
                          Cost per sq ft: ${Math.round(costEstimate.low / designData.sqft)} - ${Math.round(costEstimate.high / designData.sqft)}
                        </p>
                      </div>
                    )}

                    {!costEstimate && (
                      <div className="bg-gray-50 rounded-xl p-6 text-center">
                        <DollarSign className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">Enter your ZIP code to see location-adjusted costs</p>
                        <p className="text-xs text-gray-400 mt-1">National base estimate: {designData.costRange}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Permits */}
              {activeTab === 'permits' && (
                <div className="space-y-6">
                  <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                      <div>
                        <h3 className="font-bold text-green-900">Pre-Approved Design — Expedited Review</h3>
                        <p className="text-sm text-green-700 mt-1">
                          This design is pre-approved under the Pattern Book Housing program (Sec 210). Many jurisdictions offer expedited permit review for pre-approved designs.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-bold mb-4" style={{ color: brand.navy }}>Typical Permits Required</h2>
                    <div className="space-y-3">
                      {[
                        { name: 'Building Permit', fee: '$500-$2,500', timeline: '2-4 weeks (expedited)' },
                        { name: 'Electrical Permit', fee: '$150-$400', timeline: '1-2 weeks' },
                        { name: 'Plumbing Permit', fee: '$150-$400', timeline: '1-2 weeks' },
                        { name: 'Mechanical Permit', fee: '$150-$300', timeline: '1-2 weeks' },
                      ].map(permit => (
                        <div key={permit.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                          <div className="flex items-center gap-3">
                            <FileCheck className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-900">{permit.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">{permit.fee}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {permit.timeline}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link
                    href="/permits/new"
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-white transition hover:opacity-90"
                    style={{ backgroundColor: brand.green }}
                  >
                    <FileCheck className="w-5 h-5" /> Start Permit Application
                  </Link>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Design Summary */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h2 className="text-xl font-bold mb-1" style={{ color: brand.navy }}>{designData.name}</h2>
                <p className="text-sm text-gray-500 mb-4">{designData.style} | {designData.type}</p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <Ruler className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                    <div className="text-sm font-bold text-gray-900">{designData.sqft.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">sq ft</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <BedDouble className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                    <div className="text-sm font-bold text-gray-900">{designData.beds}</div>
                    <div className="text-xs text-gray-500">bedroom</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <Bath className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                    <div className="text-sm font-bold text-gray-900">{designData.baths}</div>
                    <div className="text-xs text-gray-500">bathroom</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <Car className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                    <div className="text-sm font-bold text-gray-900">{designData.parking}</div>
                    <div className="text-xs text-gray-500">parking</div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-500">Est. Cost</span>
                    <span className="text-sm font-bold" style={{ color: brand.navy }}>{designData.costRange}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Per sq ft</span>
                    <span className="text-sm text-gray-700">{designData.costPerSqft}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>{designData.avgRating} rating</span>
                  <span className="text-gray-300">|</span>
                  <span>{designData.usageCount} projects</span>
                </div>

                <p className="text-sm text-gray-600 mb-6">{designData.description}</p>

                <div className="space-y-3">
                  <button
                    className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition"
                    style={{ backgroundColor: brand.teal }}
                  >
                    Select This Design
                  </button>
                  <button className="w-full py-3 rounded-xl font-semibold border border-gray-300 text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50 transition">
                    <Download className="w-4 h-4" /> Download Plans
                  </button>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link href="/zoning/analyze" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-sm text-gray-700">
                    <MapPin className="w-4 h-4" style={{ color: brand.teal }} /> Check Zoning Compliance
                  </Link>
                  <Link href="/permits/new" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-sm text-gray-700">
                    <FileCheck className="w-4 h-4" style={{ color: brand.green }} /> Start Permit Application
                  </Link>
                  <Link href="/estimation" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-sm text-gray-700">
                    <DollarSign className="w-4 h-4" style={{ color: brand.orange }} /> Detailed Cost Estimate
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
