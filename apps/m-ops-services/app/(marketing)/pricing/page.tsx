import Link from "next/link";

const gcPackages = [
  {
    id: "gc-a",
    name: "Package A",
    label: "Solo GC",
    price: "$1,750",
    interval: "month",
    annualPrice: "$17,850",
    annualSavings: "$3,150",
    highlight: false,
    hours: "5-10 hrs/week",
    features: [
      "Permits + inspections tracking",
      "Client-ready weekly updates",
      "Vendor follow-ups",
      "Document organization (POs, COs, receipts)",
      "Email support",
    ],
  },
  {
    id: "gc-b",
    name: "Package B",
    label: "Growing Team",
    price: "$3,750",
    interval: "month",
    annualPrice: "$38,250",
    annualSavings: "$6,750",
    highlight: true,
    badge: "MOST POPULAR",
    hours: "15-20 hrs/week",
    features: [
      "Everything in Package A",
      "Full operations department handoff",
      "Permit/delivery follow-ups",
      "Schedule protection",
      "Weekly reporting + action items",
      "Sub accountability tracking",
      "Priority support",
    ],
  },
  {
    id: "gc-c",
    name: "Package C",
    label: "Multiple Projects",
    price: "$9,500",
    interval: "month",
    annualPrice: "$96,900",
    annualSavings: "$17,100",
    highlight: false,
    hours: "30-40 hrs/week",
    features: [
      "Everything in Package B",
      "Multi-project ops coverage",
      "Centralized vendor/sub comms",
      "Consistent status cadence",
      "Proactive risk tracking",
      "Dedicated account manager",
      "24/7 support",
    ],
  },
  {
    id: "gc-d",
    name: "Package D",
    label: "Enterprise GC",
    price: "$16,500",
    interval: "month",
    annualPrice: "$168,300",
    annualSavings: "$29,700",
    highlight: false,
    hours: "40+ hrs/week",
    features: [
      "Everything in Package C",
      "Enterprise ops team coverage",
      "Escalation management",
      "Standardized workflows",
      "Multi-region support",
      "SLA-style response",
      "Executive reporting",
      "Custom integrations",
    ],
  },
];

const projectOwnerPackages = [
  {
    id: "po-a",
    name: "Starter",
    price: "$299",
    interval: "month",
    features: ["1 active project", "Basic milestone tracking", "Email notifications", "Standard support"],
  },
  {
    id: "po-b",
    name: "Professional",
    price: "$699",
    interval: "month",
    highlight: true,
    badge: "POPULAR",
    features: ["3 active projects", "Full milestone tracking", "Contractor management", "Document storage", "Priority support"],
  },
  {
    id: "po-c",
    name: "Business",
    price: "$1,499",
    interval: "month",
    features: ["10 active projects", "Team collaboration", "Advanced analytics", "API access", "Dedicated support"],
  },
  {
    id: "po-d",
    name: "Enterprise",
    price: "$2,999",
    interval: "month",
    features: ["Unlimited projects", "White-label options", "Custom workflows", "SSO integration", "24/7 enterprise support"],
  },
];

const permitPackages = [
  {
    id: "permit-a",
    name: "Basic",
    price: "$499",
    interval: "month",
    features: ["2 permits/month", "Basic tracking", "Email notifications", "Standard jurisdictions"],
  },
  {
    id: "permit-b",
    name: "Professional",
    price: "$1,299",
    interval: "month",
    highlight: true,
    badge: "POPULAR",
    features: ["5 permits/month", "Full tracking", "Inspection scheduling", "AI document review", "50+ jurisdictions"],
  },
  {
    id: "permit-c",
    name: "Business",
    price: "$2,499",
    interval: "month",
    features: ["Unlimited permits", "Priority processing", "All jurisdictions", "Compliance alerts", "Dedicated specialist"],
  },
  {
    id: "permit-d",
    name: "Enterprise",
    price: "$4,999",
    interval: "month",
    features: ["Unlimited + expedited", "Multi-location support", "Custom workflows", "API integration", "White-glove service"],
  },
];

