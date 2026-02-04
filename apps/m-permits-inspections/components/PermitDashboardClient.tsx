// apps/m-permits-inspections/components/PermitDashboardClient.tsx
// Permit Dashboard Client Component with List/Kanban Views

'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface Permit {
  id: string;
  permitNumber: string;
  address: string;
  type: 'building' | 'electrical' | 'plumbing' | 'mechanical' | 'renovation' | 'demolition';
  jurisdiction: string;
  status: 'submitted' | 'in_review' | 'corrections' | 'approved' | 'inspection' | 'complete';
  progress: number; // 1-5
  lastUpdated: string;
  submittedDate: string;
  estimatedApproval?: string;
  inspector?: string;
  notes?: string;
}

interface PermitDashboardClientProps {
  initialPermits: Permit[];
}

const statusConfig = {
  submitted: { label: 'Submitted', color: 'bg-yellow-100 text-yellow-800', icon: '🟡', column: 0 },
  in_review: { label: 'In Review', color: 'bg-blue-100 text-blue-800', icon: '🔵', column: 1 },
  corrections: { label: 'Corrections Needed', color: 'bg-orange-100 text-orange-800', icon: '🟠', column: 2 },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: '🟢', column: 3 },
  inspection: { label: 'Inspection Scheduled', color: 'bg-purple-100 text-purple-800', icon: '🔵', column: 4 },
  complete: { label: 'Complete', color: 'bg-emerald-100 text-emerald-800', icon: '✅', column: 4 },
};

const typeConfig = {
  building: { label: 'Building', color: 'bg-slate-100 text-slate-700' },
  electrical: { label: 'Electrical', color: 'bg-amber-100 text-amber-700' },
  plumbing: { label: 'Plumbing', color: 'bg-cyan-100 text-cyan-700' },
  mechanical: { label: 'Mechanical', color: 'bg-red-100 text-red-700' },
  renovation: { label: 'Renovation', color: 'bg-violet-100 text-violet-700' },
  demolition: { label: 'Demolition', color: 'bg-gray-100 text-gray-700' },
};

const kanbanColumns = [
  { id: 'submitted', title: 'Submitted', statuses: ['submitted'] },
  { id: 'in_review', title: 'In Review', statuses: ['in_review'] },
  { id: 'corrections', title: 'Corrections', statuses: ['corrections'] },
  { id: 'approved', title: 'Approved', statuses: ['approved'] },
  { id: 'inspections', title: 'Inspections', statuses: ['inspection', 'complete'] },
];

