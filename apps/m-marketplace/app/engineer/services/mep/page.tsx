import Link from "next/link";

const disciplines = [
  {
    title: "Mechanical / HVAC Design",
    items: [
      "Heating and cooling load calculations",
      "HVAC system selection and sizing",
      "Ductwork layout and design",
      "Ventilation and air quality analysis",
      "Refrigeration system design",
    ],
  },
  {
    title: "Electrical System Design",
    items: [
      "Electrical load analysis and panel schedules",
      "Power distribution design",
      "Lighting layout and photometric analysis",
      "Emergency and standby power systems",
      "Low-voltage system design",
    ],
  },
  {
    title: "Plumbing Design",
    items: [
      "Domestic water supply sizing",
      "Sanitary drainage and vent design",
      "Stormwater piping and roof drainage",
      "Gas piping layout",
      "Fixture scheduling and specification",
    ],
  },
  {
    title: "Energy Efficiency Analysis",
    items: [
      "Energy modeling and simulation",
      "Title 24 / IECC compliance",
      "LEED and green building consulting",
      "Envelope performance analysis",
      "Utility cost projections",
    ],
  },
];

const pricingTiers = [
  {
    name: "Basic",
    price: "$3,000",
    description: "Single-discipline MEP design for straightforward residential projects",
    features: [
      "One discipline (M, E, or P)",
      "Load calculations",
      "Basic system layout",
      "1 set of stamped drawings",
      "1 revision included",
      "10 business day turnaround",
    ],
  },
  {
    name: "Standard",
    price: "$7,500",
    popular: true,
    description: "Complete MEP coordination for residential and light commercial projects",
    features: [
      "All three disciplines included",
      "Coordinated MEP drawings",
      "Energy compliance documentation",
      "Equipment specifications",
      "3 sets of stamped drawings",
      "3 revisions included",
      "7 business day turnaround",
      "Permit support",
    ],
  },
  {
    name: "Premium",
    price: "$15,000",
    description: "Full-service MEP engineering for complex commercial and multi-family projects",
    features: [
      "All disciplines with full coordination",
      "Detailed energy modeling",
      "Fire protection design",
      "Building automation specifications",
      "Unlimited stamped drawing sets",
      "Unlimited revisions",
      "5 business day turnaround",
      "Dedicated MEP engineer",
      "Construction phase support",
      "Permit management",
    ],
  },
];

