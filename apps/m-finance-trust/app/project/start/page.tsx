'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Shield, 
  DollarSign, 
  FileText, 
  CheckCircle,
  Home,
  Building2,
  Hammer,
  Plus
} from 'lucide-react';

export default function ProjectStartPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    projectType: '',
    projectName: '',
    projectAddress: '',
    estimatedBudget: '',
    projectDescription: '',
    startDate: '',
    duration: '',
    contractorSelected: false,
    contractorName: '',
    escrowAmount: '',
  });

  const projectTypes = [
    { id: 'new-construction', label: 'New Construction', icon: Building2, description: 'Ground-up new build projects' },
    { id: 'remodel', label: 'Remodel/Renovation', icon: Home, description: 'Home improvement and renovations' },
    { id: 'addition', label: 'Addition', icon: Plus, description: 'Room additions and expansions' },
    { id: 'commercial', label: 'Commercial', icon: Building2, description: 'Commercial construction projects' },
    { id: 'other', label: 'Other', icon: Hammer, description: 'Custom construction project' },
  ];

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const calculateEscrowFee = (amount: number) => {
    const fee = Math.min(amount * 0.01, 500);
    return fee;
  };

  const handleSubmit = () => {
    // Will redirect to escrow creation with pre-filled data
    console.log('Creating project with escrow:', formData);
    // Navigate to /escrow/new with query params
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Start Your Protected Project
          </h1>
          <p className="text-xl text-slate-600">
            Set up escrow protection in minutes. Your money stays safe until work is completed.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      step >= num
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {step > num ? <CheckCircle className="h-5 w-5" /> : num}
                  </div>
                  <span className="text-xs mt-2 text-slate-600 hidden sm:block">
                    {num === 1 && 'Project Type'}
                    {num === 2 && 'Details'}
                    {num === 3 && 'Budget'}
                    {num === 4 && 'Review'}
                  </span>
                </div>
                {num < 4 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-colors ${
                      step > num ? 'bg-emerald-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-3xl mx-auto">
          
          {/* Step 1: Project Type */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                What type of project are you planning?
              </h2>
              
              <div className="grid gap-4">
                {projectTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setFormData({ ...formData, projectType: type.id })}
                    className={`p-6 rounded-xl border-2 transition-all text-left hover:border-emerald-500 hover:shadow-md ${
                      formData.projectType === type.id
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        formData.projectType === type.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        <type.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-slate-900 mb-1">
                          {type.label}
                        </h3>
                        <p className="text-slate-600 text-sm">
                          {type.description}
                        </p>
                      </div>
                      {formData.projectType === type.id && (
                        <CheckCircle className="h-6 w-6 text-emerald-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-6">
                <button
                  onClick={handleNext}
                  disabled={!formData.projectType}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Next: Project Details
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Project Details */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Tell us about your project
              </h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  placeholder="e.g., Kitchen Remodel, New Home Construction"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Project Address *
                </label>
                <input
                  type="text"
                  value={formData.projectAddress}
                  onChange={(e) => setFormData({ ...formData, projectAddress: e.target.value })}
                  placeholder="123 Main Street, City, State ZIP"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Project Description
                </label>
                <textarea
                  value={formData.projectDescription}
                  onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                  placeholder="Describe the scope of work, materials, timeline, and any special requirements..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Estimated Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Duration (weeks)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="12"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-6">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!formData.projectName || !formData.projectAddress}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Next: Budget & Escrow
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Budget & Escrow */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Budget and Escrow Setup
              </h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Total Project Budget *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    $
                  </span>
                  <input
                    type="number"
                    value={formData.estimatedBudget}
                    onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                    placeholder="50,000"
                    className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Total estimated cost for the entire project
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Initial Escrow Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    $
                  </span>
                  <input
                    type="number"
                    value={formData.escrowAmount}
                    onChange={(e) => setFormData({ ...formData, escrowAmount: e.target.value })}
                    placeholder="50,000"
                    className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Amount to deposit into escrow initially (typically full project amount)
                </p>
              </div>

              {/* Fee Calculator */}
              {formData.escrowAmount && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                  <h3 className="font-bold text-slate-900 mb-4">Estimated Fees</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-700">Escrow Amount:</span>
                      <span className="font-semibold text-slate-900">
                        ${Number(formData.escrowAmount).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700">Escrow Fee (1%):</span>
                      <span className="font-semibold text-slate-900">
                        ${calculateEscrowFee(Number(formData.escrowAmount)).toLocaleString()}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-emerald-300">
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-900">Total to Deposit:</span>
                        <span className="font-bold text-emerald-600 text-lg">
                          ${(Number(formData.escrowAmount) + calculateEscrowFee(Number(formData.escrowAmount))).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-4">
                    💡 Escrow fee is capped at $500 for any project size
                  </p>
                </div>
              )}

              {/* Contractor Selection */}
              <div className="border-t pt-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.contractorSelected}
                    onChange={(e) => setFormData({ ...formData, contractorSelected: e.target.checked })}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-slate-700 font-medium">
                    I&apos;ve already selected a contractor
                  </span>
                </label>

                {formData.contractorSelected && (
                  <div className="mt-4 ml-8">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Contractor Name/Company
                    </label>
                    <input
                      type="text"
                      value={formData.contractorName}
                      onChange={(e) => setFormData({ ...formData, contractorName: e.target.value })}
                      placeholder="ABC Construction Company"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}

                {!formData.contractorSelected && (
                  <p className="text-sm text-slate-600 mt-3 ml-8">
                    No problem! You can find verified contractors in our{' '}
                    <Link href="/marketplace" className="text-emerald-600 hover:underline">
                      marketplace
                    </Link>
                    {' '}after creating your project.
                  </p>
                )}
              </div>

              <div className="flex justify-between pt-6">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!formData.escrowAmount}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Next: Review
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review & Confirm */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Review Your Project
              </h2>

              <div className="bg-slate-50 rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">Project Type</h3>
                  <p className="text-lg font-semibold text-slate-900 capitalize">
                    {formData.projectType.replace('-', ' ')}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">Project Name</h3>
                  <p className="text-lg font-semibold text-slate-900">
                    {formData.projectName}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">Address</h3>
                  <p className="text-lg font-semibold text-slate-900">
                    {formData.projectAddress}
                  </p>
                </div>

                {formData.estimatedBudget && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Total Budget</h3>
                    <p className="text-lg font-semibold text-slate-900">
                      ${Number(formData.estimatedBudget).toLocaleString()}
                    </p>
                  </div>
                )}

                {formData.contractorName && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Contractor</h3>
                    <p className="text-lg font-semibold text-slate-900">
                      {formData.contractorName}
                    </p>
                  </div>
                )}
              </div>

              {/* Escrow Summary */}
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-6 border border-emerald-200">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-600" />
                  Escrow Account Summary
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700">Escrow Amount:</span>
                    <span className="text-2xl font-bold text-slate-900">
                      ${Number(formData.escrowAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">One-time Escrow Fee (1%):</span>
                    <span className="font-semibold text-slate-900">
                      ${calculateEscrowFee(Number(formData.escrowAmount)).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-emerald-300">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">Total Due Now:</span>
                      <span className="text-2xl font-bold text-emerald-600">
                        ${(Number(formData.escrowAmount) + calculateEscrowFee(Number(formData.escrowAmount))).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* What Happens Next */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-bold text-slate-900 mb-4">
                  What happens next?
                </h3>
                <ol className="space-y-3">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </span>
                    <span className="text-slate-700">
                      Your escrow account is created and funds are secured
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </span>
                    <span className="text-slate-700">
                      You set up project milestones and payment schedule
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </span>
                    <span className="text-slate-700">
                      Work begins - contractor knows funds are secured
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      4
                    </span>
                    <span className="text-slate-700">
                      You approve completed milestones → funds release automatically
                    </span>
                  </li>
                </ol>
              </div>

              {/* Terms Agreement */}
              <div className="border-t pt-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 mt-0.5"
                  />
                  <span className="text-sm text-slate-700">
                    I agree to the{' '}
                    <Link href="/terms" className="text-emerald-600 hover:underline">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link href="/escrow-agreement" className="text-emerald-600 hover:underline">
                      Escrow Agreement
                    </Link>
                  </span>
                </label>
              </div>

              <div className="flex justify-between pt-6">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-blue-700 transition-colors flex items-center gap-2"
                >
                  <Shield className="h-5 w-5" />
                  Create Protected Project
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-16">
          <div className="text-center">
            <Shield className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-900">FDIC Insured</p>
            <p className="text-xs text-slate-600">Up to $250,000</p>
          </div>
          <div className="text-center">
            <Lock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-900">Bank-Level Security</p>
            <p className="text-xs text-slate-600">256-bit encryption</p>
          </div>
          <div className="text-center">
            <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-900">Legal Protection</p>
            <p className="text-xs text-slate-600">Binding agreements</p>
          </div>
          <div className="text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-900">Licensed Escrow</p>
            <p className="text-xs text-slate-600">Fully compliant</p>
          </div>
        </div>
      </div>
    </div>
  );
}
