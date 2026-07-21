"use client";

import { useEffect, useMemo, useState } from "react";

export type GCWeeklyReportType =
  | "Project Status Report"
  | "Financial Summary"
  | "Permit & Inspection Tracker"
  | "Risk & Issue Log"
  | "Upcoming Week Preview";

export type GCWeeklyReport = {
  id: string;
  weekOf: string; // ISO date (Monday)
  projectName?: string | null; // for per-project reports
  types: GCWeeklyReportType[];
  generatedAt: string; // ISO
  generatedBy: { name: string; email?: string };
  emailedTo: string[]; // GC recipients
  pdfUrl?: string | null; // URL to a generated PDF (when wired)
  aiInsights: string[]; // Claude-generated insights (stubbed)
  summary: string;
  actionItems: Array<{
    id: string;
    title: string;
    owner: "Kealee PM" | "GC" | "Sub";
    dueDate?: string;
    status: "Open" | "Done";
  }>;
  permitInspection: Array<{
    item: string;
    status: "Pending" | "Scheduled" | "Approved" | "Failed";
    eta?: string;
  }>;
  financial: {
    budgetTotal: number;
    actualToDate: number;
    notes: string[];
  };
  risks: Array<{
    id: string;
    risk: string;
    impact: "Low" | "Medium" | "High";
    mitigation: string;
  }>;
  upcoming: Array<{ day: string; focus: string }>;
};

type ApprovalState = "Pending" | "Approved" | "Changes Requested";
type ViewerSection =
  | "pdf"
  | "overview"
  | "project"
  | "financial"
  | "permits"
  | "risks"
  | "upcoming"
  | "actions";

function formatMoney(n: number) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function storageKey(reportId: string) {
  return `kealee:weekly-report:${reportId}`;
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] font-black text-zinc-700">
      {children}
    </span>
  );
}

