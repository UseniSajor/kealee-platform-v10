'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  ChevronRight,
  Building2,
  Ruler,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { brand } from '@kealee/ui';

const stateMultipliers: Record<string, { name: string; multiplier: number }> = {
  AL: { name: 'Alabama', multiplier: 0.82 }, AK: { name: 'Alaska', multiplier: 1.28 },
  AZ: { name: 'Arizona', multiplier: 0.92 }, AR: { name: 'Arkansas', multiplier: 0.79 },
  CA: { name: 'California', multiplier: 1.32 }, CO: { name: 'Colorado', multiplier: 1.05 },
  CT: { name: 'Connecticut', multiplier: 1.18 }, DE: { name: 'Delaware', multiplier: 1.05 },
  DC: { name: 'District of Columbia', multiplier: 1.22 }, FL: { name: 'Florida', multiplier: 0.95 },
  GA: { name: 'Georgia', multiplier: 0.88 }, HI: { name: 'Hawaii', multiplier: 1.45 },
  ID: { name: 'Idaho', multiplier: 0.90 }, IL: { name: 'Illinois', multiplier: 1.08 },
  IN: { name: 'Indiana', multiplier: 0.88 }, IA: { name: 'Iowa', multiplier: 0.87 },
  KS: { name: 'Kansas', multiplier: 0.85 }, KY: { name: 'Kentucky', multiplier: 0.84 },
  LA: { name: 'Louisiana', multiplier: 0.86 }, ME: { name: 'Maine', multiplier: 1.02 },
  MD: { name: 'Maryland', multiplier: 1.15 }, MA: { name: 'Massachusetts', multiplier: 1.25 },
  MI: { name: 'Michigan', multiplier: 0.93 }, MN: { name: 'Minnesota', multiplier: 1.02 },
  MS: { name: 'Mississippi', multiplier: 0.78 }, MO: { name: 'Missouri', multiplier: 0.88 },
  MT: { name: 'Montana', multiplier: 0.92 }, NE: { name: 'Nebraska', multiplier: 0.86 },
  NV: { name: 'Nevada', multiplier: 1.03 }, NH: { name: 'New Hampshire', multiplier: 1.08 },
  NJ: { name: 'New Jersey', multiplier: 1.22 }, NM: { name: 'New Mexico', multiplier: 0.90 },
  NY: { name: 'New York', multiplier: 1.35 }, NC: { name: 'North Carolina', multiplier: 0.87 },
  ND: { name: 'North Dakota', multiplier: 0.88 }, OH: { name: 'Ohio', multiplier: 0.90 },
  OK: { name: 'Oklahoma', multiplier: 0.82 }, OR: { name: 'Oregon', multiplier: 1.08 },
  PA: { name: 'Pennsylvania', multiplier: 1.05 }, RI: { name: 'Rhode Island', multiplier: 1.12 },
  SC: { name: 'South Carolina', multiplier: 0.84 }, SD: { name: 'South Dakota', multiplier: 0.84 },
  TN: { name: 'Tennessee', multiplier: 0.85 }, TX: { name: 'Texas', multiplier: 0.90 },
  UT: { name: 'Utah', multiplier: 0.95 }, VT: { name: 'Vermont', multiplier: 1.05 },
  VA: { name: 'Virginia', multiplier: 1.10 }, WA: { name: 'Washington', multiplier: 1.12 },
  WV: { name: 'West Virginia', multiplier: 0.85 }, WI: { name: 'Wisconsin', multiplier: 0.95 },
  WY: { name: 'Wyoming', multiplier: 0.88 },
};

