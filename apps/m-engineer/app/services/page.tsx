"use client";

import Link from "next/link";

const services = [
  {
    id: "structural",
    name: "Structural Engineering",
    icon: "🏗️",
    description: "Complete structural engineering services including foundation design, framing analysis, load calculations, and PE-stamped drawings.",
    detailedFeatures: [
      "Foundation Design & Analysis",
      "Load-Bearing Wall Calculations",
      "Beam & Column Sizing",
      "Roof Truss Design",
      "Retaining Wall Design",
      "Seismic & Wind Analysis",
      "PE-Stamped Drawings",
      "Construction Details",
    ],
    pricing: [
      { tier: "Review Only", price: "$1,500", desc: "Existing plans review" },
      { tier: "Basic Design", price: "$3,000", desc: "Simple residential" },
      { tier: "Full Service", price: "$6,000+", desc: "Complex projects" },
    ],
    turnaround: "5-10 business days",
  },
  {
    id: "mep",
    name: "MEP Engineering",
    icon: "⚡",
    description: "Mechanical, electrical, and plumbing system design with energy modeling and code compliance for residential and commercial projects.",
    detailedFeatures: [
      "HVAC Load Calculations",
      "Ductwork Design",
      "Electrical Load Analysis",
      "Panel Schedules",
      "Lighting Design",
      "Plumbing Layout",
      "Energy Modeling",
      "Title 24 Compliance",
    ],
    pricing: [
      { tier: "Single System", price: "$2,000", desc: "One discipline only" },
      { tier: "Full MEP", price: "$5,000", desc: "All three disciplines" },
      { tier: "Commercial", price: "$10,000+", desc: "Large-scale projects" },
    ],
    turnaround: "7-14 business days",
  },
  {
    id: "civil",
    name: "Civil Engineering",
    icon: "🛤️",
    description: "Site development, grading, drainage, and infrastructure design for residential subdivisions and commercial developments.",
    detailedFeatures: [
      "Site Planning",
      "Grading & Earthwork",
      "Stormwater Management",
      "Drainage Design",
      "Utility Layout",
      "Road Design",
      "Erosion Control",
      "SWPPP Preparation",
    ],
    pricing: [
      { tier: "Site Plan", price: "$2,500", desc: "Basic site layout" },
      { tier: "Full Civil", price: "$7,500", desc: "Complete civil package" },
      { tier: "Subdivision", price: "$15,000+", desc: "Multi-lot development" },
    ],
    turnaround: "10-14 business days",
  },
  {
    id: "geotechnical",
    name: "Geotechnical Services",
    icon: "🔬",
    description: "Soil investigation, foundation recommendations, and site characterization for construction projects of all sizes.",
    detailedFeatures: [
      "Soil Boring & Sampling",
      "Laboratory Testing",
      "Bearing Capacity Analysis",
      "Settlement Analysis",
      "Foundation Recommendations",
      "Slope Stability",
      "Liquefaction Assessment",
      "Pavement Design",
    ],
    pricing: [
      { tier: "Desktop Study", price: "$800", desc: "Existing data review" },
      { tier: "Standard Investigation", price: "$3,500", desc: "2-4 borings" },
      { tier: "Comprehensive", price: "$8,000+", desc: "Large site investigation" },
    ],
    turnaround: "7-21 business days",
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-black text-blue-600">
              Kealee Engineering
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/services" className="text-blue-600 font-semibold">Services</Link>
              <Link href="/pricing" className="text-zinc-600 hover:text-zinc-900">Pricing</Link>
              <Link href="/projects" className="text-zinc-600 hover:text-zinc-900">My Projects</Link>
              <Link href="/quote" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">
                Get Quote
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black">Engineering Services</h1>
          <p className="text-zinc-500 mt-2 max-w-2xl mx-auto">
            Licensed professional engineers across all major disciplines, delivering
            permit-ready stamped drawings for your construction projects.
          </p>
        </div>

        <div className="space-y-8">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl border border-zinc-200 overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-start gap-6">
                  <div className="text-5xl">{service.icon}</div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">{service.name}</h2>
                    <p className="text-zinc-600 mb-4">{service.description}</p>
                    <div className="text-sm text-zinc-500">
                      Typical turnaround: <span className="font-semibold text-blue-600">{service.turnaround}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-8">
                  {/* Features */}
                  <div>
                    <h3 className="text-sm font-bold text-zinc-500 uppercase mb-4">What's Included</h3>
                    <ul className="grid grid-cols-2 gap-2">
                      {service.detailedFeatures.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <span className="text-blue-500">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Pricing Tiers */}
                  <div>
                    <h3 className="text-sm font-bold text-zinc-500 uppercase mb-4">Pricing</h3>
                    <div className="space-y-3">
                      {service.pricing.map((tier) => (
                        <div
                          key={tier.tier}
                          className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg"
                        >
                          <div>
                            <div className="font-semibold">{tier.tier}</div>
                            <div className="text-sm text-zinc-500">{tier.desc}</div>
                          </div>
                          <div className="text-lg font-bold text-blue-600">{tier.price}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Link
                    href={`/quote?service=${service.id}`}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
                  >
                    Request Quote
                  </Link>
                  <Link
                    href={`/services/${service.id}`}
                    className="px-6 py-3 border border-zinc-200 font-semibold rounded-lg hover:bg-zinc-50"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 bg-blue-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Need Multiple Services?</h2>
          <p className="opacity-90 mb-6">
            Get bundled pricing for multi-discipline engineering projects.
          </p>
          <Link
            href="/quote"
            className="inline-block px-8 py-3 bg-white text-blue-700 font-bold rounded-lg hover:bg-zinc-100"
          >
            Get Custom Quote
          </Link>
        </div>
      </main>
    </div>
  );
}