export function WeeklyReportViewer({
  report,
  onUpdate,
}: {
  report: GCWeeklyReport;
  onUpdate?: (next: GCWeeklyReport) => void;
}) {
  const [activeSection, setActiveSection] = useState<ViewerSection>("overview");

  const [approval, setApproval] = useState<ApprovalState>("Pending");
  const [comments, setComments] = useState<
    Array<{ id: string; at: string; from: string; section: ViewerSection; text: string }>
  >([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentSection, setCommentSection] = useState<ViewerSection>("overview");
  const [changesReason, setChangesReason] = useState("");

  useEffect(() => {
    // Load per-report interaction state from localStorage (MVP)
    try {
      const raw = localStorage.getItem(storageKey(report.id));
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        approval?: ApprovalState;
        comments?: Array<{ id: string; at: string; from: string; section?: ViewerSection; text: string }>;
        actionItems?: GCWeeklyReport["actionItems"];
      };
      if (parsed.approval) setApproval(parsed.approval);
      if (Array.isArray(parsed.comments)) {
        setComments(
          parsed.comments.map((c) => ({
            ...c,
            section: c.section || "overview",
          }))
        );
      }
      if (Array.isArray(parsed.actionItems)) {
        onUpdate?.({ ...report, actionItems: parsed.actionItems });
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report.id]);

  function persist(
    next: Partial<{
      approval: ApprovalState;
      comments: typeof comments;
      actionItems: GCWeeklyReport["actionItems"];
    }>
  ) {
    try {
      const currentRaw = localStorage.getItem(storageKey(report.id));
      const current = currentRaw
        ? (JSON.parse(currentRaw) as Record<string, unknown>)
        : {};
      localStorage.setItem(storageKey(report.id), JSON.stringify({ ...current, ...next }));
    } catch {
      // ignore
    }
  }

  const budgetPct = useMemo(() => {
    if (report.financial.budgetTotal <= 0) return 0;
    return Math.min(100, (report.financial.actualToDate / report.financial.budgetTotal) * 100);
  }, [report.financial.actualToDate, report.financial.budgetTotal]);

  const overBudget = report.financial.actualToDate > report.financial.budgetTotal;

  function downloadExcelCsv() {
    // “Excel” download as CSV (Excel opens it). Includes action items and permit/inspection tracker.
    const rows: string[][] = [];
    rows.push(["Weekly Report", report.id]);
    rows.push(["Week Of", report.weekOf]);
    rows.push([]);
    rows.push(["Action Items"]);
    rows.push(["Title", "Owner", "Due Date", "Status"]);
    for (const a of report.actionItems) {
      rows.push([a.title, a.owner, a.dueDate || "", a.status]);
    }
    rows.push([]);
    rows.push(["Permits & Inspections"]);
    rows.push(["Item", "Status", "ETA"]);
    for (const p of report.permitInspection) {
      rows.push([p.item, p.status, p.eta || ""]);
    }

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
    a.download = `weekly-report-${report.weekOf}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPdfViaPrint() {
    // MVP “PDF download” via print dialog (user can Save as PDF).
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.open();
    w.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Weekly Report</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
      h1 { font-size: 20px; margin: 0 0 8px; }
      h2 { font-size: 14px; margin: 20px 0 8px; }
      .meta { color: #555; font-size: 12px; }
      .card { border: 1px solid #ddd; border-radius: 12px; padding: 12px; margin-top: 10px; }
      ul { margin: 6px 0 0 18px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; text-align: left; }
      th { background: #f6f6f6; }
    </style>
  </head>
  <body>
    <h1>Weekly Report — Week of ${formatDate(report.weekOf)}</h1>
    <div class="meta">
      Project: ${report.projectName || "Portfolio"} • Generated: ${formatDate(report.generatedAt)} • By: ${report.generatedBy.name}
    </div>

    <div class="card">
      <strong>Summary</strong>
      <div>${report.summary}</div>
    </div>

    <h2>AI insights</h2>
    <ul>
      ${report.aiInsights.map((i) => `<li>${i}</li>`).join("")}
    </ul>

    <h2>Permits & inspections</h2>
    <table>
      <thead><tr><th>Item</th><th>Status</th><th>ETA</th></tr></thead>
      <tbody>
        ${report.permitInspection
          .map((p) => `<tr><td>${p.item}</td><td>${p.status}</td><td>${p.eta || ""}</td></tr>`)
          .join("")}
      </tbody>
    </table>

    <h2>Action items</h2>
    <table>
      <thead><tr><th>Title</th><th>Owner</th><th>Due</th><th>Status</th></tr></thead>
      <tbody>
        ${report.actionItems
          .map((a) => `<tr><td>${a.title}</td><td>${a.owner}</td><td>${a.dueDate || ""}</td><td>${a.status}</td></tr>`)
          .join("")}
      </tbody>
    </table>
  </body>
</html>`);
    w.document.close();
    w.focus();
    w.print();
  }

  async function shareLinkCopy() {
    const url = `${window.location.origin}/portal/weekly-reports?report=${encodeURIComponent(report.id)}&share=1`;
    await navigator.clipboard.writeText(url);
    alert("Share link copied. You can paste it to clients/lenders.");
  }

  function addComment() {
    const text = commentDraft.trim();
    if (text.length < 2) return;
    const next = [
      { id: `c_${Date.now()}`, at: new Date().toISOString(), from: "GC", section: commentSection, text },
      ...comments,
    ];
    setComments(next);
    setCommentDraft("");
    persist({ comments: next });
  }

  function toggleAction(id: string) {
    const next = report.actionItems.map((a) =>
      a.id === id ? { ...a, status: a.status === "Done" ? "Open" : "Done" } : a
    );
    onUpdate?.({ ...report, actionItems: next });
    persist({ actionItems: next });
  }

  function approveReport() {
    setApproval("Approved");
    persist({ approval: "Approved" });
  }

  function requestChanges() {
    setApproval("Changes Requested");
    const next = [
      {
        id: `c_${Date.now()}`,
        at: new Date().toISOString(),
        from: "GC",
        section: activeSection,
        text: `Requested changes: ${changesReason || "Please revise."}`,
      },
      ...comments,
    ];
    setComments(next);
    setChangesReason("");
    persist({ approval: "Changes Requested", comments: next });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black tracking-tight">
              Weekly report — week of {formatDate(report.weekOf)}
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <Pill>{report.projectName ? `Project: ${report.projectName}` : "Portfolio"}</Pill>
              <Pill>Generated Friday</Pill>
              <Pill>By {report.generatedBy.name}</Pill>
              <Pill>Approval: {approval}</Pill>
            </div>
            <div className="mt-2 text-xs text-zinc-600">
              Emailed to: {report.emailedTo.join(", ")}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadPdfViaPrint}
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
            >
              Download PDF
            </button>
            <button
              type="button"
              onClick={downloadExcelCsv}
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
            >
              Download Excel
            </button>
            <button
              type="button"
              onClick={shareLinkCopy}
              className="rounded-xl bg-[var(--primary)] px-3 py-2 text-sm font-black text-[var(--primary-foreground)] hover:opacity-95"
            >
              Share with client
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(
            [
              ["pdf", "PDF viewer"],
              ["overview", "Overview"],
              ["project", "Project status"],
              ["financial", "Financial summary"],
              ["permits", "Permits & inspections"],
              ["risks", "Risks & issues"],
              ["upcoming", "Upcoming week"],
              ["actions", "Action items"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveSection(key)}
              className={[
                "rounded-full px-3 py-1.5 text-xs font-black",
                activeSection === key
                  ? "bg-sky-50 text-sky-700 border border-sky-200"
                  : "bg-zinc-50 text-zinc-800 border border-black/10 hover:bg-zinc-100",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {activeSection === "pdf" ? (
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-zinc-950">PDF viewer</div>
                  <div className="mt-1 text-sm text-zinc-700">
                    Uses your browser&apos;s PDF controls for navigation, search, and zoom.
                  </div>
                </div>
                {report.pdfUrl ? (
                  <a
                    href={report.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
                  >
                    Open in new tab
                  </a>
                ) : null}
              </div>

              <div className="mt-3 overflow-hidden rounded-2xl border border-black/10 bg-zinc-50">
                {report.pdfUrl ? (
                  <iframe
                    title="Weekly report PDF"
                    src={report.pdfUrl}
                    className="h-[720px] w-full"
                  />
                ) : (
                  <div className="p-4 text-sm text-zinc-700">
                    PDF not available yet. Once the worker generates it, it will appear here.
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {activeSection === "overview" ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                <div className="text-sm font-black text-zinc-950">Summary</div>
                <div className="mt-2 text-sm text-zinc-800">{report.summary}</div>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-black text-zinc-950">
                    AI-generated insights (Claude)
                  </div>
                  <Pill>Draft</Pill>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-zinc-800">
                  {report.aiInsights.map((i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          {activeSection === "project" ? (
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="text-sm font-black text-zinc-950">Project status</div>
              <div className="mt-2 text-sm text-zinc-700">
                {report.projectName
                  ? `Status report for ${report.projectName}.`
                  : "Portfolio-level status summary (all active projects)."}
              </div>
              <div className="mt-3 text-sm text-zinc-800">
                Included report types: {report.types.join(" • ")}
              </div>
            </div>
          ) : null}

          {activeSection === "financial" ? (
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="text-sm font-black text-zinc-950">Financial summary</div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-zinc-50 p-4">
                  <div className="text-xs font-semibold text-zinc-600">Budget total</div>
                  <div className="mt-1 text-xl font-black text-zinc-950">
                    {formatMoney(report.financial.budgetTotal)}
                  </div>
                </div>
                <div className="rounded-2xl bg-zinc-50 p-4">
                  <div className="text-xs font-semibold text-zinc-600">Actual to date</div>
                  <div className={["mt-1 text-xl font-black", overBudget ? "text-red-700" : "text-zinc-950"].join(" ")}>
                    {formatMoney(report.financial.actualToDate)}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-600">
                  <span>Budget usage</span>
                  <span className={["font-black", overBudget ? "text-red-700" : "text-zinc-900"].join(" ")}>
                    {budgetPct.toFixed(0)}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className={["h-full rounded-full", overBudget ? "bg-red-500" : "bg-emerald-500"].join(" ")}
                    style={{ width: `${budgetPct}%` }}
                  />
                </div>
              </div>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-zinc-800">
                {report.financial.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {activeSection === "permits" ? (
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="text-sm font-black text-zinc-950">Permit & inspection tracker</div>
              <div className="mt-3 overflow-auto">
                <table className="min-w-[520px] w-full border-collapse">
                  <thead>
                    <tr className="text-left text-xs font-black text-zinc-600">
                      <th className="border-b border-black/10 pb-2 pr-3">Item</th>
                      <th className="border-b border-black/10 pb-2 pr-3">Status</th>
                      <th className="border-b border-black/10 pb-2 pr-3">ETA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.permitInspection.map((p) => (
                      <tr key={p.item} className="text-sm text-zinc-800">
                        <td className="border-b border-black/5 py-2 pr-3">{p.item}</td>
                        <td className="border-b border-black/5 py-2 pr-3">{p.status}</td>
                        <td className="border-b border-black/5 py-2 pr-3">{p.eta || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {activeSection === "risks" ? (
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="text-sm font-black text-zinc-950">Risk & issue log</div>
              <div className="mt-3 grid gap-3">
                {report.risks.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm font-black text-zinc-950">{r.risk}</div>
                      <Pill>Impact: {r.impact}</Pill>
                    </div>
                    <div className="mt-2 text-sm text-zinc-700">{r.mitigation}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {activeSection === "upcoming" ? (
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="text-sm font-black text-zinc-950">Upcoming week preview</div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {report.upcoming.map((u) => (
                  <div key={u.day} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                    <div className="text-xs font-black text-zinc-700">{u.day}</div>
                    <div className="mt-1 text-sm text-zinc-800">{u.focus}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {activeSection === "actions" ? (
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="text-sm font-black text-zinc-950">Action item tracking</div>
              <div className="mt-3 grid gap-2">
                {report.actionItems.map((a) => (
                  <label
                    key={a.id}
                    className="flex items-start gap-3 rounded-2xl border border-black/10 bg-zinc-50 p-3"
                  >
                    <input
                      type="checkbox"
                      checked={a.status === "Done"}
                      onChange={() => toggleAction(a.id)}
                      className="mt-1"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-black text-zinc-950">{a.title}</div>
                      <div className="mt-1 text-xs text-zinc-600">
                        Owner: <span className="font-bold">{a.owner}</span>
                        {a.dueDate ? ` • Due ${a.dueDate}` : ""}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-3 text-xs text-zinc-600">
                Action item updates are saved locally in this MVP; server sync can be added next.
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black tracking-tight">GC actions</h3>
          <div className="mt-3 grid gap-2">
            <button
              type="button"
              onClick={approveReport}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white hover:opacity-95"
            >
              Approve report
            </button>

            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <div className="text-sm font-black text-zinc-950">Request changes</div>
              <textarea
                className="mt-2 min-h-[92px] w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                value={changesReason}
                onChange={(e) => setChangesReason(e.target.value)}
                placeholder="What should we update in the report?"
              />
              <button
                type="button"
                onClick={requestChanges}
                className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-black text-zinc-900 hover:bg-zinc-50"
              >
                Send change request
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black tracking-tight">Comments</h3>
          <div className="mt-3 grid gap-2">
            <div className="flex flex-wrap gap-2">
              <label className="text-xs font-black text-zinc-700">
                Attach to section
                <select
                  className="ml-2 h-10 rounded-xl border border-black/10 bg-white px-3 text-sm font-black text-zinc-900 outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                  value={commentSection}
                  onChange={(e) => setCommentSection(e.target.value as ViewerSection)}
                >
                  {(
                    [
                      ["overview", "Overview"],
                      ["project", "Project status"],
                      ["financial", "Financial summary"],
                      ["permits", "Permits & inspections"],
                      ["risks", "Risks & issues"],
                      ["upcoming", "Upcoming week"],
                      ["actions", "Action items"],
                      ["pdf", "PDF viewer"],
                    ] as const
                  ).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex gap-2">
            <input
              className="h-10 flex-1 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              placeholder="Add a comment (clients, lenders, internal)…"
            />
            <button
              type="button"
              onClick={addComment}
              className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-black text-[var(--primary-foreground)] hover:opacity-95"
            >
              Add
            </button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {comments.length ? (
              comments.map((c) => (
                <div key={c.id} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                  <div className="text-xs font-bold text-zinc-600">
                    {c.from} • {formatDate(c.at)} •{" "}
                    <span className="font-black text-zinc-700">
                      {c.section === "pdf"
                        ? "PDF"
                        : c.section.charAt(0).toUpperCase() + c.section.slice(1)}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-zinc-800">{c.text}</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-zinc-700">No comments yet.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="text-sm font-black text-zinc-950">Automation</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
            <li>Generated every Friday by Kealee PMs</li>
            <li>Pulls data from projects, permits, inspections, budget (wiring next)</li>
            <li>AI insights via Claude API (stubbed in this MVP)</li>
            <li>Email notification to GC (wiring next)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

