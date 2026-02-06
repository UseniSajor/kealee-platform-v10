import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui"
import { CheckCircle2 } from "lucide-react"

export function ServiceTiers() {
  const tiers = [
    {
      name: "Tier 1",
      title: "Feasibility & Pre-Development Review",
      duration: "2–3 weeks",
      pricing: "$7,500–$15,000",
      description: "Rapid assessment to identify red flags and opportunities before you commit capital.",
      deliverables: [
        "Site & zoning analysis",
        "Entitlement pathway assessment",
        "Preliminary budget & schedule",
        "Risk & opportunity matrix",
        "Go/no-go recommendation",
        "Written feasibility report",
      ],
      badge: "Fast Turnaround",
      badgeColor: "bg-blue-100 text-blue-800",
    },
    {
      name: "Tier 2",
      title: "Owner's Rep / Development Management",
      duration: "Monthly retainer + milestones",
      pricing: "$5,000–$15,000/month",
      description: "Full owner's rep services from design through C of O. We become your development team.",
      deliverables: [
        "Design & consultant oversight",
        "Entitlement & permitting coordination",
        "Budget & schedule management",
        "GC procurement & bid analysis",
        "Construction oversight & quality control",
        "Change order review & negotiation",
        "Pay application review",
        "Monthly reporting & risk management",
        "Close-out & warranty coordination",
      ],
      badge: "Most Popular",
      badgeColor: "bg-orange-100 text-orange-800",
    },
    {
      name: "Tier 3",
      title: "Strategic Partner / Promote Participation",
      duration: "Project lifecycle",
      pricing: "Reduced retainer + 5–10% of sponsor promote",
      description: "For select engagements: we align our success with yours through equity participation.",
      deliverables: [
        "All Tier 2 services included",
        "Strategic capital stack review",
        "Exit strategy & value engineering",
        "Lender & investor coordination",
        "Promote participation in sponsor returns",
        "Fully aligned incentives",
      ],
      badge: "Select Projects",
      badgeColor: "bg-purple-100 text-purple-800",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {tiers.map((tier) => (
        <Card key={tier.name} className="bg-gray-50 border-gray-200 hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-gray-600">{tier.name}</p>
                <CardTitle className="text-xl mt-1">{tier.title}</CardTitle>
              </div>
              <Badge className={tier.badgeColor}>
                {tier.badge}
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">{tier.duration}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{tier.pricing}</p>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-6">{tier.description}</p>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-900">Deliverables:</p>
              <ul className="space-y-2">
                {tier.deliverables.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
