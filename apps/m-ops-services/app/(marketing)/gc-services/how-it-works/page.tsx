import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { CheckCircle2, Clock, Users, FileText, TrendingUp } from "lucide-react"

export const metadata: Metadata = {
  title: "How It Works - GC Operations Services | Kealee",
  description: "Our proven 4-step process for providing operations support to general contractors. From onboarding to daily execution.",
}

export default function GCHowItWorksPage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-16 lg:py-24">
        <Image src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1920&q=80&auto=format&fit=crop" alt="Steel frame construction" fill className="object-cover" sizes="100vw" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              How It Works
            </h1>
            <p className="text-xl text-white/80 leading-relaxed">
              We integrate with your business in 4 simple steps—then handle your operations while you focus on building.
            </p>
          </div>
        </div>
      </section>

      {/* 4-Step Process */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {[
              {
                step: "01",
                icon: Users,
                title: "Onboarding (Week 1)",
                description: "We learn your business, systems, and communication style",
                details: [
                  "Understand your current projects and pain points",
                  "Connect to your systems (project management, email, etc.)",
                  "Meet your team, subs, and key vendors",
                  "Set up communication protocols and reporting preferences",
                ],
              },
              {
                step: "02",
                icon: FileText,
                title: "Transition (Week 2)",
                description: "We take over operations tasks and establish workflows",
                details: [
                  "Catalog all active permits and inspections",
                  "Organize existing project documentation",
                  "Establish vendor/sub communication channels",
                  "Set up weekly reporting cadence",
                ],
              },
              {
                step: "03",
                icon: TrendingUp,
                title: "Daily Execution (Ongoing)",
                description: "We handle your operations so you can focus on building",
                details: [
                  "Track permits and coordinate inspections daily",
                  "Follow up with vendors on deliveries and subs on schedules",
                  "Organize documents (POs, invoices, lien waivers) as they arrive",
                  "Monitor project progress and flag issues proactively",
                ],
              },
              {
                step: "04",
                icon: Clock,
                title: "Weekly Reporting (Every Monday)",
                description: "Professional updates delivered to you and your clients",
                details: [
                  "Client-ready weekly reports sent by 8am Monday",
                  "Status updates on all permits, inspections, and deliveries",
                  "Action items list for upcoming week",
                  "Risk alerts and recommendations",
                ],
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Card key={item.step} className="bg-gray-50 border-gray-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-6">
                      <div className="text-6xl font-bold text-blue-100">{item.step}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="bg-blue-100 rounded-xl w-12 h-12 flex items-center justify-center">
                            <Icon className="h-6 w-6 text-blue-600" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900">{item.title}</h3>
                        </div>
                        <p className="text-lg text-gray-600 mb-4">{item.description}</p>
                        <ul className="space-y-2">
                          {item.details.map((detail, idx) => (
                            <li key={idx} className="flex items-start space-x-2 text-gray-700">
                              <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* What You Get Weekly */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What You Get Every Week
            </h2>
            <p className="text-lg text-gray-600">
              Consistent, professional operations support delivered weekly
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle>For Your Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <span>Professional progress report (delivered Monday 8am)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <span>Progress photos with annotations</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <span>Schedule updates and upcoming milestones</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <span>Any issues or decisions needed</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle>For You (Internal)</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <span>Permit status and inspection schedule</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <span>Vendor delivery tracking and follow-ups</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <span>Sub coordination and accountability</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <span>Document organization (current week)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <span>Risk alerts and recommended actions</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Get Your Operations Under Control?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Start your free trial and see how much time you get back in the first week.
          </p>
          <Button
            asChild
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 px-8"
          >
            <Link href="/gc-services/contact">Start Free Trial</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
