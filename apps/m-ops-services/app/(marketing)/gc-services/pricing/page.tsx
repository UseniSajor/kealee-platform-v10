import { Metadata } from "next"
import Link from "next/link"
import { Button, Card, CardContent, Badge } from "@/components/ui"
import { CheckCircle2, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Pricing - Operations Services for GCs | Kealee",
  description: "Transparent pricing for operations support: $1,750-$16,500/month based on project volume. 14-day free trial. No setup fees.",
}

export default function GCPricingPage() {
  const packages = [
    {
      name: "Package A",
      label: "Solo GC",
      price: "$1,750",
      period: "/month",
      idealFor: "1-3 active projects • Solo operators • Residential focus",
      features: [
        "Permit + inspection tracking for up to 3 projects",
        "Client-ready weekly updates (email format)",
        "Vendor follow-ups and delivery coordination",
        "Basic document organization (POs, invoices)",
        "24-hour response time",
        "Email and phone support",
      ],
    },
    {
      name: "Package B",
      label: "Growing Team",
      price: "$3,750",
      period: "/month",
      idealFor: "3-8 active projects • Small teams • Commercial & residential",
      features: [
        "Multi-project coordination across all active jobs",
        "Weekly client reporting with action items + photos",
        "Full vendor and subcontractor coordination",
        "Complete document organization (POs, COs, receipts, lien waivers)",
        "Permit tracking and delivery follow-ups",
        "12-hour response time",
        "Dedicated ops coordinator",
      ],
      popular: true,
    },
    {
      name: "Package C",
      label: "Multiple Projects",
      price: "$9,500",
      period: "/month",
      idealFor: "8-15 active projects • Established firms • Multi-region",
      features: [
        "Enterprise-level multi-project operations coverage",
        "Proactive risk tracking (permits, inspections, delays)",
        "Executive weekly reporting with KPI dashboard",
        "Centralized vendor/sub communications",
        "Priority permit expediting when needed",
        "4-hour response time",
        "Shared dedicated ops manager",
        "Monthly strategic review calls",
      ],
    },
    {
      name: "Package D",
      label: "Enterprise GC",
      price: "$16,500",
      period: "/month",
      idealFor: "15+ projects • Multi-region operations • $20M+ annual revenue",
      features: [
        "Full operations department replacement",
        "Dedicated ops manager (your team)",
        "SLA-guaranteed response times",
        "Custom workflows and processes",
        "Standardized reporting across all projects",
        "Multi-region coordination",
        "Weekly executive briefings",
        "24/7 emergency support",
        "Integration with your systems",
      ],
    },
  ]

  const alaCarte = [
    { name: "Permit Application Assistance", price: "$325", unit: "per permit" },
    { name: "Inspection Scheduling", price: "$200", unit: "per inspection" },
    { name: "Weekly Client Report (one-time)", price: "$150", unit: "per report" },
    { name: "Document Organization (project)", price: "$400", unit: "per project" },
    { name: "Contractor Coordination (day)", price: "$500", unit: "per day" },
    { name: "Site Visit & Reporting", price: "$350", unit: "per visit" },
  ]

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Transparent Pricing for Operations Support
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Choose the package that matches your project volume. All packages include a 14-day free trial—no credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {packages.map((pkg) => (
              <Card
                key={pkg.name}
                className={`${
                  pkg.popular
                    ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200"
                    : "bg-white border-gray-200"
                } relative`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white">⭐ Most Popular - 14-Day Free Trial</Badge>
                  </div>
                )}
                <CardContent className="pt-8">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-600">{pkg.name}</div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">{pkg.label}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-gray-900">{pkg.price}</div>
                      <div className="text-gray-600">{pkg.period}</div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
                    <strong>Ideal for:</strong> {pkg.idealFor}
                  </p>

                  <ul className="space-y-3 mb-6">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
                        <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    className={`w-full ${
                      pkg.popular
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-900 hover:bg-gray-800"
                    } text-white rounded-xl h-12`}
                  >
                    <Link href="/gc-services/contact">
                      {pkg.popular ? "Start Free Trial" : "Get Started"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* À La Carte */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              À La Carte Services
            </h2>
            <p className="text-lg text-gray-600">
              Need help with specific tasks? Purchase services individually.
            </p>
          </div>

          <Card className="bg-white border-gray-200">
            <CardContent className="pt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {alaCarte.map((service) => (
                  <div key={service.name} className="flex items-start justify-between border-b border-gray-200 pb-4">
                    <div>
                      <div className="font-medium text-gray-900">{service.name}</div>
                      <div className="text-sm text-gray-600">{service.unit}</div>
                    </div>
                    <div className="text-xl font-bold text-blue-600">{service.price}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <Button
                  asChild
                  variant="outline"
                  className="border-2 border-gray-300 hover:border-blue-600 rounded-2xl"
                >
                  <Link href="/gc-services/contact">Request À La Carte Services</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Outsource Your Operations?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Start your free 14-day trial on Package B—no credit card required, cancel anytime.
          </p>
          <Button
            asChild
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 px-8"
          >
            <Link href="/gc-services/contact">Start Free Trial</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
