"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { ProjectHealth, type GCProjectHealth } from "@/components/portal/ProjectHealth";
import { GCSuccessDashboard } from "@/components/portal/GCSuccessDashboard";
import { api } from "@/lib/api";
import { getCurrentUser, getCurrentUserOrgs, getPrimaryOrgId } from "@/lib/auth";

function formatMoney(n: number) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

type PortalData = {
  gcCompanyName: string;
  currentPackage: {
    name: string;
    label: string;
    includedProjects: number;
    serviceHoursMonthly: number;
  };
  currentPackagePriceMonthly: number;
  stats: {
    activeProjectsUsed: number;
    activeProjectsLimit: number;
    openServiceRequests: number;
    pendingPermits: number;
    upcomingInspections: number;
    overdueInvoices: number;
    serviceHoursUsed: number;
    serviceHoursLimit: number;
  };
  projects: GCProjectHealth[];
  activity: string[];
  successMetrics: {
    hoursSavedPerWeek: number;
    projectDelayReductionDays: number;
    permitApprovalAvgDays: number;
    permitApprovalIndustryDays: number;
    monthlyCostSavings: number;
    clientSatisfactionScore: number;
    benchmarkPercentile: number;
    avgCompletionDeltaDays: number;
  };
};

const defaultData: PortalData = {
  gcCompanyName: "Your Company",
  currentPackage: {
    name: "Package B",
    label: "Growing Team",
    includedProjects: 3,
    serviceHoursMonthly: 40,
  },
  currentPackagePriceMonthly: 3750,
  stats: {
    activeProjectsUsed: 0,
    activeProjectsLimit: 3,
    openServiceRequests: 0,
    pendingPermits: 0,
    upcomingInspections: 0,
    overdueInvoices: 0,
    serviceHoursUsed: 0,
    serviceHoursLimit: 40,
  },
  projects: [],
  activity: [],
  successMetrics: {
    hoursSavedPerWeek: 0,
    projectDelayReductionDays: 0,
    permitApprovalAvgDays: 0,
    permitApprovalIndustryDays: 28,
    monthlyCostSavings: 0,
    clientSatisfactionScore: 0,
    benchmarkPercentile: 0,
    avgCompletionDeltaDays: 0,
  },
};

export default function PortalHomePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PortalData>(defaultData);

  useEffect(() => {
    async function loadPortalData() {
      try {
        // Fetch org data, subscription, projects, and service requests in parallel
        const orgId = await getPrimaryOrgId();

        const [orgsResult, subscriptionResult, projectsResult, serviceRequestsResult] = await Promise.all([
          orgId ? api.getOrg(orgId).catch(() => ({ org: null })) : Promise.resolve({ org: null }),
          api.getMySubscription().catch(() => ({ subscription: null })),
          orgId ? api.getProjects({ orgId }).catch(() => ({ projects: [] })) : Promise.resolve({ projects: [] }),
          api.listServiceRequests({ status: 'open' }).catch(() => ({ serviceRequests: [] })),
        ]);

        const org = orgsResult.org;
        const subscription = subscriptionResult.subscription;
        const projectsList = projectsResult.projects || [];
        const openRequests = serviceRequestsResult.serviceRequests || [];

        // Derive package info from subscription
        const planSlug = subscription?.servicePlan?.slug || '';
        const planName = subscription?.servicePlan?.name || 'Package B';
        const includedProjects = subscription?.servicePlan?.includedProjects || 3;
        const serviceHoursMonthly = subscription?.servicePlan?.serviceHoursMonthly || 40;
        const priceMonthly = subscription?.servicePlan?.priceMonthly || 3750;

        // Map projects to health format
        const mappedProjects: GCProjectHealth[] = projectsList.slice(0, 10).map((p: any) => ({
          id: p.id,
          name: p.name || 'Unnamed Project',
          address: p.address || p.category || '',
          status: p.status === 'ACTIVE' ? 'On Track' : p.status === 'AT_RISK' ? 'At Risk' : p.status === 'DELAYED' ? 'Delayed' : 'On Track',
          progressPct: p.progressPercent || 0,
          budgetTotal: p.budgetTotal || 0,
          budgetActual: p.budgetActual || 0,
        }));

        // Derive stats
        const activeProjects = projectsList.filter((p: any) => p.status === 'ACTIVE' || p.status === 'IN_PROGRESS').length;
        const pendingPermits = projectsList.reduce((sum: number, p: any) => sum + (p.pendingPermits || 0), 0);
        const upcomingInspections = projectsList.reduce((sum: number, p: any) => sum + (p.upcomingInspections || 0), 0);

        // Build activity from recent service requests and project updates
        const recentActivity: string[] = [];
        openRequests.slice(0, 4).forEach((sr: any) => {
          recentActivity.push(`Service request: ${sr.title || 'New request'}`);
        });
        if (recentActivity.length === 0) {
          recentActivity.push('No recent activity');
        }

        // Fetch subscription metrics for success tracking
        let metricsResult: any = null;
        if (orgId) {
          metricsResult = await api.getSubscriptionMetrics({ orgId }).catch(() => null);
        }
        const metrics = metricsResult?.metrics || {};

        setData({
          gcCompanyName: org?.name || 'Your Company',
          currentPackage: {
            name: planName,
            label: planSlug,
            includedProjects,
            serviceHoursMonthly,
          },
          currentPackagePriceMonthly: priceMonthly,
          stats: {
            activeProjectsUsed: activeProjects || mappedProjects.length,
            activeProjectsLimit: includedProjects,
            openServiceRequests: openRequests.length,
            pendingPermits,
            upcomingInspections,
            overdueInvoices: 0,
            serviceHoursUsed: metrics?.serviceHoursUsed || 0,
            serviceHoursLimit: serviceHoursMonthly,
          },
          projects: mappedProjects,
          activity: recentActivity,
          successMetrics: {
            hoursSavedPerWeek: metrics?.hoursSavedPerWeek || 0,
            projectDelayReductionDays: metrics?.projectDelayReductionDays || 0,
            permitApprovalAvgDays: metrics?.permitApprovalAvgDays || 0,
            permitApprovalIndustryDays: 28,
            monthlyCostSavings: metrics?.monthlyCostSavings || 0,
            clientSatisfactionScore: metrics?.clientSatisfactionScore || 0,
            benchmarkPercentile: metrics?.benchmarkPercentile || 0,
            avgCompletionDeltaDays: metrics?.avgCompletionDeltaDays || 0,
          },
        });
      } catch (e) {
        console.error('Failed to load portal data:', e);
      } finally {
        setLoading(false);
      }
    }

    loadPortalData();
  }, []);

  const {
    gcCompanyName,
    currentPackage,
    currentPackagePriceMonthly,
    stats,
    projects,
    activity,
    successMetrics,
  } = data;

  const projectsPct =
    stats.activeProjectsLimit > 0
      ? Math.min(100, (stats.activeProjectsUsed / stats.activeProjectsLimit) * 100)
      : 0;
  const hoursPct =
    stats.serviceHoursLimit > 0
      ? Math.min(100, (stats.serviceHoursUsed / stats.serviceHoursLimit) * 100)
      : 0;
  const nearingLimits = projectsPct >= 85 || hoursPct >= 85;

  if (loading) {
    return (
      <section className="space-y-8">
        <div className="rounded-2xl border border-black/10 bg-white p-8 text-center text-sm text-zinc-600 shadow-sm">
          Loading portal data...
        </div>
      </section>
    );
  }

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
