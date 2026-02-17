import Link from "next/link";

const services = [
  {
    title: "Foundation Design",
    description:
      "Comprehensive foundation engineering including spread footings, mat foundations, deep foundations, and grade beams tailored to soil conditions and structural loads.",
  },
  {
    title: "Steel & Concrete Frame Analysis",
    description:
      "Detailed analysis and design of steel and reinforced concrete structural frames, including moment frames, braced frames, and shear wall systems.",
  },
  {
    title: "Load-Bearing Wall Assessments",
    description:
      "Evaluation of existing and proposed load-bearing walls, including load path analysis, header sizing, and modification recommendations.",
  },
  {
    title: "Seismic Retrofitting",
    description:
      "Seismic vulnerability assessments and retrofit design to meet current building codes, including soft-story retrofits and unreinforced masonry upgrades.",
  },
  {
    title: "Structural Inspections",
    description:
      "On-site structural condition assessments, damage evaluations, and inspection reports for existing buildings, renovations, and new construction.",
  },
  {
    title: "PE-Stamped Drawings",
    description:
      "Permit-ready structural drawings stamped by a licensed Professional Engineer, accepted by building departments across all 50 states.",
  },
];

const pricingTiers = [
  {
    name: "Basic",
    price: "$2,500",
    description: "Essential structural review for simple residential projects",
    features: [
      "Single-element analysis",
      "Basic load calculations",
      "Foundation recommendations",
      "1 set of stamped drawings",
      "1 revision included",
      "10 business day turnaround",
    ],
  },
  {
    name: "Standard",
    price: "$5,000",
    popular: true,
    description: "Complete structural design for most residential and light commercial projects",
    features: [
      "Full structural analysis",
      "Foundation design included",
      "Beam and column sizing",
      "Seismic and wind analysis",
      "3 sets of stamped drawings",
      "3 revisions included",
      "7 business day turnaround",
      "Permit support",
    ],
  },
  {
    name: "Premium",
    price: "$12,000",
    description: "Full-service structural engineering for complex or large-scale projects",
    features: [
      "Multi-story structural design",
      "Steel and concrete frame design",
      "Advanced seismic analysis",
      "Foundation and retaining walls",
      "Unlimited stamped drawing sets",
      "Unlimited revisions",
      "5 business day turnaround",
      "Dedicated structural engineer",
      "Construction phase support",
      "Permit management",
    ],
  },
];

export default function StructuralEngineeringPage() {
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
                href="/quote?service=structural"
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
          <span className="text-zinc-900 font-medium">Structural Engineering</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="py-16 lg:py-20" style={{ backgroundColor: "#1A2B4A" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-black mb-6 text-white">
              Structural Engineering Services
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              From foundation design to seismic retrofitting, our licensed structural engineers
              deliver PE-stamped drawings and analysis for residential, commercial, and industrial projects.
            </p>
            <div className="flex gap-4">
              <Link
                href="/quote?service=structural"
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
              { value: "200+", label: "Structural Projects" },
              { value: "50+", label: "Licensed PEs" },
              { value: "98%", label: "Permit Approval" },
              { value: "5 Day", label: "Avg. Turnaround" },
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
            <h2 className="text-3xl font-black" style={{ color: "#1A2B4A" }}>Our Structural Services</h2>
            <p className="text-zinc-500 mt-2">
              Comprehensive structural engineering for every phase of your project
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

      {/* Process */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black" style={{ color: "#1A2B4A" }}>How It Works</h2>
            <p className="text-zinc-500 mt-2">Simple process from submission to stamped deliverables</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: 1, title: "Submit Plans", desc: "Upload your architectural drawings and project details" },
              { step: 2, title: "Receive Quote", desc: "Get a detailed scope and pricing within 24 hours" },
              { step: 3, title: "Engineering Design", desc: "Our PE completes structural analysis and drawings" },
              { step: 4, title: "Stamped Deliverables", desc: "Receive permit-ready PE-stamped structural drawings" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div
                  className="w-12 h-12 text-white font-bold rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: "#1A2B4A" }}
                >
                  {item.step}
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-500">{item.desc}</p>
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
              Structural Engineering Pricing
            </h2>
            <p className="text-zinc-500 mt-2">
              Clear, upfront pricing with no hidden fees
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl border bg-white p-8 ${
                  tier.popular
                    ? "ring-2 shadow-lg"
                    : "border-zinc-200"
                }`}
                style={tier.popular ? { borderColor: "#2DD4BF", ringColor: "#2DD4BF" } : undefined}
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
                  href={`/quote?service=structural&tier=${tier.name.toLowerCase()}`}
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
          <h2 className="text-3xl font-black mb-4">Ready to Start Your Structural Project?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Get a detailed quote within 24 hours. Our licensed structural engineers deliver
            PE-stamped drawings for permit in as few as 5 business days.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/quote?service=structural"
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
