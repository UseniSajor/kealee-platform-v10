import { Card, CardContent } from "@ops/components/ui"
import { ClipboardCheck, Users, BarChart3, CheckCircle } from "lucide-react"

export function ProcessSteps() {
  const steps = [
    {
      number: "01",
      icon: ClipboardCheck,
      title: "Initial Assessment",
      description: "We review your project scope, budget, schedule, and current team to identify gaps and risks.",
    },
    {
      number: "02",
      icon: Users,
      title: "Team Coordination",
      description: "We integrate with your existing architect, engineers, and contractors—coordinating all parties toward shared goals.",
    },
    {
      number: "03",
      icon: BarChart3,
      title: "Ongoing Oversight",
      description: "Weekly reporting, budget tracking, schedule updates, and proactive problem-solving throughout the project lifecycle.",
    },
    {
      number: "04",
      icon: CheckCircle,
      title: "Successful Delivery",
      description: "We stay through close-out, final inspections, warranty coordination, and Certificate of Occupancy.",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {steps.map((step) => {
        const Icon = step.icon
        return (
          <Card key={step.number} className="bg-white border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 text-[120px] font-bold text-gray-50 leading-none -mr-4 -mt-8">
              {step.number}
            </div>
            <CardContent className="pt-6 relative z-10">
              <div className="bg-orange-100 rounded-xl w-14 h-14 flex items-center justify-center mb-4">
                <Icon className="h-7 w-7 text-orange-600" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600 text-sm">{step.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
