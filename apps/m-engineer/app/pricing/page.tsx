import Link from "next/link";

const serviceComparison = [
  {
    service: "Structural Engineering",
    href: "/services/structural",
    basic: { price: "$2,500", scope: "Single-element analysis, basic drawings" },
    standard: { price: "$5,000", scope: "Full structural design, 3 revisions" },
    premium: { price: "$12,000", scope: "Multi-story, unlimited revisions" },
  },
  {
    service: "MEP Engineering",
    href: "/services/mep",
    basic: { price: "$3,000", scope: "Single discipline (M, E, or P)" },
    standard: { price: "$7,500", scope: "All 3 disciplines, coordinated" },
    premium: { price: "$15,000", scope: "Full MEP + fire protection" },
  },
  {
    service: "Civil Engineering",
    href: "/services/civil",
    basic: { price: "$3,500", scope: "Site grading, basic drainage" },
    standard: { price: "$8,500", scope: "Full site development package" },
    premium: { price: "$18,000", scope: "Subdivision, multi-phase design" },
  },
  {
    service: "Geotechnical Engineering",
    href: "/services/geotechnical",
    basic: { price: "$2,000", scope: "Desktop study, recommendations" },
    standard: { price: "$6,500", scope: "Field borings + lab testing" },
    premium: { price: "$14,000", scope: "Comprehensive investigation" },
  },
];

const bundles = [
  {
    name: "Residential Package",
    discount: "10% off",
    services: ["Structural + Geotechnical"],
    description: "Foundation-focused bundle for residential construction with soil investigation and structural design.",
    savings: "Save up to $850",
  },
  {
    name: "Full Design Package",
    discount: "15% off",
    services: ["Structural + MEP + Civil"],
    description: "Complete engineering design for site development projects requiring multiple disciplines.",
    savings: "Save up to $3,150",
  },
  {
    name: "Total Engineering Package",
    discount: "20% off",
    services: ["All 4 Disciplines"],
    description: "Every engineering service bundled together for large-scale projects needing full coverage.",
    savings: "Save up to $5,900",
  },
];

