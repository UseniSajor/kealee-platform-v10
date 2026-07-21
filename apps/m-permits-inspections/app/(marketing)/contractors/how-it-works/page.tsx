import Link from "next/link"
import Image from "next/image"
import { CheckCircle2, FileCheck, Zap, Clock, AlertCircle, ArrowRight } from "lucide-react"

export const metadata = {
  title: "How It Works - Permit Services | Kealee",
  description: "Our 4-step process for handling permits from application to approval. See how we make permits simple for contractors.",
}

export default function PermitHowItWorksPage() {
  const steps = [
    {
      step: "01",
      icon: FileCheck,
      title: "Submit Your Permit Info",
      description: "Quick online form or email us your plans—we handle the rest",
      details: [
        "Fill out our simple permit request form (5 minutes)",
        "Upload plans, specs, and any supporting documents",
        "Or email everything to permits@kealee.com",
        "We confirm receipt within 2 hours",
      ],
    },
    {
      step: "02",
      icon: Zap,
      title: "AI Compliance Review",
      description: "Our AI checks your application before submission",
      details: [
        "Automated code compliance verification",
        "Common rejection issue identification",
        "Missing document flagging",
        "Compliance report delivered within 4 hours",
        "We fix any issues before submitting",
      ],
    },
    {
      step: "03",
      icon: Clock,
      title: "We Submit & Track",
      description: "We handle submission and proactive follow-up",
      details: [
        "Complete application preparation and submission",
        "Daily status tracking with jurisdiction",
        "Proactive follow-up to prevent delays",
        "You receive automated status updates",
        "Average 14-day approval time",
      ],
    },
    {
      step: "04",
      icon: CheckCircle2,
      title: "Approval & Inspections",
      description: "We coordinate inspections through final approval",
      details: [
        "Notify you immediately when permit is approved",
        "Schedule inspections when you're ready",
        "Reminder notifications 24 hours before",
        "Track inspection results and handle corrections",
        "Support through final approval",
      ],
    },
  ]

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=1920&q=80&auto=format&fit=crop"
          alt="Construction paperwork and blueprints"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/85" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              How It Works
            </h1>
            <p className="text-xl text-white/90 leading-relaxed">
              From application to approval in 4 simple steps. We handle the paperwork so you can build.
            </p>
          </div>
        </div>
      </section>

      {/* 4-Step Process */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {steps.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.step} className="bg-gray-50 border border-gray-200 rounded-2xl p-8">
                  <div className="flex items-start space-x-6">
                    <div className="text-6xl font-bold text-emerald-100">{item.step}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="bg-emerald-100 rounded-xl w-12 h-12 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-emerald-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">{item.title}</h3>
                      </div>
                      <p className="text-lg text-gray-600 mb-4">{item.description}</p>
                      <ul className="space-y-2">
                        {item.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start space-x-2 text-gray-700">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
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

      {/* What Makes Us Different */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Contractors Choose Kealee
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "AI Catches Issues Early",
                description: "Our AI reviews applications before submission and catches 95% of common rejection reasons—saving you time and resubmittal fees.",
              },
              {
                title: "Proactive Status Tracking",
                description: "We do not just submit and wait. We follow up daily with jurisdictions and keep you updated on progress.",
              },
              {
                title: "Contractor-Focused Service",
                description: "We understand contractor schedules and speak your language. No jargon, no runaround—just results.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Stop Wasting Time on Permits?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Submit your first permit free and see how simple permits can be.
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
