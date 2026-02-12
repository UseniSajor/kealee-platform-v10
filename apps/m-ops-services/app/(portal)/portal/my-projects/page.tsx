import Link from "next/link";

const MOCK_PROJECTS = [
  {
    id: "proj-1",
    name: "Downtown Office Renovation",
    status: "Active",
    phase: "Rough-In",
    progress: 62,
    budget: "$450,000",
    nextMilestone: "Drywall Start — Feb 15",
  },
  {
    id: "proj-2",
    name: "Hillside Custom Home",
    status: "Active",
    phase: "Framing",
    progress: 35,
    budget: "$820,000",
    nextMilestone: "Framing Inspection — Feb 10",
  },
  {
    id: "proj-3",
    name: "Warehouse Expansion Phase 2",
    status: "On Hold",
    phase: "Permitting",
    progress: 18,
    budget: "$1,200,000",
    nextMilestone: "Permit Approval — TBD",
  },
];

export default function MyProjectsPage() {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950">My Projects</h1>
          <p className="text-sm text-zinc-600 mt-1">
            View and manage your construction projects
          </p>
        </div>
        <a
          href={process.env.NEXT_PUBLIC_PM_URL || "/"}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-700 transition"
        >
          Open PM Software &rarr;
        </a>
      </div>

      <div className="grid gap-4">
        {MOCK_PROJECTS.map((project) => (
          <div
            key={project.id}
            className="rounded-2xl border border-black/10 bg-white p-5 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-zinc-950 truncate">{project.name}</h3>
                  <span
                    className={[
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold",
                      project.status === "Active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700",
                    ].join(" ")}
                  >
                    {project.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-zinc-600">
                  <span>Phase: <span className="font-medium text-zinc-800">{project.phase}</span></span>
                  <span>Budget: <span className="font-medium text-zinc-800">{project.budget}</span></span>
                </div>
              </div>
              <a
                href={`${process.env.NEXT_PUBLIC_PM_URL || ""}/projects/${project.id}`}
                className="shrink-0 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-bold text-sky-700 hover:bg-sky-100 transition"
              >
                View in PM
              </a>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                <span>Progress</span>
                <span className="font-bold text-zinc-800">{project.progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-100">
                <div
                  className="h-2 rounded-full bg-sky-500 transition-all"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            <div className="mt-2 text-xs text-zinc-500">
              Next milestone: <span className="font-medium text-zinc-700">{project.nextMilestone}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-5 text-center">
        <h3 className="font-bold text-sky-900">Full Project Management</h3>
        <p className="text-sm text-sky-700 mt-1">
          Schedule, budget, RFIs, submittals, daily logs, punch lists, and more
        </p>
        <a
          href={process.env.NEXT_PUBLIC_PM_URL || "/"}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-700 transition"
        >
          Open Kealee PM &rarr;
        </a>
      </div>
    </section>
  );
}

