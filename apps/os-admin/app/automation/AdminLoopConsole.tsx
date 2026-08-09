'use client';

import React from 'react';

export default function AdminLoopConsole() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Loop Orchestration Console</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Active Loops</h3>
          <p className="text-4xl font-light mt-2">24</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Awaiting Review</h3>
          <p className="text-4xl font-light text-amber-500 mt-2">3</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Failed Runs</h3>
          <p className="text-4xl font-light text-red-500 mt-2">1</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Pending Decisions (Admin Review Required)</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {/* Example static row, normally fetched from API */}
          <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  estimate_revision
                </span>
                <span className="text-sm text-gray-500">Project: PRJ-9921</span>
              </div>
              <p className="font-medium">Budget exceeded by 30% after engineering review.</p>
              <p className="text-sm text-gray-500 mt-1">Confidence Score: 0.65</p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-3">
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                Review & Approve
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors">
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
