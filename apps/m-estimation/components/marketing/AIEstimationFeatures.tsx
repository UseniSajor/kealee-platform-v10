"use client"

import { Brain, TrendingUp, Lightbulb, Package, BarChart3, Shield } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "AI Scope Analysis",
    description:
      "Our AI reviews your project description and automatically identifies all required work items, potential gaps, and scope risks before you start estimating.",
  },
  {
    icon: TrendingUp,
    title: "Cost Prediction",
    description:
      "Machine learning models trained on thousands of construction projects predict costs with 95% accuracy, accounting for regional variations and market conditions.",
  },
  {
    icon: Lightbulb,
    title: "Value Engineering",
    description:
      "AI analyzes your estimate and suggests cost-saving alternatives without compromising quality. Identify materials, methods, and design changes that reduce costs.",
  },
  {
    icon: Package,
    title: "Smart Assemblies",
    description:
      "AI recommends pre-built cost assemblies based on your project type and scope. One click adds a complete wall system, foundation, or finish package to your estimate.",
  },
  {
    icon: BarChart3,
    title: "Benchmarking",
    description:
      "Compare your estimates against industry benchmarks and historical data. Know immediately if your numbers are competitive and where you might be over or under.",
  },
  {
    icon: Shield,
    title: "Compliance Check",
    description:
      "AI verifies your estimate includes all required items for code compliance, safety requirements, and jurisdictional regulations before you submit.",
  },
]

export function AIEstimationFeatures() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
          <Brain className="h-4 w-4" />
          <span>Powered by AI</span>
        </div>
        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
          AI That Understands Construction
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Our AI is trained on construction data, building codes, and thousands of real estimates. It does not just crunch numbers—it understands what your project needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <div
              key={feature.title}
              className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="bg-blue-100 rounded-xl w-14 h-14 flex items-center justify-center mb-4">
                <Icon className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
