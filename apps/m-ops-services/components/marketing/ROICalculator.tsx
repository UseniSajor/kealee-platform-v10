"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";

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

// Animated number component
function AnimatedNumber({ value, prefix = "", suffix = "", format = false }: { value: number; prefix?: string; suffix?: string; format?: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const startValue = prevValue.current;
    const endValue = value;
    const duration = 500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * easeOut;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValue.current = endValue;
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  const formattedValue = format
    ? formatMoney(displayValue)
    : Math.round(displayValue).toLocaleString();

  return (
    <span>
      {!format && prefix}
      {formattedValue}
      {suffix}
    </span>
  );
}

// Slider input component
function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  prefix = "",
  suffix = "",
  formatValue,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  formatValue?: (value: number) => string;
}) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-zinc-700">{label}</label>
        <span className="text-sm font-bold text-zinc-900">
          {formatValue ? formatValue(value) : `${prefix}${value.toLocaleString()}${suffix}`}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-sky-500 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-sky-500 [&::-webkit-slider-thumb]:to-cyan-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-sky-500/25"
          style={{
            background: `linear-gradient(to right, rgb(14 165 233) 0%, rgb(6 182 212) ${percentage}%, rgb(228 228 231) ${percentage}%)`,
          }}
        />
      </div>
    </div>
  );
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
      isPositiveROI: roiPct > 0,
    };
  }, [activeProjects, adminHoursPerWeek, avgProjectValue, employees]);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-zinc-200/50 bg-white/70 shadow-xl backdrop-blur-sm">
      {/* Decorative elements */}
      <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gradient-to-br from-sky-400/10 to-cyan-300/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gradient-to-tr from-emerald-400/10 to-teal-300/10 blur-3xl" />

      <div className="relative z-10 p-8 md:p-10">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-4 py-2 text-sm font-semibold text-emerald-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            ROI Calculator
          </div>

          <h2 className="mt-6 text-3xl font-black tracking-tight text-zinc-900 md:text-4xl">
            Calculate Your{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Savings
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600">
            See how much time and money you could save with Kealee Ops Services.
            Results estimate ROI against <strong>Package B</strong> ({formatMoney(PACKAGE_B_MONTHLY)}/mo).
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {/* Input panel */}
          <div className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-lg">
            <h3 className="text-lg font-bold text-zinc-900">Your Current Situation</h3>
            <p className="mt-1 text-sm text-zinc-500">Adjust the sliders to match your operations</p>

            <div className="mt-6 space-y-6">
              <SliderInput
                label="Number of active projects"
                value={activeProjects}
                onChange={setActiveProjects}
                min={1}
                max={20}
              />

              <SliderInput
                label="Current admin hours/week"
                value={adminHoursPerWeek}
                onChange={setAdminHoursPerWeek}
                min={5}
                max={60}
                suffix=" hrs"
              />

              <SliderInput
                label="Average project value"
                value={avgProjectValue}
                onChange={setAvgProjectValue}
                min={50000}
                max={2000000}
                step={10000}
                formatValue={(v) => formatMoney(v)}
              />

              <SliderInput
                label="Number of employees"
                value={employees}
                onChange={setEmployees}
                min={1}
                max={50}
              />
            </div>

            <div className="mt-6 rounded-xl bg-zinc-50 p-4">
              <p className="text-xs leading-relaxed text-zinc-500">
                <strong className="text-zinc-700">Assumptions:</strong> ~60% admin time reduction through handoff and systems.
                Delay/margin impact modeled as 0.1% of project value per active project monthly.
              </p>
            </div>
          </div>

          {/* Results panel */}
          <div className="space-y-4">
            {/* Main savings card */}
            <div className={`relative overflow-hidden rounded-2xl p-6 shadow-lg ${
              results.isPositiveROI
                ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                : "bg-gradient-to-br from-zinc-600 to-zinc-700"
            }`}>
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.05)_75%)] bg-[length:20px_20px] opacity-50" />

              <div className="relative z-10">
                <div className="text-sm font-semibold text-white/80">Estimated Monthly Savings</div>
                <div className="mt-2 text-5xl font-black tracking-tight text-white">
                  <AnimatedNumber value={results.monthlySavings} format />
                </div>
                <div className="mt-2 text-sm text-white/70">
                  {results.isPositiveROI ? (
                    <>Net positive after Package B cost ({formatMoney(PACKAGE_B_MONTHLY)}/mo)</>
                  ) : (
                    <>Consider increasing scope or project volume</>
                  )}
                </div>
              </div>
            </div>

            {/* Secondary metrics */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200/50 bg-white p-5 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    results.isPositiveROI
                      ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600"
                      : "bg-zinc-100 text-zinc-500"
                  }`}>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-zinc-500">ROI</div>
                    <div className={`text-2xl font-black ${results.isPositiveROI ? "text-emerald-600" : "text-zinc-400"}`}>
                      <AnimatedNumber value={results.roiPct} suffix="%" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/50 bg-white p-5 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 text-sky-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-zinc-500">Break-even</div>
                    <div className="text-2xl font-black text-zinc-900">
                      {Number.isFinite(results.breakEvenMonths)
                        ? <><AnimatedNumber value={results.breakEvenMonths} /> mo</>
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/50 bg-white p-5 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-zinc-500">Hours saved/week</div>
                    <div className="text-2xl font-black text-zinc-900">
                      <AnimatedNumber value={results.hoursSavedPerWeek} suffix=" hrs" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/50 bg-white p-5 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 text-violet-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-zinc-500">Est. admin hour cost</div>
                    <div className="text-2xl font-black text-zinc-900">
                      <AnimatedNumber value={results.blendedHourlyCost} prefix="$" suffix="/hr" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-2xl border border-sky-200/50 bg-gradient-to-r from-sky-50 to-cyan-50 p-6">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h4 className="font-bold text-zinc-900">Ready to start saving?</h4>
                  <p className="mt-1 text-sm text-zinc-600">Try Package B free for 14 days</p>
                </div>
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:shadow-xl"
                >
                  Start Free Trial
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
