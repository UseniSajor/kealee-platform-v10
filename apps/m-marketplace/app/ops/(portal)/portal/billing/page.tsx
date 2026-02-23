import Link from "next/link";

import { GCBilling } from "@ops/components/portal/GCBilling";

export default function BillingPage() {
  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Billing</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-700">
            Manage packages, payment methods, invoices, usage analytics, and
            cancellation.
          </p>
        </div>
        <Link
          href="/ops/portal"
          className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
        >
          Back to dashboard
        </Link>
      </header>

      <GCBilling />
    </section>
  );
}

