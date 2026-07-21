'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  TreePine,
  MapPin,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2,
  Home,
  Layers,
  Search,
  Loader2,
  Info,
} from 'lucide-react';

const brand = {
  navy: '#1A2B4A',
  teal: '#0D9488',
  orange: '#C8882A',
  green: '#059669',
};

type ExemptionType = 'INFILL_DEVELOPMENT' | 'SMALL_SCALE_HOUSING' | 'PREVIOUSLY_DEVELOPED' | 'CATEGORICAL_EXCLUSION' | 'NONE';

interface NEPAResult {
  exempt: boolean;
  exemptionType: ExemptionType;
  reason: string;
  conditions: string[];
  confidence: number;
}

const exemptionCriteria = [
  {
    type: 'Infill Development',
    description: 'Development on vacant or underutilized lots within existing developed areas where utilities and roads already exist.',
    icon: Building2,
  },
  {
    type: 'Small-Scale Housing',
    description: 'Residential projects of 4 or fewer units on previously developed or adjacent parcels.',
    icon: Home,
  },
  {
    type: 'Previously Developed',
    description: 'Sites that have been previously developed, disturbed, or used for commercial/industrial purposes.',
    icon: Layers,
  },
  {
    type: 'Categorical Exclusion',
    description: 'Projects that fall under HUD categorical exclusion categories for minor renovation or rehabilitation.',
    icon: CheckCircle,
  },
];

export default function NEPACheckerPage() {
  const [address, setAddress] = useState('');
  const [housingType, setHousingType] = useState('');
  const [units, setUnits] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<NEPAResult | null>(null);

  const handleCheck = async () => {
    if (!address || !housingType) return;
    setIsChecking(true);

    // Simulate API call
    setTimeout(() => {
      const unitCount = parseInt(units) || 1;
      const isSmallScale = unitCount <= 4;
      setResult({
        exempt: isSmallScale,
        exemptionType: isSmallScale ? 'SMALL_SCALE_HOUSING' : 'NONE',
        reason: isSmallScale
          ? `This ${housingType.toLowerCase()} project with ${unitCount} unit(s) qualifies for NEPA categorical exclusion as small-scale housing under the 21st Century Housing Act.`
          : `This project with ${unitCount} units exceeds the small-scale threshold. A full NEPA environmental review may be required.`,
        conditions: isSmallScale
          ? [
              'No impact to wetlands, floodplains, or endangered species habitat',
              'Site is not listed on the National Register of Historic Places',
              'No hazardous materials on site (Phase I ESA recommended)',
              'Project does not require new roadway infrastructure',
            ]
          : [
              'Environmental Assessment (EA) required',
              'Public comment period required',
              'Consider Environmental Impact Statement (EIS) if significant impacts found',
            ],
        confidence: isSmallScale ? 92 : 85,
      });
      setIsChecking(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/zoning" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" /> Back to Zoning
          </Link>
          <span className="text-sm font-medium" style={{ color: brand.green }}>NEPA Exemption Checker</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${brand.green}15` }}>
            <TreePine className="w-8 h-8" style={{ color: brand.green }} />
          </div>
          <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}>
            NEPA Exemption Checker
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Determine if your housing project qualifies for a National Environmental Policy Act (NEPA) categorical exclusion under the 21st Century Housing Act.
          </p>
        </div>

        {/* Exemption Types Info */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {exemptionCriteria.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.type} className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: brand.green }} />
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900">{c.type}</h3>
                    <p className="text-xs text-gray-500 mt-1">{c.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Check Form */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
          <h2 className="font-bold text-lg mb-6" style={{ color: brand.navy }}>Check Your Project</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="123 Main St, City, State ZIP"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Housing Type</label>
              <select
                value={housingType}
                onChange={(e) => setHousingType(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 bg-white"
              >
                <option value="">Select housing type...</option>
                <option value="Single Family">Single Family</option>
                <option value="ADU">ADU / Accessory Dwelling</option>
                <option value="Duplex">Duplex</option>
                <option value="Triplex">Triplex</option>
                <option value="Fourplex">Fourplex</option>
                <option value="Townhouse">Townhouse</option>
                <option value="Small Apartment">Small Apartment (5-20 units)</option>
                <option value="Mixed-Use">Mixed-Use</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Units</label>
              <input
                type="number"
                placeholder="e.g. 4"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500"
              />
            </div>
          </div>
          <button
            onClick={handleCheck}
            disabled={!address || !housingType || isChecking}
            className="mt-6 w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition"
            style={{ backgroundColor: brand.green }}
          >
            {isChecking ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Checking Eligibility...</>
            ) : (
              <><Search className="w-5 h-5" /> Check NEPA Exemption</>
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className={`rounded-xl p-6 border-2 ${result.exempt ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-start gap-4 mb-6">
              {result.exempt ? (
                <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-amber-600 flex-shrink-0" />
              )}
              <div>
                <h2 className={`text-xl font-bold ${result.exempt ? 'text-green-900' : 'text-amber-900'}`}>
                  {result.exempt ? 'NEPA Exemption: Likely Eligible' : 'NEPA Exemption: Not Eligible'}
                </h2>
                <p className={`text-sm mt-2 ${result.exempt ? 'text-green-700' : 'text-amber-700'}`}>
                  {result.reason}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500">AI Confidence:</span>
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div className="h-full rounded-full" style={{ width: `${result.confidence}%`, backgroundColor: result.exempt ? brand.green : brand.orange }} />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{result.confidence}%</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className={`font-semibold text-sm mb-3 ${result.exempt ? 'text-green-800' : 'text-amber-800'}`}>
                {result.exempt ? 'Conditions for Exemption' : 'Next Steps Required'}
              </h3>
              <ul className="space-y-2">
                {result.conditions.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Info className={`w-4 h-4 mt-0.5 flex-shrink-0 ${result.exempt ? 'text-green-500' : 'text-amber-500'}`} />
                    <span className={result.exempt ? 'text-green-700' : 'text-amber-700'}>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200/50 text-xs text-gray-500">
              This assessment is AI-generated and for informational purposes only. Consult with your environmental compliance officer or HUD representative for official determinations.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
