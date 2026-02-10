import Link from "next/link";

const services = [
  {
    id: "structural",
    name: "Structural Engineering",
    icon: "🏗️",
    description: "Foundation design, load calculations, structural analysis, and stamped drawings for residential and commercial projects.",
    features: ["Foundation Design", "Load-Bearing Analysis", "Beam & Column Sizing", "Stamped Drawings"],
    startingPrice: "$1,500",
  },
  {
    id: "mep",
    name: "MEP Engineering",
    icon: "⚡",
    description: "Mechanical, electrical, and plumbing system design with energy-efficient solutions and code compliance.",
    features: ["HVAC System Design", "Electrical Load Analysis", "Plumbing Layout", "Energy Modeling"],
    startingPrice: "$2,000",
  },
  {
    id: "civil",
    name: "Civil Engineering",
    icon: "🛤️",
    description: "Site planning, grading, drainage design, and infrastructure for development projects.",
    features: ["Site Planning", "Grading & Drainage", "Stormwater Management", "Utility Design"],
    startingPrice: "$2,500",
  },
  {
    id: "geotechnical",
    name: "Geotechnical Services",
    icon: "🔬",
    description: "Soil testing, foundation recommendations, and site assessment for construction projects.",
    features: ["Soil Analysis", "Bearing Capacity", "Foundation Recommendations", "Site Assessment"],
    startingPrice: "$1,800",
  },
];

