"use client";

import Link from "next/link";
import { useState } from "react";

const reportTypes = [
  {
    id: "transaction-summary",
    name: "Transaction Summary",
    description: "Overview of all transactions within a date range",
    icon: "📊",
  },
  {
    id: "escrow-status",
    name: "Escrow Status Report",
    description: "Current balances and status of all escrow accounts",
    icon: "💰",
  },
  {
    id: "release-history",
    name: "Release History",
    description: "Detailed log of all payment releases",
    icon: "📤",
  },
  {
    id: "fee-report",
    name: "Fee Report",
    description: "Platform fees and charges breakdown",
    icon: "💵",
  },
  {
    id: "project-financial",
    name: "Project Financial Summary",
    description: "Financial overview by project",
    icon: "🏗️",
  },
  {
    id: "tax-document",
    name: "Tax Documents",
    description: "1099s and tax-related documents",
    icon: "📋",
  },
];

const recentReports = [
  { id: "1", name: "Transaction Summary - January 2024", type: "transaction-summary", date: "Jan 27, 2024", status: "Ready" },
  { id: "2", name: "Escrow Status Report - Q4 2023", type: "escrow-status", date: "Jan 15, 2024", status: "Ready" },
  { id: "3", name: "Annual Fee Report - 2023", type: "fee-report", date: "Jan 10, 2024", status: "Ready" },
  { id: "4", name: "Project Financial - Modern Kitchen Remodel", type: "project-financial", date: "Jan 5, 2024", status: "Ready" },
];

const scheduledReports = [
  { id: "1", name: "Weekly Transaction Summary", frequency: "Weekly", nextRun: "Feb 3, 2024", recipients: "john@example.com" },
  { id: "2", name: "Monthly Escrow Status", frequency: "Monthly", nextRun: "Feb 1, 2024", recipients: "john@example.com, accountant@example.com" },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/finance" className="text-zinc-500 hover:text-zinc-700">
                ← Back
              </Link>
              <div>
                <h1 className="text-2xl font-black">Reports & Analytics</h1>
                <p className="text-sm text-zinc-500">Generate and download financial reports</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="text-sm text-zinc-500">Reports Generated</div>
            <div className="mt-1 text-2xl font-black">47</div>
            <div className="mt-1 text-sm text-zinc-500">This month</div>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="text-sm text-zinc-500">Scheduled Reports</div>
            <div className="mt-1 text-2xl font-black">2</div>
            <div className="mt-1 text-sm text-emerald-600">Active</div>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="text-sm text-zinc-500">Last Generated</div>
            <div className="mt-1 text-2xl font-black">2h ago</div>
            <div className="mt-1 text-sm text-zinc-500">Transaction Summary</div>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="text-sm text-zinc-500">Storage Used</div>
            <div className="mt-1 text-2xl font-black">124 MB</div>
            <div className="mt-1 text-sm text-zinc-500">of 1 GB</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Generate New Report */}
          <div className="lg:col-span-2">
            <section className="bg-white rounded-xl border border-zinc-200 p-6 mb-6">
              <h2 className="text-lg font-bold mb-4">Generate New Report</h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {reportTypes.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`p-4 rounded-lg border-2 text-left transition ${
                      selectedReport === report.id
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <div className="text-2xl mb-2">{report.icon}</div>
                    <div className="font-semibold text-sm">{report.name}</div>
                    <div className="text-xs text-zinc-500 mt-1">{report.description}</div>
                  </button>
                ))}
              </div>

              {selectedReport && (
                <div className="border-t border-zinc-200 pt-6">
                  <h3 className="font-semibold mb-4">Report Options</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                      Format
                    </label>
                    <select className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="pdf">PDF</option>
                      <option value="csv">CSV (Excel)</option>
                      <option value="xlsx">XLSX</option>
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700">
                      Generate Report
                    </button>
                    <button className="px-4 py-2 border border-zinc-200 font-semibold rounded-lg hover:bg-zinc-50">
                      Schedule Report
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Recent Reports */}
            <section className="bg-white rounded-xl border border-zinc-200 p-6">
              <h2 className="text-lg font-bold mb-4">Recent Reports</h2>
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border border-zinc-100 rounded-lg hover:bg-zinc-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center">
                        {reportTypes.find((r) => r.id === report.type)?.icon || "📄"}
                      </div>
                      <div>
                        <div className="font-semibold">{report.name}</div>
                        <div className="text-sm text-zinc-500">{report.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                        {report.status}
                      </span>
                      <button className="px-3 py-1.5 text-sm font-semibold border border-zinc-200 rounded-lg hover:bg-zinc-50">
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg">
                View All Reports
              </button>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Scheduled Reports */}
            <section className="bg-white rounded-xl border border-zinc-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Scheduled Reports</h2>
                <button className="text-sm text-emerald-600 font-semibold hover:underline">
                  + New
                </button>
              </div>
              <div className="space-y-4">
                {scheduledReports.map((report) => (
                  <div key={report.id} className="p-3 border border-zinc-100 rounded-lg">
                    <div className="font-semibold text-sm">{report.name}</div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {report.frequency} • Next: {report.nextRun}
                    </div>
                    <div className="text-xs text-zinc-400 mt-1 truncate">
                      To: {report.recipients}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick Links */}
            <section className="bg-white rounded-xl border border-zinc-200 p-6">
              <h2 className="text-lg font-bold mb-4">Quick Links</h2>
              <div className="space-y-2">
                <Link
                  href="/finance/transactions"
                  className="block p-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg"
                >
                  View All Transactions →
                </Link>
                <Link
                  href="/finance/statements"
                  className="block p-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg"
                >
                  Account Statements →
                </Link>
                <Link
                  href="/finance/settings"
                  className="block p-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg"
                >
                  Report Settings →
                </Link>
              </div>
            </section>

            {/* Help */}
            <section className="bg-emerald-50 rounded-xl border border-emerald-100 p-6">
              <h3 className="font-bold text-emerald-900 mb-2">Need Help?</h3>
              <p className="text-sm text-emerald-700 mb-4">
                Learn how to generate custom reports and set up automated delivery.
              </p>
              <button className="text-sm font-semibold text-emerald-700 hover:underline">
                View Documentation →
              </button>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