const enterpriseFeatures = [
  "Volume pricing for multiple projects",
  "Dedicated engineering team",
  "Priority scheduling and expedited turnaround",
  "Custom scope and deliverables",
  "On-site engineering support",
  "API integration with your project management tools",
  "White-label reporting options",
  "Monthly billing and account management",
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-black" style={{ color: "#1A2B4A" }}>
              Kealee Engineering
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/services" className="text-zinc-600 hover:text-zinc-900">Services</Link>
              <Link href="/pricing" className="font-semibold" style={{ color: "#1A2B4A" }}>Pricing</Link>
              <Link href="/faq" className="text-zinc-600 hover:text-zinc-900">FAQ</Link>
              <Link href="/blog" className="text-zinc-600 hover:text-zinc-900">Blog</Link>
              <Link
                href="/contact"
                className="px-4 py-2 text-white font-bold rounded-lg"
                style={{ backgroundColor: "#2DD4BF" }}
              >
                Get Quote
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <nav className="text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-900">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-900 font-medium">Pricing</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="py-16" style={{ backgroundColor: "#1A2B4A" }}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl lg:text-5xl font-black mb-6 text-white">
            Engineering Pricing Overview
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Clear, upfront pricing across all engineering disciplines. No hidden fees.
            Bundle multiple services and save.
          </p>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black" style={{ color: "#1A2B4A" }}>
              Service Pricing Comparison
            </h2>
            <p className="text-zinc-500 mt-2">
              Compare pricing across all engineering disciplines and tiers
            </p>
          </div>

          {/* Table for desktop */}
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: "#1A2B4A" }}>
                    <th className="text-left text-white font-bold px-6 py-4 text-sm">Service</th>
                    <th className="text-center text-white font-bold px-6 py-4 text-sm">Basic</th>
                    <th className="text-center text-white font-bold px-6 py-4 text-sm">
                      <span className="inline-block px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: "#2DD4BF", color: "#1A2B4A" }}>
                        Standard
                      </span>
                    </th>
                    <th className="text-center text-white font-bold px-6 py-4 text-sm">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceComparison.map((row, i) => (
                    <tr
                      key={row.service}
                      className={i % 2 === 0 ? "bg-white" : "bg-zinc-50"}
                    >
                      <td className="px-6 py-5">
                        <Link href={row.href} className="font-bold hover:underline" style={{ color: "#1A2B4A" }}>
                          {row.service}
                        </Link>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="text-lg font-black" style={{ color: "#1A2B4A" }}>{row.basic.price}</div>
                        <div className="text-xs text-zinc-500 mt-1">{row.basic.scope}</div>
                      </td>
                      <td className="px-6 py-5 text-center border-x border-zinc-100">
                        <div className="text-lg font-black" style={{ color: "#2DD4BF" }}>{row.standard.price}</div>
                        <div className="text-xs text-zinc-500 mt-1">{row.standard.scope}</div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="text-lg font-black" style={{ color: "#1A2B4A" }}>{row.premium.price}</div>
                        <div className="text-xs text-zinc-500 mt-1">{row.premium.scope}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 text-center text-sm text-zinc-500">
            All prices are one-time fees. Final pricing depends on project scope and complexity.
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black" style={{ color: "#1A2B4A" }}>
              What Every Tier Includes
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border border-zinc-200 rounded-2xl">
              <h3 className="text-lg font-bold mb-4" style={{ color: "#1A2B4A" }}>Basic</h3>
              <ul className="space-y-3 text-sm text-zinc-600">
                <li className="flex items-start gap-2"><span style={{ color: "#22C55E" }}>&#10003;</span> PE-stamped drawings</li>
                <li className="flex items-start gap-2"><span style={{ color: "#22C55E" }}>&#10003;</span> Engineering calculations</li>
                <li className="flex items-start gap-2"><span style={{ color: "#22C55E" }}>&#10003;</span> 1 revision</li>
                <li className="flex items-start gap-2"><span style={{ color: "#22C55E" }}>&#10003;</span> 10 business day turnaround</li>
                <li className="flex items-start gap-2"><span style={{ color: "#22C55E" }}>&#10003;</span> Digital delivery</li>
              </ul>
            </div>
            <div className="p-6 rounded-2xl ring-2" style={{ borderColor: "#2DD4BF", ringColor: "#2DD4BF" }}>
              <h3 className="text-lg font-bold mb-1" style={{ color: "#1A2B4A" }}>Standard</h3>
              <span className="inline-block px-2 py-0.5 text-xs font-bold rounded-full text-white mb-4" style={{ backgroundColor: "#2DD4BF" }}>RECOMMENDED</span>
              <ul className="space-y-3 text-sm text-zinc-600">
                <li className="flex items-start gap-2"><span style={{ color: "#22C55E" }}>&#10003;</span> Everything in Basic</li>
                <li className="flex items-start gap-2"><span style={{ color: "#22C55E" }}>&#10003;</span> 3 revisions included</li>
                <li className="flex items-start gap-2"><span style={{ color: "#22C55E" }}>&#10003;</span> 7 business day turnaround</li>
                <li className="flex items-start gap-2"><span style={{ color: "#22C55E" }}>&#10003;</span> Permit support</li>
                <li className="flex items-start gap-2"><span style={{ color: "#22C55E" }}>&#10003;</span> Plan check response</li>
                <li className="flex items-start gap-2"><span style={{ color: "#22C55E" }}>&#10003;</span> Direct engineer access</li>
              </ul>
            </div>
            <div className="p-6 border border-zinc-200 rounded-2xl">
              <h3 className="text-lg font-bold mb-4" style={{ color: "#1A2B4A" }}>Premium</h3>
              <ul className="space-y-3 text-sm text-zinc-600">
                <li className="flex items-start gap-2"><span style={{ color: "#22C55E" }}>&#10003;</span> Everything in Standard</li>
                <li className="flex items-start gap-2"><span style={{ color: "#22C55E" }}>&#10003;</span> Unlimited revisions</li>
                <li className="flex items-start gap-2"><span style={{ color: "#22C55E" }}>&#10003;</span> 5 business day turnaround</li>
                <li className="flex items-start gap-2"><span style={{ color: "#22C55E" }}>&#10003;</span> Dedicated engineer</li>
                <li className="flex items-start gap-2"><span style={{ color: "#22C55E" }}>&#10003;</span> Construction phase support</li>
                <li className="flex items-start gap-2"><span style={{ color: "#22C55E" }}>&#10003;</span> Permit management</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Bundle Discounts */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black" style={{ color: "#1A2B4A" }}>
              Bundle Discounts
            </h2>
            <p className="text-zinc-500 mt-2">
              Save when you combine multiple engineering disciplines
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {bundles.map((bundle) => (
              <div
                key={bundle.name}
                className="bg-white rounded-2xl border border-zinc-200 p-8 hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold" style={{ color: "#1A2B4A" }}>{bundle.name}</h3>
                  <span
                    className="inline-block px-3 py-1 text-sm font-bold rounded-full text-white"
                    style={{ backgroundColor: "#22C55E" }}
                  >
                    {bundle.discount}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 mb-2">{bundle.services.join(", ")}</p>
                <p className="text-sm text-zinc-600 mb-4">{bundle.description}</p>
                <div className="text-sm font-bold" style={{ color: "#22C55E" }}>{bundle.savings}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="rounded-2xl p-8 lg:p-12" style={{ backgroundColor: "#1A2B4A" }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-black text-white mb-4">Enterprise &amp; Custom Projects</h2>
                <p className="text-gray-300 mb-6">
                  For developers, general contractors, and organizations with ongoing engineering
                  needs. Get custom pricing, dedicated teams, and priority service.
                </p>
                <Link
                  href="/quote?tier=enterprise"
                  className="inline-block px-8 py-4 font-bold rounded-xl hover:opacity-90"
                  style={{ backgroundColor: "#2DD4BF", color: "#1A2B4A" }}
                >
                  Contact for Custom Pricing
                </Link>
              </div>
              <div>
                <ul className="space-y-3">
                  {enterpriseFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-gray-300">
                      <span style={{ color: "#2DD4BF" }}>&#10003;</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ backgroundColor: "#1A2B4A" }}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-4 text-white">Not Sure Which Tier You Need?</h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Describe your project and our team will recommend the right scope and pricing.
            Quotes are always free and delivered within 24 hours.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/contact"
              className="px-8 py-4 font-bold rounded-xl hover:opacity-90"
              style={{ backgroundColor: "#2DD4BF", color: "#1A2B4A" }}
            >
              Get a Free Quote
            </Link>
            <Link
              href="/services"
              className="px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10"
            >
              Browse Services
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-lg font-bold mb-4">Kealee Engineering</div>
              <p className="text-sm text-zinc-400">
                Professional engineering services for the modern construction industry.
              </p>
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-400 uppercase mb-4">Services</div>
              <div className="space-y-2 text-sm">
                <Link href="/services/structural" className="block text-zinc-300 hover:text-white">Structural</Link>
                <Link href="/services/mep" className="block text-zinc-300 hover:text-white">MEP</Link>
                <Link href="/services/civil" className="block text-zinc-300 hover:text-white">Civil</Link>
                <Link href="/services/geotechnical" className="block text-zinc-300 hover:text-white">Geotechnical</Link>
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-400 uppercase mb-4">Resources</div>
              <div className="space-y-2 text-sm">
                <Link href="/pricing" className="block text-zinc-300 hover:text-white">Pricing</Link>
                <Link href="/faq" className="block text-zinc-300 hover:text-white">FAQ</Link>
                <Link href="/blog" className="block text-zinc-300 hover:text-white">Blog</Link>
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-400 uppercase mb-4">Contact</div>
              <div className="space-y-2 text-sm text-zinc-300">
                <div>engineering@kealee.com</div>
                <div>1-800-KEALEE</div>
              </div>
            </div>
          </div>
          <div className="border-t border-zinc-800 pt-8 text-center text-sm text-zinc-500">
            &copy; 2026 Kealee. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
