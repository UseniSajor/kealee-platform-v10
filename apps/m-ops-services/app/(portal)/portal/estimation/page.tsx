"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

function formatMoney(n: number) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusPill({ status }: { status: string }) {
  const s = (status || "").toLowerCase();
  const styles =
    s === "approved" || s === "completed"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : s === "in_progress" || s === "in progress"
        ? "bg-sky-50 text-sky-700 border-sky-200"
        : s === "draft"
          ? "bg-zinc-50 text-zinc-700 border-zinc-200"
          : s === "rejected"
            ? "bg-red-50 text-red-700 border-red-200"
            : s === "submitted" || s === "pending"
              ? "bg-amber-50 text-amber-800 border-amber-200"
              : "bg-zinc-50 text-zinc-700 border-zinc-200";
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black capitalize",
        styles,
      ].join(" ")}
    >
      {status || "Draft"}
    </span>
  );
}

export default function EstimationListPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [metrics, setMetrics] = useState<any>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const filters: Record<string, string> = {};
      if (statusFilter !== "all") filters.status = statusFilter;
      if (search.trim()) filters.search = search.trim();

      const [estimatesResult, metricsResult] = await Promise.all([
        api.listEstimates(filters).catch(() => ({ estimates: [] })),
        api.getEstimationMetrics().catch(() => ({ metrics: null })),
      ]);

      setEstimates(estimatesResult.estimates || []);
      setMetrics(metricsResult.metrics || null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load estimates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this estimate?")) return;
    try {
      await api.deleteEstimate(id);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete estimate");
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Estimation</h1>
          <p className="mt-2 text-sm text-zinc-700">
            Create and manage cost estimates with AI-powered tools.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/portal/estimation/ai-takeoff"
            className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-black text-zinc-900 hover:bg-zinc-50"
          >
            AI Takeoff
          </Link>
          <Link
            href="/portal/estimation/ai-tools"
            className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-black text-zinc-900 hover:bg-zinc-50"
          >
            AI Tools
          </Link>
          <Link
            href="/portal/estimation/new"
            className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-black text-[var(--primary-foreground)] shadow-sm hover:opacity-95"
          >
            New Estimate
          </Link>
        </div>
      </header>

      {/* Metrics cards */}
      {metrics && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold text-zinc-600">Total estimates</div>
            <div className="mt-1 text-xl font-black text-zinc-950">
              {metrics.totalEstimates ?? estimates.length}
            </div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold text-zinc-600">Avg. estimate value</div>
            <div className="mt-1 text-xl font-black text-zinc-950">
              {formatMoney(metrics.avgEstimateValue ?? 0)}
            </div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold text-zinc-600">Pending approval</div>
            <div className="mt-1 text-xl font-black text-zinc-950">
              {metrics.pendingApproval ?? 0}
            </div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold text-zinc-600">AI takeoffs run</div>
            <div className="mt-1 text-xl font-black text-zinc-950">
              {metrics.aiTakeoffsRun ?? 0}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search estimates..."
            className="h-10 flex-1 min-w-[200px] rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
          />
          <button
            type="submit"
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
          >
            Search
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm font-black text-zinc-900 outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="in_progress">In Progress</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <button
          type="button"
          onClick={load}
          className="text-sm font-extrabold text-[color:var(--primary)] hover:underline"
        >
          Refresh
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="rounded-2xl border border-black/10 bg-white p-8 text-center text-sm text-zinc-600 shadow-sm">
          Loading estimates...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900 shadow-sm">
          {error}
        </div>
      ) : estimates.length === 0 ? (
        <div className="rounded-2xl border border-black/10 bg-white p-8 text-center shadow-sm">
          <div className="text-lg font-black text-zinc-950">No estimates yet</div>
          <p className="mt-2 text-sm text-zinc-700">
            Create your first estimate to get started with cost estimation.
          </p>
          <Link
            href="/portal/estimation/new"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-black text-[var(--primary-foreground)] shadow-sm hover:opacity-95"
          >
            Create First Estimate
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {estimates.map((est: any) => (
            <Link
              key={est.id}
              href={`/portal/estimation/${est.id}`}
              className="group rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition hover:border-[var(--primary)]/30 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-black text-zinc-950 group-hover:text-[var(--primary)]">
                      {est.name || "Untitled Estimate"}
                    </div>
                    <StatusPill status={est.status} />
                  </div>
                  {est.description && (
                    <p className="mt-1 text-sm text-zinc-600 line-clamp-1">{est.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600">
                    {est.projectName && (
                      <span>
                        <span className="font-bold text-zinc-700">Project:</span> {est.projectName}
                      </span>
                    )}
                    {est.type && (
                      <span>
                        <span className="font-bold text-zinc-700">Type:</span> {est.type}
                      </span>
                    )}
                    {est.createdAt && (
                      <span>
                        <span className="font-bold text-zinc-700">Created:</span>{" "}
                        {formatDate(est.createdAt)}
                      </span>
                    )}
                    {est.updatedAt && (
                      <span>
                        <span className="font-bold text-zinc-700">Updated:</span>{" "}
                        {formatDate(est.updatedAt)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {est.totalCost != null && (
                    <div className="text-lg font-black text-zinc-950">
                      {formatMoney(est.totalCost)}
                    </div>
                  )}
                  {est.lineItemCount != null && (
                    <div className="text-xs text-zinc-600">
                      {est.lineItemCount} line items
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
