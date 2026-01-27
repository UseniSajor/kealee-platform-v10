import Link from "next/link";

import { HeroGC } from "@/components/marketing/HeroGC";
import { GCTestimonials } from "@/components/marketing/GCTestimonials";
import { ROICalculator } from "@/components/marketing/ROICalculator";

const gcPackages = [
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

const platformModules = [
  {
    name: "Project Management",
    icon: "📋",
    description: "Full-service construction project management with milestone tracking, contractor coordination, and real-time progress updates.",
    link: "/os-pm",
    features: ["Milestone tracking", "Progress photos", "Budget management", "Team collaboration"],
  },
  {
    name: "Pre-Construction",
    icon: "🏗️",
    description: "Streamlined pre-con workflow from design to contractor bidding with guaranteed escrow-backed contracts.",
    link: "/precon",
    features: ["Design packages", "SRP generation", "Contractor marketplace", "Escrow protection"],
    badge: "NEW",
  },
  {
    name: "Estimation Engine",
    icon: "📊",
    description: "AI-powered cost estimation with labor, materials, and timeline projections for accurate project bidding.",
    link: "/estimation",
    features: ["Labor estimation", "Material takeoffs", "Timeline projection", "Profit analysis"],
    badge: "NEW",
  },
  {
    name: "Finance & Trust",
    icon: "💰",
    description: "Lender portal for construction financing, draw management, and project oversight. Escrow built into all platform transactions.",
    link: "/finance",
    features: ["Construction lending", "Draw management", "Project oversight", "Risk monitoring"],
    badge: "LENDERS",
  },
  {
    name: "Permits & Inspections",
    icon: "📝",
    description: "Automated permit tracking, inspection scheduling, and AI-powered document review for compliance.",
    link: "/permits",
    features: ["Permit tracking", "Inspection scheduling", "AI document review", "Compliance alerts"],
  },
  {
    name: "Marketplace",
    icon: "🏪",
    description: "Connect with verified contractors, vendors, and suppliers. Quality leads and transparent bidding.",
    link: "/marketplace",
    features: ["Verified contractors", "Quality leads", "Bid management", "Reviews & ratings"],
  },
  {
    name: "Architecture Services",
    icon: "🏛️",
    description: "Professional architectural design services with CAD/BIM integration and permit-ready drawings.",
    link: "/architect",
    features: ["Design consultation", "CAD/BIM drawings", "Permit packages", "3D visualization"],
  },
  {
    name: "Engineering Services",
    icon: "⚙️",
    description: "Structural, MEP, and civil engineering services with stamped drawings and compliance verification.",
    link: "/engineer",
    features: ["Structural analysis", "MEP design", "Stamped drawings", "Code compliance"],
  },
];

const feeStructure = [
  {
    category: "Homeowners & Project Owners",
    items: [
      { name: "Design Package - Basic", price: "$199", description: "2 concepts, standard revisions" },
      { name: "Design Package - Standard", price: "$499", description: "4 concepts, priority support" },
      { name: "Design Package - Premium", price: "$999", description: "Unlimited concepts, dedicated designer" },
      { name: "PM Services Access", price: "Free", description: "Via Project Owner Portal" },
    ],
  },
  {
    category: "GCs, Builders & Contractors",
    items: [
      { name: "Ops Packages", price: "$1,750-$16,500/mo", description: "Full operations support" },
      { name: "Marketplace Subscription", price: "$299/mo", description: "Basic listing + 5 leads/month" },
      { name: "Platform Commission", price: "3.5%", description: "Deducted from first milestone payment" },
    ],
  },
  {
    category: "Lenders & Financial Partners",
    items: [
      { name: "Lender Portal Access", price: "Contact us", description: "Construction loan management" },
      { name: "Draw Management", price: "Included", description: "With lender subscription" },
      { name: "Project Oversight", price: "Included", description: "Real-time monitoring" },
    ],
  },
];

const aLaCarteServices = [
  { name: "Permit Application Assistance", price: "$325" },
  { name: "Inspection Scheduling", price: "$200" },
  { name: "Document Organization", price: "$400" },
  { name: "Contractor Coordination", price: "$500" },
  { name: "Site Visit & Reporting", price: "$350" },
  { name: "Budget Analysis", price: "$450" },
  { name: "Progress Reporting", price: "$250" },
  { name: "Quality Control Review", price: "$400" },
  { name: "Change Order Management", price: "$475" },
  { name: "Schedule Optimization", price: "$1,250" },
];

export default function MarketingHomePage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="text-xl font-black tracking-tight">
          Kealee Platform
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-700">
          <Link className="hover:text-zinc-950" href="#platform">
            Platform
          </Link>
          <Link className="hover:text-zinc-950" href="#pricing">
            Pricing
          </Link>
          <Link className="hover:text-zinc-950" href="/how-it-works">
            How it works
          </Link>
          <Link className="hover:text-zinc-950" href="/case-studies">
            Case studies
          </Link>
          <Link className="hover:text-zinc-950" href="/contractors">
            For Contractors
          </Link>
          <Link className="hover:text-zinc-950" href="/login">
            Login
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="mt-10">
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            Professional Project Management for Construction
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-zinc-600">
            Whether you're a GC, builder, contractor, or homeowner—get professional PM services
            that keep your projects on track. From pre-construction to closeout, we handle the
            coordination so you can focus on building.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-extrabold text-[var(--primary-foreground)] shadow-sm transition hover:opacity-95"
            >
              Get Started Free
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-6 py-3 text-sm font-bold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
            >
              Request Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Modules */}
      <section id="platform" className="mt-16">
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tight">
            One Platform, Every Phase
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-zinc-600">
            8 integrated modules covering the entire construction lifecycle
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {platformModules.map((module) => (
            <Link
              key={module.name}
              href={module.link}
              className="group rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition hover:border-[var(--primary)] hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl">{module.icon}</span>
                {module.badge && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    {module.badge}
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-base font-extrabold">{module.name}</h3>
              <p className="mt-2 text-sm text-zinc-600 line-clamp-2">{module.description}</p>
              <ul className="mt-3 flex flex-wrap gap-1">
                {module.features.slice(0, 3).map((f) => (
                  <li key={f} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-700">
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-3 text-sm font-bold text-[var(--primary)] group-hover:underline">
                Learn more →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* GC Services Section */}
      <section className="mt-16">
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
            View All Packages
          </Link>
        </div>
      </section>

      {/* Pain Points */}
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

      {/* GC Packages */}
      <section id="pricing" className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight">
              Operations Packages for GCs
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
          {gcPackages.map((p) => (
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

      {/* Transparent Fee Structure */}
      <section className="mt-16">
        <div className="text-center">
          <h2 className="text-2xl font-black tracking-tight">
            Transparent Fee Structure
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-zinc-600">
            No hidden fees. Know exactly what you pay—and what you earn.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {feeStructure.map((category) => (
            <div
              key={category.category}
              className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm"
            >
              <h3 className="text-lg font-black">{category.category}</h3>
              <div className="mt-4 space-y-3">
                {category.items.map((item) => (
                  <div key={item.name} className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">{item.name}</div>
                      <div className="text-xs text-zinc-500">{item.description}</div>
                    </div>
                    <div className="text-sm font-black text-[var(--primary)]">{item.price}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* A La Carte Services */}
      <section className="mt-12">
        <h2 className="text-xl font-black tracking-tight">À La Carte Services</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Need specific help? Pick only what you need.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {aLaCarteServices.map((service) => (
            <div
              key={service.name}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm"
            >
              <span className="text-zinc-700">{service.name}</span>
              <span className="font-bold text-zinc-900">{service.price}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="mt-12">
        <ROICalculator />
      </section>

      {/* Pre-Con Workflow Highlight */}
      <section className="mt-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-cyan-50 p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 mb-3">
              NEW FEATURE
            </span>
            <h2 className="text-2xl font-black tracking-tight">
              Pre-Construction Workflow
            </h2>
            <p className="mt-2 max-w-xl text-sm text-zinc-700">
              From initial design to contractor award—all with guaranteed escrow-backed
              payments. Design packages start at $199, platform commission is only 3.5%
              (paid by contractor from first milestone).
            </p>
            <div className="mt-4 flex items-center gap-6 text-sm">
              <div>
                <div className="font-black text-emerald-700">8 Phases</div>
                <div className="text-zinc-500">Full workflow</div>
              </div>
              <div>
                <div className="font-black text-emerald-700">$199-$999</div>
                <div className="text-zinc-500">Design packages</div>
              </div>
              <div>
                <div className="font-black text-emerald-700">3.5%</div>
                <div className="text-zinc-500">Platform fee</div>
              </div>
            </div>
          </div>
          <Link
            href="/precon"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Start Pre-Con Project →
          </Link>
        </div>
      </section>

      {/* Estimation Engine Highlight */}
      <section className="mt-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 mb-3">
              NEW FEATURE
            </span>
            <h2 className="text-2xl font-black tracking-tight">
              AI-Powered Estimation Engine
            </h2>
            <p className="mt-2 max-w-xl text-sm text-zinc-700">
              Get accurate cost estimates with our APP-15 Estimation Engine. Labor rates,
              material costs, timeline projections, and profit analysis—all powered by
              real market data.
            </p>
            <div className="mt-4 flex items-center gap-6 text-sm">
              <div>
                <div className="font-black text-blue-700">$299-$4,999</div>
                <div className="text-zinc-500">Estimation tiers</div>
              </div>
              <div>
                <div className="font-black text-blue-700">AI-Powered</div>
                <div className="text-zinc-500">Market data</div>
              </div>
              <div>
                <div className="font-black text-blue-700">24hr</div>
                <div className="text-zinc-500">Turnaround</div>
              </div>
            </div>
          </div>
          <Link
            href="/estimation"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            Get Estimate →
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mt-12">
        <GCTestimonials />
      </section>

      {/* CTA */}
      <section className="mt-12 rounded-2xl bg-[var(--primary)] p-6 text-[var(--primary-foreground)] shadow-sm">
        <h2 className="text-xl font-black">
          Ready to Get Started?
        </h2>
        <p className="mt-2 max-w-2xl text-sm opacity-95">
          GCs, builders, contractors, homeowners, and lenders—Kealee has a portal designed for you.
          Professional project management services that keep your projects on track.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-black text-zinc-900 shadow-sm transition hover:bg-zinc-50"
          >
            Start Free Trial
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center rounded-xl border border-white/30 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Schedule Demo
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 border-t border-black/10 pt-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="text-sm font-black">Kealee Platform</div>
            <p className="mt-2 text-xs text-zinc-500">
              The complete construction management platform for modern builders.
            </p>
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-500 uppercase">Platform</div>
            <div className="mt-2 flex flex-col gap-1 text-sm text-zinc-700">
              <Link className="hover:text-zinc-950" href="/precon">Pre-Construction</Link>
              <Link className="hover:text-zinc-950" href="/estimation">Estimation</Link>
              <Link className="hover:text-zinc-950" href="/marketplace">Marketplace</Link>
              <Link className="hover:text-zinc-950" href="/finance">Finance & Trust</Link>
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-500 uppercase">Services</div>
            <div className="mt-2 flex flex-col gap-1 text-sm text-zinc-700">
              <Link className="hover:text-zinc-950" href="/os-pm">Project Management</Link>
              <Link className="hover:text-zinc-950" href="/permits">Permits & Inspections</Link>
              <Link className="hover:text-zinc-950" href="/architect">Architecture</Link>
              <Link className="hover:text-zinc-950" href="/engineer">Engineering</Link>
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-500 uppercase">Company</div>
            <div className="mt-2 flex flex-col gap-1 text-sm text-zinc-700">
              <Link className="hover:text-zinc-950" href="/how-it-works">How it works</Link>
              <Link className="hover:text-zinc-950" href="/pricing">Pricing</Link>
              <Link className="hover:text-zinc-950" href="/case-studies">Case studies</Link>
              <Link className="hover:text-zinc-950" href="/contractors">For Contractors</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-black/5 pt-4 text-xs text-zinc-500">
          © 2024 Kealee Platform. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
