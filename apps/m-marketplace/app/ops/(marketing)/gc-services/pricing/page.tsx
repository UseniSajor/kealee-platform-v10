import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Button, Card, CardContent, Badge } from "@ops/components/ui"
import { CheckCircle2, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Pricing - Operations Services for GCs | Kealee",
  description: "Clear pricing for operations support: $1,750-$16,500/month based on project volume. 14-day free trial. No setup fees.",
}

export default function GCPricingPage() {
  const packages = [
    {
      name: "Package A",
      label: "Solo GC",
      price: "$1,750",
      period: "/month",
      annualPrice: "$1,400",
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
      annualPrice: "$3,000",
      idealFor: "Up to 5 active projects • Small teams • Commercial & residential",
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
      annualPrice: "$7,600",
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
      annualPrice: "$13,200",
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

  const individualServices = [
    { 
      name: "Permit Application Assistance", 
      price: "$325", 
      unit: "per permit",
      description: "Complete permit application preparation, review, and submission to jurisdiction. Includes tracking until approval.",
      features: ["Application form completion", "Document checklist", "Fee calculation", "Submission coordination", "Status tracking"]
    },
    { 
      name: "Inspection Scheduling & Coordination", 
      price: "$200", 
      unit: "per inspection",
      description: "Schedule inspections with jurisdiction, send reminders, coordinate access, and track results.",
      features: ["Schedule with jurisdiction", "24hr reminder notifications", "Inspector coordination", "Results tracking", "Re-inspection if needed"]
    },
    { 
      name: "Weekly Client Report", 
      price: "$150", 
      unit: "per report",
      description: "Professional client-ready progress report with photos, schedule updates, and action items.",
      features: ["Progress summary", "Photo documentation", "Schedule status", "Action items", "Professional formatting"]
    },
    { 
      name: "Document Organization", 
      price: "$400", 
      unit: "per project",
      description: "Full project documentation organization including POs, invoices, change orders, lien waivers, and receipts.",
      features: ["Folder structure setup", "Document cataloging", "Digital organization", "Easy retrieval system", "Ongoing maintenance"]
    },
    { 
      name: "Vendor & Sub Coordination", 
      price: "$500", 
      unit: "per day",
      description: "Daily vendor delivery and subcontractor coordination to keep your project on schedule.",
      features: ["Delivery tracking", "Sub scheduling", "Follow-up calls", "Schedule coordination", "Issue resolution"]
    },
    { 
      name: "Site Visit & Progress Report", 
      price: "$350", 
      unit: "per visit",
      description: "On-site visit with comprehensive photo documentation and written progress report.",
      features: ["Site walkthrough", "Progress photos", "Quality observations", "Written report", "Action item list"]
    },
    { 
      name: "Change Order Review & Documentation", 
      price: "$250", 
      unit: "per change order",
      description: "Review change order requests, verify scope and pricing, and document for client approval.",
      features: ["Scope verification", "Cost analysis", "Pricing review", "Documentation", "Client presentation"]
    },
    { 
      name: "Budget Tracking & Analysis", 
      price: "$450", 
      unit: "per project/month",
      description: "Monthly budget tracking with variance analysis and cost-to-complete projections.",
      features: ["Budget vs actual tracking", "Variance analysis", "Cost projections", "Monthly report", "Alert notifications"]
    },
    { 
      name: "RFI Management", 
      price: "$75", 
      unit: "per RFI",
      description: "Log, track, and coordinate responses to Requests for Information from subs and vendors.",
      features: ["RFI logging", "Response tracking", "Distribution to parties", "Resolution documentation", "Archive management"]
    },
    { 
      name: "Submittal Tracking", 
      price: "$100", 
      unit: "per submittal",
      description: "Track shop drawings, product submittals, and samples through the approval process.",
      features: ["Submittal logging", "Approval tracking", "Architect coordination", "Status updates", "Approved document filing"]
    },
    { 
      name: "Schedule Management", 
      price: "$600", 
      unit: "per project/month",
      description: "Monthly schedule updates with critical path analysis and milestone tracking.",
      features: ["Schedule updates", "Critical path tracking", "Milestone monitoring", "Delay alerts", "Recovery planning"]
    },
    { 
      name: "Safety Documentation Management", 
      price: "$300", 
      unit: "per project/month",
      description: "Manage safety documentation, toolbox talks, and OSHA compliance records.",
      features: ["Safety doc organization", "Toolbox talk tracking", "OSHA logs", "Incident reporting", "Compliance verification"]
    },
  ]

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-16 lg:py-24">
        <Image src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1920&q=80&auto=format&fit=crop" alt="Construction workers on site" fill className="object-cover" sizes="100vw" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Clear Pricing for Operations Support
            </h1>
            <p className="text-xl text-white/80 leading-relaxed">
              Choose the package that matches your project volume. All packages include a 14-day free trial—no credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Operations Packages
            </h2>
            <p className="text-lg text-gray-600">
              Comprehensive operations support with predictable monthly pricing.
              <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-700 text-sm rounded-full font-medium">
                Save 20% with annual billing
              </span>
            </p>
          </div>
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
                      {pkg.annualPrice && (
                        <div className="text-sm text-green-600 font-medium mt-1">
                          {pkg.annualPrice}/mo billed annually
                        </div>
                      )}
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
                    <Link href="/ops/gc-services/contact">
                      {pkg.popular ? "Start Free Trial" : "Get Started"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Individual Services */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Individual Services for GCs & Builders
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Need help with specific tasks or individual projects? Purchase professional services individually without a monthly commitment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {individualServices.map((service) => (
              <Card key={service.name} className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-4">
                      {service.name}
                    </h3>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-bold text-blue-600">{service.price}</div>
                      <div className="text-xs text-gray-600">{service.unit}</div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    {service.description}
                  </p>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-xs font-medium text-gray-700 mb-2">Includes:</p>
                    <ul className="space-y-1">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start space-x-2 text-xs text-gray-600">
                          <CheckCircle2 className="h-3 w-3 text-blue-600 mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 max-w-3xl mx-auto mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Bundle & Save
              </h3>
              <p className="text-gray-700">
                Purchasing multiple services regularly? Our monthly packages (Package A-D above) provide better value and guaranteed availability. <Link href="#packages" className="text-blue-600 hover:underline font-medium">Compare packages</Link>
              </p>
            </div>
            <Button
              asChild
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 px-8"
            >
              <Link href="/ops/gc-services/contact">Request Individual Services</Link>
            </Button>
          </div>
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
            <Link href="/ops/gc-services/contact">Start Free Trial</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
