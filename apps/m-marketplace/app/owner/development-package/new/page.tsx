'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Building2,
  ArrowRight,
  ArrowLeft,
  Check,
  Home,
  Layers,
  Warehouse,
  Store,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { brand } from '@kealee/ui';

const housingTypes = [
  { key: 'ADU', label: 'ADU / Guest House', icon: Home, defaultSqft: 600, units: 1 },
  { key: 'DUPLEX', label: 'Duplex', icon: Building2, defaultSqft: 2400, units: 2 },
  { key: 'TRIPLEX', label: 'Triplex', icon: Building2, defaultSqft: 3600, units: 3 },
  { key: 'FOURPLEX', label: 'Fourplex', icon: Building2, defaultSqft: 4800, units: 4 },
  { key: 'TOWNHOUSE', label: 'Townhouse', icon: Layers, defaultSqft: 1800, units: 1 },
  { key: 'SMALL_APARTMENT', label: 'Small Apartment (5-20)', icon: Building2, defaultSqft: 12000, units: 12 },
  { key: 'MIXED_USE', label: 'Mixed-Use', icon: Store, defaultSqft: 8000, units: 6 },
  { key: 'MODULAR', label: 'Modular / Manufactured', icon: Warehouse, defaultSqft: 1400, units: 1 },
];

export default function NewDevelopmentPackagePage() {
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [totalSqft, setTotalSqft] = useState(0);
  const [units, setUnits] = useState(0);
  const [stories, setStories] = useState(2);
  const [affordablePercent, setAffordablePercent] = useState(20);
  const [generating, setGenerating] = useState(false);

  const selectedConfig = housingTypes.find((t) => t.key === selectedType);

  const handleTypeSelect = (key: string) => {
    const config = housingTypes.find((t) => t.key === key);
    setSelectedType(key);
    if (config) {
      setTotalSqft(config.defaultSqft);
      setUnits(config.units);
    }
  };

  const handleGenerate = () => {
    setGenerating(true);
    // In production this would POST to /api/development-package/generate
    setTimeout(() => {
      // Simulate redirect to a generated package
      window.location.href = '/owner/development-package/demo-pkg-001';
    }, 3000);
  };

  const canProceed = () => {
    if (step === 1) return address.trim() && city.trim() && state.trim() && zip.trim();
    if (step === 2) return !!selectedType;
    if (step === 3) return totalSqft > 0 && units > 0;
    return true;
  };

  return (
    <>
      <Header />
      <main className="pt-16">
        {/* Progress Bar */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex items-center justify-between mb-4">
              <h1
                className="text-xl font-bold"
                style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
              >
                Generate Development Package
              </h1>
              <span className="text-sm text-gray-500">Step {step} of 4</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className="h-2 flex-1 rounded-full transition-all"
                  style={{
                    backgroundColor: s <= step ? brand.teal : '#E5E7EB',
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>Property</span>
              <span>Building Type</span>
              <span>Details</span>
              <span>Review</span>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          {/* Step 1: Address */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: brand.navy }}>
                Property Location
              </h2>
              <p className="text-gray-600 mb-8">
                Enter the address of the property you want to analyze.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="1234 Main Street"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Denver"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="CO"
                      maxLength={2}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
                    <input
                      type="text"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      placeholder="80202"
                      maxLength={5}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Building Type */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: brand.navy }}>
                Building Type
              </h2>
              <p className="text-gray-600 mb-8">
                What type of housing do you want to analyze for this property?
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {housingTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedType === type.key;
                  return (
                    <button
                      key={type.key}
                      onClick={() => handleTypeSelect(type.key)}
                      className={`text-left p-5 rounded-xl border-2 transition ${
                        isSelected
                          ? 'shadow-md'
                          : 'border-gray-200 hover:border-teal-300'
                      }`}
                      style={isSelected ? { borderColor: brand.teal, backgroundColor: `${brand.teal}08` } : {}}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: isSelected ? `${brand.teal}20` : '#F3F4F6' }}
                        >
                          <Icon className="w-5 h-5" style={{ color: isSelected ? brand.teal : '#6B7280' }} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{type.label}</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Default: {type.defaultSqft.toLocaleString()} SF &middot; {type.units} unit{type.units !== 1 ? 's' : ''}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="w-5 h-5 ml-auto flex-shrink-0" style={{ color: brand.teal }} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: brand.navy }}>
                Project Details
              </h2>
              <p className="text-gray-600 mb-8">
                Adjust the defaults to match your development plan.
              </p>

              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Square Feet</label>
                    <input
                      type="number"
                      value={totalSqft}
                      onChange={(e) => setTotalSqft(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Units</label>
                    <input
                      type="number"
                      value={units}
                      onChange={(e) => setUnits(parseInt(e.target.value) || 0)}
                      min={1}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stories</label>
                    <select
                      value={stories}
                      onChange={(e) => setStories(parseInt(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
                    >
                      {[1, 2, 3, 4].map((s) => (
                        <option key={s} value={s}>{s} {s === 1 ? 'Story' : 'Stories'}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Affordable Units (% at 80% AMI)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={affordablePercent}
                        onChange={(e) => setAffordablePercent(parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm font-bold w-12 text-right" style={{ color: brand.teal }}>
                        {affordablePercent}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      20%+ qualifies for HOME program. 51%+ qualifies for CDBG.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: brand.navy }}>
                Review &amp; Generate
              </h2>
              <p className="text-gray-600 mb-8">
                Confirm your details and generate the development package.
              </p>

              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                <div className="p-5 flex justify-between">
                  <span className="text-sm text-gray-500">Address</span>
                  <span className="text-sm font-medium text-gray-900">{address}, {city}, {state} {zip}</span>
                </div>
                <div className="p-5 flex justify-between">
                  <span className="text-sm text-gray-500">Building Type</span>
                  <span className="text-sm font-medium text-gray-900">{selectedConfig?.label}</span>
                </div>
                <div className="p-5 flex justify-between">
                  <span className="text-sm text-gray-500">Total SF</span>
                  <span className="text-sm font-medium text-gray-900">{totalSqft.toLocaleString()} SF</span>
                </div>
                <div className="p-5 flex justify-between">
                  <span className="text-sm text-gray-500">Units</span>
                  <span className="text-sm font-medium text-gray-900">{units}</span>
                </div>
                <div className="p-5 flex justify-between">
                  <span className="text-sm text-gray-500">Stories</span>
                  <span className="text-sm font-medium text-gray-900">{stories}</span>
                </div>
                <div className="p-5 flex justify-between">
                  <span className="text-sm text-gray-500">Affordable Units</span>
                  <span className="text-sm font-medium text-gray-900">{affordablePercent}% at 80% AMI</span>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-teal-50 border border-teal-200">
                <h4 className="font-bold text-teal-900 text-sm mb-2">Your package will include:</h4>
                <div className="grid sm:grid-cols-2 gap-2">
                  {[
                    'AI Zoning Analysis',
                    'Compliance Check (0–100)',
                    'NEPA Assessment',
                    'Pattern Book Match',
                    'Assembly Cost Estimate',
                    'Pro Forma (NOI, Cap Rate)',
                    'Permit Checklist & Fees',
                    'Downloadable PDF Package',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-teal-800">
                      <Check className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-200">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <Link
                href="/development-package"
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Link>
            )}

            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: brand.teal }}
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
                style={{ backgroundColor: brand.navy }}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    Generate Package <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