const packages = [
  {
    name: "Basic Review",
    price: "$1,500",
    interval: "one-time",
    description: "Essential engineering review for simple projects",
    features: [
      "Single discipline review",
      "Standard calculations",
      "Basic stamped drawings",
      "1 revision included",
      "7-10 day turnaround",
    ],
  },
  {
    name: "Standard Design",
    price: "$4,500",
    interval: "one-time",
    popular: true,
    description: "Complete engineering design for most residential projects",
    features: [
      "Multi-discipline coordination",
      "Detailed calculations",
      "Full stamped drawing set",
      "3 revisions included",
      "5-7 day turnaround",
      "Permit support",
    ],
  },
  {
    name: "Premium Service",
    price: "$12,000",
    interval: "one-time",
    description: "Full-service engineering for complex projects",
    features: [
      "All engineering disciplines",
      "Comprehensive design package",
      "Unlimited revisions",
      "3-5 day turnaround",
      "Permit management",
      "Construction support",
      "Dedicated engineer",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    interval: "project",
    description: "For developers and large-scale projects",
    features: [
      "Volume pricing",
      "Dedicated team",
      "Priority scheduling",
      "On-site support",
      "Custom workflows",
      "API integration",
      "White-label options",
    ],
  },
];

const stats = [
  { value: "500+", label: "Projects Completed" },
  { value: "50+", label: "Licensed Engineers" },
  { value: "98%", label: "Permit Approval Rate" },
  { value: "4.9", label: "Average Rating" },
];

const processSteps = [
  { step: 1, title: "Submit Project", description: "Upload plans and describe your engineering needs" },
  { step: 2, title: "Get Quote", description: "Receive a detailed scope and pricing within 24 hours" },
  { step: 3, title: "Engineering Review", description: "Our licensed engineers complete your project" },
  { step: 4, title: "Stamped Deliverables", description: "Receive permit-ready stamped drawings" },
];

export default function EngineerHomePage() {
  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-black text-blue-600">
              Kealee Engineering
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/services" className="text-zinc-600 hover:text-zinc-900">Services</Link>
              <Link href="/pricing" className="text-zinc-600 hover:text-zinc-900">Pricing</Link>
              <Link href="/projects" className="text-zinc-600 hover:text-zinc-900">My Projects</Link>
              <Link href="/login" className="text-zinc-600 hover:text-zinc-900">Login</Link>
              <Link href="/signup" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-black mb-6">
              Professional Engineering Services On Demand
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Licensed structural, MEP, and civil engineers ready to deliver stamped
              drawings for your construction projects. Fast turnaround, competitive pricing,
              guaranteed permit approval.
            </p>
            <div className="flex gap-4">
              <Link
                href="/services"
                className="px-8 py-4 bg-white text-blue-700 font-bold rounded-xl hover:bg-zinc-100"
              >
                View Services
              </Link>
              <Link
                href="/quote"
                className="px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10"
              >
                Get a Quote
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-8 border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-4 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-black text-blue-600">{stat.value}</div>
                <div className="text-sm text-zinc-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black">Engineering Services</h2>
            <p className="text-zinc-500 mt-2">Licensed engineers across all major disciplines</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <Link
                key={service.id}
                href={`/services/${service.id}`}
                className="bg-white rounded-2xl border border-zinc-200 p-6 hover:shadow-lg hover:border-blue-200 transition"
              >
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-lg font-bold mb-2">{service.name}</h3>
                <p className="text-sm text-zinc-600 mb-4 line-clamp-2">{service.description}</p>
                <ul className="space-y-1 mb-4">
                  {service.features.slice(0, 3).map((f) => (
                    <li key={f} className="text-xs text-zinc-500 flex items-center gap-1">
                      <span className="text-blue-500">•</span> {f}
                    </li>
                  ))}
                </ul>
                <div className="text-sm">
                  <span className="text-zinc-500">Starting at</span>{" "}
                  <span className="font-bold text-blue-600">{service.startingPrice}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black">How It Works</h2>
            <p className="text-zinc-500 mt-2">From submission to stamped drawings in days, not weeks</p>
          </div>
          <div className="grid grid-cols-4 gap-8">
            {processSteps.map((step, i) => (
              <div key={step.step} className="relative">
                {i < processSteps.length - 1 && (
                  <div className="absolute top-6 left-1/2 w-full h-0.5 bg-zinc-200" />
                )}
                <div className="relative text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white font-bold rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
                    {step.step}
                  </div>
                  <h3 className="font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-zinc-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Packages */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black">Engineering Packages</h2>
            <p className="text-zinc-500 mt-2">Clear pricing for every project size</p>
          </div>
          <div className="grid grid-cols-4 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className={`rounded-2xl border bg-white p-6 ${
                  pkg.popular
                    ? "border-blue-500 ring-2 ring-blue-500/20"
                    : "border-zinc-200"
                }`}
              >
                {pkg.popular && (
                  <span className="inline-block px-3 py-1 text-xs font-bold bg-blue-100 text-blue-700 rounded-full mb-4">
                    MOST POPULAR
                  </span>
                )}
                <h3 className="text-xl font-bold">{pkg.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-black">{pkg.price}</span>
                  {pkg.interval !== "project" && (
                    <span className="text-zinc-500">/{pkg.interval}</span>
                  )}
                </div>
                <p className="text-sm text-zinc-500 mt-2">{pkg.description}</p>
                <ul className="mt-6 space-y-2">
                  {pkg.features.map((f) => (
                    <li key={f} className="text-sm flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/checkout/${pkg.name.toLowerCase().replace(" ", "-")}`}
                  className={`mt-6 block text-center py-3 rounded-xl font-bold ${
                    pkg.popular
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "border border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  {pkg.price === "Custom" ? "Contact Sales" : "Get Started"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clear Pricing Notice */}
      <section className="py-12 bg-blue-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-xl font-bold mb-2">Clear Pricing</h3>
          <p className="text-zinc-600 mb-4">
            Get clear, upfront quotes with all costs displayed at checkout.
            No hidden fees—ever.
          </p>
          <div className="flex justify-center gap-8 text-sm">
            <div>
              <span className="font-bold text-blue-600">$0</span>
              <span className="text-zinc-500 ml-1">Hidden Charges</span>
            </div>
            <div>
              <span className="font-bold text-blue-600">100%</span>
              <span className="text-zinc-500 ml-1">Satisfaction Guaranteed</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black">Why Choose Kealee Engineering</h2>
          </div>
          <div className="grid grid-cols-4 gap-6 text-center">
            {[
              { icon: "📜", title: "Licensed Engineers", desc: "PE-stamped drawings in all 50 states" },
              { icon: "⚡", title: "Fast Turnaround", desc: "3-10 day delivery standard" },
              { icon: "✅", title: "Permit Guarantee", desc: "98% first-time permit approval" },
              { icon: "💬", title: "Direct Support", desc: "Talk directly to your engineer" },
            ].map((item) => (
              <div key={item.title}>
                <div className="text-4xl mb-3">{item.icon}</div>
                <div className="font-bold mb-1">{item.title}</div>
                <div className="text-sm text-zinc-500">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-4">Ready to Start Your Engineering Project?</h2>
          <p className="text-lg opacity-90 mb-8">
            Get a quote in 24 hours. Stamped drawings delivered in days.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/quote"
              className="px-8 py-4 bg-white text-blue-700 font-bold rounded-xl hover:bg-zinc-100"
            >
              Get a Free Quote
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10"
            >
              Talk to an Engineer
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-4 gap-8 mb-8">
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
            © 2026 Kealee. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
