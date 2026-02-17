"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProjects, type EngineeringProject } from "../../lib/api";

/** Map backend status codes to user-friendly labels */
function formatStatus(status: string): string {
  const map: Record<string, string> = {
    QUOTE_REQUESTED: "Quote Requested",
    QUOTE_SENT: "Quote Sent",
    PENDING_PAYMENT: "Pending Payment",
    PAYMENT_RECEIVED: "Payment Received",
    ASSIGNED: "Assigned",
    IN_PROGRESS: "In Progress",
    UNDER_REVIEW: "Under Review",
    REVISIONS_REQUESTED: "Revisions Requested",
    COMPLETED: "Completed",
    DELIVERED: "Delivered",
  };
  return map[status] || status;
}

/** Map backend discipline codes to readable labels */
function formatDisciplines(disciplines: string[]): string {
  const map: Record<string, string> = {
    STRUCTURAL: "Structural Engineering",
    MEP: "MEP Engineering",
    CIVIL: "Civil Engineering",
    GEOTECHNICAL: "Geotechnical Services",
  };
  return disciplines.map((d) => map[d] || d).join(" + ");
}

/** Map backend package tier to readable label */
function formatPackageTier(tier: string): string {
  const map: Record<string, string> = {
    BASIC_REVIEW: "Basic Review",
    STANDARD_DESIGN: "Standard Design",
    PREMIUM_SERVICE: "Premium Service",
    ENTERPRISE: "Enterprise",
  };
  return map[tier] || tier;
}

/** Estimate progress from status */
function statusToProgress(status: string): number {
  const map: Record<string, number> = {
    QUOTE_REQUESTED: 5,
    QUOTE_SENT: 10,
    PENDING_PAYMENT: 15,
    PAYMENT_RECEIVED: 25,
    ASSIGNED: 35,
    IN_PROGRESS: 60,
    UNDER_REVIEW: 85,
    REVISIONS_REQUESTED: 70,
    COMPLETED: 100,
    DELIVERED: 100,
  };
  return map[status] ?? 0;
}

/** Status badge color */
function statusColor(status: string): string {
  if (status === "COMPLETED" || status === "DELIVERED") return "bg-emerald-100 text-emerald-700";
  if (status === "IN_PROGRESS" || status === "ASSIGNED" || status === "PAYMENT_RECEIVED") return "bg-blue-100 text-blue-700";
  if (status === "UNDER_REVIEW" || status === "REVISIONS_REQUESTED") return "bg-amber-100 text-amber-700";
  return "bg-zinc-100 text-zinc-600";
}

/** Determine filter bucket */
function filterBucket(status: string): string {
  if (status === "COMPLETED" || status === "DELIVERED") return "completed";
  if (status === "PENDING_PAYMENT" || status === "QUOTE_REQUESTED" || status === "QUOTE_SENT") return "pending";
  return "active";
}

/** Format currency */
function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(cents);
}