function ProgressDots({ progress }: { progress: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((dot) => (
        <div
          key={dot}
          className={`w-2 h-2 rounded-full ${
            dot <= progress ? 'bg-[#38A169]' : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

function PermitCard({
  permit,
  onClick,
  isSelected,
  isDragging,
}: {
  permit: Permit;
  onClick: () => void;
  isSelected: boolean;
  isDragging?: boolean;
}) {
  const status = statusConfig[permit.status];
  const type = typeConfig[permit.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onClick={onClick}
      className={`bg-white rounded-lg border p-4 cursor-pointer transition-all ${
        isSelected
          ? 'border-[#E8793A] ring-2 ring-[#E8793A]/20'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      } ${isDragging ? 'shadow-lg rotate-2' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-[#1A2B4A]">{permit.permitNumber}</p>
          <p className="text-sm text-gray-600 truncate max-w-[200px]">{permit.address}</p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${type.color}`}>
          {type.label}
        </span>
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
          <span>{status.icon}</span>
          {status.label}
        </span>
        <ProgressDots progress={permit.progress} />
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-500">{permit.jurisdiction}</span>
        <span className="text-xs text-gray-400">Updated {permit.lastUpdated}</span>
      </div>
    </motion.div>
  );
}

function PermitRow({
  permit,
  onClick,
  isSelected,
}: {
  permit: Permit;
  onClick: () => void;
  isSelected: boolean;
}) {
  const status = statusConfig[permit.status];
  const type = typeConfig[permit.type];

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClick}
      className={`cursor-pointer transition-colors ${
        isSelected ? 'bg-[#E8793A]/5' : 'hover:bg-gray-50'
      }`}
    >
      <td className="px-4 py-4">
        <div>
          <p className="font-semibold text-[#1A2B4A]">{permit.permitNumber}</p>
          <p className="text-sm text-gray-600">{permit.address}</p>
        </div>
      </td>
      <td className="px-4 py-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${type.color}`}>
          {type.label}
        </span>
      </td>
      <td className="px-4 py-4 text-sm text-gray-600">{permit.jurisdiction}</td>
      <td className="px-4 py-4">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
          <span>{status.icon}</span>
          {status.label}
        </span>
      </td>
      <td className="px-4 py-4">
        <ProgressDots progress={permit.progress} />
      </td>
      <td className="px-4 py-4 text-sm text-gray-500">{permit.lastUpdated}</td>
      <td className="px-4 py-4">
        <button className="text-[#E8793A] hover:text-[#d16a2f] text-sm font-medium">
          View Details →
        </button>
      </td>
    </motion.tr>
  );
}

function DetailPanel({ permit, onClose }: { permit: Permit; onClose: () => void }) {
  const status = statusConfig[permit.status];
  const type = typeConfig[permit.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-96 bg-white border-l border-gray-200 h-full overflow-y-auto"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#1A2B4A]">Permit Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Permit Number & Address */}
          <div>
            <p className="text-2xl font-bold text-[#1A2B4A]">{permit.permitNumber}</p>
            <p className="text-gray-600 mt-1">{permit.address}</p>
          </div>

          {/* Status & Type */}
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
              {status.icon} {status.label}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${type.color}`}>
              {type.label}
            </span>
          </div>

          {/* Progress */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Progress</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#38A169] rounded-full transition-all"
                  style={{ width: `${(permit.progress / 5) * 100}%` }}
                />
              </div>
              <span className="text-sm text-gray-600">{permit.progress}/5</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Jurisdiction</p>
              <p className="text-sm font-medium text-[#1A2B4A] mt-1">{permit.jurisdiction}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Submitted</p>
              <p className="text-sm font-medium text-[#1A2B4A] mt-1">{permit.submittedDate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Last Updated</p>
              <p className="text-sm font-medium text-[#1A2B4A] mt-1">{permit.lastUpdated}</p>
            </div>
            {permit.estimatedApproval && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Est. Approval</p>
                <p className="text-sm font-medium text-[#1A2B4A] mt-1">{permit.estimatedApproval}</p>
              </div>
            )}
          </div>

          {/* Inspector */}
          {permit.inspector && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Assigned Inspector</p>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-[#1A2B4A] rounded-full flex items-center justify-center text-white font-medium">
                  {permit.inspector.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-medium text-[#1A2B4A]">{permit.inspector}</p>
                  <p className="text-sm text-gray-500">Building Inspector</p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {permit.notes && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Notes</p>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{permit.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-4 border-t border-gray-200">
            <Link
              href={`/permits/${permit.id}`}
              className="block w-full py-2.5 px-4 bg-[#E8793A] text-white font-medium rounded-lg text-center hover:bg-[#d16a2f] transition-colors"
            >
              View Full Details
            </Link>
            <button className="w-full py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
              Download Documents
            </button>
            {permit.status === 'approved' && (
              <button className="w-full py-2.5 px-4 border border-[#38A169] text-[#38A169] font-medium rounded-lg hover:bg-[#38A169]/5 transition-colors">
                Schedule Inspection
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-48 h-48 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <svg className="w-24 h-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-[#1A2B4A] mb-2">No permits yet</h3>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        Start your first permit application and track it from submission to approval.
      </p>
      <Link
        href="/apply"
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#E8793A] text-white font-semibold rounded-xl hover:bg-[#d16a2f] transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Start Your First Permit
      </Link>
    </div>
  );
}

export function PermitDashboardClient({ initialPermits }: PermitDashboardClientProps) {
  const [permits] = useState<Permit[]>(initialPermits);
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    jurisdiction: 'all',
    dateRange: 'all',
  });

  const jurisdictions = [...new Set(permits.map(p => p.jurisdiction))];

  const filteredPermits = permits.filter(permit => {
    if (filters.status !== 'all' && permit.status !== filters.status) return false;
    if (filters.jurisdiction !== 'all' && permit.jurisdiction !== filters.jurisdiction) return false;
    // Date range filtering would go here
    return true;
  });

  const handlePermitClick = useCallback((permit: Permit) => {
    setSelectedPermit(prev => prev?.id === permit.id ? null : permit);
  }, []);

  if (permits.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-[#1A2B4A]">My Permits</h1>
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#E8793A] text-white font-semibold rounded-lg hover:bg-[#d16a2f] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Permit Application
            </Link>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <EmptyState />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#1A2B4A]">My Permits</h1>
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#E8793A] text-white font-semibold rounded-lg hover:bg-[#d16a2f] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Permit Application
          </Link>
        </div>

        {/* Filters & View Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-3">
            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8793A]/20 focus:border-[#E8793A]"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="in_review">In Review</option>
              <option value="corrections">Corrections</option>
              <option value="approved">Approved</option>
              <option value="inspection">Inspection</option>
              <option value="complete">Complete</option>
            </select>

            {/* Jurisdiction Filter */}
            <select
              value={filters.jurisdiction}
              onChange={(e) => setFilters(prev => ({ ...prev, jurisdiction: e.target.value }))}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8793A]/20 focus:border-[#E8793A]"
            >
              <option value="all">All Jurisdictions</option>
              {jurisdictions.map(j => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>

            {/* Date Range Filter */}
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8793A]/20 focus:border-[#E8793A]"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex bg-white border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setView('list')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                view === 'list'
                  ? 'bg-[#1A2B4A] text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                view === 'kanban'
                  ? 'bg-[#1A2B4A] text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Kanban Board
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-0">
          <div className={`flex-1 ${selectedPermit ? 'mr-0' : ''}`}>
            <AnimatePresence mode="wait">
              {view === 'list' ? (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Permit</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Jurisdiction</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Progress</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Updated</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <AnimatePresence>
                        {filteredPermits.map(permit => (
                          <PermitRow
                            key={permit.id}
                            permit={permit}
                            onClick={() => handlePermitClick(permit)}
                            isSelected={selectedPermit?.id === permit.id}
                          />
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </motion.div>
              ) : (
                <motion.div
                  key="kanban"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-4 overflow-x-auto pb-4"
                >
                  {kanbanColumns.map(column => {
                    const columnPermits = filteredPermits.filter(p =>
                      column.statuses.includes(p.status)
                    );
                    return (
                      <div
                        key={column.id}
                        className="flex-shrink-0 w-72 bg-gray-100 rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-[#1A2B4A]">{column.title}</h3>
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
                            {columnPermits.length}
                          </span>
                        </div>
                        <div className="space-y-3">
                          <AnimatePresence>
                            {columnPermits.map(permit => (
                              <PermitCard
                                key={permit.id}
                                permit={permit}
                                onClick={() => handlePermitClick(permit)}
                                isSelected={selectedPermit?.id === permit.id}
                              />
                            ))}
                          </AnimatePresence>
                          {columnPermits.length === 0 && (
                            <div className="py-8 text-center text-gray-400 text-sm">
                              No permits
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Detail Panel */}
          <AnimatePresence>
            {selectedPermit && (
              <DetailPanel
                permit={selectedPermit}
                onClose={() => setSelectedPermit(null)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
