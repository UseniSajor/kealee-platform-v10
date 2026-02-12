import Link from "next/link"
import Image from "next/image"
import { Calculator, FileText, Target, TrendingUp, DollarSign, Package, CheckCircle2, ArrowRight, Clock, Brain } from "lucide-react"

export const metadata = {
  title: "Estimation Services - Kealee Estimation",
  description: "Construction estimation services including quick budgets, detailed estimates, takeoff services, value engineering, and bid support.",
}

const services = [
  {
    icon: Calculator,
    title: "Quick Budget Estimate",
    description: "Get a reliable cost range in hours. AI analyzes your project description, type, and location to generate a budget estimate with confidence ranges.",
    features: ["Same-day delivery", "AI-powered analysis", "Confidence ranges included", "Regional cost adjustments"],
    turnaround: "4-8 hours",
    best: "Early planning and feasibility",
  },
  {
    icon: FileText,
    title: "Conceptual Estimate",
    description: "A more refined estimate based on preliminary drawings or scope narratives. Includes major cost categories and order-of-magnitude pricing.",
    features: ["Based on preliminary drawings", "Major category breakdown", "Historical cost comparisons", "Risk assessment included"],
    turnaround: "1-2 business days",
    best: "Design development phase",
  },
  {
    icon: Target,
    title: "Detailed Estimate",
    description: "Line-by-line CSI-formatted estimate with full material, labor, and equipment breakdowns. Built from complete drawings and specifications.",
    features: ["CSI MasterFormat organized", "Material/labor/equipment splits", "Subcontractor scoping", "Markup and contingency analysis"],
    turnaround: "3-5 business days",
    best: "Bidding and budgeting",
  },
  {
    icon: TrendingUp,
    title: "Value Engineering",
    description: "AI and expert review of your estimate to find cost savings without sacrificing quality. Includes alternative materials, methods, and design suggestions.",
    features: ["AI-powered alternatives", "10-25% typical savings", "Quality impact analysis", "Implementation roadmap"],
    turnaround: "2-3 business days",
    best: "Cost reduction",
  },
  {
    icon: DollarSign,
    title: "Bid Preparation",
    description: "Complete bid packages with competitive pricing, scope narratives, exclusions, and professional formatting ready for submission.",
    features: ["Competitive pricing", "Scope narratives", "Exclusions and clarifications", "Professional formatting"],
    turnaround: "2-5 business days",
    best: "Competitive bidding",
  },
  {
    icon: Package,
    title: "Takeoff Services",
    description: "AI-assisted quantity extraction from construction plans. Upload PDFs or CAD files and receive organized quantity reports by CSI division.",
    features: ["AI quantity extraction", "Multiple file formats", "CSI-organized output", "Measurement verification"],
    turnaround: "1-3 business days",
    best: "Quantity surveys",
  },
]

const processSteps = [
  { step: 1, title: "Submit Project Info", description: "Upload plans, descriptions, or specifications. Tell us what you need.", icon: FileText },
  { step: 2, title: "AI Analysis", description: "Our AI reviews your project, identifies scope, and generates initial pricing.", icon: Brain },
  { step: 3, title: "Expert Review", description: "A construction estimator reviews and refines the AI output for accuracy.", icon: CheckCircle2 },
  { step: 4, title: "Delivered Estimate", description: "Receive your completed estimate in your preferred format, ready to use.", icon: ArrowRight },
]

export default function ServicesPage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-16 lg:py-24 px-4 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1920&q=80&auto=format&fit=crop"
          alt="Construction blueprints and architectural plans"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Estimation Services
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              From quick budgets to detailed bid-ready estimates, we provide the right level of detail for every stage of your project.
            </p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {services.map((service, idx) => {
              const Icon = service.icon
              return (
                <div key={service.title} className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="bg-blue-100 rounded-xl w-14 h-14 flex items-center justify-center shrink-0">
                          <Icon className="h-7 w-7 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">{service.title}</h2>
                      </div>
                      <p className="text-gray-600 mb-6">{service.description}</p>
                      <div className="grid grid-cols-2 gap-3">
                        {service.features.map((feature) => (
                          <div key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                            <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Turnaround</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <p className="font-semibold text-gray-900">{service.turnaround}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Best For</p>
                        <p className="font-semibold text-gray-900 mt-1">{service.best}</p>
                      </div>
                      <Link
                        href="/contact"
                        className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
                      >
                        Request This Service
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From submission to delivery in four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {processSteps.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.step} className="text-center">
                  <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Not Sure Which Service You Need?</h2>
          <p className="text-lg mb-8 opacity-95">
            Tell us about your project and we will recommend the right estimation service for your needs.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 hover:bg-gray-100 rounded-2xl text-lg font-semibold transition-colors"
          >
            Get a Recommendation
          </Link>
        </div>
      </section>
    </div>
  )
}
