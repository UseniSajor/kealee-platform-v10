import { Card, CardContent } from "@ops/components/ui"
import { Brain, Zap, TrendingUp, AlertCircle, BarChart3, Clock } from "lucide-react"

export function AIFeaturesShowcase() {
  const aiFeatures = [
    {
      icon: Brain,
      title: "Smart Schedule Prediction",
      description: "AI analyzes historical project data to predict delays before they happen, giving you time to adjust.",
    },
    {
      icon: Zap,
      title: "Automated Risk Alerts",
      description: "Machine learning identifies patterns in permit delays, vendor issues, and inspection failures—alerting you to problems early.",
    },
    {
      icon: TrendingUp,
      title: "Intelligent Reporting",
      description: "AI-assisted report generation pulls data from multiple sources and formats it into professional client updates automatically.",
    },
    {
      icon: AlertCircle,
      title: "Proactive Issue Detection",
      description: "Natural language processing analyzes vendor communications and sub feedback to flag potential issues before they escalate.",
    },
    {
      icon: BarChart3,
      title: "Budget Variance Analysis",
      description: "AI compares your spending patterns against benchmarks and alerts you to budget concerns in real-time.",
    },
    {
      icon: Clock,
      title: "Smart Task Prioritization",
      description: "Machine learning prioritizes your daily operations tasks based on impact, urgency, and project interdependencies.",
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
          <Brain className="h-4 w-4" />
          <span>Powered by AI & Machine Learning</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          AI-Powered Operations Intelligence
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Our AI doesn't just track—it predicts, alerts, and recommends. Catch problems before they cost you money.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aiFeatures.map((feature) => {
          const Icon = feature.icon
          return (
            <Card key={feature.title} className="bg-white border-gray-200">
              <CardContent className="pt-6">
                <div className="bg-blue-100 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
