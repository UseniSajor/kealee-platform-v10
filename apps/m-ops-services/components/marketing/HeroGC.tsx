"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// Animated feature item component
function AnimatedFeature({ icon, title, description, delay }: { icon: React.ReactNode; title: string; description: string; delay: number }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`flex items-start gap-4 transition-all duration-700 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 text-sky-600">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-zinc-900">{title}</h3>
        <p className="mt-1 text-sm text-zinc-600">{description}</p>
      </div>
    </div>
  );
}

// Icon components
function ClipboardIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

export function HeroGC() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-zinc-200/50 bg-white/70 p-8 shadow-xl backdrop-blur-sm md:p-10">
      {/* Decorative gradient orbs */}
      <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gradient-to-br from-sky-400/20 to-cyan-300/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gradient-to-tr from-blue-400/15 to-indigo-300/15 blur-3xl" />

      <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500/10 to-cyan-500/10 px-4 py-2 text-sm font-semibold text-sky-700">
            <span className="flex h-2 w-2 rounded-full bg-sky-500" />
            Your Operations Partner
          </div>

          <h2 className="mt-6 text-3xl font-black tracking-tight text-zinc-900 md:text-4xl">
            What We Handle{" "}
            <span className="bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">
              For You
            </span>
          </h2>

          <p className="mt-4 max-w-xl text-lg leading-relaxed text-zinc-600">
            Stop managing chaos. Start building. We take care of the operational
            overhead that keeps you from doing your best work.
          </p>

          <div className="mt-8 space-y-6">
            <AnimatedFeature
              delay={100}
              icon={<ClipboardIcon />}
              title="Permits & Inspections"
              description="Track applications, chase status updates, coordinate with inspectors - so you don't have to."
            />
            <AnimatedFeature
              delay={200}
              icon={<CalendarIcon />}
              title="Weekly Reporting"
              description="Client-ready updates with action items, photos, and progress tracking delivered every week."
            />
            <AnimatedFeature
              delay={300}
              icon={<UsersIcon />}
              title="Vendor Coordination"
              description="Centralized communications, delivery follow-ups, and sub accountability management."
            />
            <AnimatedFeature
              delay={400}
              icon={<DocumentIcon />}
              title="Documentation"
              description="POs, change orders, receipts, and contracts - organized and accessible."
            />
          </div>

          {/* Stats row */}
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-zinc-200 pt-8">
            <div>
              <div className="text-2xl font-black text-zinc-900">22+</div>
              <div className="mt-1 text-xs font-medium text-zinc-500">Hours saved weekly</div>
            </div>
            <div>
              <div className="text-2xl font-black text-zinc-900">150+</div>
              <div className="mt-1 text-xs font-medium text-zinc-500">GCs trust us</div>
            </div>
            <div>
              <div className="text-2xl font-black text-zinc-900">98%</div>
              <div className="mt-1 text-xs font-medium text-zinc-500">Satisfaction rate</div>
            </div>
          </div>
        </div>

        {/* Before/After comparison cards */}
        <div className="space-y-4">
          {/* Before Card */}
          <div className="group relative overflow-hidden rounded-2xl border border-red-200/50 bg-gradient-to-br from-red-50 to-orange-50 p-1 shadow-lg transition-all hover:shadow-xl">
            <div className="rounded-xl bg-white p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                  <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-red-700">Before Kealee</span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 text-sm text-zinc-600">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">1</span>
                  <span>20+ hours/week lost to admin</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-600">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">2</span>
                  <span>Permit delays eating margins</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-600">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">3</span>
                  <span>Scrambling for weekly reports</span>
                </div>
              </div>

              <div className="relative mt-4 h-32 overflow-hidden rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200">
                <Image
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400'%3E%3Crect width='100%25' height='100%25' fill='%23fef2f2'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23dc2626' font-family='Arial' font-size='18' font-weight='bold'%3EOverwhelmed GC%3C/text%3E%3C/svg%3E"
                  alt="GC overwhelmed with paperwork"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* After Card */}
          <div className="group relative overflow-hidden rounded-2xl border border-emerald-200/50 bg-gradient-to-br from-emerald-50 to-cyan-50 p-1 shadow-lg transition-all hover:shadow-xl">
            <div className="rounded-xl bg-white p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                  <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-emerald-700">After Kealee</span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 text-sm text-zinc-600">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600">1</span>
                  <span>Focus 100% on building</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-600">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600">2</span>
                  <span>Proactive permit tracking</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-600">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600">3</span>
                  <span>Reports delivered automatically</span>
                </div>
              </div>

              <div className="relative mt-4 h-32 overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-cyan-50">
                <Image
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400'%3E%3Crect width='100%25' height='100%25' fill='%23ecfdf5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2310b981' font-family='Arial' font-size='18' font-weight='bold'%3EHappy GC on Site%3C/text%3E%3C/svg%3E"
                  alt="Happy GC on construction site"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* Transformation arrow */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-2 text-sm font-bold text-white shadow-lg">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              The Kealee Transformation
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
