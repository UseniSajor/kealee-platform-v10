import Link from "next/link"
import { AIPermitFeatures } from "@/components/permits/AIPermitFeatures"
import { CheckCircle2, Zap, Shield, Clock, FileCheck, AlertCircle } from "lucide-react"

export const metadata = {
  title: "Kealee Permits - Professional Permit Services for Everyone",
  description: "Stop chasing permits. We handle applications, inspections, and resubmittals for contractors, developers, and property owners. AI-powered compliance, 40% faster approvals.",
  keywords: "permit services, building permits, inspection coordination, permit expediting, contractor permits, developer permits, property owner permits",
}

export default function ContractorsHomePage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-gradient-to-b from-emerald-50 to-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              <span>Permits Approved 40% Faster with AI Review</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Stop Chasing Permits. Start Building.
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Professional permit and inspection services for contractors, developers, and property owners. AI-powered compliance review, automated tracking, and expert coordination—we handle the paperwork so you can focus on your project.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/contractors/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-lg font-semibold transition-colors shadow-lg"
              >
                Submit Your First Permit Free
              </Link>
              <Link
                href="/contractors/pricing"
                className="inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-gray-300 hover:border-emerald-600 text-gray-900 rounded-2xl text-lg font-semibold transition-colors"
              >
                View Pricing
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>First Permit Free</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>AI Compliance Check</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>Average 14-Day Approval</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Contractor Permit Problems (Solved)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                problem: "Permit applications keep getting rejected?",
                solution: "Our AI pre-reviews your application and catches common code violations before submission—reducing rejections by 60%.",
              },
              {
                problem: "Spending hours tracking permit status?",
                solution: "We track every application and proactively follow up with jurisdictions so you know exactly where things stand.",
              },
              {
                problem: "Missing inspections or failing due to paperwork?",
                solution: "We coordinate inspections, ensure you're ready, and handle resubmittals so you never fail due to missed documentation.",
              },
              {
                problem: "Working across multiple jurisdictions?",
                solution: "We handle jurisdiction-specific requirements and process variations so you don't have to learn every city's rules.",
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {item.problem}
                </h3>
                <p className="text-gray-600">{item.solution}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features */}
      <section className="py-20 bg-gray-50">
        <AIPermitFeatures />
      </section>

      {/* Services */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              What We Handle For You
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: FileCheck,
                title: "Permit Applications",
                description: "We prep, review, and submit your permits with AI-powered compliance checking.",
              },
              {
                icon: Clock,
                title: "Inspection Coordination",
                description: "We schedule inspections, ensure you're ready, and track results through to approval.",
              },
              {
                icon: AlertCircle,
                title: "Resubmittal Management",
                description: "If corrections are needed, we handle resubmittals quickly to keep you on schedule.",
              },
              {
                icon: Shield,
                title: "Multi-Jurisdiction Support",
                description: "We know the rules in every jurisdiction and handle jurisdiction-specific requirements.",
              },
              {
                icon: Zap,
                title: "Expedited Processing",
                description: "Need it fast? We offer expedited processing with guaranteed review timelines.",
              },
              {
                icon: CheckCircle2,
                title: "Compliance Tracking",
                description: "We track permits through final approval and ensure all conditions are met.",
              },
            ].map((service) => {
              const Icon = service.icon
              return (
                <div key={service.title} className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="bg-emerald-100 rounded-xl w-14 h-14 flex items-center justify-center mb-4">
                    <Icon className="h-7 w-7 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {service.title}
                  </h3>
                  <p className="text-gray-600">{service.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Who We Serve */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Permit Services for Everyone
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Whether you're a contractor, developer, or property owner—we handle permits for all project types and sizes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-emerald-50 rounded-2xl p-8 border border-emerald-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Contractors</h3>
              <p className="text-gray-600 mb-4">
                General contractors, subcontractors, and specialty trades—we handle your permits so you can focus on building.
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Building permits</li>
                <li>• Trade-specific permits</li>
                <li>• Multi-jurisdiction coordination</li>
                <li>• Volume discounts available</li>
              </ul>
            </div>

            <div className="bg-blue-50 rounded-2xl p-8 border border-blue-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Developers</h3>
              <p className="text-gray-600 mb-4">
                From small projects to large developments—we coordinate all permit requirements and keep your project on schedule.
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Multi-permit coordination</li>
                <li>• Entitlement support</li>
                <li>• Expedited processing</li>
                <li>• Project-level tracking</li>
              </ul>
            </div>

            <div className="bg-orange-50 rounded-2xl p-8 border border-orange-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Property Owners</h3>
              <p className="text-gray-600 mb-4">
                Renovating, adding on, or building new? We make the permit process simple for homeowners and property owners.
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Residential permits</li>
                <li>• Addition/remodel permits</li>
                <li>• Simple online process</li>
                <li>• Plain-language guidance</li>
              </ul>
            </div>
          </div>

          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Permit Types We Handle
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              "Building Permits",
              "Electrical Permits",
              "Plumbing Permits",
              "HVAC/Mechanical",
              "Roofing Permits",
              "Solar/PV Permits",
              "Pool/Spa Permits",
              "Fencing Permits",
              "Demolition Permits",
              "Occupancy Permits",
              "Sign Permits",
              "Grading Permits",
              "Foundation Permits",
              "Framing Permits",
              "Site Development",
              "And More...",
            ].map((type) => (
              <div key={type} className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                <p className="font-medium text-gray-900 text-sm">{type}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to Stop Chasing Permits?
          </h2>
          <p className="text-xl mb-8 opacity-95">
            Submit your first permit free. See how we handle everything from application to approval.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contractors/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-emerald-600 hover:bg-gray-100 rounded-2xl text-lg font-semibold transition-colors"
            >
              Get Started Free
            </Link>
            <a
              href="mailto:getstarted@kealee.com"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white hover:bg-white/10 rounded-2xl text-lg font-semibold transition-colors"
            >
              Email Us
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
