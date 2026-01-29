"use client";

import Link from "next/link";
import { useState } from "react";

const quickStats = [
  { label: "Total Escrow Balance", value: "$847,250.00", change: "+$125,000", trend: "up" },
  { label: "Pending Releases", value: "12", change: "3 due today", trend: "neutral" },
  { label: "This Month Released", value: "$234,500.00", change: "+18%", trend: "up" },
  { label: "Active Projects", value: "8", change: "2 new", trend: "up" },
];

const recentTransactions = [
  { id: "TXN-001", project: "Modern Kitchen Remodel", type: "Milestone Release", amount: "$15,000.00", status: "Completed", date: "Jan 27, 2024" },
  { id: "TXN-002", project: "Backyard Renovation", type: "Deposit", amount: "$25,000.00", status: "Completed", date: "Jan 26, 2024" },
  { id: "TXN-003", project: "Master Bath Upgrade", type: "Milestone Release", amount: "$8,500.00", status: "Pending", date: "Jan 26, 2024" },
  { id: "TXN-004", project: "Home Addition", type: "Platform Fee", amount: "$1,750.00", status: "Collected", date: "Jan 25, 2024" },
  { id: "TXN-005", project: "Garage Conversion", type: "Milestone Release", amount: "$12,000.00", status: "Processing", date: "Jan 25, 2024" },
];

const pendingApprovals = [
  { id: "APR-001", project: "Modern Kitchen Remodel", milestone: "Rough Plumbing", amount: "$15,000.00", contractor: "ABC Plumbing", dueDate: "Jan 28, 2024" },
  { id: "APR-002", project: "Home Addition", milestone: "Foundation Complete", amount: "$35,000.00", contractor: "BuildRight LLC", dueDate: "Jan 29, 2024" },
  { id: "APR-003", project: "Master Bath Upgrade", milestone: "Tile Installation", amount: "$8,500.00", contractor: "Tile Masters", dueDate: "Jan 30, 2024" },
];

const escrowAccounts = [
  { id: "ESC-001", project: "Modern Kitchen Remodel", balance: "$45,000.00", totalBudget: "$85,000.00", released: "47%", status: "Active" },
  { id: "ESC-002", project: "Home Addition", balance: "$125,000.00", totalBudget: "$250,000.00", released: "50%", status: "Active" },
  { id: "ESC-003", project: "Backyard Renovation", balance: "$32,500.00", totalBudget: "$65,000.00", released: "50%", status: "Active" },
  { id: "ESC-004", project: "Master Bath Upgrade", balance: "$18,750.00", totalBudget: "$45,000.00", released: "58%", status: "Active" },
];

