import Link from "next/link"
import Image from "next/image"
import { CheckCircle2, FileCheck, Clock, Zap, Shield, AlertCircle, ArrowRight } from "lucide-react"

export const metadata = {
  title: "Permit Services for Contractors | Kealee",
  description: "Complete permit management services: applications, AI compliance review, inspection coordination, and resubmittals. For GCs, subs, and specialty contractors.",
}

export default function PermitServicesPage() {
  const services = [
    {
      icon: FileCheck,
      title: "Permit Application Preparation & Submission",
      description: "We prepare complete, code-compliant permit applications and submit on your behalf.",
      details: [
        "Application form completion with all required fields",
        "Plan review and compliance verification",
        "Fee calculation and payment processing",
        "Electronic submission to jurisdiction",
        "Application tracking number and confirmation",
        "Zoning and variance submission coordination",
        "Historic review board submissions",
        "Subdivision and land use approvals",
      ],
    },
    {
      icon: Zap,
      title: "AI-Powered Compliance Pre-Review",
      description: "Advanced machine learning trained on thousands of permits analyzes your application to catch common issues and code violations before submission—reducing rejections by 60%.",
      details: [
        "AI code compliance checking (trained on 50,000+ permits)",
        "Automated plan review for common rejection reasons",
        "Smart document completeness verification",
        "Zoning and setback verification with GIS integration",
        "Pre-submission issue report with AI recommendations",
      ],
    },
    {
      icon: Clock,
      title: "Inspection Scheduling & Coordination",
      description: "We coordinate all inspections from rough-in through final, ensuring you're ready each time.",
      details: [
        "Inspection scheduling with jurisdiction",
        "Reminder notifications 24hrs before",
        "Site readiness checklist verification",
        "Inspector coordination and access",
        "Results tracking and correction coordination",
      ],
    },
    {
      icon: AlertCircle,
      title: "Resubmittal & Correction Management",
      description: "If corrections are needed, we handle resubmittals quickly to minimize schedule impact.",
      details: [
        "Correction list review and planning",
        "Updated plan preparation",
        "Resubmittal documentation and fees",
        "Follow-up with plan reviewer",
        "Approval tracking and notification",
      ],
    },
    {
      icon: Shield,
      title: "Multi-Jurisdiction Support",
      description: "We handle jurisdiction-specific requirements and process variations across all your work areas.",
      details: [
        "Jurisdiction-specific form knowledge",
        "Local code requirement expertise",
        "Established relationships with departments",
        "Process variation handling",
        "Regional compliance expertise",
      ],
    },
    {
      icon: Zap,
      title: "Expedited Processing (When Available)",
      description: "Need it fast? We offer expedited processing with faster review timelines when jurisdictions allow.",
      details: [
        "Expedited processing requests",
        "Priority review coordination",
        "Fast-track fee handling",
        "Rush inspection scheduling",
        "48-72 hour processing (when available)",
      ],
    },
  ]

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1920&q=80&auto=format&fit=crop"
          alt="Steel frame construction site"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/85" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Complete Permit Services for Contractors
            </h1>
            <p className="text-xl text-white/90 leading-relaxed">
              From application to approval, we handle every step of the permit process so you can focus on building.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service) => {
              const Icon = service.icon
              return (
                <div key={service.title} className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-emerald-100 rounded-xl w-12 h-12 flex items-center justify-center shrink-0">
                      <Icon className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {service.title}
                      </h3>
                      <p className="text-gray-600 mb-4">{service.description}</p>
                      <ul className="space-y-1">
                        {service.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contractor Types */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              We Serve All Contractor Types
            </h2>
            <p className="text-lg text-gray-600">
              Specialized permit knowledge for every trade
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              "General Contractors",
              "Electrical Contractors",
              "Plumbing Contractors",
              "HVAC Contractors",
              "Framing Contractors",
              "Roofing Contractors",
              "Solar Contractors",
              "Pool Contractors",
              "Landscaping Contractors",
              "Fencing Contractors",
              "Siding Contractors",
              "Foundation Contractors",
            ].map((type) => (
              <div key={type} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <p className="font-medium text-gray-900">{type}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Streamline Your Permit Process?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Submit your first permit free—see how we handle everything from application to approval.
          </p>
          <Link
            href="/permits/permits/contractors/contact"
            className="inline-flex items-center justify-center px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-lg font-semibold transition-colors"
          >
            Get Started <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