const architecturePackages = [
  {
    id: "arch-a",
    name: "Design Consultation",
    price: "$2,500",
    interval: "one-time",
    features: ["Initial consultation", "Concept sketches", "Budget guidance", "2 revisions"],
  },
  {
    id: "arch-b",
    name: "Residential Design",
    price: "$7,500",
    interval: "one-time",
    highlight: true,
    badge: "POPULAR",
    features: ["Full design package", "CAD drawings", "3D visualization", "Permit-ready docs", "5 revisions"],
  },
  {
    id: "arch-c",
    name: "Full Service",
    price: "$15,000",
    interval: "one-time",
    features: ["Complete architectural services", "BIM modeling", "Engineering coordination", "Permit management", "Unlimited revisions"],
  },
  {
    id: "arch-d",
    name: "Premium Custom",
    price: "$35,000",
    interval: "one-time",
    features: ["Luxury/custom homes", "Full team assignment", "Site supervision", "Material selection", "Interior design"],
  },
];

const estimationPackages = [
  {
    id: "est-a",
    name: "Basic Estimate",
    price: "$299",
    interval: "one-time",
    features: ["Labor breakdown", "Materials list", "Basic timeline", "24hr delivery"],
  },
  {
    id: "est-b",
    name: "Standard Estimate",
    price: "$799",
    interval: "one-time",
    highlight: true,
    badge: "POPULAR",
    features: ["Detailed labor analysis", "Material takeoffs", "Full timeline", "Resource planning", "Profit analysis"],
  },
  {
    id: "est-c",
    name: "Premium Estimate",
    price: "$1,999",
    interval: "one-time",
    features: ["Bill of quantities", "Vendor quotes", "Risk assessment", "Cash flow projection", "Bid optimization"],
  },
  {
    id: "est-d",
    name: "Enterprise",
    price: "$4,999",
    interval: "one-time",
    features: ["Multi-project analysis", "Portfolio planning", "Market analysis", "Custom reporting", "Consultant review"],
  },
];

const preconPackages = [
  {
    id: "precon-basic",
    name: "Basic Design",
    price: "$199",
    interval: "one-time",
    features: ["2 design concepts", "Standard revisions", "Basic SRP", "Email support"],
  },
  {
    id: "precon-standard",
    name: "Standard Design",
    price: "$499",
    interval: "one-time",
    highlight: true,
    badge: "POPULAR",
    features: ["4 design concepts", "Priority revisions", "Full SRP generation", "Marketplace listing", "Phone support"],
  },
  {
    id: "precon-premium",
    name: "Premium Design",
    price: "$999",
    interval: "one-time",
    features: ["Unlimited concepts", "Dedicated designer", "Premium SRP", "Featured listing", "Concierge support"],
  },
];

const aLaCarteServices = [
  { name: "Permit Application Assistance", price: "$325", category: "Permits" },
  { name: "Inspection Scheduling", price: "$200", category: "Permits" },
  { name: "Document Organization", price: "$400", category: "Admin" },
  { name: "Contractor Coordination", price: "$500", category: "Operations" },
  { name: "Site Visit & Reporting", price: "$350", category: "Operations" },
  { name: "Budget Analysis", price: "$450", category: "Finance" },
  { name: "Progress Reporting", price: "$250", category: "Admin" },
  { name: "Quality Control Review", price: "$400", category: "Operations" },
  { name: "Change Order Management", price: "$475", category: "Admin" },
  { name: "Schedule Optimization", price: "$1,250", category: "Operations" },
  { name: "Billing & Invoicing", price: "$300/mo", category: "Finance" },
  { name: "Lien Waiver Management", price: "$275", category: "Finance" },
];

const platformFees = [
  { name: "Platform Commission (Contractors)", rate: "3.5%", description: "Deducted from first milestone payment" },
  { name: "Lead Purchase Fee", rate: "$50-$500", description: "Based on project size and type" },
  { name: "Escrow Transaction Fee", rate: "1.5%", description: "For milestone releases" },
  { name: "ACH Transfer", rate: "$0", description: "Free bank transfers" },
  { name: "Wire Transfer", rate: "$25", description: "Same-day wire transfers" },
  { name: "Card Processing", rate: "2.9% + $0.30", description: "Credit/debit card payments" },
];

