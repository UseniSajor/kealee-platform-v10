import Link from "next/link"
import { CheckCircle2, ArrowRight } from "lucide-react"

export const metadata = {
  title: "Pricing - Permit Services for Contractors | Kealee",
  description: "Transparent permit service pricing: per-permit, monthly unlimited, or enterprise packages. First permit free.",
}

export default function PermitPricingPage() {
  const packages = [
    {
      name: "Pay Per Permit",
      price: "$125-$500",
      unit: "per permit",
      description: "Perfect for contractors with occasional permit needs",
      features: [
        "AI compliance pre-review",
        "Application preparation & submission",
        "Status tracking until approval",
        "Basic inspection coordination",
        "One resubmittal included",
        "Email/phone support",
      ],
      pricing: "Pricing varies by permit type and complexity",
      cta: "Submit a Permit",
    },
    {
      name: "Monthly Unlimited",
      price: "$1,250",
      unit: "/month",
      description: "Unlimited permits for active contractors",
      features: [
        "Unlimited permit applications",
        "Priority AI compliance review",
        "Full inspection coordination",
        "Unlimited resubmittals",
        "Multi-jurisdiction support",
        "Dedicated permit coordinator",
        "12-hour response time",
      ],
      popular: true,
      cta: "Start Free Trial",
    },
    {
      name: "Premium",
      price: "$2,500",
      unit: "/month",
      description: "For high-volume contractors needing expedited service",
      features: [
        "Everything in Monthly Unlimited",
        "Expedited processing (when available)",
        "48-72 hour review guarantee",
        "Priority inspection scheduling",
        "Dedicated account manager",
        "4-hour response time",
        "Custom reporting",
      ],
      cta: "Start Free Trial",
    },
    {
      name: "Enterprise",
      price: "Custom",
      unit: "pricing",
      description: "Multi-office contractors and large-volume operations",
      features: [
        "Everything in Premium",
        "Multi-office coordination",
        "Custom workflow integration",
        "API access",
        "White-label reporting",
        "SLA guarantees",
        "24/7 emergency support",
      ],
      cta: "Contact Sales",
    },
  ]

  const permitPricing = [
    { type: "Residential Building Permit", price: "$325" },
    { type: "Commercial Building Permit", price: "$500" },
    { type: "Electrical Permit", price: "$150" },
    { type: "Plumbing Permit", price: "$150" },
    { type: "HVAC/Mechanical Permit", price: "$175" },
    { type: "Roofing Permit", price: "$125" },
    { type: "Solar/PV Permit", price: "$250" },
    { type: "Pool/Spa Permit", price: "$275" },
    { type: "Fence Permit", price: "$100" },
    { type: "Demolition Permit", price: "$200" },
    { type: "Occupancy Permit", price: "$150" },
    { type: "Sign Permit", price: "$125" },
  ]

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-gradient-to-b from-emerald-50 to-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Transparent Permit Pricing
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Pay per permit or choose unlimited monthly service. First permit free for new contractors.
            </p>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className={`${
                  pkg.popular
                    ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200"
                    : "bg-white border-gray-200"
                } rounded-2xl border p-6 relative`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white px-4 py-1 rounded-full text-xs font-semibold">
                    Most Popular
                  </div>
                )}
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-600">{pkg.name}</div>
                  <div className="text-4xl font-bold text-gray-900 mt-2">{pkg.price}</div>
                  <div className="text-gray-600 text-sm">{pkg.unit}</div>
                </div>

                <p className="text-sm text-gray-600 mb-6">{pkg.description}</p>

                <ul className="space-y-2 mb-6">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {pkg.pricing && (
                  <p className="text-xs text-gray-600 mb-4 italic">{pkg.pricing}</p>
                )}

                <Link
                  href="/contractors/contact"
                  className={`block text-center px-6 py-3 rounded-xl font-semibold transition-colors ${
                    pkg.popular
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-gray-900 hover:bg-gray-800 text-white"
                  }`}
                >
                  {pkg.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Per-Permit Pricing */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pay-Per-Permit Pricing
            </h2>
            <p className="text-lg text-gray-600">
              Transparent pricing for individual permits
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              {permitPricing.map((permit) => (
                <div key={permit.type} className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <span className="text-gray-900 font-medium">{permit.type}</span>
                  <span className="text-emerald-600 font-bold">{permit.price}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 text-sm text-gray-600">
              <p>*Prices include application preparation, AI compliance review, submission, and basic status tracking. Jurisdiction fees not included.</p>
              <p className="mt-2">*Complex or commercial permits may require custom pricing. Contact us for a quote.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            First Permit Free for New Contractors
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Try our service risk-free. Submit your first permit and see how we handle everything.
          </p>
          <Link
            href="/contractors/contact"
            className="inline-flex items-center justify-center px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-lg font-semibold transition-colors"
          >
            Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
