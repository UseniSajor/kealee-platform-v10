"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Payment {
  id: string;
  amount: number;
  status: string;
  type: string;
  description?: string;
  stripePaymentIntentId?: string;
  paidAt?: string;
  createdAt: string;
  projectName?: string;
  milestoneName?: string;
}

interface PaymentMethod {
  id: string;
  type: string;
  last4?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
  status: string;
}

interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
}

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-purple-100 text-purple-700",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalPayments: 0,
    totalAmount: 0,
    completedCount: 0,
    pendingCount: 0,
    failedCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchPaymentData() {
      setIsLoading(true);
      try {
        const [paymentsRes, methodsRes] = await Promise.allSettled([
          fetch(`${API_BASE}/finance/payments`, { credentials: "include" }),
          fetch(`${API_BASE}/finance/payment-methods`, { credentials: "include" }),
        ]);

        if (paymentsRes.status === "fulfilled" && paymentsRes.value.ok) {
          const data = await paymentsRes.value.json();
          if (data.payments) setPayments(data.payments);
          if (data.stats) setStats(data.stats);
        }

        if (methodsRes.status === "fulfilled" && methodsRes.value.ok) {
          const data = await methodsRes.value.json();
          if (data.paymentMethods) setPaymentMethods(data.paymentMethods);
        }
      } catch {
        // API not available — show empty state
      } finally {
        setIsLoading(false);
      }
    }
    fetchPaymentData();
  }, []);

  const filteredPayments =
    statusFilter === "all" ? payments : payments.filter((p) => p.status === statusFilter);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/finance" className="text-zinc-500 hover:text-zinc-700">
                &larr; Back
              </Link>
              <div>
                <h1 className="text-2xl font-black">Payment Activity</h1>
                <p className="text-sm text-zinc-500">
                  Real-time payment tracking powered by Stripe webhooks
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="text-sm text-zinc-500">Total Payments</div>
            <div className="mt-1 text-2xl font-black">{stats.totalPayments}</div>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="text-sm text-zinc-500">Total Volume</div>
            <div className="mt-1 text-2xl font-black">{formatCurrency(stats.totalAmount)}</div>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="text-sm text-zinc-500">Completed</div>
            <div className="mt-1 text-2xl font-black text-emerald-600">{stats.completedCount}</div>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="text-sm text-zinc-500">Pending</div>
            <div className="mt-1 text-2xl font-black text-amber-600">{stats.pendingCount}</div>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="text-sm text-zinc-500">Failed</div>
            <div className="mt-1 text-2xl font-black text-red-600">{stats.failedCount}</div>
          </div>
        </div>

        {/* Webhook integration note */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-emerald-900 mb-1">Live Stripe Integration</h3>
          <p className="text-xs text-emerald-700">
            Payments are tracked in real-time via Stripe webhook handlers: payment_intent.succeeded,
            payment_intent.payment_failed, transfer.created. Payment methods sync automatically via
            payment_method.attached and payment_method.detached events.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment History */}
          <div className="lg:col-span-2">
            <section className="bg-white rounded-xl border border-zinc-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Payment History</h2>
                <div className="flex items-center gap-2">
                  {["all", "COMPLETED", "PENDING", "FAILED"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-2 py-1 text-xs rounded font-medium transition ${
                        statusFilter === s
                          ? "bg-emerald-100 text-emerald-700"
                          : "text-zinc-500 hover:bg-zinc-100"
                      }`}
                    >
                      {s === "all" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {isLoading ? (
                <div className="py-12 text-center text-sm text-zinc-400">Loading payments...</div>
              ) : filteredPayments.length > 0 ? (
                <div className="space-y-3">
                  {filteredPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border border-zinc-100 rounded-lg hover:bg-zinc-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                          <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                              STATUS_STYLES[payment.status] || "bg-zinc-100 text-zinc-700"
                            }`}
                          >
                            {payment.status}
                          </span>
                        </div>
                        <div className="text-sm text-zinc-500 mt-1">
                          {payment.description || payment.type}
                          {payment.projectName && ` — ${payment.projectName}`}
                          {payment.milestoneName && ` / ${payment.milestoneName}`}
                        </div>
                        <div className="text-xs text-zinc-400 mt-1">
                          {formatDate(payment.paidAt || payment.createdAt)}
                          {payment.stripePaymentIntentId && (
                            <span className="ml-2 font-mono">
                              PI: {payment.stripePaymentIntentId.slice(0, 14)}...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-zinc-400 text-sm">No payments recorded yet</p>
                  <p className="text-zinc-400 text-xs mt-1">
                    Payments will appear here as they are processed through Stripe.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Methods */}
            <section className="bg-white rounded-xl border border-zinc-200 p-6">
              <h2 className="text-lg font-bold mb-4">Payment Methods</h2>
              {paymentMethods.length > 0 ? (
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="p-3 border border-zinc-100 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {method.brand || method.type}
                          </span>
                          {method.last4 && (
                            <span className="text-sm text-zinc-500">**** {method.last4}</span>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            method.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {method.status}
                        </span>
                      </div>
                      {method.expMonth && method.expYear && (
                        <div className="text-xs text-zinc-400 mt-1">
                          Expires {method.expMonth}/{method.expYear}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-400">
                  No payment methods on file. Methods are auto-synced when attached via Stripe.
                </p>
              )}
            </section>

            {/* Quick Links */}
            <section className="bg-white rounded-xl border border-zinc-200 p-6">
              <h2 className="text-lg font-bold mb-4">Quick Links</h2>
              <div className="space-y-2">
                <Link
                  href="/finance/escrow"
                  className="block p-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg"
                >
                  Escrow Accounts &rarr;
                </Link>
                <Link
                  href="/finance/transactions"
                  className="block p-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg"
                >
                  All Transactions &rarr;
                </Link>
                <Link
                  href="/finance/reports"
                  className="block p-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg"
                >
                  Financial Reports &rarr;
                </Link>
                <Link
                  href="/finance/releases"
                  className="block p-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg"
                >
                  Payment Releases &rarr;
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
