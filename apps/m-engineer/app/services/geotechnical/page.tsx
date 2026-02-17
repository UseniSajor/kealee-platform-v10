import Link from "next/link";

const services = [
  {
    title: "Soil Analysis & Testing",
    description:
      "Laboratory testing of soil samples including grain size distribution, Atterberg limits, moisture content, compaction tests, and chemical analysis for site suitability.",
  },
  {
    title: "Foundation Recommendations",
    description:
      "Engineering recommendations for foundation type and design based on subsurface conditions, including bearing capacity, settlement estimates, and design considerations.",
  },
  {
    title: "Slope Stability Analysis",
    description:
      "Stability analysis for natural and engineered slopes, retaining structures, and embankments using limit equilibrium and finite element methods.",
  },
  {
    title: "Subsurface Investigation",
    description:
      "Field exploration programs including soil borings, test pits, cone penetration testing (CPT), and groundwater monitoring to characterize site conditions.",
  },
  {
    title: "Pavement Design",
    description:
      "Structural pavement sections for roads, parking lots, and hardscapes based on traffic loading, subgrade conditions, and local agency requirements.",
  },
  {
    title: "Construction Monitoring",
    description:
      "Field observation and testing during construction including fill compaction testing, foundation inspections, and compliance verification.",
  },
];

const pricingTiers = [
  {
    name: "Basic",
    price: "$2,000",
    description: "Desktop study and basic recommendations for small residential projects",
    features: [
      "Review of existing geotechnical data",
      "Desktop geological assessment",
      "Preliminary foundation recommendations",
      "Summary report",
      "7 business day turnaround",
    ],
  },
  {
    name: "Standard",
    price: "$6,500",
    popular: true,
    description: "Field investigation with laboratory testing for most residential and commercial sites",
    features: [
      "2-4 soil borings (up to 25 ft depth)",
      "Laboratory testing program",
      "Bearing capacity analysis",
      "Settlement analysis",
      "Foundation recommendations",
      "Detailed geotechnical report",
      "Pavement section recommendation",
      "10 business day turnaround",
    ],
  },
  {
    name: "Premium",
    price: "$14,000",
    description: "Comprehensive investigation for complex sites, multi-story, or large-scale projects",
    features: [
      "6+ soil borings with deep drilling",
      "Advanced lab testing suite",
      "Slope stability analysis",
      "Liquefaction assessment",
      "Groundwater evaluation",
      "Seismic site classification",
      "Retaining wall recommendations",
      "Construction monitoring plan",
      "Dedicated project engineer",
      "5 business day turnaround",
    ],
  },
];

export default function GeotechnicalEngineeringPage() {
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
              <Link href="/pricing" className="text-zinc-600 hover:text-zinc-900">Pricing</Link>
              <Link href="/faq" className="text-zinc-600 hover:text-zinc-900">FAQ</Link>
              <Link href="/blog" className="text-zinc-600 hover:text-zinc-900">Blog</Link>
              <Link
                href="/quote?service=geotechnical"
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
          <Link href="/services" className="hover:text-zinc-900">Services</Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-900 font-medium">Geotechnical Engineering</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="py-16 lg:py-20" style={{ backgroundColor: "#1A2B4A" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-black mb-6 text-white">
              Geotechnical Engineering Services
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Subsurface investigation, soil analysis, and foundation recommendations
              from licensed geotechnical engineers. Build on a solid foundation with
              data-driven engineering.
            </p>
            <div className="flex gap-4">
              <Link
                href="/quote?service=geotechnical"
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
              { value: "500+", label: "Sites Investigated" },
              { value: "20+", label: "Licensed GEs" },
              { value: "100%", label: "Report Accuracy" },
              { value: "10 Day", label: "Avg. Turnaround" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-black" style={{ color: "#2DD4BF" }}>{stat.value}</div>
                <div className="text-sm text-zinc-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Detail */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black" style={{ color: "#1A2B4A" }}>
              Our Geotechnical Services
            </h2>
            <p className="text-zinc-500 mt-2">
              From desktop studies to comprehensive field investigations
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.title}
                className="bg-white rounded-2xl border border-zinc-200 p-6 hover:shadow-lg transition"
              >
                <h3 className="text-lg font-bold mb-3" style={{ color: "#1A2B4A" }}>
                  {service.title}
                </h3>
                <p className="text-sm text-zinc-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Geotech Matters */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black" style={{ color: "#1A2B4A" }}>
              Why Geotechnical Investigation Matters
            </h2>
            <p className="text-zinc-500 mt-2">
              Understanding subsurface conditions is the foundation of every successful project
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Prevent Foundation Failures",
                desc: "Proper soil characterization ensures the right foundation type and depth, preventing costly structural issues down the road.",
              },
              {
                title: "Reduce Project Costs",
                desc: "Accurate geotechnical data prevents over-engineering and identifies the most cost-effective foundation solutions for site conditions.",
              },
              {
                title: "Meet Code Requirements",
                desc: "Most building departments require a geotechnical report for permit. Our reports meet or exceed all local and IBC requirements.",
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
              Geotechnical Engineering Pricing
            </h2>
            <p className="text-zinc-500 mt-2">
              Clear pricing for every level of investigation
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
                  href={`/quote?service=geotechnical&tier=${tier.name.toLowerCase()}`}
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
          <h2 className="text-3xl font-black mb-4">Need a Geotechnical Report?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Get a detailed quote for soil investigation and geotechnical engineering within
            24 hours. Fast turnaround, clear reporting, permit-ready deliverables.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/quote?service=geotechnical"
              className="px-8 py-4 font-bold rounded-xl hover:opacity-90"
              style={{ backgroundColor: "#2DD4BF", color: "#1A2B4A" }}
            >
              Get a Free Quote
            </Link>
            <Link
              href="/services"
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
