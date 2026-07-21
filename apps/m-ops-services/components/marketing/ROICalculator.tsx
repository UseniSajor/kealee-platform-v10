"use client";

import { useMemo, useState } from "react";

const PACKAGE_B_MONTHLY = 3750;
const WEEKS_PER_MONTH = 4.33;

function clampNumber(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function formatMoney(n: number) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function ROICalculator() {
  const [activeProjects, setActiveProjects] = useState<number>(2);
  const [adminHoursPerWeek, setAdminHoursPerWeek] = useState<number>(25);
  const [avgProjectValue, setAvgProjectValue] = useState<number>(250000);
  const [employees, setEmployees] = useState<number>(4);

  const results = useMemo(() => {
    const projects = clampNumber(activeProjects, 0, 100);
    const hours = clampNumber(adminHoursPerWeek, 0, 120);
    const value = clampNumber(avgProjectValue, 0, 50_000_000);
    const team = clampNumber(employees, 1, 5000);

    // Assumptions (kept simple + transparent):
    // - Estimated blended cost of GC admin hour increases with team size.
    // - Kealee removes ~60% of admin hours from the GC team (handoff + systems).
    // - Permit/delay impact modeled as small % of project value per month, scaled by active projects.
    const blendedHourlyCost = clampNumber(65 + Math.log(team) * 10, 65, 140);
    const hoursSavedPerWeek = hours * 0.6;
    const laborSavingsMonthly = hoursSavedPerWeek * WEEKS_PER_MONTH * blendedHourlyCost;
    const delaySavingsMonthly = projects * value * 0.001; // 0.1% of project value per month per active project

    const monthlySavings = laborSavingsMonthly + delaySavingsMonthly;
    const monthlyNet = monthlySavings - PACKAGE_B_MONTHLY;
    const roiPct =
      PACKAGE_B_MONTHLY > 0 ? (monthlyNet / PACKAGE_B_MONTHLY) * 100 : 0;

    const breakEvenMonths =
      monthlySavings > 0 ? PACKAGE_B_MONTHLY / monthlySavings : Infinity;

    return {
      blendedHourlyCost,
      hoursSavedPerWeek,
      monthlySavings,
      roiPct,
      breakEvenMonths,
    };
  }, [activeProjects, adminHoursPerWeek, avgProjectValue, employees]);

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-black tracking-tight">
        Calculate how much you&apos;ll save
      </h3>
      <p className="mt-2 max-w-3xl text-sm text-zinc-700">
        Inputs are tuned for general contractors. Results estimate ROI against{" "}
        <strong>Package B</strong> ({formatMoney(PACKAGE_B_MONTHLY)}/mo).
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-zinc-900">
                Number of active projects
              </span>
              <input
                className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                type="number"
                min={0}
                value={activeProjects}
                onChange={(e) => setActiveProjects(Number(e.target.value))}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-zinc-900">
                Current admin hours/week
              </span>
              <input
                className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                type="number"
                min={0}
                value={adminHoursPerWeek}
                onChange={(e) => setAdminHoursPerWeek(Number(e.target.value))}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-zinc-900">
                Average project value
              </span>
              <input
                className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                type="number"
                min={0}
                step={1000}
                value={avgProjectValue}
                onChange={(e) => setAvgProjectValue(Number(e.target.value))}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-zinc-900">
                Number of employees
              </span>
              <input
                className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                type="number"
                min={1}
                value={employees}
                onChange={(e) => setEmployees(Number(e.target.value))}
              />
            </label>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-zinc-600">
            Assumes ~60% admin time reduction and a small monthly delay/margin
            impact per active project.
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-[linear-gradient(135deg,rgba(14,165,233,0.10),rgba(255,255,255,0))] p-5">
          <div className="grid gap-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold text-zinc-600">
                Monthly savings
              </div>
              <div className="mt-1 text-3xl font-black tracking-tight text-zinc-950">
                {formatMoney(results.monthlySavings)}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="text-xs font-semibold text-zinc-600">ROI</div>
                <div className="mt-1 text-xl font-black text-zinc-950">
                  {results.roiPct.toFixed(0)}%
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="text-xs font-semibold text-zinc-600">
                  Break-even point
                </div>
                <div className="mt-1 text-xl font-black text-zinc-950">
                  {Number.isFinite(results.breakEvenMonths)
                    ? `${results.breakEvenMonths.toFixed(1)} months`
                    : "—"}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="text-xs font-semibold text-zinc-600">
                  Hours saved/week
                </div>
                <div className="mt-1 text-xl font-black text-zinc-950">
                  {results.hoursSavedPerWeek.toFixed(1)}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="text-xs font-semibold text-zinc-600">
                  Est. admin hour cost
                </div>
                <div className="mt-1 text-xl font-black text-zinc-950">
                  {formatMoney(results.blendedHourlyCost)}/hr
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

