"use client";

import Link from "next/link";
import { useState } from "react";

const escrowAccount = {
  id: "ESC-001",
  project: "Modern Kitchen Remodel",
  status: "Active",
  createdDate: "Dec 15, 2023",
  balance: "$45,000.00",
  totalBudget: "$85,000.00",
  totalDeposited: "$85,000.00",
  totalReleased: "$40,000.00",
  pendingReleases: "$15,000.00",
  platformFeeCollected: "$1,400.00",
  contractor: {
    name: "ABC Contracting LLC",
    contact: "John Smith",
    email: "john@abccontracting.com",
  },
  owner: {
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
  },
};

const milestones = [
  { id: "M-001", name: "Demo & Site Prep", amount: "$8,000.00", status: "Released", date: "Dec 20, 2023" },
  { id: "M-002", name: "Rough Plumbing", amount: "$12,000.00", status: "Released", date: "Jan 5, 2024" },
  { id: "M-003", name: "Electrical Rough-In", amount: "$10,000.00", status: "Released", date: "Jan 12, 2024" },
  { id: "M-004", name: "Framing & Drywall", amount: "$10,000.00", status: "Released", date: "Jan 18, 2024" },
  { id: "M-005", name: "Cabinet Installation", amount: "$15,000.00", status: "Pending Approval", date: "Jan 27, 2024" },
  { id: "M-006", name: "Countertops & Backsplash", amount: "$12,000.00", status: "Not Started", date: "TBD" },
  { id: "M-007", name: "Final Finishes", amount: "$10,000.00", status: "Not Started", date: "TBD" },
  { id: "M-008", name: "Final Inspection", amount: "$8,000.00", status: "Not Started", date: "TBD" },
];

const transactions = [
  { id: "TXN-001", type: "Deposit", amount: "+$50,000.00", date: "Dec 15, 2023", status: "Completed" },
  { id: "TXN-002", type: "Milestone Release", amount: "-$8,000.00", date: "Dec 20, 2023", status: "Completed", milestone: "Demo & Site Prep" },
  { id: "TXN-003", type: "Platform Fee", amount: "-$280.00", date: "Dec 20, 2023", status: "Collected" },
  { id: "TXN-004", type: "Deposit", amount: "+$35,000.00", date: "Jan 2, 2024", status: "Completed" },
  { id: "TXN-005", type: "Milestone Release", amount: "-$12,000.00", date: "Jan 5, 2024", status: "Completed", milestone: "Rough Plumbing" },
  { id: "TXN-006", type: "Platform Fee", amount: "-$420.00", date: "Jan 5, 2024", status: "Collected" },
];

