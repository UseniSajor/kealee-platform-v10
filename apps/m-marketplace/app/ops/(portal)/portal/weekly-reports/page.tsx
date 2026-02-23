"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { WeeklyReportViewer, type GCWeeklyReport } from "@ops/components/portal/WeeklyReportViewer";
import { api } from "@ops/lib/api";

function startOfWeekISO(d: Date) {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1) - day; // move to Monday
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export default function WeeklyReportsPage() {
  const [apiReports, setApiReports] = useState<GCWeeklyReport[] | null>(null);

  useEffect(() => {
    async function loadReports() {
      try {
        const result = await api.getReports({ type: 'weekly', limit: '20' });
        if (result.reports && result.reports.length > 0) {
          const mapped: GCWeeklyReport[] = result.reports.map((r: any) => {
            const data = r.data || {};
            return {
              id: r.id,
              weekOf: data.period?.split(' - ')[0] || r.createdAt || new Date().toISOString(),
              projectName: data.projectName || null,
              types: data.types || ['Project Status Report'],
              generatedAt: r.createdAt,
              generatedBy: { name: r.generatedByName || 'Kealee PM Team', email: r.generatedByEmail || 'pm@kealee.com' },
              emailedTo: data.emailedTo || [],
              pdfUrl: data.pdfUrl || null,
              aiInsights: data.aiInsights || [],
              summary: data.summary || r.title || '',
              actionItems: data.actionItems || [],
              permitInspection: data.permitInspection || [],
              financial: data.financial || { budgetTotal: 0, actualToDate: 0, notes: [] },
              risks: data.risks || [],
              upcoming: data.upcoming || [],
            };
          });
          setApiReports(mapped);
        }
      } catch {
        // Fall back to demo reports if API not available
      }
    }
    loadReports();
  }, []);

  // Fallback demo reports used when API returns no data
  const demoReports: GCWeeklyReport[] = [
    {
      id: "wr_2026_01_05_portfolio",
      weekOf: startOfWeekISO(new Date("2026-01-05T12:00:00Z")),
      projectName: null,
      types: [
        "Project Status Report",
        "Financial Summary",
        "Permit & Inspection Tracker",
        "Risk & Issue Log",
        "Upcoming Week Preview",
      ],
      generatedAt: "2026-01-09T16:00:00Z",
      generatedBy: { name: "Kealee PM Team", email: "pm@kealee.com" },
      emailedTo: ["ops@acmegc.com", "owner@acmegc.com"],
      pdfUrl: null,
      aiInsights: [
        "Schedule slipping by 3 days on Downtown Tenant Improvement due to electrical rough inspection lead time.",
        "Budget overrun risk in electrical category—change order recommended before rough-in.",
        "Permit approval expected next week for Oak Ridge (jurisdiction follow-up scheduled).",
      ],
      summary:
        "Overall production is steady. Biggest focus is protecting inspection dates and closing the electrical scope gap on Downtown TI. Client comms are on track; next week is heavy on inspections and sub coordination.",
      actionItems: [
        { id: "a1", title: "Confirm electrical rough-in inspection window (Downtown TI)", owner: "Kealee PM", dueDate: "Tue", status: "Open" },
        { id: "a2", title: "Provide CO approval direction for electrical scope gap", owner: "GC", dueDate: "Wed", status: "Open" },
        { id: "a3", title: "Send updated schedule to subs for next week", owner: "Kealee PM", dueDate: "Fri", status: "Open" },
      ],
      permitInspection: [
        { item: "123 Main St — Rough inspection", status: "Scheduled", eta: "Tomorrow 10:00 AM" },
        { item: "Oak Ridge — Permit approval", status: "Pending", eta: "Next week" },
        { item: "Downtown TI — Electrical rough inspection", status: "Pending", eta: "3–5 business days" },
      ],
      financial: {
        budgetTotal: 1750000,
        actualToDate: 1185000,
        notes: [
          "Downtown TI electrical scope trending over; CO path recommended.",
          "Oak Ridge spend is aligned with progress; no immediate overruns.",
        ],
      },
      risks: [
        {
          id: "r1",
          risk: "Electrical scope gap may impact rough-in and push downstream trades",
          impact: "High",
          mitigation: "Draft CO + confirm inspection lead times; adjust schedule sequence.",
        },
        {
          id: "r2",
          risk: "Permit approval timing could affect Oak Ridge start activities",
          impact: "Medium",
          mitigation: "Jurisdiction follow-up scheduled; prep alternate start tasks.",
        },
      ],
      upcoming: [
        { day: "Mon", focus: "Confirm inspections + sub availability windows" },
        { day: "Tue", focus: "Downtown TI electrical CO draft + review" },
        { day: "Wed", focus: "Oak Ridge permit follow-up + documentation" },
        { day: "Thu", focus: "Site coordination + delivery confirmations" },
        { day: "Fri", focus: "Weekly report generation + client-ready updates" },
      ],
    },
    {
      id: "wr_2026_01_05_123_main",
      weekOf: startOfWeekISO(new Date("2026-01-05T12:00:00Z")),
      projectName: "123 Main St Remodel",
      types: ["Project Status Report", "Permit & Inspection Tracker", "Upcoming Week Preview"],
      generatedAt: "2026-01-09T16:00:00Z",
      generatedBy: { name: "Kealee PM Team", email: "pm@kealee.com" },
      emailedTo: ["pm@acmegc.com"],
      pdfUrl: null,
      aiInsights: [
        "Inspection pass likelihood is high if framing photos are uploaded today.",
        "Material delivery risk is low; vendor confirmed ETA.",
      ],
      summary:
        "Framing is nearing completion. Primary objective is passing rough inspection and keeping subs sequenced without downtime.",
      actionItems: [
        { id: "b1", title: "Upload framing photos for inspector prep", owner: "GC", dueDate: "Today", status: "Open" },
        { id: "b2", title: "Confirm insulation subcontractor start date", owner: "Kealee PM", dueDate: "Tue", status: "Open" },
      ],
      permitInspection: [
        { item: "123 Main St — Rough inspection", status: "Scheduled", eta: "Tomorrow 10:00 AM" },
      ],
      financial: {
        budgetTotal: 180000,
        actualToDate: 112000,
        notes: ["Spend aligned with progress; no exceptions flagged this week."],
      },
      risks: [
        {
          id: "rb1",
          risk: "If rough inspection slips, insulation and drywall sequence will compress",
          impact: "Medium",
          mitigation: "Prep docs/photos; confirm inspector availability day-of.",
        },
      ],
      upcoming: [
        { day: "Mon", focus: "Inspection prep + sub confirmations" },
        { day: "Tue", focus: "Rough inspection + follow-ups" },
        { day: "Wed", focus: "Insulation scheduling" },
        { day: "Thu", focus: "Drywall material coordination" },
        { day: "Fri", focus: "Client update + weekly report" },
      ],
    },
  ];

  const reportsSource = apiReports && apiReports.length > 0 ? apiReports : demoReports;
  const [activeId, setActiveId] = useState(reportsSource[0]?.id || "");
  const [reports, setReports] = useState<GCWeeklyReport[]>(reportsSource);

  // Update reports when API data loads
  useEffect(() => {
    if (apiReports && apiReports.length > 0) {
      setReports(apiReports);
      setActiveId(apiReports[0]?.id || "");
    }
  }, [apiReports]);

  const active = useMemo(
    () => reports.find((r) => r.id === activeId) || reports[0],
    [activeId, reports]
  );

  function updateActive(next: GCWeeklyReport) {
    setReports((prev) => prev.map((r) => (r.id === next.id ? next : r)));
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Weekly reports</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-700">
            Reports are generated every Friday by Kealee PMs. Review, approve,
            comment, and share with clients/lenders.
          </p>
        </div>
        <Link
          href="/ops/portal"
          className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
        >
          Back to dashboard
        </Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <aside className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black tracking-tight">Report library</h2>
          <p className="mt-1 text-sm text-zinc-700">
            Project-specific and portfolio summaries.
          </p>

          <div className="mt-4 grid gap-3">
            {reports.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setActiveId(r.id)}
                className={[
                  "rounded-2xl border p-4 text-left shadow-sm transition",
                  activeId === r.id
                    ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/15"
                    : "border-black/10 hover:bg-zinc-50",
                ].join(" ")}
              >
                <div className="text-sm font-black text-zinc-950">
                  {r.projectName ? r.projectName : "Portfolio summary"}
                </div>
                <div className="mt-1 text-sm text-zinc-700">
                  Week of {new Date(r.weekOf).toLocaleDateString()}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {r.types.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-zinc-50 px-2.5 py-1 text-[11px] font-black text-zinc-700"
                    >
                      {t}
                    </span>
                  ))}
                  {r.types.length > 2 ? (
                    <span className="rounded-full bg-zinc-50 px-2.5 py-1 text-[11px] font-black text-zinc-700">
                      +{r.types.length - 2} more
                    </span>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <div>
          {active ? (
            <WeeklyReportViewer report={active} onUpdate={updateActive} />
          ) : (
            <div className="rounded-2xl border border-black/10 bg-white p-5 text-sm text-zinc-700 shadow-sm">
              Select a report to view.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

