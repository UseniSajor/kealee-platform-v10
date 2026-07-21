"use client";

import Link from "next/link";

export type GCSuccessMetrics = {
  hoursSavedPerWeek: number;
  projectDelayReductionDays: number;
  permitApprovalAvgDays: number;
  permitApprovalIndustryDays: number;
  monthlyCostSavings: number;
  clientSatisfactionScore: number; // 0-10
  benchmarkPercentile: number; // 0-100
  avgCompletionDeltaDays: number; // negative means ahead of schedule
};

export type GCROI = {
  investmentMonthly: number;
  savingsMonthly: number;
  roiPct: number; // savings/investment
  breakEvenMonths: number;
};

function formatMoney(n: number) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pct(n: number) {
  return `${Math.round(n)}%`;
}

function MetricCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold text-zinc-600">{label}</div>
      <div className="mt-1 text-xl font-black text-zinc-950">{value}</div>
      {subtitle ? <div className="mt-2 text-xs text-zinc-600">{subtitle}</div> : null}
    </div>
  );
}

export function GCSuccessDashboard({
  planName,
  investmentMonthly,
  metrics,
}: {
  planName: string;
  investmentMonthly: number;
  metrics: GCSuccessMetrics;
}) {
  // ROI model (MVP): savings vs subscription cost.
  // Break-even model: assume one-time “setup cost” equal to ~65% of a month (tunable) so it's not always <1.
  const assumedSetupCost = Math.round(investmentMonthly * 1.65);
  const roi: GCROI = {
    investmentMonthly,
    savingsMonthly: metrics.monthlyCostSavings,
    roiPct: investmentMonthly > 0 ? (metrics.monthlyCostSavings / investmentMonthly) * 100 : 0,
    breakEvenMonths:
      Math.max(0.1, metrics.monthlyCostSavings - investmentMonthly) > 0
        ? assumedSetupCost / (metrics.monthlyCostSavings - investmentMonthly)
        : 99,
  };

  const permitBetterThanIndustry =
    metrics.permitApprovalIndustryDays > 0
      ? clamp(
          (1 - metrics.permitApprovalAvgDays / metrics.permitApprovalIndustryDays) * 100,
          -999,
          999
        )
      : 0;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight">Success tracking</h2>
          <p className="mt-1 text-sm text-zinc-700">
            A clear view of time saved, schedule improvements, and ROI from{" "}
            <span className="font-extrabold text-zinc-900">{planName}</span>.
          </p>
        </div>
        <Link
          href="/ops/case-studies"
          className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
        >
          Browse case studies
        </Link>
      </div>

      {/* GC dashboard metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Hours saved / week"
          value={`${metrics.hoursSavedPerWeek}h`}
          subtitle="Estimated admin + coordination saved"
        />
        <MetricCard
          label="Project delay reduction"
          value={`${metrics.projectDelayReductionDays} days`}
          subtitle="Compared to your baseline"
        />
        <MetricCard
          label="Permit approval (avg)"
          value={`${metrics.permitApprovalAvgDays} days`}
          subtitle={`Industry: ${metrics.permitApprovalIndustryDays} days`}
        />
        <MetricCard
          label="Optimization savings"
          value={formatMoney(metrics.monthlyCostSavings)}
          subtitle="Estimated monthly savings"
        />
        <MetricCard
          label="Client satisfaction"
          value={`${metrics.clientSatisfactionScore.toFixed(1)}/10`}
          subtitle="Survey + feedback rollup (stub)"
        />
      </div>

      {/* ROI dashboard */}
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black tracking-tight">ROI dashboard</h3>
            <p className="mt-1 text-sm text-zinc-700">
              Simple ROI model: savings vs subscription cost (tunable once you wire real data).
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-800">
            ROI: {pct(roi.roiPct)}
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
            <div className="text-xs font-semibold text-zinc-600">Your investment</div>
            <div className="mt-1 text-xl font-black text-zinc-950">
              {formatMoney(roi.investmentMonthly)}/mo
            </div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
            <div className="text-xs font-semibold text-zinc-600">Your savings</div>
            <div className="mt-1 text-xl font-black text-zinc-950">
              {formatMoney(roi.savingsMonthly)}/mo
            </div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
            <div className="text-xs font-semibold text-zinc-600">ROI</div>
            <div className="mt-1 text-xl font-black text-zinc-950">{pct(roi.roiPct)}</div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
            <div className="text-xs font-semibold text-zinc-600">Break-even</div>
            <div className="mt-1 text-xl font-black text-zinc-950">
              {roi.breakEvenMonths >= 99 ? "—" : `${roi.breakEvenMonths.toFixed(1)} mo`}
            </div>
            <div className="mt-1 text-xs text-zinc-600">Uses a one-time setup assumption</div>
          </div>
        </div>
      </div>

      {/* Benchmarking */}
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black tracking-tight">Benchmarking</h3>
            <p className="mt-1 text-sm text-zinc-700">
              How you compare to similar GCs (stubbed until database + cohort rules are wired).
            </p>
          </div>
          <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-black text-sky-700">
            Better than {metrics.benchmarkPercentile}% of GCs
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
            <div className="text-sm font-black text-zinc-950">
              Average permit approval: {metrics.permitApprovalAvgDays} days
            </div>
            <div className="mt-2 text-sm text-zinc-700">
              Industry: {metrics.permitApprovalIndustryDays} days{" "}
              <span className="font-black text-zinc-900">
                ({permitBetterThanIndustry >= 0 ? "↓" : "↑"} {Math.abs(permitBetterThanIndustry).toFixed(0)}%)
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
            <div className="text-sm font-black text-zinc-950">Project completion</div>
            <div className="mt-2 text-sm text-zinc-700">
              {metrics.avgCompletionDeltaDays <= 0 ? (
                <>
                  <span className="font-black text-zinc-900">
                    {Math.abs(metrics.avgCompletionDeltaDays)} days ahead
                  </span>{" "}
                  of schedule
                </>
              ) : (
                <>
                  <span className="font-black text-zinc-900">{metrics.avgCompletionDeltaDays} days behind</span>{" "}
                  schedule
                </>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
            <div className="text-sm font-black text-zinc-950">Client satisfaction</div>
            <div className="mt-2 text-sm text-zinc-700">
              You’re trending{" "}
              <span className="font-black text-zinc-900">
                {metrics.clientSatisfactionScore >= 8.5 ? "excellent" : metrics.clientSatisfactionScore >= 7.5 ? "good" : "needs focus"}
              </span>{" "}
              based on the last 30 days.
            </div>
          </div>
        </div>
      </div>

      {/* Success stories */}
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black tracking-tight">Success stories</h3>
            <p className="mt-1 text-sm text-zinc-700">
              Real outcomes from other GCs (examples until you connect your CMS/case study DB).
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            {
              quote: "Since joining, GC XYZ increased projects by 40%.",
              link: "/case-studies",
              label: "Read story",
            },
            {
              quote: "GC ABC reduced admin costs by 65% through streamlined workflows.",
              link: "/case-studies",
              label: "Read story",
            },
            {
              quote: "A mid-size GC cut permit cycle time from 28 days to 12 days.",
              link: "/case-studies",
              label: "See case study",
            },
          ].map((s) => (
            <div key={s.quote} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <div className="text-sm font-black text-zinc-950">{s.quote}</div>
              <Link
                href={s.link}
                className="mt-3 inline-flex rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
              >
                {s.label}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

