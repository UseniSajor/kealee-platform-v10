import { Brain, Zap, FileCheck, AlertCircle, BarChart3, Clock } from "lucide-react"

export function AIPermitFeatures() {
  const aiFeatures = [
    {
      icon: Brain,
      title: "AI Compliance Engine",
      description: "Trained on 50,000+ permits to automatically check code compliance, zoning requirements, and common rejection reasons.",
    },
    {
      icon: Zap,
      title: "Smart Document Analysis",
      description: "Computer vision and NLP analyze your plans and documents to identify missing items, inconsistencies, and potential issues.",
    },
    {
      icon: FileCheck,
      title: "Automated Code Checking",
      description: "AI cross-references your project against local code requirements and flags violations before submission.",
    },
    {
      icon: AlertCircle,
      title: "Rejection Risk Scoring",
      description: "Machine learning predicts likelihood of rejection and provides specific recommendations to improve approval chances.",
    },
    {
      icon: BarChart3,
      title: "Jurisdiction Intelligence",
      description: "AI tracks approval patterns and reviewer preferences across jurisdictions to optimize your application strategy.",
    },
    {
      icon: Clock,
      title: "Timeline Prediction",
      description: "Predictive analytics estimate approval timelines based on jurisdiction workload, permit type, and historical data.",
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
          <Brain className="h-4 w-4" />
          <span>AI-Powered Permit Intelligence</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Why Our AI Catches What Others Miss
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Our permit AI is trained on thousands of applications, approvals, and rejections—learning what works in each jurisdiction.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aiFeatures.map((feature) => {
          const Icon = feature.icon
          return (
            <div key={feature.title} className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all">
              <div className="bg-emerald-100 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                <Icon className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-12 bg-emerald-50 border border-emerald-200 rounded-2xl p-8">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            60% Reduction in Application Rejections
          </h3>
          <p className="text-gray-700 max-w-2xl mx-auto">
            Our AI compliance engine has processed over 50,000 permit applications and learned from every rejection. It catches issues that even experienced contractors miss—saving you time and resubmittal fees.
          </p>
        </div>
      </div>
    </div>
  )
}
