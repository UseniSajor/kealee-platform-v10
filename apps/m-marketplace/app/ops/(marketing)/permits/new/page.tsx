'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const permitTypes = [
  { id: 'building', label: 'Building Permit', icon: '🏗️' },
  { id: 'electrical', label: 'Electrical Permit', icon: '⚡' },
  { id: 'plumbing', label: 'Plumbing Permit', icon: '🔧' },
  { id: 'hvac', label: 'HVAC Permit', icon: '❄️' },
  { id: 'demolition', label: 'Demolition Permit', icon: '🔨' },
  { id: 'fire', label: 'Fire Permit', icon: '🔥' },
  { id: 'zoning', label: 'Zoning Permit', icon: '📐' },
  { id: 'environmental', label: 'Environmental Permit', icon: '🌿' },
  { id: 'historic', label: 'Historic Preservation', icon: '🏛️' },
];

const jurisdictions = [
  'Washington, DC',
  'Montgomery County, MD',
  "Prince George's County, MD",
  'Fairfax County, VA',
  'Arlington County, VA',
  'Alexandria, VA',
  'Anne Arundel County, MD',
  'Howard County, MD',
  'Baltimore City, MD',
  'Baltimore County, MD',
  'Loudoun County, VA',
  'Prince William County, VA',
  'Other',
];

export default function NewPermitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    permitType: '',
    jurisdiction: '',
    projectAddress: '',
    projectCity: '',
    projectState: '',
    projectZip: '',
    projectDescription: '',
    estimatedValue: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    contractorName: '',
    contractorLicense: '',
    urgency: 'standard',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Redirect to confirmation
    router.push('/ops/permits/confirmation');
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/ops/permits"
        className="inline-flex items-center gap-2 text-amber-600 hover:underline mb-6"
      >
        ← Back to Permits & Inspections
      </Link>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-black tracking-tight">New Permit Application</h1>
        <p className="mt-2 text-zinc-600">
          Fill out the form below and we&apos;ll help you submit your permit application.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= s ? 'bg-amber-500 text-white' : 'bg-zinc-200 text-zinc-500'
              }`}
            >
              {s}
            </div>
            {s < 3 && <div className={`w-12 h-1 ${step > s ? 'bg-amber-500' : 'bg-zinc-200'}`} />}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-8 text-sm text-zinc-600 mb-8">
        <span className={step === 1 ? 'font-semibold text-amber-600' : ''}>Project Details</span>
        <span className={step === 2 ? 'font-semibold text-amber-600' : ''}>Contact Info</span>
        <span className={step === 3 ? 'font-semibold text-amber-600' : ''}>Review & Submit</span>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm">
        {/* Step 1: Project Details */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">Permit Type *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {permitTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => updateField('permitType', type.id)}
                    className={`p-3 rounded-lg border text-center transition ${
                      formData.permitType === type.id
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="text-xl mb-1">{type.icon}</div>
                    <div className="text-xs font-medium">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">Jurisdiction *</label>
              <select
                value={formData.jurisdiction}
                onChange={(e) => updateField('jurisdiction', e.target.value)}
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                required
              >
                <option value="">Select jurisdiction...</option>
                {jurisdictions.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">Project Address *</label>
              <input
                type="text"
                value={formData.projectAddress}
                onChange={(e) => updateField('projectAddress', e.target.value)}
                placeholder="123 Main Street"
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">City *</label>
                <input
                  type="text"
                  value={formData.projectCity}
                  onChange={(e) => updateField('projectCity', e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">State *</label>
                <input
                  type="text"
                  value={formData.projectState}
                  onChange={(e) => updateField('projectState', e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">ZIP *</label>
                <input
                  type="text"
                  value={formData.projectZip}
                  onChange={(e) => updateField('projectZip', e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">Project Description *</label>
              <textarea
                value={formData.projectDescription}
                onChange={(e) => updateField('projectDescription', e.target.value)}
                rows={4}
                placeholder="Describe the scope of work for this permit..."
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">Estimated Project Value</label>
              <input
                type="text"
                value={formData.estimatedValue}
                onChange={(e) => updateField('estimatedValue', e.target.value)}
                placeholder="$50,000"
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
              />
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!formData.permitType || !formData.jurisdiction || !formData.projectAddress}
              className="w-full py-3 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Contact Info
            </button>
          </div>
        )}

        {/* Step 2: Contact Info */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg">Property Owner Information</h3>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">Owner Name *</label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => updateField('ownerName', e.target.value)}
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.ownerEmail}
                  onChange={(e) => updateField('ownerEmail', e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Phone *</label>
                <input
                  type="tel"
                  value={formData.ownerPhone}
                  onChange={(e) => updateField('ownerPhone', e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                  required
                />
              </div>
            </div>

            <h3 className="font-bold text-lg pt-4">Contractor Information (if applicable)</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Contractor Name</label>
                <input
                  type="text"
                  value={formData.contractorName}
                  onChange={(e) => updateField('contractorName', e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">License Number</label>
                <input
                  type="text"
                  value={formData.contractorLicense}
                  onChange={(e) => updateField('contractorLicense', e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">Processing Urgency</label>
              <div className="flex gap-4">
                {[
                  { id: 'standard', label: 'Standard', description: '5-10 business days' },
                  { id: 'expedited', label: 'Expedited', description: '2-3 business days (+$150)' },
                  { id: 'rush', label: 'Rush', description: '24-48 hours (+$350)' },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => updateField('urgency', option.id)}
                    className={`flex-1 p-4 rounded-lg border text-left transition ${
                      formData.urgency === option.id
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="font-semibold">{option.label}</div>
                    <div className="text-xs text-zinc-500">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 border border-zinc-300 text-zinc-700 font-bold rounded-lg hover:bg-zinc-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!formData.ownerName || !formData.ownerEmail}
                className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Review Application
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg">Review Your Application</h3>

            <div className="bg-zinc-50 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-500">Permit Type:</span>
                  <div className="font-semibold">{permitTypes.find((p) => p.id === formData.permitType)?.label}</div>
                </div>
                <div>
                  <span className="text-zinc-500">Jurisdiction:</span>
                  <div className="font-semibold">{formData.jurisdiction}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-500">Project Address:</span>
                  <div className="font-semibold">
                    {formData.projectAddress}, {formData.projectCity}, {formData.projectState} {formData.projectZip}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-500">Description:</span>
                  <div className="font-semibold">{formData.projectDescription}</div>
                </div>
                <div>
                  <span className="text-zinc-500">Owner:</span>
                  <div className="font-semibold">{formData.ownerName}</div>
                </div>
                <div>
                  <span className="text-zinc-500">Email:</span>
                  <div className="font-semibold">{formData.ownerEmail}</div>
                </div>
                {formData.contractorName && (
                  <div>
                    <span className="text-zinc-500">Contractor:</span>
                    <div className="font-semibold">{formData.contractorName}</div>
                  </div>
                )}
                <div>
                  <span className="text-zinc-500">Processing:</span>
                  <div className="font-semibold capitalize">{formData.urgency}</div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">📋</span>
                <div className="text-sm">
                  <p className="font-semibold text-amber-800">Full Service Fee: $325</p>
                  <p className="text-amber-700">
                    Includes application preparation, document review, submission, and status tracking.
                    {formData.urgency === 'expedited' && ' +$150 expedited processing.'}
                    {formData.urgency === 'rush' && ' +$350 rush processing.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-3 border border-zinc-300 text-zinc-700 font-bold rounded-lg hover:bg-zinc-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </main>
  );
}
