'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  MapPin,
  Search,
  Building2,
  Home,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const brand = {
  navy: '#1A2B4A',
  teal: '#0D9488',
  orange: '#C8882A',
  green: '#059669',
};

type HousingType = 'SINGLE_FAMILY' | 'ADU' | 'DUPLEX' | 'TRIPLEX' | 'FOURPLEX' | 'TOWNHOUSE' | 'SMALL_APARTMENT' | 'MIXED_USE';

const housingOptions: { value: HousingType; label: string; icon: typeof Home; desc: string }[] = [
  { value: 'SINGLE_FAMILY', label: 'Single Family', icon: Home, desc: '1 unit detached home' },
  { value: 'ADU', label: 'ADU', icon: Home, desc: 'Accessory dwelling unit' },
  { value: 'DUPLEX', label: 'Duplex', icon: Building2, desc: '2 units' },
  { value: 'TRIPLEX', label: 'Triplex', icon: Building2, desc: '3 units' },
  { value: 'FOURPLEX', label: 'Fourplex', icon: Building2, desc: '4 units' },
  { value: 'TOWNHOUSE', label: 'Townhouse', icon: Layers, desc: '3-8 attached units' },
  { value: 'SMALL_APARTMENT', label: 'Small Apartment', icon: Building2, desc: '5-20 units' },
  { value: 'MIXED_USE', label: 'Mixed-Use', icon: Building2, desc: 'Residential + commercial' },
];

type Step = 'address' | 'type' | 'details' | 'review';

export default function ZoningAnalyzePage() {
  const searchParams = useSearchParams();
  const initialAddress = searchParams.get('address') || '';

  const [step, setStep] = useState<Step>(initialAddress ? 'type' : 'address');
  const [address, setAddress] = useState(initialAddress);
  const [housingType, setHousingType] = useState<HousingType | ''>('');
  const [units, setUnits] = useState('');
  const [stories, setStories] = useState('');
  const [sqFt, setSqFt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!address || !housingType) return;
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/zoning/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          housingType,
          units: units ? parseInt(units) : undefined,
          stories: stories ? parseInt(stories) : undefined,
          sqFt: sqFt ? parseInt(sqFt) : undefined,
        }),
      });

      if (!response.ok) throw new Error('Analysis failed. Please try again.');

      const data = await response.json();
      if (data.profileId) {
        window.location.href = `/zoning/report/${data.profileId}`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps: { key: Step; label: string }[] = [
    { key: 'address', label: 'Address' },
    { key: 'type', label: 'Building Type' },
    { key: 'details', label: 'Details' },
    { key: 'review', label: 'Review' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/zoning" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" /> Back to Zoning
          </Link>
          <span className="text-sm font-medium" style={{ color: brand.teal }}>Zoning Analysis</span>
        </div>
      </nav>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            {steps.map((s, idx) => (
              <div key={s.key} className="flex items-center">
                <div className={`flex items-center gap-2 ${idx <= currentStepIndex ? 'text-teal-600' : 'text-gray-400'}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      idx < currentStepIndex ? 'bg-teal-600 text-white' : idx === currentStepIndex ? 'border-2 border-teal-600 text-teal-600' : 'border-2 border-gray-300 text-gray-400'
                    }`}
                  >
                    {idx < currentStepIndex ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                  </div>
                  <span className="text-sm font-medium hidden sm:block">{s.label}</span>
                </div>
                {idx < steps.length - 1 && <div className={`w-12 sm:w-20 h-0.5 mx-2 ${idx < currentStepIndex ? 'bg-teal-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Step 1: Address */}
        {step === 'address' && (
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: brand.navy }}>Enter the Property Address</h2>
            <p className="text-gray-600 mb-8">We will auto-detect the jurisdiction and zoning district.</p>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="123 Main St, City, State ZIP"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={() => address && setStep('type')}
                disabled={!address}
                className="px-6 py-3 rounded-xl font-semibold text-white flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition"
                style={{ backgroundColor: brand.teal }}
              >
                Next: Building Type <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Housing Type */}
        {step === 'type' && (
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: brand.navy }}>Select Building Type</h2>
            <p className="text-gray-600 mb-8">What type of housing are you proposing for this site?</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {housingOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = housingType === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setHousingType(opt.value)}
                    className={`rounded-xl p-5 border-2 text-center transition ${
                      isSelected ? 'border-teal-500 bg-teal-50 shadow-md' : 'border-gray-200 bg-white hover:border-teal-300'
                    }`}
                  >
                    <Icon className={`w-8 h-8 mx-auto mb-2 ${isSelected ? 'text-teal-600' : 'text-gray-400'}`} />
                    <h4 className="font-semibold text-sm text-gray-900">{opt.label}</h4>
                    <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setStep('address')} className="px-6 py-3 rounded-xl font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 transition">
                Back
              </button>
              <button
                onClick={() => housingType && setStep('details')}
                disabled={!housingType}
                className="px-6 py-3 rounded-xl font-semibold text-white flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition"
                style={{ backgroundColor: brand.teal }}
              >
                Next: Details <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Details */}
        {step === 'details' && (
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: brand.navy }}>Project Details</h2>
            <p className="text-gray-600 mb-8">Optional — provide additional details for a more accurate analysis.</p>

            <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Units</label>
                <input
                  type="number"
                  placeholder="e.g. 4"
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Stories</label>
                <input
                  type="number"
                  placeholder="e.g. 3"
                  value={stories}
                  onChange={(e) => setStories(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Square Footage</label>
                <input
                  type="number"
                  placeholder="e.g. 4800"
                  value={sqFt}
                  onChange={(e) => setSqFt(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setStep('type')} className="px-6 py-3 rounded-xl font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 transition">
                Back
              </button>
              <button
                onClick={() => setStep('review')}
                className="px-6 py-3 rounded-xl font-semibold text-white flex items-center gap-2 hover:opacity-90 transition"
                style={{ backgroundColor: brand.teal }}
              >
                Next: Review <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 'review' && (
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: brand.navy }}>Review & Analyze</h2>
            <p className="text-gray-600 mb-8">Confirm the details below and run your zoning analysis.</p>

            <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-sm text-gray-500">Address</span>
                <span className="text-sm font-medium text-gray-900">{address}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-sm text-gray-500">Housing Type</span>
                <span className="text-sm font-medium text-gray-900">{housingOptions.find(h => h.value === housingType)?.label || '—'}</span>
              </div>
              {units && (
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Units</span>
                  <span className="text-sm font-medium text-gray-900">{units}</span>
                </div>
              )}
              {stories && (
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Stories</span>
                  <span className="text-sm font-medium text-gray-900">{stories}</span>
                </div>
              )}
              {sqFt && (
                <div className="flex justify-between py-3">
                  <span className="text-sm text-gray-500">Square Footage</span>
                  <span className="text-sm font-medium text-gray-900">{parseInt(sqFt).toLocaleString()} sq ft</span>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <button onClick={() => setStep('details')} className="px-6 py-3 rounded-xl font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 transition">
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl font-semibold text-white flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition"
                style={{ backgroundColor: brand.teal }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" /> Run Zoning Analysis
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
