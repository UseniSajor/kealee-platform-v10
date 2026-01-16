"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export type GCServiceRequestCategory =
  | "Permit Application Help"
  | "Inspection Scheduling"
  | "Contractor Coordination"
  | "Change Order Management"
  | "Billing & Invoicing"
  | "Schedule Optimization"
  | "Document Preparation"
  | "Other Operations Help";

export type GCServiceRequestPriority = "Urgent" | "Normal";

export type GCServiceRequestStatus =
  | "Submitted"
  | "Assigned"
  | "In Progress"
  | "Completed";

export type GCProjectOption = {
  id: string;
  name: string;
  address?: string;
};

export type GCServiceRequest = {
  id: string;
  category: GCServiceRequestCategory;
  priority: GCServiceRequestPriority;
  status: GCServiceRequestStatus;
  projectId?: string | null;
  projectName?: string | null;
  title: string;
  description?: string | null;
  createdAt: string;
  assignedPm?: { name: string; email?: string } | null;
  timeSpentMinutes?: number;
  attachments?: Array<{ name: string; size: number; type: string }>;
  thread?: Array<{ id: string; at: string; from: string; message: string }>;
  satisfaction?: number | null;
};

type WizardStep = 1 | 2 | 3 | 4 | 5;

const categories: Array<{
  key: GCServiceRequestCategory;
  description: string;
}> = [
  { key: "Permit Application Help", description: "Applications, resubmittals, follow-ups, jurisdiction comms." },
  { key: "Inspection Scheduling", description: "Book inspections, coordinate trades, prep checklists." },
  { key: "Contractor Coordination", description: "Subs/vendors scheduling, updates, and accountability." },
  { key: "Change Order Management", description: "CO drafting, approvals, documentation, client comms." },
  { key: "Billing & Invoicing", description: "Owner invoices, vendor bills, lien waivers, receipts." },
  { key: "Schedule Optimization", description: "Tighten sequence, reduce downtime, protect milestones." },
  { key: "Document Preparation", description: "Submittals, closeout docs, plan sets, compliance files." },
  { key: "Other Operations Help", description: "Anything ops-related that’s slowing your team down." },
];

function responseTimeFor(priority: GCServiceRequestPriority) {
  return priority === "Urgent" ? "Urgent: 2 hours" : "Normal: 24 hours";
}

