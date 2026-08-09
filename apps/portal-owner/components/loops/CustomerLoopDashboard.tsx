'use client';

import React from 'react';

export default function CustomerLoopDashboard({ projectId }: { projectId: string }) {
  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Project Updates</h2>
          <p className="text-gray-500 mt-1">Recent AI insights and recommendations for your project.</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>

      <div className="space-y-4">
        {/* Example Update Card */}
        <div className="p-5 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white transition-colors group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Estimate Revision</span>
            <span className="text-xs text-gray-400">2 hours ago</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">New Structural Framing Options</h3>
          <p className="text-gray-600 text-sm mb-4">
            Our engineering AI reviewed your intake forms and found an opportunity to save $4,500 on framing by adjusting the roof pitch.
          </p>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors shadow-sm">
              Approve Change
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">
              View Deliverable
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
