"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

function formatMoney(n: number) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "in_progress", label: "In Progress" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function EstimateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const estimateId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<any>(null);
  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [databases, setDatabases] = useState<any[]>([]);

  // Editable fields
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editType, setEditType] = useState("");

  // AI tools
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiResultType, setAiResultType] = useState<string>("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [estResult, assembliesResult, dbResult] = await Promise.all([
        api.getEstimate(estimateId),
        api.listAssemblies().catch(() => ({ assemblies: [] })),
        api.listCostDatabases().catch(() => ({ databases: [] })),
      ]);

      const est = estResult.estimate;
      setEstimate(est);
      setEditName(est?.name || "");
      setEditDescription(est?.description || "");
      setEditStatus(est?.status || "draft");
      setEditType(est?.type || "detailed");
      setAssemblies(assembliesResult.assemblies || []);
      setDatabases(dbResult.databases || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load estimate");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (estimateId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimateId]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await api.updateEstimate(estimateId, {
        name: editName.trim(),
        description: editDescription.trim(),
        status: editStatus,
        type: editType,
      });
      setEditing(false);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update estimate");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this estimate? This cannot be undone.")) return;
    try {
      await api.deleteEstimate(estimateId);
      router.push("/portal/estimation");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete estimate");
    }
  }

  async function runAiTool(tool: string) {
    setAiLoading(tool);
    setAiResult(null);
    setAiResultType(tool);
    try {
      let result;
      switch (tool) {
        case "scope":
          result = await api.runScopeAnalysis({ estimateId });
          setAiResult(result.analysis);
          break;
        case "cost":
          result = await api.runCostPrediction({ estimateId });
          setAiResult(result.prediction);
          break;
        case "value":
          result = await api.runValueEngineering({ estimateId });
          setAiResult(result.suggestions);
          break;
        case "benchmark":
          result = await api.benchmarkEstimate({ estimateId });
          setAiResult(result.benchmark);
          break;
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : `AI ${tool} analysis failed`);
    } finally {
      setAiLoading(null);
    }
  }

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="rounded-2xl border border-black/10 bg-white p-8 text-center text-sm text-zinc-600 shadow-sm">
          Loading estimate...
        </div>
      </section>
    );
  }

  if (!estimate && error) {
    return (
      <section className="space-y-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900 shadow-sm">
          {error}
        </div>
        <Link
          href="/portal/estimation"
          className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
        >
          Back to estimates
        </Link>
      </section>
    );
  }

  const lineItems = estimate?.lineItems || [];
  const totalCost = estimate?.totalCost ?? lineItems.reduce((sum: number, li: any) => sum + (li.totalCost || 0), 0);
  const materialCost = estimate?.materialCost ?? lineItems.reduce((sum: number, li: any) => sum + (li.materialCost || 0), 0);
  const laborCost = estimate?.laborCost ?? lineItems.reduce((sum: number, li: any) => sum + (li.laborCost || 0), 0);

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-10 w-full max-w-lg rounded-xl border border-black/10 bg-white px-3 text-lg font-black outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
            />
          ) : (
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight">
                {estimate?.name || "Untitled Estimate"}
              </h1>
              <StatusPill status={estimate?.status} />
            </div>
          )}
          <p className="mt-2 text-sm text-zinc-700">
            {estimate?.type && (
              <span className="font-extrabold text-zinc-900 capitalize">{estimate.type}</span>
            )}
            {estimate?.createdAt && (
              <span> &middot; Created {formatDate(estimate.createdAt)}</span>
            )}
            {estimate?.updatedAt && (
              <span> &middot; Updated {formatDate(estimate.updatedAt)}</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/portal/estimation"
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
          >
            Back
          </Link>
          {editing ? (
            <>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-black text-[var(--primary-foreground)] hover:opacity-95 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-black text-red-700 hover:bg-red-50"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-3 text-xs font-black underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Left column: Details + Line Items */}
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold text-zinc-600">Total cost</div>
              <div className="mt-1 text-xl font-black text-zinc-950">
                {formatMoney(totalCost)}
              </div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold text-zinc-600">Material cost</div>
              <div className="mt-1 text-xl font-black text-zinc-950">
                {formatMoney(materialCost)}
              </div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold text-zinc-600">Labor cost</div>
              <div className="mt-1 text-xl font-black text-zinc-950">
                {formatMoney(laborCost)}
              </div>
            </div>
          </div>

          {/* Edit fields */}
          {editing && (
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black tracking-tight">Edit details</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-extrabold text-zinc-900">Description</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                  />
                </div>
                <div>
                  <label className="block text-sm font-extrabold text-zinc-900">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-extrabold text-zinc-900">Type</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                  >
                    <option value="conceptual">Conceptual</option>
                    <option value="schematic">Schematic</option>
                    <option value="detailed">Detailed</option>
                    <option value="bid">Bid</option>
                    <option value="change_order">Change Order</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Description (read mode) */}
          {!editing && estimate?.description && (
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black tracking-tight">Description</h2>
              <p className="mt-2 text-sm text-zinc-700 whitespace-pre-wrap">
                {estimate.description}
              </p>
            </div>
          )}

          {/* Line items */}
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-lg font-black tracking-tight">Line items</h2>
              <span className="text-sm font-extrabold text-zinc-600">
                {lineItems.length} items
              </span>
            </div>

            {lineItems.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-black/10 bg-zinc-50 p-4 text-center text-sm text-zinc-700">
                No line items yet. Use AI Takeoff to auto-generate items from plans, or add items
                manually via the API.
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/10">
                      <th className="pb-2 text-left text-xs font-extrabold text-zinc-600">Item</th>
                      <th className="pb-2 text-left text-xs font-extrabold text-zinc-600">Division</th>
                      <th className="pb-2 text-right text-xs font-extrabold text-zinc-600">Qty</th>
                      <th className="pb-2 text-right text-xs font-extrabold text-zinc-600">Unit Cost</th>
                      <th className="pb-2 text-right text-xs font-extrabold text-zinc-600">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((li: any, idx: number) => (
                      <tr key={li.id || idx} className="border-b border-black/5">
                        <td className="py-2 pr-3 font-black text-zinc-900">
                          {li.name || li.description || `Item ${idx + 1}`}
                        </td>
                        <td className="py-2 pr-3 text-zinc-600">
                          {li.division || li.csiCode || "-"}
                        </td>
                        <td className="py-2 pr-3 text-right text-zinc-700">
                          {li.quantity ?? "-"} {li.unit || ""}
                        </td>
                        <td className="py-2 pr-3 text-right text-zinc-700">
                          {li.unitCost != null ? formatMoney(li.unitCost) : "-"}
                        </td>
                        <td className="py-2 text-right font-black text-zinc-900">
                          {li.totalCost != null ? formatMoney(li.totalCost) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-black/10">
                      <td colSpan={4} className="py-2 text-right font-extrabold text-zinc-900">
                        Total
                      </td>
                      <td className="py-2 text-right font-black text-zinc-950">
                        {formatMoney(totalCost)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Assemblies reference */}
          {assemblies.length > 0 && (
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black tracking-tight">Available assemblies</h2>
              <p className="mt-1 text-sm text-zinc-700">
                Pre-built cost groups you can reference for this estimate.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {assemblies.slice(0, 8).map((a: any) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-black/10 bg-zinc-50 p-3 text-sm"
                  >
                    <div className="font-black text-zinc-900">{a.name}</div>
                    {a.description && (
                      <div className="mt-1 text-xs text-zinc-600 line-clamp-2">{a.description}</div>
                    )}
                    {a.totalCost != null && (
                      <div className="mt-1 text-xs font-extrabold text-zinc-700">
                        {formatMoney(a.totalCost)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: AI Tools + Metadata */}
        <div className="space-y-6">
          {/* AI Quick Actions */}
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-black tracking-tight">AI analysis</h3>
            <p className="mt-1 text-sm text-zinc-700">
              Run AI-powered analysis on this estimate.
            </p>
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={() => runAiTool("scope")}
                disabled={aiLoading !== null}
                className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-left text-sm font-black text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
              >
                {aiLoading === "scope" ? "Analyzing scope..." : "Scope Analysis"}
              </button>
              <button
                type="button"
                onClick={() => runAiTool("cost")}
                disabled={aiLoading !== null}
                className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-left text-sm font-black text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
              >
                {aiLoading === "cost" ? "Predicting costs..." : "Cost Prediction"}
              </button>
              <button
                type="button"
                onClick={() => runAiTool("value")}
                disabled={aiLoading !== null}
                className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-left text-sm font-black text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
              >
                {aiLoading === "value" ? "Analyzing value..." : "Value Engineering"}
              </button>
              <button
                type="button"
                onClick={() => runAiTool("benchmark")}
                disabled={aiLoading !== null}
                className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-left text-sm font-black text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
              >
                {aiLoading === "benchmark" ? "Benchmarking..." : "Benchmark Estimate"}
              </button>
            </div>
          </div>

          {/* AI Result */}
          {aiResult && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-black tracking-tight text-sky-900 capitalize">
                  {aiResultType} Result
                </h3>
                <button
                  type="button"
                  onClick={() => setAiResult(null)}
                  className="text-xs font-black text-sky-700 hover:underline"
                >
                  Dismiss
                </button>
              </div>
              <div className="mt-3 text-sm text-sky-900">
                {typeof aiResult === "string" ? (
                  <p className="whitespace-pre-wrap">{aiResult}</p>
                ) : (
                  <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-white/60 p-3 text-xs">
                    {JSON.stringify(aiResult, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Cost databases */}
          {databases.length > 0 && (
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black tracking-tight">Cost databases</h3>
              <div className="mt-3 space-y-2">
                {databases.map((db: any) => (
                  <div key={db.id} className="rounded-xl border border-black/10 bg-zinc-50 p-3 text-sm">
                    <div className="font-black text-zinc-900">{db.name}</div>
                    {db.version && (
                      <div className="text-xs text-zinc-600">Version {db.version}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-black tracking-tight">Quick actions</h3>
            <div className="mt-3 grid gap-2">
              <Link
                href="/portal/estimation/ai-takeoff"
                className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-black text-zinc-900 hover:bg-zinc-50"
              >
                Upload Plans for AI Takeoff
              </Link>
              <Link
                href="/portal/estimation/ai-tools"
                className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-black text-zinc-900 hover:bg-zinc-50"
              >
                AI Tools Hub
              </Link>
              <Link
                href="/portal/estimation"
                className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-black text-zinc-900 hover:bg-zinc-50"
              >
                All Estimates
              </Link>
            </div>
          </div>

          {/* Metadata */}
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-black tracking-tight">Metadata</h3>
            <div className="mt-3 grid gap-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-extrabold text-zinc-900">ID</span>
                <span className="font-mono text-xs text-zinc-600">{estimateId}</span>
              </div>
              {estimate?.projectId && (
                <div className="flex items-center justify-between gap-3">
                  <span className="font-extrabold text-zinc-900">Project ID</span>
                  <span className="font-mono text-xs text-zinc-600">{estimate.projectId}</span>
                </div>
              )}
              {estimate?.createdBy && (
                <div className="flex items-center justify-between gap-3">
                  <span className="font-extrabold text-zinc-900">Created by</span>
                  <span className="text-zinc-600">{estimate.createdBy}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
