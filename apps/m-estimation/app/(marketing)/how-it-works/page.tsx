import Link from "next/link"
import Image from "next/image"
import { Upload, Brain, UserCheck, FileCheck, CheckCircle2, Clock, Shield, Zap } from "lucide-react"

export const metadata = {
  title: "How It Works - Kealee Estimation",
  description: "Learn how Kealee Estimation combines AI and expert review to deliver accurate construction cost estimates in days, not weeks.",
}

const steps = [
  {
    step: 1,
    icon: Upload,
    title: "Submit Your Project",
    description: "Upload your construction plans, project description, or specifications. You can submit PDFs, images, CAD files, or simply describe your project in detail.",
    details: [
      "Drag and drop files or describe your project",
      "Specify project type, location, and timeline",
      "Include any special requirements or constraints",
      "No account needed for your first estimate",
    ],
  },
  {
    step: 2,
    icon: Brain,
    title: "AI Analysis",
    description: "Our AI reviews your submission and performs scope analysis, quantity extraction, and initial pricing. It identifies work items, suggests assemblies, and catches gaps in your scope.",
    details: [
      "AI identifies all required work items",
      "Quantities extracted from plans automatically",
      "Regional cost data applied to pricing",
      "Scope gaps and risks flagged for review",
    ],
  },
  {
    step: 3,
    icon: UserCheck,
    title: "Expert Review",
    description: "A construction estimator reviews the AI output for accuracy. They refine quantities, verify pricing, add professional judgment, and ensure completeness.",
    details: [
      "Experienced estimators review every project",
      "Quantities verified against plans",
      "Pricing checked against current market rates",
      "Scope validated for completeness",
    ],
  },
  {
    step: 4,
    icon: FileCheck,
    title: "Delivered Estimate",
    description: "Receive your completed estimate in a professional format, ready for bidding, budgeting, or decision-making. Available as PDF, Excel, or directly in the platform.",
    details: [
      "CSI MasterFormat organized",
      "Material, labor, and equipment breakdown",
      "Overhead, profit, and contingency included",
      "Export to PDF, Excel, or CSV",
    ],
  },
]

const timelines = [
  { service: "Quick Budget", time: "4-8 hours", description: "AI-powered budget range based on project description" },
  { service: "Conceptual Estimate", time: "1-2 days", description: "Preliminary estimate from basic drawings" },
  { service: "Detailed Estimate", time: "3-5 days", description: "Full line-item estimate from complete drawings" },
  { service: "Takeoff Services", time: "1-3 days", description: "Quantity extraction from construction plans" },
]

export default function HowItWorksPage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-16 lg:py-24 px-4 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1460472178825-e5240623afd5?w=1920&q=80&auto=format&fit=crop"
          alt="Construction measurement and planning tools"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              How It Works
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              AI does the heavy lifting. Experts ensure accuracy. You get estimates you can trust—delivered in days, not weeks.
            </p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {steps.map((step, idx) => {
              const Icon = step.icon
              return (
                <div key={step.step} className={`flex flex-col lg:flex-row gap-8 items-start ${idx % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                  <div className="lg:w-1/2">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0">
                        {step.step}
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">{step.title}</h2>
                    </div>
                    <p className="text-gray-600 mb-6">{step.description}</p>
                    <ul className="space-y-3">
                      {step.details.map((detail) => (
                        <li key={detail} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="lg:w-1/2">
                    <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 flex items-center justify-center min-h-[200px]">
                      <Icon className="h-24 w-24 text-blue-200" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">AI + Human Expertise</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We combine the speed and consistency of AI with the judgment and experience of professional estimators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
              <Zap className="h-10 w-10 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3x Faster</h3>
              <p className="text-gray-600">
                AI handles quantity extraction, pricing lookups, and initial calculations in minutes instead of hours.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
              <Shield className="h-10 w-10 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">95% Accurate</h3>
              <p className="text-gray-600">
                Expert review catches what AI misses. Every estimate is reviewed by a construction professional.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
              <Clock className="h-10 w-10 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Days Not Weeks</h3>
              <p className="text-gray-600">
                Most estimates delivered in 1-5 business days. Quick budgets available same day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timelines */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Delivery Timelines</h2>
            <p className="text-gray-600">How long each service takes from submission to delivery</p>
          </div>

          <div className="space-y-4">
            {timelines.map((item) => (
              <div key={item.service} className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{item.service}</h3>
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                </div>
                <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-semibold text-sm shrink-0 ml-4">
                  <Clock className="h-4 w-4" />
                  {item.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-8 opacity-95">
            Submit your project details and get your first estimate free.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 hover:bg-gray-100 rounded-2xl text-lg font-semibold transition-colors"
          >
            Submit Your Project
          </Link>
        </div>
      </section>
    </div>
  )
}