/** Format date */
function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function ProjectsPage() {
  const [filter, setFilter] = useState("all");
  const [projects, setProjects] = useState<EngineeringProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const res = await getProjects();
      if (cancelled) return;
      if (res.success && res.data) {
        setProjects(res.data.projects || []);
      } else {
        setError(res.error || "Failed to load projects");
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filteredProjects = projects.filter((p) => {
    if (filter === "all") return true;
    return filterBucket(p.status) === filter;
  });

  // Computed stats from real data
  const activeCount = projects.filter((p) => filterBucket(p.status) === "active").length;
  const completedCount = projects.filter((p) => filterBucket(p.status) === "completed").length;
  const pendingCount = projects.filter((p) => filterBucket(p.status) === "pending").length;
  const totalSpent = projects.reduce((sum, p) => sum + (p.totalPrice || 0), 0);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-black text-blue-600">
              Kealee Engineering
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/services" className="text-zinc-600 hover:text-zinc-900">Services</Link>
              <Link href="/pricing" className="text-zinc-600 hover:text-zinc-900">Pricing</Link>
              <Link href="/projects" className="text-blue-600 font-semibold">My Projects</Link>
              <Link href="/quote" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">
                New Project
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">My Projects</h1>
            <p className="text-zinc-500">Track your engineering projects and deliverables</p>
          </div>
          <Link
            href="/quote"
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
          >
            + New Project
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="text-sm text-zinc-500">Active Projects</div>
            <div className="text-2xl font-black">{loading ? "-" : activeCount}</div>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="text-sm text-zinc-500">Completed</div>
            <div className="text-2xl font-black">{loading ? "-" : completedCount}</div>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="text-sm text-zinc-500">Pending</div>
            <div className="text-2xl font-black">{loading ? "-" : pendingCount}</div>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="text-sm text-zinc-500">Total Spent</div>
            <div className="text-2xl font-black">{loading ? "-" : formatCurrency(totalSpent)}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "all", label: "All Projects" },
            { id: "active", label: "Active" },
            { id: "completed", label: "Completed" },
            { id: "pending", label: "Pending" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg ${
                filter === f.id
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-zinc-200 p-6 animate-pulse">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-20 bg-zinc-200 rounded" />
                      <div className="h-5 w-24 bg-zinc-200 rounded-full" />
                    </div>
                    <div className="h-6 w-64 bg-zinc-200 rounded" />
                    <div className="h-4 w-48 bg-zinc-200 rounded" />
                  </div>
                  <div className="text-right space-y-2">
                    <div className="h-8 w-24 bg-zinc-200 rounded" />
                    <div className="h-4 w-20 bg-zinc-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 font-medium mb-2">Failed to load projects</p>
            <p className="text-red-500 text-sm mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && projects.length === 0 && (
          <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
            <div className="text-4xl mb-4">&#128221;</div>
            <h2 className="text-xl font-bold mb-2">No projects yet</h2>
            <p className="text-zinc-500 mb-6">Start your first engineering project to see it here.</p>
            <Link
              href="/quote"
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
            >
              Request a Quote
            </Link>
          </div>
        )}

        {/* No Results for Filter */}
        {!loading && !error && projects.length > 0 && filteredProjects.length === 0 && (
          <div className="bg-white rounded-xl border border-zinc-200 p-8 text-center">
            <p className="text-zinc-500">No projects match the selected filter.</p>
            <button
              onClick={() => setFilter("all")}
              className="mt-3 text-blue-600 text-sm font-semibold hover:underline"
            >
              Show all projects
            </button>
          </div>
        )}

        {/* Project List */}
        {!loading && !error && filteredProjects.length > 0 && (
          <div className="space-y-4">
            {filteredProjects.map((project) => {
              const progress = statusToProgress(project.status);
              const displayStatus = formatStatus(project.status);
              return (
                <div
                  key={project.id}
                  className="bg-white rounded-xl border border-zinc-200 p-6 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-mono text-zinc-400">{project.id}</span>
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${statusColor(project.status)}`}>
                          {displayStatus}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold">{project.projectName}</h2>
                      <p className="text-zinc-500">{formatDisciplines(project.disciplines)}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-blue-600">{formatCurrency(project.totalPrice)}</div>
                      <div className="text-sm text-zinc-500">Project Value</div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-zinc-400">Package</div>
                      <div className="font-medium">{formatPackageTier(project.packageTier)}</div>
                    </div>
                    <div>
                      <div className="text-zinc-400">Start Date</div>
                      <div className="font-medium">{formatDate(project.createdAt)}</div>
                    </div>
                    <div>
                      <div className="text-zinc-400">Due Date</div>
                      <div className="font-medium">{formatDate(project.dueDate)}</div>
                    </div>
                    <div>
                      <div className="text-zinc-400">Progress</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="font-medium">{progress}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <Link
                      href={`/projects/${project.id}`}
                      className="px-4 py-2 text-sm font-semibold border border-zinc-200 rounded-lg hover:bg-zinc-50"
                    >
                      View Details
                    </Link>
                    {(project.status === "COMPLETED" || project.status === "DELIVERED") && (
                      <button className="px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg">
                        Download Drawings
                      </button>
                    )}
                    {project.status === "PENDING_PAYMENT" && (
                      <button className="px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Complete Payment
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