function clampInt(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export function ServiceRequestWizard({
  packageName = "Package B",
  slaText = "Package B: 40 service hours/month",
  defaultProjectId,
  onSubmitted,
}: {
  packageName?: string;
  slaText?: string;
  defaultProjectId?: string;
  onSubmitted?: (request: GCServiceRequest) => void;
}) {
  const [step, setStep] = useState<WizardStep>(1);

  const [priority, setPriority] = useState<GCServiceRequestPriority>("Normal");
  const [category, setCategory] = useState<GCServiceRequestCategory>(
    "Permit Application Help"
  );

  const [projects, setProjects] = useState<GCProjectOption[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | "">("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [files, setFiles] = useState<File[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedRequest, setSubmittedRequest] = useState<GCServiceRequest | null>(
    null
  );

  // Auto-suggest based on package (simple heuristic)
  const suggestedCategories = useMemo(() => {
    if (packageName.includes("B")) {
      return ["Permit Application Help", "Inspection Scheduling", "Contractor Coordination"] as const;
    }
    if (packageName.includes("A")) {
      return ["Permit Application Help", "Document Preparation", "Billing & Invoicing"] as const;
    }
    if (packageName.includes("C") || packageName.includes("D")) {
      return ["Schedule Optimization", "Contractor Coordination", "Change Order Management"] as const;
    }
    return ["Permit Application Help", "Inspection Scheduling"] as const;
  }, [packageName]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setProjectsLoading(true);
      setProjectsError(null);
      try {
        const res = await fetch("/api/projects", { cache: "no-store" });
        const data = (await res.json()) as { ok: boolean; data: GCProjectOption[]; message?: string };
        if (!res.ok || !data.ok) throw new Error(data.message || "Failed to load projects");
        if (!mounted) return;
        setProjects(data.data || []);
        setProjectId(defaultProjectId || (data.data?.[0]?.id ?? ""));
      } catch (e: unknown) {
        if (!mounted) return;
        setProjectsError(e instanceof Error ? e.message : "Failed to load projects");
      } finally {
        if (mounted) setProjectsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [defaultProjectId]);

  const canNext = useMemo(() => {
    if (step === 1) return true;
    if (step === 2) return !!projectId;
    if (step === 3) return title.trim().length >= 6;
    if (step === 4) return true;
    return false;
  }, [projectId, step, title]);

  const attachmentsMeta = useMemo(() => {
    return files.map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type || "application/octet-stream",
    }));
  }, [files]);

  async function submit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          priority,
          projectId,
          title,
          description,
          attachments: attachmentsMeta,
          packageName,
        }),
      });
      const data = (await res.json()) as { ok: boolean; data?: GCServiceRequest; message?: string };
      if (!res.ok || !data.ok || !data.data) {
        throw new Error(data.message || "Failed to submit request");
      }
      setSubmittedRequest(data.data);
      setStep(5);
      onSubmitted?.(data.data);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight">
            Submit a Service Request
          </h2>
          <p className="mt-1 text-sm text-zinc-700">
            Request help from the Kealee PM team. Estimated response:{" "}
            <span className="font-extrabold text-zinc-900">
              {responseTimeFor(priority)}
            </span>
          </p>
          <p className="mt-1 text-xs text-zinc-600">{slaText}</p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-zinc-600">
          <span className={step === 1 ? "text-zinc-950" : ""}>1</span>
          <span>→</span>
          <span className={step === 2 ? "text-zinc-950" : ""}>2</span>
          <span>→</span>
          <span className={step === 3 ? "text-zinc-950" : ""}>3</span>
          <span>→</span>
          <span className={step === 4 ? "text-zinc-950" : ""}>4</span>
          <span>→</span>
          <span className={step === 5 ? "text-zinc-950" : ""}>5</span>
        </div>
      </div>

      {submitError ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {submitError}
        </div>
      ) : null}

      <div className="mt-6">
        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <div className="text-sm font-black text-zinc-950">
                Step 1: Category & Priority
              </div>
              <div className="mt-1 text-sm text-zinc-700">
                Choose what you need help with and how urgent it is.
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <div className="text-xs font-bold text-zinc-600">Priority</div>
                <div className="mt-3 flex gap-2">
                  {(["Normal", "Urgent"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={[
                        "rounded-xl px-3 py-2 text-sm font-black",
                        priority === p
                          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                          : "border border-black/10 bg-white text-zinc-900 hover:bg-zinc-50",
                      ].join(" ")}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="mt-3 text-xs text-zinc-600">
                  {priority === "Urgent"
                    ? "Urgent requests target a ~2 hour response window."
                    : "Normal requests target a ~24 hour response window."}
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-xs font-bold text-zinc-600">Category</div>
                  <div className="text-[11px] font-black text-zinc-600">
                    Suggested for {packageName}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestedCategories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={[
                        "rounded-full px-3 py-1.5 text-xs font-black",
                        category === c
                          ? "bg-sky-50 text-sky-700 border border-sky-200"
                          : "bg-zinc-50 text-zinc-800 border border-black/10 hover:bg-zinc-100",
                      ].join(" ")}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {categories.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className={[
                    "rounded-2xl border p-4 text-left shadow-sm transition",
                    category === c.key
                      ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/15"
                      : "border-black/10 hover:bg-zinc-50",
                  ].join(" ")}
                >
                  <div className="text-sm font-black text-zinc-950">{c.key}</div>
                  <div className="mt-1 text-sm text-zinc-700">{c.description}</div>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div>
              <div className="text-sm font-black text-zinc-950">
                Step 2: Project Selection
              </div>
              <div className="mt-1 text-sm text-zinc-700">
                Select which project this request is for.
              </div>
            </div>

            {projectsLoading ? (
              <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-zinc-700">
                Loading projects…
              </div>
            ) : projectsError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                {projectsError}
              </div>
            ) : (
              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <label className="grid gap-2">
                  <span className="text-sm font-extrabold text-zinc-900">
                    Project
                  </span>
                  <select
                    className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                  >
                    <option value="" disabled>
                      Select a project…
                    </option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.address ? ` — ${p.address}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div>
              <div className="text-sm font-black text-zinc-950">
                Step 3: Description & Details
              </div>
              <div className="mt-1 text-sm text-zinc-700">
                Give your PM enough context to start immediately.
              </div>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-zinc-900">Title</span>
              <input
                className="h-10 rounded-xl border border-black/10 px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Help scheduling rough inspection for 123 Main St"
              />
              <span className="text-xs text-zinc-600">
                Tip: include address + milestone (rough/final/framing/etc.).
              </span>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-zinc-900">
                Description & details
              </span>
              <textarea
                className="min-h-[140px] rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Include jurisdiction, target dates, trade availability windows, known blockers, and any required docs."
              />
            </label>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <div>
              <div className="text-sm font-black text-zinc-950">
                Step 4: Attachments
              </div>
              <div className="mt-1 text-sm text-zinc-700">
                Add plans, photos, documents, screenshots—anything helpful.
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <input
                type="file"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />

              {files.length ? (
                <div className="mt-3">
                  <div className="text-xs font-bold text-zinc-600">
                    Attachments selected
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-zinc-800">
                    {files.map((f) => (
                      <li key={f.name}>
                        {f.name}{" "}
                        <span className="text-xs text-zinc-600">
                          ({clampInt(Math.round(f.size / 1024), 0, 999999)} KB)
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 text-xs text-zinc-600">
                    Note: this MVP stores attachment metadata for tracking. File
                    upload storage can be added next.
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-xs text-zinc-600">
                  Optional — you can submit without attachments.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 text-sm text-zinc-800">
              <div className="font-black text-zinc-950">Ready to submit</div>
              <div className="mt-1 text-sm text-zinc-700">
                We&apos;ll create a PM task and keep status updates synced here.
              </div>
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-4">
            <div>
              <div className="text-sm font-black text-zinc-950">
                Step 5: Submit & Confirmation
              </div>
              <div className="mt-1 text-sm text-zinc-700">
                Your request has been received.
              </div>
            </div>

            {submittedRequest ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <div className="font-black">Submitted</div>
                <div className="mt-1">
                  <span className="font-bold">Request:</span>{" "}
                  {submittedRequest.title}
                </div>
                <div className="mt-1">
                  <span className="font-bold">Status:</span>{" "}
                  {submittedRequest.status}
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link
                    href="/portal/service-requests"
                    className="font-extrabold underline"
                  >
                    View all service requests →
                  </Link>
                  <button
                    type="button"
                    className="font-extrabold underline"
                    onClick={() => {
                      setStep(1);
                      setTitle("");
                      setDescription("");
                      setFiles([]);
                      setSubmittedRequest(null);
                    }}
                  >
                    Submit another →
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-zinc-700">
                Nothing submitted yet.
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
          onClick={() =>
            setStep((s) => (s === 1 ? 1 : ((s - 1) as WizardStep)))
          }
          disabled={step === 1 || submitting || step === 5}
        >
          Back
        </button>

        <div className="flex items-center gap-2">
          {step === 4 ? (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-black text-[var(--primary-foreground)] hover:opacity-95 disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit request"}
            </button>
          ) : step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => ((s + 1) as WizardStep))}
              disabled={!canNext || submitting}
              className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-black text-[var(--primary-foreground)] hover:opacity-95 disabled:opacity-60"
              title={
                step === 2 && !projectId
                  ? "Select a project"
                  : step === 3 && title.trim().length < 6
                    ? "Enter a more specific title"
                    : undefined
              }
            >
              Next
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

