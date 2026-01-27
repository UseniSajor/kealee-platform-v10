"use client";

import Link from "next/link";
import { useState } from "react";

const quickStats = [
  { label: "Total Loan Portfolio", value: "$4,275,000.00", change: "+$850,000", trend: "up" },
  { label: "Pending Draw Requests", value: "7", change: "3 due today", trend: "neutral" },
  { label: "This Month Disbursed", value: "$1,234,500.00", change: "+22%", trend: "up" },
  { label: "Active Projects", value: "12", change: "2 new", trend: "up" },
];

const recentTransactions = [
  { id: "DRW-001", project: "Smith Residence - New Build", type: "Draw Disbursement", amount: "$85,000.00", status: "Completed", date: "Jan 27, 2024" },
  { id: "DRW-002", project: "Oak Street Development", type: "Draw Request", amount: "$125,000.00", status: "Pending Review", date: "Jan 26, 2024" },
  { id: "DRW-003", project: "Johnson Addition", type: "Draw Disbursement", amount: "$45,500.00", status: "Completed", date: "Jan 26, 2024" },
  { id: "INS-001", project: "Smith Residence - New Build", type: "Inspection Report", amount: "-", status: "Passed", date: "Jan 25, 2024" },
  { id: "DRW-004", project: "Maple Grove Remodel", type: "Draw Request", amount: "$32,000.00", status: "Under Review", date: "Jan 25, 2024" },
];

const pendingApprovals = [
  { id: "DRW-002", project: "Oak Street Development", milestone: "Framing Complete", amount: "$125,000.00", contractor: "Premier Builders", dueDate: "Jan 28, 2024", inspectionStatus: "Passed" },
  { id: "DRW-004", project: "Maple Grove Remodel", milestone: "Rough MEP", amount: "$32,000.00", contractor: "ABC Construction", dueDate: "Jan 29, 2024", inspectionStatus: "Pending" },
  { id: "DRW-005", project: "Riverside Townhomes", milestone: "Foundation", amount: "$95,000.00", contractor: "Summit Homes", dueDate: "Jan 30, 2024", inspectionStatus: "Passed" },
];

const loanAccounts = [
  { id: "LOAN-001", project: "Smith Residence - New Build", borrower: "John Smith", loanAmount: "$650,000.00", disbursed: "$325,000.00", remaining: "$325,000.00", progress: "50%", status: "Active", risk: "Low" },
  { id: "LOAN-002", project: "Oak Street Development", borrower: "Oak Dev LLC", loanAmount: "$1,250,000.00", disbursed: "$500,000.00", remaining: "$750,000.00", progress: "40%", status: "Active", risk: "Low" },
  { id: "LOAN-003", project: "Maple Grove Remodel", borrower: "Sarah Johnson", loanAmount: "$185,000.00", disbursed: "$92,500.00", remaining: "$92,500.00", progress: "50%", status: "Active", risk: "Medium" },
  { id: "LOAN-004", project: "Riverside Townhomes", borrower: "River Homes Inc", loanAmount: "$2,400,000.00", disbursed: "$600,000.00", remaining: "$1,800,000.00", progress: "25%", status: "Active", risk: "Low" },
];

export default function FinanceDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "approvals" | "loans">("overview");

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black">Lender Portal</h1>
              <p className="text-sm text-zinc-500">Construction loan management, draw requests, and project oversight</p>
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
              { id: "approvals", label: "Draw Requests", badge: "3" },
              { id: "loans", label: "Loan Portfolio" },
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
                  { icon: "⚙️", label: "Payment Settings", href: "/settings/payments", description: "Configure payment methods" },
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

        {activeTab === "loans" && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Loan Portfolio</h2>
              <Link href="/loans/new" className="text-sm text-emerald-600 font-semibold hover:underline">
                + New Construction Loan
              </Link>
            </div>
            <div className="space-y-4">
              {loanAccounts.map((loan) => (
                <div key={loan.id} className="bg-white rounded-xl border border-zinc-200 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-500">{loan.id}</span>
                        <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                          {loan.status}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          loan.risk === "Low" ? "bg-green-100 text-green-700" :
                          loan.risk === "Medium" ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {loan.risk} Risk
                        </span>
                      </div>
                      <h3 className="mt-1 text-lg font-bold">{loan.project}</h3>
                      <p className="text-sm text-zinc-500">Borrower: {loan.borrower}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-zinc-500">Loan Amount</div>
                      <div className="text-2xl font-black">{loan.loanAmount}</div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-zinc-500">Disbursed</div>
                      <div className="font-semibold text-emerald-600">{loan.disbursed}</div>
                    </div>
                    <div>
                      <div className="text-zinc-500">Remaining</div>
                      <div className="font-semibold">{loan.remaining}</div>
                    </div>
                    <div>
                      <div className="text-zinc-500">Progress</div>
                      <div className="font-semibold">{loan.progress}</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: loan.progress }}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Link
                      href={`/loans/${loan.id}`}
                      className="px-4 py-2 text-sm font-semibold border border-zinc-200 rounded-lg hover:bg-zinc-50"
                    >
                      View Loan Details
                    </Link>
                    <button className="px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg">
                      Schedule Inspection
                    </button>
                    <button className="px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg">
                      View Reports
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
