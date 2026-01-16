import Link from "next/link";

import { ProjectHealth, type GCProjectHealth } from "@/components/portal/ProjectHealth";
import { GCSuccessDashboard } from "@/components/portal/GCSuccessDashboard";

function formatMoney(n: number) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function PortalHomePage() {
  // TODO: Replace with real org/company lookup once auth is wired.
  const gcCompanyName = "Acme Construction LLC";
  const currentPackage = {
    name: "Package B",
    label: "Growing Team",
    includedProjects: 3,
    serviceHoursMonthly: 40,
  };
  const currentPackagePriceMonthly = 3750;

  // TODO: Replace with real API data.
  const stats = {
    activeProjectsUsed: 3,
    activeProjectsLimit: 3,
    openServiceRequests: 2,
    pendingPermits: 1,
    upcomingInspections: 3,
    overdueInvoices: 0,
    serviceHoursUsed: 12,
    serviceHoursLimit: 40,
  };

  const projects: GCProjectHealth[] = [
    {
      id: "p1",
      name: "123 Main St Remodel",
      address: "123 Main St • Residential",
      status: "On Track",
      progressPct: 62,
      budgetTotal: 180000,
      budgetActual: 112000,
    },
    {
      id: "p2",
      name: "Oak Ridge Custom Build",
      address: "Oak Ridge • Residential",
      status: "At Risk",
      progressPct: 38,
      budgetTotal: 620000,
      budgetActual: 255000,
    },
    {
      id: "p3",
      name: "Downtown Tenant Improvement",
      address: "Downtown • Commercial",
      status: "Delayed",
      progressPct: 71,
      budgetTotal: 950000,
      budgetActual: 1005000,
    },
  ];

  const activity = [
    "Permit approved for 123 Main St",
    "Inspection scheduled for tomorrow",
    "Weekly report generated",
    "New contractor added to project",
  ];

  const projectsPct =
    stats.activeProjectsLimit > 0
      ? Math.min(100, (stats.activeProjectsUsed / stats.activeProjectsLimit) * 100)
      : 0;
  const hoursPct =
    stats.serviceHoursLimit > 0
      ? Math.min(100, (stats.serviceHoursUsed / stats.serviceHoursLimit) * 100)
      : 0;
  const nearingLimits = projectsPct >= 85 || hoursPct >= 85;

  // TODO: Replace with real success tracking (service requests time saved, permit cycles, schedule variance, etc.)
  const successMetrics = {
    hoursSavedPerWeek: 11,
    projectDelayReductionDays: 3,
    permitApprovalAvgDays: 12,
    permitApprovalIndustryDays: 28,
    monthlyCostSavings: 8200,
    clientSatisfactionScore: 9.1,
    benchmarkPercentile: 75,
    avgCompletionDeltaDays: -2,
  } as const;

  return (
    <section className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            Welcome back, {gcCompanyName}
          </h1>
          <p className="mt-2 text-sm text-zinc-700">
            Current Package:{" "}
            <span className="font-extrabold text-zinc-900">
              {currentPackage.name} - {currentPackage.includedProjects} projects included
            </span>
          </p>
        </div>

        <Link
          href="/portal/billing"
          className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-black text-[var(--primary-foreground)] shadow-sm hover:opacity-95"
        >
          Manage billing
        </Link>
      </header>

      <section>
        <h2 className="text-xl font-black tracking-tight">Quick stats</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold text-zinc-600">Active projects</div>
            <div className="mt-1 text-xl font-black text-zinc-950">
              {stats.activeProjectsUsed}/{stats.activeProjectsLimit}
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-[var(--primary)]"
                style={{ width: `${projectsPct}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-zinc-600">
              {currentPackage.name} limit
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold text-zinc-600">Open service requests</div>
            <div className="mt-1 text-xl font-black text-zinc-950">{stats.openServiceRequests}</div>
            <div className="mt-2 text-xs text-zinc-600">Kealee PM team in progress</div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold text-zinc-600">Pending permits</div>
            <div className="mt-1 text-xl font-black text-zinc-950">{stats.pendingPermits}</div>
            <div className="mt-2 text-xs text-zinc-600">Awaiting approval</div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold text-zinc-600">Upcoming inspections</div>
            <div className="mt-1 text-xl font-black text-zinc-950">{stats.upcomingInspections}</div>
            <div className="mt-2 text-xs text-zinc-600">Next 7 days</div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold text-zinc-600">Overdue invoices</div>
            <div className="mt-1 text-xl font-black text-zinc-950">
              {formatMoney(stats.overdueInvoices)}
            </div>
            <div className="mt-2 text-xs text-zinc-600">Outstanding balance</div>
          </div>
        </div>
      </section>

      <GCSuccessDashboard
        planName={currentPackage.name}
        investmentMonthly={currentPackagePriceMonthly}
        metrics={successMetrics}
      />

      <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <ProjectHealth projects={projects} />

        <div className="space-y-6">
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-black tracking-tight">Recent activity</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-800">
              {activity.map((a) => (
                <li key={a} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-black tracking-tight">Quick actions</h3>
            <div className="mt-4 grid gap-2">
              <Link
                href="/portal/service-requests/new"
                className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-black text-zinc-900 hover:bg-zinc-50"
              >
                Submit Service Request
              </Link>
              <Link
                href="/portal/weekly-reports"
                className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-black text-zinc-900 hover:bg-zinc-50"
              >
                View Weekly Report
              </Link>
              <Link
                href="/portal/my-projects"
                className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-black text-zinc-900 hover:bg-zinc-50"
              >
                Check Permit Status
              </Link>
              <Link
                href="/portal/my-projects?new=1"
                className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-black text-zinc-900 hover:bg-zinc-50"
              >
                Add New Project
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black tracking-tight">Package usage</h3>
                <p className="mt-1 text-sm text-zinc-700">
                  Track projects + service hours.
                </p>
              </div>
              {nearingLimits ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-800">
                  Nearing limits
                </span>
              ) : null}
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-600">
                  <span>Service Hours Used (Monthly)</span>
                  <span className="font-black text-zinc-900">
                    {stats.serviceHoursUsed}/{stats.serviceHoursLimit}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-[var(--primary)]"
                    style={{ width: `${hoursPct}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-600">
                  <span>Projects</span>
                  <span className="font-black text-zinc-900">
                    {stats.activeProjectsUsed}/{stats.activeProjectsLimit}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-[var(--primary)]"
                    style={{ width: `${projectsPct}%` }}
                  />
                </div>
              </div>

              {nearingLimits ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  You&apos;re close to your plan limits. Consider upgrading to avoid
                  delays in support coverage.
                  <div className="mt-2">
                    <Link
                      href="/portal/billing"
                      className="font-extrabold text-amber-900 underline"
                    >
                      Upgrade package →
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

