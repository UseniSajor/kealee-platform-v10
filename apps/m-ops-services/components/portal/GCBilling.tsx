"use client";

import { useMemo, useState } from "react";

type InvoiceStatus = "Paid" | "Due" | "Failed" | "Refunded";

type Invoice = {
  id: string;
  date: string; // ISO
  amount: number;
  status: InvoiceStatus;
  pdfUrl?: string | null;
  taxReceiptUrl?: string | null;
};

type PackageId = "A" | "B" | "C";

type PackagePlan = {
  id: PackageId;
  name: string; // e.g. Package B
  priceMonthly: number;
  includedProjects: number;
  serviceHoursMonthly: number;
  features: string[];
};

function formatMoney(n: number) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function daysBetween(a: Date, b: Date) {
  return Math.max(0, Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

function Pill({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "good" | "warn" | "bad";
  children: React.ReactNode;
}) {
  const cls =
    tone === "good"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : tone === "warn"
        ? "bg-amber-50 text-amber-900 border-amber-200"
        : tone === "bad"
          ? "bg-red-50 text-red-800 border-red-200"
          : "bg-white text-zinc-700 border-black/10";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black ${cls}`}>
      {children}
    </span>
  );
}

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-black/10 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-black/10 p-5">
          <div>
            <div className="text-lg font-black tracking-tight">{title}</div>
            <div className="mt-1 text-sm text-zinc-600">
              This is an MVP UI; wire to Stripe/DB next.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
          >
            Close
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function GCBilling() {
  // TODO: Replace with real org/company lookup + subscription provider (e.g. Stripe).
  const currentPackageId: PackageId = "B";
  const nextChargeIso = "2024-11-15T12:00:00Z";
  const serviceHoursUsed = 12;
  const serviceHoursLimit = 40;
  const savedHoursThisMonth = 44;

  const plans: PackagePlan[] = useMemo(
    () => [
      {
        id: "A",
        name: "Package A",
        priceMonthly: 2250,
        includedProjects: 1,
        serviceHoursMonthly: 20,
        features: ["Weekly reports", "Permit & inspection tracking", "Email support (48h SLA)"],
      },
      {
        id: "B",
        name: "Package B",
        priceMonthly: 3750,
        includedProjects: 3,
        serviceHoursMonthly: 40,
        features: [
          "Everything in A",
          "Priority support (24h SLA)",
          "Budget tracking + variance alerts",
          "Shareable weekly reports (clients/lenders)",
        ],
      },
      {
        id: "C",
        name: "Package C",
        priceMonthly: 6500,
        includedProjects: 6,
        serviceHoursMonthly: 80,
        features: [
          "Everything in B",
          "Dedicated PM coverage window",
          "Expanded reporting + custom KPIs",
          "Phone support",
        ],
      },
    ],
    []
  );

  const currentPlan = plans.find((p) => p.id === currentPackageId) || plans[0];

  const invoices: Invoice[] = useMemo(
    () => [
      { id: "inv_2024_10", date: "2024-10-15T12:00:00Z", amount: 3750, status: "Paid", pdfUrl: null, taxReceiptUrl: null },
      { id: "inv_2024_09", date: "2024-09-15T12:00:00Z", amount: 3750, status: "Paid", pdfUrl: null, taxReceiptUrl: null },
      { id: "inv_2024_08", date: "2024-08-15T12:00:00Z", amount: 3750, status: "Paid", pdfUrl: null, taxReceiptUrl: null },
    ],
    []
  );

  const hoursPct =
    serviceHoursLimit > 0 ? Math.min(100, (serviceHoursUsed / serviceHoursLimit) * 100) : 0;
  const nearingHours = hoursPct >= 85;

  const [paymentMethod, setPaymentMethod] = useState<{
    brand: string;
    last4: string;
    exp: string;
  }>({ brand: "Visa", last4: "4242", exp: "08/27" });

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<PackageId>("B");

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || currentPlan;

  const proration = useMemo(() => {
    const now = new Date();
    const nextCharge = new Date(nextChargeIso);

    // Treat billing cycle as [prevCharge, nextCharge) with a fixed 30 day window (MVP approximation).
    const totalDays = 30;
    const remainingDays = Math.min(totalDays, daysBetween(now, nextCharge));
    const diff = selectedPlan.priceMonthly - currentPlan.priceMonthly;
    const prorated = (diff * remainingDays) / totalDays;

    return {
      remainingDays,
      totalDays,
      priceDiff: diff,
      estimatedCharge: Math.round(prorated),
    };
  }, [currentPlan.priceMonthly, nextChargeIso, selectedPlan.priceMonthly]);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState<
    "Too expensive" | "Not using enough" | "Missing features" | "Switching provider" | "Other" | ""
  >("");
  const [cancelDetails, setCancelDetails] = useState("");
  const [exportRequested, setExportRequested] = useState(false);

  function toast(msg: string) {
    // MVP: keep it simple.
    // eslint-disable-next-line no-alert
    alert(msg);
  }

  function downloadStub(kind: "invoice" | "tax", invoiceId: string) {
    toast(
      `${kind === "invoice" ? "Invoice PDF" : "Tax receipt"} download is stubbed for ${invoiceId}. Wire to storage/Stripe invoice URLs.`
    );
  }

  function openWhatChanges(planId: PackageId) {
    setSelectedPlanId(planId);
    setPlanModalOpen(true);
  }

  function confirmPlanChange() {
    toast(
      `Plan change is stubbed. Would change from ${currentPlan.name} to ${selectedPlan.name} with estimated proration ${formatMoney(
        proration.estimatedCharge
      )}.`
    );
    setPlanModalOpen(false);
  }

  function requestExport() {
    setExportRequested(true);
    // Minimal data export as CSV (demo).
    const rows: string[][] = [
      ["Export", "Kealee GC Portal"],
      ["Generated At", new Date().toISOString()],
      [],
      ["Invoices"],
      ["Invoice ID", "Date", "Amount", "Status"],
      ...invoices.map((i) => [i.id, i.date, String(i.amount), i.status]),
    ];
    const csv = rows
      .map((r) =>
        r
          .map((cell) => {
            const s = String(cell ?? "");
            if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
            return s;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kealee-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function submitCancellation() {
    toast(
      `Cancellation is stubbed. Reason: ${cancelReason || "n/a"}${cancelDetails ? ` — ${cancelDetails}` : ""}. Final invoice handling will be added with billing provider.`
    );
    setCancelOpen(false);
  }

  // Usage analytics (MVP sample)
  const categoryHours = useMemo(
    () => [
      { label: "Permits & inspections", hours: 4 },
      { label: "Scheduling & coordination", hours: 3 },
      { label: "Budget & invoices", hours: 2 },
      { label: "Client/lender comms", hours: 3 },
    ],
    []
  );

  const costPerProject = useMemo(() => {
    const activeProjects = currentPlan.includedProjects;
    return activeProjects > 0 ? Math.round(currentPlan.priceMonthly / activeProjects) : currentPlan.priceMonthly;
  }, [currentPlan.includedProjects, currentPlan.priceMonthly]);

  const roi = useMemo(() => {
    // Simple story: compare saved hours to a blended in-house cost.
    const inHouseHourly = 95;
    const value = savedHoursThisMonth * inHouseHourly;
    const net = value - currentPlan.priceMonthly;
    return { inHouseHourly, value, net };
  }, [currentPlan.priceMonthly, savedHoursThisMonth]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-6">
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black tracking-tight">Current subscription</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <Pill>
                  {currentPlan.name} — {formatMoney(currentPlan.priceMonthly)}/month
                </Pill>
                <Pill tone={nearingHours ? "warn" : "neutral"}>
                  Service hours: {serviceHoursUsed}/{serviceHoursLimit}
                </Pill>
                <Pill>Next charge: {formatDate(nextChargeIso)}</Pill>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openWhatChanges("B")}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
            >
              Manage package
            </button>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-600">
              <span>Service hours used (monthly)</span>
              <span className="font-black text-zinc-900">{hoursPct.toFixed(0)}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
              <div
                className={`h-full rounded-full ${nearingHours ? "bg-amber-500" : "bg-[var(--primary)]"}`}
                style={{ width: `${hoursPct}%` }}
              />
            </div>
            {nearingHours ? (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                You&apos;re nearing your included service hours. Consider upgrading if you expect
                higher volume next month.
              </div>
            ) : null}
          </div>

          <div className="mt-4 rounded-2xl border border-black/10 bg-zinc-50 p-4">
            <div className="text-sm font-black text-zinc-950">Value</div>
            <div className="mt-1 text-sm text-zinc-700">
              You&apos;ve saved approx.{" "}
              <span className="font-black text-zinc-900">{savedHoursThisMonth} hours</span> this month.
              Estimated value:{" "}
              <span className="font-black text-zinc-900">{formatMoney(roi.value)}</span>{" "}
              compared to hiring.
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black tracking-tight">Invoice history</h2>
              <p className="mt-1 text-sm text-zinc-700">Download invoices and tax receipts.</p>
            </div>
            <button
              type="button"
              onClick={() => toast("Invoice emailing is stubbed. Wire to billing provider webhooks.")}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
            >
              Email receipts
            </button>
          </div>

          <div className="mt-4 overflow-auto">
            <table className="min-w-[680px] w-full border-collapse">
              <thead>
                <tr className="text-left text-xs font-black text-zinc-600">
                  <th className="border-b border-black/10 pb-2 pr-3">Date</th>
                  <th className="border-b border-black/10 pb-2 pr-3">Amount</th>
                  <th className="border-b border-black/10 pb-2 pr-3">Status</th>
                  <th className="border-b border-black/10 pb-2 pr-3">Downloads</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="text-sm text-zinc-800">
                    <td className="border-b border-black/5 py-2 pr-3">{formatDate(inv.date)}</td>
                    <td className="border-b border-black/5 py-2 pr-3">{formatMoney(inv.amount)}</td>
                    <td className="border-b border-black/5 py-2 pr-3">
                      <Pill
                        tone={
                          inv.status === "Paid"
                            ? "good"
                            : inv.status === "Due"
                              ? "warn"
                              : inv.status === "Failed"
                                ? "bad"
                                : "neutral"
                        }
                      >
                        {inv.status}
                      </Pill>
                    </td>
                    <td className="border-b border-black/5 py-2 pr-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => downloadStub("invoice", inv.id)}
                          className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-black text-zinc-900 hover:bg-zinc-50"
                        >
                          Invoice PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadStub("tax", inv.id)}
                          className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-black text-zinc-900 hover:bg-zinc-50"
                        >
                          Tax receipt
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black tracking-tight">Usage analytics</h2>
          <p className="mt-1 text-sm text-zinc-700">
            Understand where service hours go and your ROI.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <div className="text-sm font-black text-zinc-950">Service hours by category</div>
              <div className="mt-3 grid gap-2">
                {categoryHours.map((c) => {
                  const pct = serviceHoursUsed > 0 ? Math.min(100, (c.hours / serviceHoursUsed) * 100) : 0;
                  return (
                    <div key={c.label}>
                      <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
                        <span>{c.label}</span>
                        <span className="font-black">{c.hours}h</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                        <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <div className="text-sm font-black text-zinc-950">Cost & ROI</div>
              <div className="mt-3 grid gap-3">
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs font-semibold text-zinc-600">Cost per project (included)</div>
                  <div className="mt-1 text-xl font-black text-zinc-950">{formatMoney(costPerProject)}/mo</div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs font-semibold text-zinc-600">Savings vs hiring (est.)</div>
                  <div className="mt-1 text-xl font-black text-zinc-950">{formatMoney(roi.value)}</div>
                  <div className="mt-1 text-xs text-zinc-600">
                    Assumes {formatMoney(roi.inHouseHourly)}/hour blended in-house cost × {savedHoursThisMonth} hours saved.
                  </div>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  You&apos;re saving approximately{" "}
                  <span className="font-black">{formatMoney(Math.max(0, roi.net))}</span>{" "}
                  this month compared to hiring.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black tracking-tight">Payment method</h2>
          <p className="mt-1 text-sm text-zinc-700">Update how you pay and manage receipts.</p>

          <div className="mt-4 rounded-2xl border border-black/10 bg-zinc-50 p-4">
            <div className="text-sm font-black text-zinc-950">
              {paymentMethod.brand} •••• {paymentMethod.last4}
            </div>
            <div className="mt-1 text-sm text-zinc-700">Expires {paymentMethod.exp}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toast("Open billing provider portal (stub).")}
                className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-black text-[var(--primary-foreground)] hover:opacity-95"
              >
                Manage payment method
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod({ brand: "Mastercard", last4: "5100", exp: "11/28" })}
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
              >
                Use backup card (demo)
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black tracking-tight">Package management</h2>
              <p className="mt-1 text-sm text-zinc-700">
                Upgrade/downgrade with prorated estimates and feature comparison.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openWhatChanges(currentPackageId)}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
            >
              What changes?
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            {plans.map((p) => {
              const isCurrent = p.id === currentPackageId;
              const action =
                p.priceMonthly > currentPlan.priceMonthly ? "Upgrade" : p.priceMonthly < currentPlan.priceMonthly ? "Downgrade" : "Current";
              return (
                <div key={p.id} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-zinc-950">
                        {p.name} — {formatMoney(p.priceMonthly)}/month
                      </div>
                      <div className="mt-1 text-sm text-zinc-700">
                        {p.includedProjects} projects • {p.serviceHoursMonthly} service hours/month
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {isCurrent ? <Pill tone="good">Current</Pill> : null}
                      <button
                        type="button"
                        onClick={() => openWhatChanges(p.id)}
                        className={`rounded-xl px-4 py-2 text-sm font-black ${
                          isCurrent ? "border border-black/10 bg-white text-zinc-700" : "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-95"
                        }`}
                      >
                        {action}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black tracking-tight">Cancellation</h2>
          <p className="mt-1 text-sm text-zinc-700">
            Cancel, export your data, and receive your final invoice.
          </p>

          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={() => setCancelOpen(true)}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-black text-red-800 hover:bg-red-100"
            >
              Cancel subscription
            </button>
            <button
              type="button"
              onClick={requestExport}
              className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-black text-zinc-900 hover:bg-zinc-50"
            >
              Export my data
            </button>
            {exportRequested ? (
              <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 text-sm text-zinc-700">
                Export generated (CSV). Wire a full export pipeline next (projects, permits, reports, comments).
              </div>
            ) : null}
          </div>

          <div className="mt-4 rounded-2xl border border-black/10 bg-zinc-50 p-4 text-sm text-zinc-700">
            Final invoice: will be generated automatically by your billing provider when cancellation is confirmed.
          </div>
        </div>
      </div>

      <Modal
        open={planModalOpen}
        title={`What changes? ${currentPlan.name} → ${selectedPlan.name}`}
        onClose={() => setPlanModalOpen(false)}
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-3">
            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <div className="text-sm font-black text-zinc-950">Feature comparison</div>
              <div className="mt-2 text-sm text-zinc-700">
                <div className="font-black text-zinc-900">{selectedPlan.name} includes:</div>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {selectedPlan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <div className="text-sm font-black text-zinc-950">Limits</div>
              <div className="mt-2 text-sm text-zinc-700">
                Projects:{" "}
                <span className="font-black text-zinc-900">{selectedPlan.includedProjects}</span>
                <br />
                Service hours/month:{" "}
                <span className="font-black text-zinc-900">{selectedPlan.serviceHoursMonthly}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <div className="text-sm font-black text-zinc-950">Proration estimate</div>
              <div className="mt-2 text-sm text-zinc-700">
                Remaining in cycle:{" "}
                <span className="font-black text-zinc-900">{proration.remainingDays}</span>/
                {proration.totalDays} days
              </div>
              <div className="mt-2 text-sm text-zinc-700">
                Monthly difference:{" "}
                <span className="font-black text-zinc-900">{formatMoney(proration.priceDiff)}</span>
              </div>
              <div className="mt-2 rounded-2xl border border-black/10 bg-white p-4">
                <div className="text-xs font-semibold text-zinc-600">Estimated charge/credit today</div>
                <div className="mt-1 text-xl font-black text-zinc-950">
                  {formatMoney(proration.estimatedCharge)}
                </div>
                <div className="mt-1 text-xs text-zinc-600">
                  Approximate; final proration is computed by your billing provider.
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <div className="text-sm font-black text-zinc-950">Confirm</div>
              <div className="mt-2 text-sm text-zinc-700">
                Clicking confirm will open your billing provider portal in the real implementation.
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={confirmPlanChange}
                  className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-black text-[var(--primary-foreground)] hover:opacity-95"
                >
                  Confirm change (stub)
                </button>
                <button
                  type="button"
                  onClick={() => setPlanModalOpen(false)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={cancelOpen} title="Cancel subscription" onClose={() => setCancelOpen(false)}>
        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-3">
            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <div className="text-sm font-black text-zinc-950">Exit survey</div>
              <div className="mt-3 grid gap-2">
                <label className="text-xs font-black text-zinc-700">
                  Why are you leaving?
                  <select
                    className="mt-2 h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm font-black text-zinc-900 outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value as any)}
                  >
                    <option value="">Select…</option>
                    <option value="Too expensive">Too expensive</option>
                    <option value="Not using enough">Not using enough</option>
                    <option value="Missing features">Missing features</option>
                    <option value="Switching provider">Switching provider</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label className="text-xs font-black text-zinc-700">
                  Anything we should know?
                  <textarea
                    className="mt-2 min-h-[110px] w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                    value={cancelDetails}
                    onChange={(e) => setCancelDetails(e.target.value)}
                    placeholder="Share context so we can improve…"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <div className="text-sm font-black text-zinc-950">Data export</div>
              <div className="mt-2 text-sm text-zinc-700">
                Export your invoices and key account data before leaving.
              </div>
              <button
                type="button"
                onClick={requestExport}
                className="mt-3 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
              >
                Export now
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <div className="text-sm font-black">Retention offers</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Downgrade to Package A</li>
                <li>Pause service for 1 month</li>
                <li>10% discount for 3 months (case-by-case)</li>
              </ul>
              <button
                type="button"
                onClick={() => openWhatChanges("A")}
                className="mt-3 w-full rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-black text-[var(--primary-foreground)] hover:opacity-95"
              >
                Downgrade instead
              </button>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              <div className="text-sm font-black">Confirm cancellation</div>
              <div className="mt-2 text-sm">
                Your access will remain until the end of the current billing period. A final invoice may apply.
              </div>
              <button
                type="button"
                onClick={submitCancellation}
                className="mt-3 w-full rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-black text-red-800 hover:bg-red-100"
              >
                Confirm cancel (stub)
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

