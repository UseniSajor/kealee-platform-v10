import Link from "next/link";

const services = [
  {
    title: "Site Grading & Earthwork",
    description:
      "Grading plans, cut/fill analysis, and earthwork calculations to establish proper site elevations, drainage slopes, and building pad grades.",
  },
  {
    title: "Stormwater Management",
    description:
      "Stormwater detention/retention design, runoff calculations, best management practices (BMPs), and compliance with local stormwater regulations.",
  },
  {
    title: "Utility Design",
    description:
      "Water, sewer, gas, and utility layout design including connections to municipal systems, pipe sizing, and trenching details.",
  },
  {
    title: "Road & Parking Design",
    description:
      "Roadway geometry, parking lot layout, pavement design, ADA compliance, striping plans, and traffic circulation analysis.",
  },
  {
    title: "Permitting Assistance",
    description:
      "Preparation and submission of permit applications, plan check responses, and coordination with local agencies and review bodies.",
  },
  {
    title: "Environmental Compliance",
    description:
      "SWPPP preparation, erosion and sediment control plans, NPDES compliance, and environmental impact mitigation measures.",
  },
];

const pricingTiers = [
  {
    name: "Basic",
    price: "$3,500",
    description: "Essential civil engineering for single-lot residential or small commercial sites",
    features: [
      "Site grading plan",
      "Basic drainage design",
      "Utility connection layout",
      "1 set of stamped drawings",
      "1 revision included",
      "10 business day turnaround",
    ],
  },
  {
    name: "Standard",
    price: "$8,500",
    popular: true,
    description: "Complete civil engineering package for mid-size development projects",
    features: [
      "Full grading and earthwork plan",
      "Stormwater management design",
      "Utility layout and sizing",
      "Road/parking design",
      "Erosion control plan",
      "3 sets of stamped drawings",
      "3 revisions included",
      "7 business day turnaround",
      "Permit support",
    ],
  },
  {
    name: "Premium",
    price: "$18,000",
    description: "Full-service civil engineering for subdivisions and large-scale developments",
    features: [
      "Multi-phase grading design",
      "Advanced stormwater modeling",
      "Complete utility infrastructure",
      "Road and intersection design",
      "SWPPP and environmental plans",
      "Unlimited stamped drawing sets",
      "Unlimited revisions",
      "5 business day turnaround",
      "Dedicated civil engineer",
      "Agency coordination",
      "Construction phase support",
    ],
  },
];

export default function CivilEngineeringPage() {
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
                href="/quote?service=civil"
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
          <span className="text-zinc-900 font-medium">Civil Engineering</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="py-16 lg:py-20" style={{ backgroundColor: "#1A2B4A" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-black mb-6 text-white">
              Civil Engineering Services
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              From site grading to stormwater management, our licensed civil engineers
              deliver complete site development packages. Permitting assistance and
              environmental compliance included.
            </p>
            <div className="flex gap-4">
              <Link
                href="/quote?service=civil"
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
              { value: "150+", label: "Sites Developed" },
              { value: "30+", label: "Licensed PEs" },
              { value: "97%", label: "Permit Approval" },
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
            <h2 className="text-3xl font-black" style={{ color: "#1A2B4A" }}>Our Civil Services</h2>
            <p className="text-zinc-500 mt-2">
              Complete site development engineering from concept to completion
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

      {/* Project Types */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black" style={{ color: "#1A2B4A" }}>Project Types We Serve</h2>
            <p className="text-zinc-500 mt-2">
              Civil engineering solutions for projects of every scale
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { title: "Residential", desc: "Single-family lots, subdivisions, and residential developments" },
              { title: "Commercial", desc: "Retail centers, office parks, and mixed-use developments" },
              { title: "Industrial", desc: "Warehouses, distribution centers, and manufacturing facilities" },
              { title: "Municipal", desc: "Public infrastructure, parks, and community facilities" },
            ].map((item) => (
              <div key={item.title} className="p-6 bg-zinc-50 rounded-2xl border border-zinc-200 text-center">
                <h3 className="font-bold mb-2" style={{ color: "#1A2B4A" }}>{item.title}</h3>
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
              Civil Engineering Pricing
            </h2>
            <p className="text-zinc-500 mt-2">
              Clear pricing for site development projects of all sizes
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
                  href={`/quote?service=civil&tier=${tier.name.toLowerCase()}`}
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
          <h2 className="text-3xl font-black mb-4">Ready to Develop Your Site?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Get a detailed civil engineering quote within 24 hours. Our licensed
            engineers handle everything from grading to permitting.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/quote?service=civil"
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