function PackageCard({ pkg, showAnnual = false }: { pkg: typeof gcPackages[0]; showAnnual?: boolean }) {
  return (
    <div
      className={[
        "rounded-2xl border bg-white p-6 shadow-sm flex flex-col",
        pkg.highlight
          ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20"
          : "border-black/10",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-black">{pkg.name}</div>
          {"label" in pkg && <div className="text-sm text-zinc-500">{pkg.label}</div>}
        </div>
        {"badge" in pkg && pkg.badge && (
          <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-bold text-sky-700">
            {pkg.badge}
          </span>
        )}
      </div>

      <div className="mt-4">
        <span className="text-3xl font-black">{pkg.price}</span>
        <span className="text-zinc-500">/{pkg.interval}</span>
      </div>

      {"annualPrice" in pkg && showAnnual && (
        <div className="mt-1 text-sm text-emerald-600">
          {pkg.annualPrice}/year (save {pkg.annualSavings})
        </div>
      )}

      {"hours" in pkg && (
        <div className="mt-2 text-sm text-zinc-600">{pkg.hours} coverage</div>
      )}

      <ul className="mt-4 flex-1 space-y-2">
        {pkg.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-zinc-700">
            <span className="text-emerald-500 mt-0.5">✓</span>
            {f}
          </li>
        ))}
      </ul>

      <Link
        href={`/checkout/${pkg.id}`}
        className={[
          "mt-6 block rounded-xl px-4 py-2.5 text-center text-sm font-bold transition",
          pkg.highlight
            ? "bg-[var(--primary)] text-white hover:opacity-90"
            : "border border-black/10 hover:bg-zinc-50",
        ].join(" ")}
      >
        {pkg.interval === "month" ? "Start Free Trial" : "Get Started"}
      </Link>
    </div>
  );
}

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="text-xl font-black tracking-tight">
          Kealee Platform
        </Link>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-700">
          <Link className="hover:text-zinc-950" href="/#platform">Platform</Link>
          <Link className="font-bold text-zinc-950" href="/pricing">Pricing</Link>
          <Link className="hover:text-zinc-950" href="/how-it-works">How it works</Link>
          <Link className="hover:text-zinc-950" href="/login">Login</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mt-12 text-center">
        <h1 className="text-4xl font-black tracking-tight">
          Transparent Pricing for Every Role
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600">
          Whether you're a GC, project owner, architect, or contractor—find the right plan
          for your needs. No hidden fees, cancel anytime.
        </p>
      </section>

      {/* GC Operations Packages */}
      <section className="mt-16">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black">Operations Packages (GCs)</h2>
            <p className="text-sm text-zinc-600 mt-1">Full-service operations support for general contractors</p>
          </div>
          <div className="text-sm text-emerald-600 font-semibold">Save 15% with annual billing</div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {gcPackages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} showAnnual />
          ))}
        </div>
      </section>

      {/* Project Owner Packages */}
      <section className="mt-16">
        <div className="mb-6">
          <h2 className="text-2xl font-black">Project Owner Plans</h2>
          <p className="text-sm text-zinc-600 mt-1">Manage your construction projects with full visibility</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {projectOwnerPackages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg as typeof gcPackages[0]} />
          ))}
        </div>
      </section>

      {/* Pre-Construction Packages */}
      <section className="mt-16">
        <div className="mb-6">
          <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 mb-2">NEW</span>
          <h2 className="text-2xl font-black">Pre-Construction Design Packages</h2>
          <p className="text-sm text-zinc-600 mt-1">From concept to contractor—guaranteed escrow-backed payments</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {preconPackages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg as typeof gcPackages[0]} />
          ))}
        </div>
      </section>

      {/* Estimation Packages */}
      <section className="mt-16">
        <div className="mb-6">
          <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 mb-2">NEW</span>
          <h2 className="text-2xl font-black">Estimation Services</h2>
          <p className="text-sm text-zinc-600 mt-1">AI-powered cost estimation with real market data</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {estimationPackages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg as typeof gcPackages[0]} />
          ))}
        </div>
      </section>

      {/* Permits & Inspections */}
      <section className="mt-16">
        <div className="mb-6">
          <h2 className="text-2xl font-black">Permits & Inspections</h2>
          <p className="text-sm text-zinc-600 mt-1">Automated permit tracking and inspection management</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {permitPackages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg as typeof gcPackages[0]} />
          ))}
        </div>
      </section>

      {/* Architecture Packages */}
      <section className="mt-16">
        <div className="mb-6">
          <h2 className="text-2xl font-black">Architecture Services</h2>
          <p className="text-sm text-zinc-600 mt-1">Professional design and permit-ready documentation</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {architecturePackages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg as typeof gcPackages[0]} />
          ))}
        </div>
      </section>

      {/* A La Carte Services */}
      <section className="mt-16">
        <div className="mb-6">
          <h2 className="text-2xl font-black">À La Carte Services</h2>
          <p className="text-sm text-zinc-600 mt-1">Need specific help? Pick only what you need.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {["Operations", "Admin", "Permits", "Finance"].map((category) => (
            <div key={category} className="rounded-2xl border border-black/10 bg-white p-5">
              <h3 className="text-lg font-bold mb-3">{category}</h3>
              <div className="space-y-2">
                {aLaCarteServices
                  .filter((s) => s.category === category)
                  .map((service) => (
                    <div key={service.name} className="flex justify-between text-sm">
                      <span className="text-zinc-700">{service.name}</span>
                      <span className="font-bold">{service.price}</span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Fees */}
      <section className="mt-16">
        <div className="mb-6">
          <h2 className="text-2xl font-black">Platform Fees & Transaction Costs</h2>
          <p className="text-sm text-zinc-600 mt-1">Transparent fee structure for all transactions</p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-black/10">
              <tr>
                <th className="text-left p-4 font-bold">Fee Type</th>
                <th className="text-left p-4 font-bold">Rate</th>
                <th className="text-left p-4 font-bold">Description</th>
              </tr>
            </thead>
            <tbody>
              {platformFees.map((fee, i) => (
                <tr key={fee.name} className={i % 2 === 1 ? "bg-zinc-50/50" : ""}>
                  <td className="p-4 font-medium">{fee.name}</td>
                  <td className="p-4 font-bold text-[var(--primary)]">{fee.rate}</td>
                  <td className="p-4 text-zinc-600">{fee.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-16">
        <h2 className="text-2xl font-black mb-6">Frequently Asked Questions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              q: "Can I switch plans anytime?",
              a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.",
            },
            {
              q: "Is there a free trial?",
              a: "Yes, most subscription plans include a 14-day free trial. One-time services do not include trials.",
            },
            {
              q: "How does the 3.5% platform fee work?",
              a: "The platform commission is automatically deducted from the contractor's first milestone payment. Project owners pay nothing extra.",
            },
            {
              q: "What payment methods do you accept?",
              a: "We accept all major credit cards, ACH bank transfers, and wire transfers. ACH transfers are free.",
            },
            {
              q: "Can I cancel anytime?",
              a: "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.",
            },
            {
              q: "Do you offer custom enterprise pricing?",
              a: "Yes! Contact our sales team for custom pricing on large teams, multi-location setups, or special requirements.",
            },
          ].map((faq) => (
            <div key={faq.q} className="rounded-2xl border border-black/10 bg-white p-5">
              <div className="font-bold">{faq.q}</div>
              <div className="mt-2 text-sm text-zinc-600">{faq.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-16 rounded-2xl bg-[var(--primary)] p-8 text-center text-white">
        <h2 className="text-2xl font-black">Ready to get started?</h2>
        <p className="mt-2 text-sm opacity-90">
          Start your free trial today—no credit card required.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-zinc-900 transition hover:bg-zinc-100"
          >
            Start Free Trial
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center rounded-xl border border-white/30 px-6 py-3 text-sm font-bold transition hover:bg-white/10"
          >
            Schedule Demo
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 border-t border-black/10 pt-6 text-center text-sm text-zinc-500">
        <p>© 2024 Kealee Platform. All rights reserved.</p>
        <div className="mt-2 flex justify-center gap-4">
          <Link className="hover:text-zinc-700" href="/terms">Terms</Link>
          <Link className="hover:text-zinc-700" href="/privacy">Privacy</Link>
          <Link className="hover:text-zinc-700" href="/contact">Contact</Link>
        </div>
      </footer>
    </main>
  );
}