export default function FinanceDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "approvals" | "escrow">("overview");

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black">Finance & Trust Hub</h1>
              <p className="text-sm text-zinc-500">Secure escrow management and payment processing</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/deposit"
                className="px-4 py-2 text-sm font-semibold border border-zinc-200 rounded-lg hover:bg-zinc-50"
              >
                Add Funds
              </Link>
              <Link
                href="/releases/new"
                className="px-4 py-2 text-sm font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                New Release
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
              { id: "approvals", label: "Pending Approvals", badge: "3" },
              { id: "escrow", label: "Escrow Accounts" },
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
                {"badge" in tab && (
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
            <Link href="/transactions" className="py-3 text-sm font-semibold text-zinc-500 hover:text-zinc-700">
              Transactions
            </Link>
            <Link href="/statements" className="py-3 text-sm font-semibold text-zinc-500 hover:text-zinc-700">
              Statements
            </Link>
            <Link href="/settings" className="py-3 text-sm font-semibold text-zinc-500 hover:text-zinc-700">
              Settings
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-zinc-200 p-5">
              <div className="text-sm text-zinc-500">{stat.label}</div>
              <div className="mt-1 text-2xl font-black">{stat.value}</div>
              <div className={`mt-1 text-sm ${stat.trend === "up" ? "text-emerald-600" : "text-zinc-500"}`}>
                {stat.change}
              </div>
            </div>
          ))}
        </div>

        {activeTab === "overview" && (
          <>
            {/* Recent Transactions */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Recent Transactions</h2>
                <Link href="/transactions" className="text-sm text-emerald-600 font-semibold hover:underline">
                  View All
                </Link>
              </div>
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="text-left p-4 font-semibold">Transaction</th>
                      <th className="text-left p-4 font-semibold">Project</th>
                      <th className="text-left p-4 font-semibold">Type</th>
                      <th className="text-right p-4 font-semibold">Amount</th>
                      <th className="text-left p-4 font-semibold">Status</th>
                      <th className="text-left p-4 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((txn) => (
                      <tr key={txn.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="p-4 font-medium">{txn.id}</td>
                        <td className="p-4">{txn.project}</td>
                        <td className="p-4">{txn.type}</td>
                        <td className="p-4 text-right font-semibold">{txn.amount}</td>
                        <td className="p-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            txn.status === "Completed" ? "bg-emerald-100 text-emerald-700" :
                            txn.status === "Pending" ? "bg-amber-100 text-amber-700" :
                            txn.status === "Processing" ? "bg-blue-100 text-blue-700" :
                            "bg-zinc-100 text-zinc-700"
                          }`}>
                            {txn.status}
                          </span>
                        </td>
                        <td className="p-4 text-zinc-500">{txn.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Quick Actions */}
            <section>
              <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { icon: "💰", label: "Deposit Funds", href: "/deposit", description: "Add funds to escrow" },
                  { icon: "📤", label: "Release Payment", href: "/releases/new", description: "Approve milestone release" },
                  { icon: "📊", label: "View Reports", href: "/reports", description: "Financial analytics" },
                  { icon: "⚙️", label: "Payment Settings", href: "/settings", description: "Configure payment methods" },
                ].map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="bg-white rounded-xl border border-zinc-200 p-5 hover:border-emerald-300 hover:shadow-sm transition"
                  >
                    <div className="text-2xl mb-2">{action.icon}</div>
                    <div className="font-bold">{action.label}</div>
                    <div className="text-sm text-zinc-500">{action.description}</div>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab === "approvals" && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Pending Approvals</h2>
              <span className="text-sm text-zinc-500">3 items require your attention</span>
            </div>
            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <div key={approval.id} className="bg-white rounded-xl border border-zinc-200 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-500">{approval.id}</span>
                        <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full">
                          Awaiting Approval
                        </span>
                      </div>
                      <h3 className="mt-1 text-lg font-bold">{approval.project}</h3>
                      <p className="text-sm text-zinc-600">Milestone: {approval.milestone}</p>
                      <p className="text-sm text-zinc-500">Contractor: {approval.contractor}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-emerald-600">{approval.amount}</div>
                      <div className="text-sm text-zinc-500">Due: {approval.dueDate}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button className="px-4 py-2 text-sm font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                      Approve Release
                    </button>
                    <button className="px-4 py-2 text-sm font-semibold border border-zinc-200 rounded-lg hover:bg-zinc-50">
                      View Details
                    </button>
                    <button className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg">
                      Dispute
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "escrow" && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Escrow Accounts</h2>
              <Link href="/escrow/new" className="text-sm text-emerald-600 font-semibold hover:underline">
                + New Escrow Account
              </Link>
            </div>
            <div className="space-y-4">
              {escrowAccounts.map((account) => (
                <div key={account.id} className="bg-white rounded-xl border border-zinc-200 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-500">{account.id}</span>
                        <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                          {account.status}
                        </span>
                      </div>
                      <h3 className="mt-1 text-lg font-bold">{account.project}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-zinc-500">Current Balance</div>
                      <div className="text-2xl font-black">{account.balance}</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-500">Released: {account.released}</span>
                      <span className="text-zinc-500">Total Budget: {account.totalBudget}</span>
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: account.released }}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Link
                      href={`/escrow/${account.id}`}
                      className="px-4 py-2 text-sm font-semibold border border-zinc-200 rounded-lg hover:bg-zinc-50"
                    >
                      View Details
                    </Link>
                    <button className="px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg">
                      Add Deposit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
