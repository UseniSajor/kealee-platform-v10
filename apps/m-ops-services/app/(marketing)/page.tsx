import Link from "next/link";

import { HeroGC } from "@/components/marketing/HeroGC";
import { GCTestimonials } from "@/components/marketing/GCTestimonials";
import { ROICalculator } from "@/components/marketing/ROICalculator";

const packages = [
  {
    name: "Package A",
    label: "Solo GC",
    price: "$1,750/mo",
    highlight: false,
    benefits: [
      "Permits + inspections tracking (so you stop chasing statuses)",
      "Client-ready weekly updates (without losing your Saturday)",
      "Vendor follow-ups + doc organization (POs, COs, receipts)",
    ],
  },
  {
    name: "Package B",
    label: "Growing Team",
    price: "$3,750/mo",
    highlight: true,
    badge: "⭐ MOST POPULAR",
    benefits: [
      "We become your operations department (handoff admin + coordination)",
      "Permit/delivery follow-ups to protect schedule and margin",
      "Weekly reporting + action items so subs stay accountable",
    ],
  },
  {
    name: "Package C",
    label: "Multiple Projects",
    price: "$9,500/mo",
    highlight: false,
    benefits: [
      "Multi-project ops coverage for active pipelines",
      "Centralized vendor/sub comms with consistent status cadence",
      "Proactive risk tracking: permits, inspections, delays, COs",
    ],
  },
  {
    name: "Package D",
    label: "Enterprise GC",
    price: "$16,500/mo",
    highlight: false,
    benefits: [
      "Enterprise ops team coverage + escalations",
      "Standardized workflows + reporting across regions/crews",
      "SLA-style response + structured weekly executive reporting",
    ],
  },
];

export default function MarketingHomePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm font-black tracking-tight">
          Kealee Ops Services
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-700">
          <Link className="hover:text-zinc-950" href="/pricing">
            Pricing
          </Link>
          <Link className="hover:text-zinc-950" href="/how-it-works">
            How it works
          </Link>
          <Link className="hover:text-zinc-950" href="/case-studies">
            Case studies
          </Link>
          <Link className="hover:text-zinc-950" href="/contractors">
            Contractors
          </Link>
          <Link className="hover:text-zinc-950" href="/login">
            Login
          </Link>
        </nav>
      </header>

      <section className="mt-7">
        <HeroGC />
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-extrabold text-[var(--primary-foreground)] shadow-sm transition hover:opacity-95"
          >
            Start Free 14-Day Trial (Package B)
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-bold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
          >
            View Packages
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-black tracking-tight">
          General Contractor pain points (solved)
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {[
            {
              q: "Losing 20+ hours/week on admin?",
              a: "We take permits, inspections, vendor comms, and reporting off your plate so you can stay on site and sell the next job.",
            },
            {
              q: "Permit delays killing margins?",
              a: "Proactive tracking + follow-ups reduce schedule slip and the expensive domino effect it creates across trades.",
            },
            {
              q: "Sub/vendor coordination eating your evenings?",
              a: "Centralized comms and consistent updates keep everyone aligned—without you playing phone tag all day.",
            },
            {
              q: "Weekly reporting always behind?",
              a: "We produce consistent, client-ready weekly updates with action items—so you look sharp and stay ahead of surprises.",
            },
          ].map((item) => (
            <div
              key={item.q}
              className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm"
            >
              <div className="text-base font-extrabold">{item.q}</div>
              <div className="mt-2 text-sm leading-relaxed text-zinc-700">
                {item.a}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight">
              Packages for GCs
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-zinc-700">
              Pick the level of ops coverage you need today—upgrade as you take
              on more work.
            </p>
          </div>
          <div className="text-sm text-zinc-700">
            Free trial on{" "}
            <span className="font-extrabold text-zinc-900">Package B</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          {packages.map((p) => (
            <div
              key={p.name}
              className={[
                "rounded-2xl border bg-white p-5 shadow-sm",
                p.highlight
                  ? "border-[var(--primary)] ring-1 ring-[var(--primary)]/20"
                  : "border-black/10",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-black">{p.name}</div>
                  <div className="mt-1 text-sm text-zinc-700">{p.label}</div>
                </div>
                {"badge" in p && p.badge ? (
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-black text-sky-700">
                    {p.badge}
                  </span>
                ) : null}
              </div>

              <div className="mt-3 text-xl font-black">{p.price}</div>
              <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-zinc-800">
                {p.benefits.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>

              <div className="mt-4">
                <Link
                  href="/signup"
                  className="text-sm font-extrabold text-[color:var(--primary)] hover:underline"
                >
                  Start trial →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <ROICalculator />
      </section>

      <section className="mt-12">
        <GCTestimonials />
      </section>

      <section className="mt-12 rounded-2xl bg-[var(--primary)] p-6 text-[var(--primary-foreground)] shadow-sm">
        <h2 className="text-xl font-black">
          Start Free 14-Day Trial (Package B)
        </h2>
        <p className="mt-2 max-w-2xl text-sm opacity-95">
          Get your first project set up and see how fast ops tasks disappear.
        </p>
        <div className="mt-4">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-black text-zinc-900 shadow-sm transition hover:bg-zinc-50"
          >
            Start trial
          </Link>
        </div>
      </section>

      <footer className="mt-12 border-t border-black/10 pt-6 text-sm text-zinc-700">
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link className="hover:text-zinc-950" href="/how-it-works">
            How it works
          </Link>
          <Link className="hover:text-zinc-950" href="/pricing">
            Pricing
          </Link>
          <Link className="hover:text-zinc-950" href="/contractors">
            Contractors
          </Link>
        </div>
      </footer>
    </main>
  );
}

