'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, DollarSign, CheckCircle, Loader2, Info } from 'lucide-react';

export default function NewEscrowPage() {
  const [formData, setFormData] = useState({
    projectName: '',
    projectAddress: '',
    totalBudget: '',
    initialDeposit: '',
    contractorName: '',
    contractorEmail: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-zinc-50 py-12 px-6">
        <div className="max-w-xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-emerald-600" size={40} />
            </div>
            <h1 className="text-2xl font-black text-zinc-900 mb-2">Escrow Account Created</h1>
            <p className="text-zinc-600 mb-4">
              Your escrow account for <strong>{formData.projectName}</strong> has been created.
            </p>
            <p className="text-sm text-zinc-500 mb-6">
              An invitation has been sent to {formData.contractorEmail} to join the project.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/"
                className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition"
              >
                Back to Dashboard
              </Link>
              <Link
                href="/deposit"
                className="px-6 py-3 border border-zinc-200 text-zinc-700 font-semibold rounded-lg hover:bg-zinc-50 transition"
              >
                Add Funds
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-6">
      <div className="max-w-2xl mx-auto">

        <Link href="/" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-8">
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-zinc-900 mb-2">Create Escrow Account</h1>
          <p className="text-zinc-600">Set up a new escrow account for your construction project</p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex items-start gap-3">
          <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">How Escrow Works</p>
            <p>
              Your funds are held securely and released to contractors only when you approve completed milestones.
              This protects both you and your contractor throughout the project.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit}>

            {/* Project Information */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-zinc-900 mb-4">Project Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    placeholder="e.g., Kitchen Remodel"
                    required
                    className="w-full px-4 py-3 border-2 border-zinc-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-2">
                    Project Address *
                  </label>
                  <input
                    type="text"
                    value={formData.projectAddress}
                    onChange={(e) => setFormData({ ...formData, projectAddress: e.target.value })}
                    placeholder="123 Main Street, Washington, DC 20001"
                    required
                    className="w-full px-4 py-3 border-2 border-zinc-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>
            </div>

            {/* Budget Information */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-zinc-900 mb-4">Budget Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-2">
                    Total Project Budget *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input
                      type="number"
                      value={formData.totalBudget}
                      onChange={(e) => setFormData({ ...formData, totalBudget: e.target.value })}
                      placeholder="0.00"
                      required
                      min="1000"
                      className="w-full pl-10 pr-4 py-3 border-2 border-zinc-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-2">
                    Initial Deposit *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input
                      type="number"
                      value={formData.initialDeposit}
                      onChange={(e) => setFormData({ ...formData, initialDeposit: e.target.value })}
                      placeholder="0.00"
                      required
                      min="500"
                      className="w-full pl-10 pr-4 py-3 border-2 border-zinc-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Minimum deposit is 10% of project budget
                  </p>
                </div>
              </div>
            </div>

            {/* Contractor Information */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-zinc-900 mb-4">Contractor Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-2">
                    Contractor Name *
                  </label>
                  <input
                    type="text"
                    value={formData.contractorName}
                    onChange={(e) => setFormData({ ...formData, contractorName: e.target.value })}
                    placeholder="ABC Construction LLC"
                    required
                    className="w-full px-4 py-3 border-2 border-zinc-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-2">
                    Contractor Email *
                  </label>
                  <input
                    type="email"
                    value={formData.contractorEmail}
                    onChange={(e) => setFormData({ ...formData, contractorEmail: e.target.value })}
                    placeholder="contractor@example.com"
                    required
                    className="w-full px-4 py-3 border-2 border-zinc-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                An invitation will be sent to the contractor to join this escrow account.
              </p>
            </div>

            {/* Fee Summary */}
            {formData.totalBudget && (
              <div className="bg-zinc-50 rounded-xl p-6 mb-8">
                <h3 className="font-bold text-zinc-900 mb-4">Fee Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Total Budget:</span>
                    <span className="font-semibold">${Number(formData.totalBudget).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Initial Deposit:</span>
                    <span className="font-semibold">${Number(formData.initialDeposit || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Platform Fee (3%):</span>
                    <span className="font-semibold">
                      ${(Number(formData.totalBudget) * 0.03).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-zinc-200 mt-2 flex justify-between">
                    <span className="text-zinc-900 font-semibold">Due Now:</span>
                    <span className="text-xl font-black text-emerald-600">
                      ${Number(formData.initialDeposit || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Creating Account...
                </>
              ) : (
                <>
                  <Building2 size={20} />
                  Create Escrow Account
                </>
              )}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}