const assemblyCosts = [
  { name: 'Site Work & Foundation', baseCost: 18500, pctOfTotal: 14 },
  { name: 'Framing & Structure', baseCost: 24000, pctOfTotal: 18 },
  { name: 'Roofing', baseCost: 8500, pctOfTotal: 6 },
  { name: 'Exterior Finishes', baseCost: 12000, pctOfTotal: 9 },
  { name: 'Plumbing', baseCost: 11000, pctOfTotal: 8 },
  { name: 'Electrical', baseCost: 9500, pctOfTotal: 7 },
  { name: 'HVAC', baseCost: 8000, pctOfTotal: 6 },
  { name: 'Insulation & Drywall', baseCost: 10500, pctOfTotal: 8 },
  { name: 'Interior Finishes', baseCost: 16000, pctOfTotal: 12 },
  { name: 'Cabinets & Countertops', baseCost: 8000, pctOfTotal: 6 },
  { name: 'Flooring', baseCost: 5500, pctOfTotal: 4 },
  { name: 'General Conditions & Fees', baseCost: 3500, pctOfTotal: 2 },
];

export default function PatternBookEstimatePage({ params }: { params: { slug: string } }) {
  const [selectedState, setSelectedState] = useState('');
  const stateData = selectedState ? stateMultipliers[selectedState] : null;
  const multiplier = stateData?.multiplier || 1.0;
  const totalBase = assemblyCosts.reduce((sum, a) => sum + a.baseCost, 0);
  const totalAdjusted = Math.round(totalBase * multiplier);

  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-4xl mx-auto flex items-center gap-2 text-sm text-gray-500">
            <Link href="/pattern-book" className="hover:text-gray-900">Pattern Book</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/pattern-book/${params.slug}`} className="hover:text-gray-900">Design</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900 font-medium">Cost Estimate</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold mb-2" style={{ color: brand.navy }}>Location-Adjusted Cost Estimate</h1>
          <p className="text-gray-600 mb-8">Assembly-level construction cost breakdown with state-level multipliers.</p>

          {/* State Selector */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Your State</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:border-teal-500"
              >
                <option value="">Choose a state...</option>
                {Object.entries(stateMultipliers).sort((a, b) => a[1].name.localeCompare(b[1].name)).map(([code, data]) => (
                  <option key={code} value={code}>{data.name} ({data.multiplier}x)</option>
                ))}
              </select>
            </div>
            {stateData && (
              <p className="text-sm text-gray-500 mt-2">
                {stateData.name} construction cost multiplier: <span className="font-semibold">{stateData.multiplier}x</span> national average
              </p>
            )}
          </div>

          {/* Cost Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="font-bold text-lg" style={{ color: brand.navy }}>Assembly Cost Breakdown</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-500">Assembly</th>
                  <th className="text-right py-3 px-6 font-medium text-gray-500">Base Cost</th>
                  {selectedState && <th className="text-right py-3 px-6 font-medium text-gray-500">Adjusted</th>}
                  <th className="text-right py-3 px-6 font-medium text-gray-500">%</th>
                </tr>
              </thead>
              <tbody>
                {assemblyCosts.map(a => (
                  <tr key={a.name} className="border-t border-gray-100">
                    <td className="py-3 px-6 text-gray-900">{a.name}</td>
                    <td className="py-3 px-6 text-right text-gray-600">${a.baseCost.toLocaleString()}</td>
                    {selectedState && (
                      <td className="py-3 px-6 text-right font-medium" style={{ color: brand.navy }}>
                        ${Math.round(a.baseCost * multiplier).toLocaleString()}
                      </td>
                    )}
                    <td className="py-3 px-6 text-right text-gray-400">{a.pctOfTotal}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                  <td className="py-4 px-6 text-gray-900">Total</td>
                  <td className="py-4 px-6 text-right text-gray-900">${totalBase.toLocaleString()}</td>
                  {selectedState && (
                    <td className="py-4 px-6 text-right text-xl" style={{ color: brand.teal }}>
                      ${totalAdjusted.toLocaleString()}
                    </td>
                  )}
                  <td className="py-4 px-6 text-right text-gray-500">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Estimates are based on national average construction costs adjusted by state-level multipliers. Actual costs vary by locality, site conditions, and market. Get a detailed estimate at <Link href="/estimation" className="underline">kealee.com/estimation</Link>.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
