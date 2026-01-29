'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, DollarSign, Building2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface Milestone {
  id: string;
  name: string;
  amount: number;
  contractor: string;
  status: 'pending' | 'ready' | 'released';
}

export default function NewReleasePage() {
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedMilestone, setSelectedMilestone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const projects = [
    { id: '1', name: 'Modern Kitchen Remodel', balance: 45000 },
    { id: '2', name: 'Home Addition', balance: 125000 },
    { id: '3', name: 'Backyard Renovation', balance: 32500 },
    { id: '4', name: 'Master Bath Upgrade', balance: 18750 },
  ];

  const milestones: Record<string, Milestone[]> = {
    '1': [
      { id: 'm1', name: 'Demolition Complete', amount: 5000, contractor: 'ABC Demolition', status: 'released' },
      { id: 'm2', name: 'Rough Plumbing', amount: 15000, contractor: 'ABC Plumbing', status: 'ready' },
      { id: 'm3', name: 'Electrical Rough-In', amount: 12000, contractor: 'Sparks Electric', status: 'pending' },
    ],
    '2': [
      { id: 'm4', name: 'Foundation Complete', amount: 35000, contractor: 'BuildRight LLC', status: 'ready' },
      { id: 'm5', name: 'Framing Complete', amount: 45000, contractor: 'BuildRight LLC', status: 'pending' },
    ],
    '3': [
      { id: 'm6', name: 'Site Prep', amount: 8000, contractor: 'Green Landscapes', status: 'released' },
      { id: 'm7', name: 'Hardscape Installation', amount: 15000, contractor: 'Green Landscapes', status: 'ready' },
    ],
    '4': [
      { id: 'm8', name: 'Tile Installation', amount: 8500, contractor: 'Tile Masters', status: 'ready' },
    ],
  };

  const selectedProjectData = projects.find(p => p.id === selectedProject);
  const availableMilestones = selectedProject ? milestones[selectedProject] || [] : [];
  const selectedMilestoneData = availableMilestones.find(m => m.id === selectedMilestone);

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
            <h1 className="text-2xl font-black text-zinc-900 mb-2">Release Initiated</h1>
            <p className="text-zinc-600 mb-6">
              The payment release of ${selectedMilestoneData?.amount.toLocaleString()} has been initiated
              and will be processed within 1-2 business days.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/"
                className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition"
              >
                Back to Dashboard
              </Link>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setSelectedProject('');
                  setSelectedMilestone('');
                  setNotes('');
                }}
                className="px-6 py-3 border border-zinc-200 text-zinc-700 font-semibold rounded-lg hover:bg-zinc-50 transition"
              >
                Create Another
              </button>
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
            <Send className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-zinc-900 mb-2">New Payment Release</h1>
          <p className="text-zinc-600">Release escrow funds for completed milestones</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit}>

            {/* Project Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Select Project *
              </label>
              <select
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  setSelectedMilestone('');
                }}
                required
                className="w-full px-4 py-3 border-2 border-zinc-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Choose a project...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${p.balance.toLocaleString()} available)
                  </option>
                ))}
              </select>
            </div>

            {/* Milestone Selection */}
            {selectedProject && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-zinc-700 mb-2">
                  Select Milestone *
                </label>
                <div className="space-y-3">
                  {availableMilestones.map(milestone => (
                    <label
                      key={milestone.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition ${
                        selectedMilestone === milestone.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : milestone.status === 'released'
                          ? 'border-zinc-100 bg-zinc-50 opacity-50 cursor-not-allowed'
                          : 'border-zinc-200 hover:border-emerald-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="milestone"
                        value={milestone.id}
                        checked={selectedMilestone === milestone.id}
                        onChange={(e) => setSelectedMilestone(e.target.value)}
                        disabled={milestone.status === 'released'}
                        className="w-4 h-4 text-emerald-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-900">{milestone.name}</span>
                          {milestone.status === 'released' && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-zinc-200 text-zinc-600 rounded-full">
                              Released
                            </span>
                          )}
                          {milestone.status === 'ready' && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                              Ready
                            </span>
                          )}
                          {milestone.status === 'pending' && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full">
                              Pending Approval
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-500">Contractor: {milestone.contractor}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-emerald-600">
                          ${milestone.amount.toLocaleString()}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedMilestone && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-zinc-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any notes about this release..."
                  className="w-full px-4 py-3 border-2 border-zinc-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
                />
              </div>
            )}

            {/* Summary */}
            {selectedMilestoneData && (
              <div className="bg-zinc-50 rounded-xl p-6 mb-6">
                <h3 className="font-bold text-zinc-900 mb-4">Release Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Project:</span>
                    <span className="font-semibold">{selectedProjectData?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Milestone:</span>
                    <span className="font-semibold">{selectedMilestoneData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Contractor:</span>
                    <span className="font-semibold">{selectedMilestoneData.contractor}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-zinc-200 mt-2">
                    <span className="text-zinc-900 font-semibold">Release Amount:</span>
                    <span className="text-xl font-black text-emerald-600">
                      ${selectedMilestoneData.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Warning */}
            {selectedMilestoneData?.status === 'pending' && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm">
                  <p className="font-semibold text-amber-800">This milestone is pending approval</p>
                  <p className="text-amber-700">
                    Please verify that the work has been completed to your satisfaction before releasing funds.
                  </p>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!selectedMilestone || submitting}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing Release...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Initiate Release
                </>
              )}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}
