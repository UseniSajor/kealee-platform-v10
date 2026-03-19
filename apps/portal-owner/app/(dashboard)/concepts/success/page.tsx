"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface OrderStatus {
  id: string;
  packageName: string;
  deliveryStatus: string;
  createdAt: string;
  deliveryUrl?: string;
}

function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }

    async function fetchOrder() {
      try {
        const res = await fetch(
          `/api/concepts/order-by-session?session_id=${sessionId}`,
        );
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
          if (data.deliveryStatus === "delivered") return; // stop polling
        }
      } catch {}
      setLoading(false);
    }

    fetchOrder();
    const interval = setInterval(fetchOrder, 6000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const statusLabel =
    order?.deliveryStatus === "ready" || order?.deliveryStatus === "delivered"
      ? "Ready to view"
      : "Generating your concepts...";

  const statusColor =
    order?.deliveryStatus === "ready" || order?.deliveryStatus === "delivered"
      ? "text-emerald-600"
      : "text-amber-600";

  return (
    <div className="mx-auto max-w-xl p-6 text-center">
      <div className="mb-6 text-6xl">🎉</div>
      <h1 className="text-3xl font-bold">Payment Confirmed!</h1>
      <p className="mt-3 text-slate-500">
        Your exterior concept package has been ordered. Our design team is on it.
      </p>

      {loading && (
        <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-400">Loading your order details...</p>
        </div>
      )}

      {!loading && order && (
        <div className="mt-6 rounded-2xl border bg-white p-6 text-left shadow-sm">
          <div className="mb-3 text-sm font-semibold text-slate-700">
            Order Details
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Package</span>
              <span className="font-medium">{order.packageName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <span className={`font-medium ${statusColor}`}>{statusLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Ordered</span>
              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          {order.deliveryUrl && (
            <a
              href={order.deliveryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block rounded-xl bg-emerald-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              View Your Concepts →
            </a>
          )}
        </div>
      )}

      <div className="mt-8 space-y-3">
        <Link
          href="/projects"
          className="block rounded-xl bg-black px-6 py-3 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
        >
          Go to my projects
        </Link>
        <Link
          href="/concepts"
          className="block rounded-xl border px-6 py-3 text-sm hover:bg-slate-50 transition-colors"
        >
          View all concept orders
        </Link>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        A confirmation email has been sent. Delivery time depends on your
        selected package tier.
      </p>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-400">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
