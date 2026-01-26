'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  FileText,
  Users,
  Pencil,
  CheckCircle,
  Loader2,
} from 'lucide-react';

const services = [
  {
    id: 'architect',
    name: 'Architect Services',
    description: 'Permit-ready drawings, 3D renderings, and design development',
    icon: Pencil,
    color: 'green',
  },
  {
    id: 'permits',
    name: 'Permits & Inspections',
    description: 'AI-powered permit processing and inspection scheduling',
    icon: FileText,
    color: 'purple',
  },
  {
    id: 'ops',
    name: 'PM Services',
    description: 'Full-service construction project management',
    icon: Building2,
    color: 'blue',
  },
  {
    id: 'portal',
    name: 'Project Owner Portal',
    description: 'Track milestones, approve payments, and manage projects',
    icon: Users,
    color: 'orange',
  },
];

const projectTypes = [
  'Renovation',
  'Remodel',
  'Addition',
  'New Construction',
  'ADU',
  'Commercial',
  'Other',
];

const budgetRanges = [
  'Under $5,000',
  '$5,000 - $15,000',
  '$15,000 - $50,000',
  '$50,000 - $100,000',
  '$100,000 - $250,000',
  '$250,000+',
];

const timelines = [
  'As soon as possible',
  'Within 1 month',
  '1-3 months',
  '3-6 months',
  '6+ months',
  'Flexible',
];

export default function NewQuotePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    serviceType: '',
    projectType: '',
    propertyAddress: '',
    projectDescription: '',
    estimatedBudget: '',
    timeline: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    additionalNotes: '',
  });

  const selectedService = services.find((s) => s.id === formData.serviceType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/dashboard/quotes?success=true');
      }
    } catch (error) {
      console.error('Error submitting quote:', error);
    } finally {
      setLoading(false);
    }
  };

  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    green: { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-600' },
    purple: { bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-600' },
    blue: { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-600' },
    orange: { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-600' },
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/quotes"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft size={18} />
          Back to Quotes
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Request a Quote</h1>
        <p className="text-slate-600 mt-1">Tell us about your project and we'll connect you with the right services</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {step > s ? <CheckCircle size={16} /> : s}
            </div>
            <span className={`text-sm ${step >= s ? 'text-slate-900' : 'text-slate-500'}`}>
              {s === 1 ? 'Service' : s === 2 ? 'Details' : 'Contact'}
            </span>
            {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-blue-600' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          {/* Step 1: Service Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900">Select a Service</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {services.map((service) => {
                  const colors = colorMap[service.color];
                  const isSelected = formData.serviceType === service.id;
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, serviceType: service.id })}
                      className={`p-6 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? `${colors.border} ${colors.bg}`
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center mb-4`}>
                        <service.icon className={colors.text} size={24} />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-1">{service.name}</h3>
                      <p className="text-sm text-slate-600">{service.description}</p>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!formData.serviceType}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Project Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl mb-6">
                {selectedService && (
                  <>
                    <div className={`w-10 h-10 ${colorMap[selectedService.color].bg} rounded-lg flex items-center justify-center`}>
                      <selectedService.icon className={colorMap[selectedService.color].text} size={20} />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{selectedService.name}</div>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Change service
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Project Type</label>
                <select
                  value={formData.projectType}
                  onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                >
                  <option value="">Select project type</option>
                  {projectTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Property Address</label>
                <input
                  type="text"
                  value={formData.propertyAddress}
                  onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="123 Main Street, City, State ZIP"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Project Description</label>
                <textarea
                  value={formData.projectDescription}
                  onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  placeholder="Describe your project in detail..."
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Estimated Budget</label>
                  <select
                    value={formData.estimatedBudget}
                    onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">Select budget range</option>
                    {budgetRanges.map((range) => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Timeline</label>
                  <select
                    value={formData.timeline}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">Select timeline</option>
                    {timelines.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!formData.projectType}
                  className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Contact Information */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900">Contact Information</h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="John Smith"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="john@company.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Additional Notes</label>
                <textarea
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  placeholder="Any other details you'd like to share..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.contactName || !formData.contactEmail}
                  className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Quote Request'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
