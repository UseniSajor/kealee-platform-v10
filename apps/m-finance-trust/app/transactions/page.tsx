"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { paymentsApi } from "@/lib/api/finance.api";

interface Transaction {
  id: string;
  project: string;
  type: string;
  amount: number;
  fee: number;
  status: string;
  date: string;
  method: string;
}

const filterOptions = {
  types: ["All Types", "Deposit", "Milestone Release", "Platform Fee", "Design Fee", "Refund"],
  statuses: ["All Statuses", "Completed", "Pending", "Processing", "Failed"],
  dateRanges: ["Last 7 days", "Last 30 days", "Last 90 days", "This year", "All time"],
};

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v);
}

export default function TransactionsPage() {
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [dateFilter, setDateFilter] = useState("Last 30 days");
  const [searchQuery, setSearchQuery] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    setLoading(true);
    try {
      const res = await paymentsApi.getUserPayments();
      const data = res as any;
      const items = data?.data || data?.payments || data?.transactions || data?.items || [];
      const mapped: Transaction[] = items.map((t: any) => ({
        id: t.id || "",
        project: t.projectName || t.project || t.milestone || "",
        type: t.type || t.transactionType || "",
        amount: typeof t.amount === "number" ? t.amount : parseFloat(String(t.amount || "0").replace(/[$,]/g, "")),
        fee: typeof t.fee === "number" ? t.fee : parseFloat(String(t.fee || "0").replace(/[$,]/g, "")),
        status: t.status || "Pending",
        date: t.createdAt
          ? new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : t.date || "",
        method: t.method || t.paymentMethod || "ACH",
      }));
      setTransactions(mapped);
    } catch (err) {
      console.error("Failed to load transactions:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredTransactions = transactions.filter((txn) => {
    if (typeFilter !== "All Types" && txn.type !== typeFilter) return false;
    if (statusFilter !== "All Statuses" && txn.status !== statusFilter) return false;
    if (
      searchQuery &&
      !txn.project.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !txn.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const totalAmount = filteredTransactions.reduce((sum, txn) => sum + txn.amount, 0);
  const totalFees = filteredTransactions.reduce((sum, txn) => sum + txn.fee, 0);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-zinc-500 hover:text-zinc-700">
                ← Back
              </Link>
              <div>
                <h1 className="text-2xl font-black">Transactions</h1>
                <p className="text-sm text-zinc-500">View and manage all financial transactions</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-sm font-semibold border border-zinc-200 rounded-lg hover:bg-zinc-50">
                Export CSV
              </button>
              <button className="px-4 py-2 text-sm font-semibold border border-zinc-200 rounded-lg hover:bg-zinc-50">
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <div className="text-sm text-zinc-500">Total Transactions</div>
            <div className="text-2xl font-black">{filteredTransactions.length}</div>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <div className="text-sm text-zinc-500">Total Amount</div>
            <div className="text-2xl font-black">{fmt(totalAmount)}</div>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <div className="text-sm text-zinc-500">Total Fees</div>
            <div className="text-2xl font-black">{fmt(totalFees)}</div>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <div className="text-sm text-zinc-500">Net Amount</div>
            <div className="text-2xl font-black">{fmt(totalAmount - totalFees)}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="text"
              placeholder="Search by project or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {filterOptions.types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {filterOptions.statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {filterOptions.dateRanges.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mr-3" />
              <span className="text-zinc-500">Loading transactions...</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left p-4 font-semibold">Transaction ID</th>
                  <th className="text-left p-4 font-semibold">Project</th>
                  <th className="text-left p-4 font-semibold">Type</th>
                  <th className="text-right p-4 font-semibold">Amount</th>
                  <th className="text-right p-4 font-semibold">Fee</th>
                  <th className="text-left p-4 font-semibold">Method</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Date</th>
                  <th className="text-left p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="p-4 font-mono font-medium">{txn.id}</td>
                    <td className="p-4">{txn.project}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                          txn.type === "Deposit"
                            ? "bg-blue-100 text-blue-700"
                            : txn.type === "Milestone Release"
                              ? "bg-emerald-100 text-emerald-700"
                              : txn.type === "Platform Fee"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {txn.type}
                      </span>
                    </td>
                    <td className="p-4 text-right font-semibold">{fmt(txn.amount)}</td>
                    <td className="p-4 text-right text-zinc-500">{fmt(txn.fee)}</td>
                    <td className="p-4 text-zinc-500">{txn.method}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          txn.status === "Completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : txn.status === "Pending"
                              ? "bg-amber-100 text-amber-700"
                              : txn.status === "Processing"
                                ? "bg-blue-100 text-blue-700"
                                : txn.status === "Collected"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-red-100 text-red-700"
                        }`}
                      >
                        {txn.status}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-500">{txn.date}</td>
                    <td className="p-4">
                      <Link href={`/transactions/${txn.id}`} className="text-emerald-600 font-semibold hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-zinc-500">
                      {searchQuery || typeFilter !== "All Types" || statusFilter !== "All Statuses"
                        ? "No transactions match your filters."
                        : "No transactions yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-zinc-500">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm border border-zinc-200 rounded hover:bg-zinc-50 disabled:opacity-50" disabled>
              Previous
            </button>
            <button className="px-3 py-1 text-sm border border-zinc-200 rounded hover:bg-zinc-50">Next</button>
          </div>
        </div>
      </main>
    </div>
  );
}