export default function EscrowDetailPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "milestones" | "transactions">("overview");

  const releasedPercentage = (40000 / 85000) * 100;

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
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-zinc-500">{escrowAccount.id}</span>
                  <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                    {escrowAccount.status}
                  </span>
                </div>
                <h1 className="text-2xl font-black">{escrowAccount.project}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-sm font-semibold border border-zinc-200 rounded-lg hover:bg-zinc-50">
                Download Statement
              </button>
              <Link
                href="/finance/deposit"
                className="px-4 py-2 text-sm font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Add Deposit
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-6">
            {[
              { id: "overview", label: "Overview" },
              { id: "milestones", label: "Milestones", badge: "1" },
              { id: "transactions", label: "Transactions" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-3 text-sm font-semibold border-b-2 transition ${
                  activeTab === tab.id
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {tab.label}
                {"badge" in tab && tab.badge && (
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "overview" && (
          <div className="grid grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="col-span-2 space-y-6">
              {/* Balance Card */}
              <div className="bg-white rounded-xl border border-zinc-200 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="text-sm text-zinc-500">Current Balance</div>
                    <div className="text-4xl font-black">{escrowAccount.balance}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-zinc-500">Total Budget</div>
                    <div className="text-xl font-bold text-zinc-600">{escrowAccount.totalBudget}</div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-500">Progress: {releasedPercentage.toFixed(0)}% released</span>
                    <span className="font-medium">
                      {escrowAccount.totalReleased} of {escrowAccount.totalBudget}
                    </span>
                  </div>
                  <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${releasedPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-white rounded-xl border border-zinc-200 p-6">
                <h2 className="text-lg font-bold mb-4">Financial Summary</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-50 rounded-lg">
                    <div className="text-sm text-zinc-500">Total Deposited</div>
                    <div className="text-xl font-bold text-emerald-600">{escrowAccount.totalDeposited}</div>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-lg">
                    <div className="text-sm text-zinc-500">Total Released</div>
                    <div className="text-xl font-bold">{escrowAccount.totalReleased}</div>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-lg">
                    <div className="text-sm text-zinc-500">Pending Releases</div>
                    <div className="text-xl font-bold text-amber-600">{escrowAccount.pendingReleases}</div>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-lg">
                    <div className="text-sm text-zinc-500">Platform Fees Collected</div>
                    <div className="text-xl font-bold text-purple-600">{escrowAccount.platformFeeCollected}</div>
                  </div>
                </div>
              </div>

              {/* Pending Approval */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">⏳</span>
                      <span className="text-sm font-semibold text-amber-700">Pending Approval</span>
                    </div>
                    <h3 className="text-lg font-bold">Cabinet Installation - $15,000.00</h3>
                    <p className="text-sm text-zinc-600 mt-1">
                      Contractor has submitted milestone completion. Review and approve to release funds.
                    </p>
                  </div>
                  <button className="px-4 py-2 text-sm font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700">
                    Review & Approve
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Project Info */}
              <div className="bg-white rounded-xl border border-zinc-200 p-6">
                <h3 className="text-sm font-semibold text-zinc-500 uppercase mb-4">Project Details</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-zinc-400">Created</div>
                    <div className="font-medium">{escrowAccount.createdDate}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400">Project Owner</div>
                    <div className="font-medium">{escrowAccount.owner.name}</div>
                    <div className="text-sm text-zinc-500">{escrowAccount.owner.email}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400">Contractor</div>
                    <div className="font-medium">{escrowAccount.contractor.name}</div>
                    <div className="text-sm text-zinc-500">{escrowAccount.contractor.contact}</div>
                    <div className="text-sm text-zinc-500">{escrowAccount.contractor.email}</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl border border-zinc-200 p-6">
                <h3 className="text-sm font-semibold text-zinc-500 uppercase mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-4 py-3 text-sm font-medium border border-zinc-200 rounded-lg hover:bg-zinc-50">
                    📤 Request Release
                  </button>
                  <button className="w-full text-left px-4 py-3 text-sm font-medium border border-zinc-200 rounded-lg hover:bg-zinc-50">
                    📄 View Contract
                  </button>
                  <button className="w-full text-left px-4 py-3 text-sm font-medium border border-zinc-200 rounded-lg hover:bg-zinc-50">
                    💬 Message Contractor
                  </button>
                  <button className="w-full text-left px-4 py-3 text-sm font-medium border border-zinc-200 rounded-lg hover:bg-zinc-50 text-red-600">
                    ⚠️ Open Dispute
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "milestones" && (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left p-4 font-semibold">Milestone</th>
                  <th className="text-right p-4 font-semibold">Amount</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Date</th>
                  <th className="text-left p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((milestone) => (
                  <tr key={milestone.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="p-4">
                      <div className="font-medium">{milestone.name}</div>
                      <div className="text-xs text-zinc-500">{milestone.id}</div>
                    </td>
                    <td className="p-4 text-right font-semibold">{milestone.amount}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        milestone.status === "Released" ? "bg-emerald-100 text-emerald-700" :
                        milestone.status === "Pending Approval" ? "bg-amber-100 text-amber-700" :
                        "bg-zinc-100 text-zinc-500"
                      }`}>
                        {milestone.status}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-500">{milestone.date}</td>
                    <td className="p-4">
                      {milestone.status === "Pending Approval" && (
                        <button className="px-3 py-1 text-xs font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700">
                          Approve
                        </button>
                      )}
                      {milestone.status === "Released" && (
                        <span className="text-zinc-400">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left p-4 font-semibold">Transaction</th>
                  <th className="text-left p-4 font-semibold">Type</th>
                  <th className="text-left p-4 font-semibold">Description</th>
                  <th className="text-right p-4 font-semibold">Amount</th>
                  <th className="text-left p-4 font-semibold">Date</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="p-4 font-mono text-zinc-500">{txn.id}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                        txn.type === "Deposit" ? "bg-emerald-100 text-emerald-700" :
                        txn.type === "Milestone Release" ? "bg-blue-100 text-blue-700" :
                        "bg-purple-100 text-purple-700"
                      }`}>
                        {txn.type}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-600">
                      {"milestone" in txn ? txn.milestone : "-"}
                    </td>
                    <td className={`p-4 text-right font-semibold ${
                      txn.amount.startsWith("+") ? "text-emerald-600" : "text-zinc-900"
                    }`}>
                      {txn.amount}
                    </td>
                    <td className="p-4 text-zinc-500">{txn.date}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        txn.status === "Completed" ? "bg-emerald-100 text-emerald-700" :
                        "bg-purple-100 text-purple-700"
                      }`}>
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