export default function MEPEngineeringPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/engineer" className="text-xl font-black" style={{ color: "#1A2B4A" }}>
              Kealee Engineering
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/engineer/services" className="text-zinc-600 hover:text-zinc-900">Services</Link>
              <Link href="/engineer/pricing" className="text-zinc-600 hover:text-zinc-900">Pricing</Link>
              <Link href="/engineer/faq" className="text-zinc-600 hover:text-zinc-900">FAQ</Link>
              <Link href="/engineer/blog" className="text-zinc-600 hover:text-zinc-900">Blog</Link>
              <Link
                href="/engineer/quote?service=mep"
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
          <Link href="/engineer" className="hover:text-zinc-900">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/engineer/services" className="hover:text-zinc-900">Services</Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-900 font-medium">MEP Engineering</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="py-16 lg:py-20" style={{ backgroundColor: "#1A2B4A" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-black mb-6 text-white">
              MEP Engineering Services
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Mechanical, electrical, and plumbing system design with energy-efficient solutions.
              Our licensed engineers deliver coordinated, code-compliant MEP drawings
              for residential and commercial projects.
            </p>
            <div className="flex gap-4">
              <Link
                href="/engineer/quote?service=mep"
                className="px-8 py-4 text-white font-bold rounded-xl hover:opacity-90"
                style={{ backgroundColor: "#2DD4BF" }}
              >
                Get a Free Quote
              </Link>
              <Link
                href="#pricing"
                className="px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white py-8 border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "300+", label: "MEP Projects Delivered" },
              { value: "3", label: "Disciplines Covered" },
              { value: "99%", label: "Code Compliance Rate" },
              { value: "7 Day", label: "Avg. Turnaround" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-black" style={{ color: "#2DD4BF" }}>{stat.value}</div>
                <div className="text-sm text-zinc-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disciplines */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black" style={{ color: "#1A2B4A" }}>
              Full-Spectrum MEP Design
            </h2>
            <p className="text-zinc-500 mt-2">
              Coordinated mechanical, electrical, and plumbing engineering under one roof
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {disciplines.map((discipline) => (
              <div
                key={discipline.title}
                className="bg-white rounded-2xl border border-zinc-200 p-8 hover:shadow-lg transition"
              >
                <h3 className="text-xl font-bold mb-4" style={{ color: "#1A2B4A" }}>
                  {discipline.title}
                </h3>
                <ul className="space-y-3">
                  {discipline.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-zinc-600">
                      <span className="mt-0.5" style={{ color: "#22C55E" }}>&#10003;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why MEP Coordination Matters */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black" style={{ color: "#1A2B4A" }}>
              Why MEP Coordination Matters
            </h2>
            <p className="text-zinc-500 mt-2">
              Properly coordinated MEP systems prevent costly field conflicts and change orders
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Clash Prevention",
                desc: "Coordinated drawings identify and resolve conflicts between mechanical, electrical, and plumbing systems before building begins.",
              },
              {
                title: "Energy Savings",
                desc: "Optimized system design reduces energy consumption, lowers operating costs, and meets or exceeds energy code requirements.",
              },
              {
                title: "Faster Permits",
                desc: "Complete, code-compliant MEP packages with all required calculations and documentation streamline the permitting process.",
              },
            ].map((item) => (
              <div key={item.title} className="text-center p-6">
                <h3 className="text-lg font-bold mb-2" style={{ color: "#1A2B4A" }}>{item.title}</h3>
                <p className="text-sm text-zinc-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black" style={{ color: "#1A2B4A" }}>
              MEP Engineering Pricing
            </h2>
            <p className="text-zinc-500 mt-2">
              Clear, upfront pricing for every project scope
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl border bg-white p-8 ${
                  tier.popular ? "ring-2 shadow-lg" : "border-zinc-200"
                }`}
                style={tier.popular ? { borderColor: "#2DD4BF" } : undefined}
              >
                {tier.popular && (
                  <span
                    className="inline-block px-3 py-1 text-xs font-bold rounded-full mb-4 text-white"
                    style={{ backgroundColor: "#2DD4BF" }}
                  >
                    MOST POPULAR
                  </span>
                )}
                <h3 className="text-xl font-bold">{tier.name}</h3>
                <div className="mt-2">
                  <span className="text-4xl font-black" style={{ color: "#1A2B4A" }}>{tier.price}</span>
                  <span className="text-zinc-500 ml-1">one-time</span>
                </div>
                <p className="text-sm text-zinc-500 mt-2">{tier.description}</p>
                <ul className="mt-6 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="text-sm flex items-start gap-2">
                      <span style={{ color: "#22C55E" }}>&#10003;</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/quote?service=mep&tier=${tier.name.toLowerCase()}`}
                  className={`mt-8 block text-center py-3 rounded-xl font-bold transition ${
                    tier.popular
                      ? "text-white hover:opacity-90"
                      : "border border-zinc-200 hover:bg-zinc-50"
                  }`}
                  style={tier.popular ? { backgroundColor: "#2DD4BF" } : { color: "#1A2B4A" }}
                >
                  Get a Quote
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-white" style={{ backgroundColor: "#1A2B4A" }}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-4">Need Coordinated MEP Design?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Our licensed engineers deliver fully coordinated mechanical, electrical, and plumbing
            packages. Get a quote within 24 hours.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/engineer/quote?service=mep"
              className="px-8 py-4 font-bold rounded-xl hover:opacity-90"
              style={{ backgroundColor: "#2DD4BF", color: "#1A2B4A" }}
            >
              Get a Free Quote
            </Link>
            <Link
              href="/engineer/services"
              className="px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10"
            >
              View All Services
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
                Professional engineering services for the modern building industry.
              </p>
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-400 uppercase mb-4">Services</div>
              <div className="space-y-2 text-sm">
                <Link href="/engineer/services/structural" className="block text-zinc-300 hover:text-white">Structural</Link>
                <Link href="/engineer/services/mep" className="block text-zinc-300 hover:text-white">MEP</Link>
                <Link href="/engineer/services/civil" className="block text-zinc-300 hover:text-white">Civil</Link>
                <Link href="/engineer/services/geotechnical" className="block text-zinc-300 hover:text-white">Geotechnical</Link>
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-400 uppercase mb-4">Resources</div>
              <div className="space-y-2 text-sm">
                <Link href="/engineer/pricing" className="block text-zinc-300 hover:text-white">Pricing</Link>
                <Link href="/engineer/faq" className="block text-zinc-300 hover:text-white">FAQ</Link>
                <Link href="/engineer/blog" className="block text-zinc-300 hover:text-white">Blog</Link>
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
