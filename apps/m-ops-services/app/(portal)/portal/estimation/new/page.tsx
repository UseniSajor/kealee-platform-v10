"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

const ESTIMATE_TYPES = [
  { value: "conceptual", label: "Conceptual" },
  { value: "schematic", label: "Schematic" },
  { value: "detailed", label: "Detailed" },
  { value: "bid", label: "Bid" },
  { value: "change_order", label: "Change Order" },
];

export default function NewEstimatePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("detailed");
  const [projectId, setProjectId] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Estimate name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const result = await api.createEstimate({
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        projectId: projectId.trim() || undefined,
        status: "draft",
      });

      const estimateId = result.estimate?.id;
      if (estimateId) {
        router.push(`/portal/estimation/${estimateId}`);
      } else {
        router.push("/portal/estimation");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create estimate");
      setSaving(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">New estimate</h1>
          <p className="mt-2 text-sm text-zinc-700">
            Create a new cost estimate. You can add line items, assemblies, and run AI
            analysis after creation.
          </p>
        </div>
        <Link
          href="/portal/estimation"
          className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
        >
          Back to estimates
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black tracking-tight">Estimate details</h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-extrabold text-zinc-900">
                Estimate name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Main Building - Detailed Estimate"
                className="mt-1.5 h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-extrabold text-zinc-900">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the estimate scope..."
                rows={3}
                className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
              />
            </div>

            <div>
              <label className="block text-sm font-extrabold text-zinc-900">Estimate type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
              >
                {ESTIMATE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-extrabold text-zinc-900">
                Project ID (optional)
              </label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="Link to an existing project"
                className="mt-1.5 h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-zinc-50 p-5 shadow-sm">
          <div className="text-sm font-black text-zinc-900">After creating your estimate</div>
          <ul className="mt-2 space-y-1 text-sm text-zinc-700">
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
              Add line items with material costs, labor, and quantities
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
              Use assemblies to quickly add pre-built cost groups
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
              Run AI scope analysis and value engineering
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
              Upload plans for AI-powered takeoff
            </li>
          </ul>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href="/portal/estimation"
            className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-black text-zinc-900 hover:bg-zinc-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-6 py-2.5 text-sm font-black text-[var(--primary-foreground)] shadow-sm hover:opacity-95 disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create Estimate"}
          </button>
        </div>
      </form>
    </section>
  );
}
