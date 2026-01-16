import Link from "next/link";

export type GCProjectHealth = {
  id: string;
  name: string;
  address: string;
  status: "On Track" | "At Risk" | "Delayed";
  progressPct: number; // 0..100
  budgetTotal: number;
  budgetActual: number;
};

function formatMoney(n: number) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function clampPct(n: number) {
  return Math.max(0, Math.min(100, n));
}

function StatusPill({ status }: { status: GCProjectHealth["status"] }) {
  const styles =
    status === "On Track"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "At Risk"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : "bg-red-50 text-red-700 border-red-200";
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black",
        styles,
      ].join(" ")}
    >
      {status}
    </span>
  );
}

export function ProjectHealth({
  projects,
}: {
  projects: GCProjectHealth[];
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-black tracking-tight">Project health</h3>
          <p className="mt-1 text-sm text-zinc-700">
            Timeline progress, budget vs actual, and quick links.
          </p>
        </div>
        <Link
          href="/portal/my-projects"
          className="text-sm font-extrabold text-[color:var(--primary)] hover:underline"
        >
          View all projects →
        </Link>
      </div>

      <div className="mt-4 grid gap-3">
        {projects.map((p) => {
          const progress = clampPct(p.progressPct);
          const budgetPct =
            p.budgetTotal > 0 ? clampPct((p.budgetActual / p.budgetTotal) * 100) : 0;
          const overBudget = p.budgetActual > p.budgetTotal;

          return (
            <div
              key={p.id}
              className="rounded-2xl border border-black/10 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-zinc-950">{p.name}</div>
                  <div className="mt-1 text-sm text-zinc-700">{p.address}</div>
                </div>
                <StatusPill status={p.status} />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-600">
                    <span>Timeline progress</span>
                    <span className="font-black text-zinc-900">{progress}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-[var(--primary)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-600">
                    <span>Budget vs actual</span>
                    <span
                      className={[
                        "font-black",
                        overBudget ? "text-red-700" : "text-zinc-900",
                      ].join(" ")}
                    >
                      {formatMoney(p.budgetActual)} / {formatMoney(p.budgetTotal)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className={[
                        "h-full rounded-full",
                        overBudget ? "bg-red-500" : "bg-emerald-500",
                      ].join(" ")}
                      style={{ width: `${Math.min(100, budgetPct)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <Link
                  href="/portal/my-projects"
                  className="font-extrabold text-[color:var(--primary)] hover:underline"
                >
                  Project details →
                </Link>
                <Link
                  href="/portal/service-requests/new"
                  className="font-extrabold text-[color:var(--primary)] hover:underline"
                >
                  Submit service request →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

