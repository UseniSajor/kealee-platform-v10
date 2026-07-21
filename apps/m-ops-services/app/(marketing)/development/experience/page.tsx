import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Button, Card, CardContent, Badge } from "@/components/ui"
import {
  Building2,
  HardHat,
  FileCheck,
  Wrench,
  CheckCircle2,
  Zap,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Experience - 350+ Projects Delivered | Kealee Development",
  description: "Licensed general contractor with 20+ years of hands-on experience. 350+ projects delivered across residential, multifamily, mixed-use, and complex renovations nationwide.",
}

export default function ExperiencePage() {
  const capabilities = [
    {
      icon: Building2,
      title: "Budget & Schedule Management",
      description: "Proven ability to deliver projects on budget and on time through proactive risk management and disciplined oversight.",
    },
    {
      icon: FileCheck,
      title: "Entitlements & Permitting",
      description: "Successfully navigated complex entitlement processes across multiple jurisdictions, from rezoning to variance approvals.",
    },
    {
      icon: Wrench,
      title: "MEP & Utilities",
      description: "Deep technical knowledge of mechanical, electrical, plumbing, and site utilities—often the most complex and costly elements.",
    },
    {
      icon: HardHat,
      title: "General Contractor Oversight",
      description: "Licensed GC with field experience ensures thorough understanding of construction means, methods, and quality control.",
    },
  ]

  const caseSnapshots = [
    {
      badge: "Multifamily",
      badgeColor: "bg-blue-100 text-blue-800",
      title: "124-Unit Garden-Style Apartments",
      location: "Southeast U.S.",
      challenge: "Project stalled with $800K in disputed change orders, 6 months behind schedule, and deteriorating GC relationship.",
      solution: [
        "Conducted forensic review of all change orders and contracts",
        "Negotiated settlement reducing disputed amounts by 65%",
        "Restructured schedule with weekly accountability meetings",
        "Implemented tighter pay app controls and quality inspections",
      ],
      result: "Delivered 3 months early (vs. revised schedule), saved $1.2M in total costs, maintained tenant lease-up schedule.",
    },
    {
      badge: "Mixed-Use",
      badgeColor: "bg-green-100 text-green-800",
      title: "32-Unit Mixed-Use Development",
      location: "Mountain West",
      challenge: "Ground-up development requiring complex entitlements, design coordination between residential and retail, and first-time developer client.",
      solution: [
        "Led entitlement process through city planning and design review boards",
        "Coordinated architect, civil, structural, and MEP consultants",
        "Managed GC procurement with detailed bid leveling",
        "Provided monthly reporting to lender and investor partners",
      ],
      result: "Entitled in 14 months, delivered on budget with zero overruns, achieved 95% occupancy within 6 months of C of O.",
    },
    {
      badge: "Townhomes",
      badgeColor: "bg-purple-100 text-purple-800",
      title: "18-Unit Luxury Townhomes",
      location: "Pacific Northwest",
      challenge: "Pre-acquisition feasibility for high-net-worth client evaluating infill site with challenging topography and aggressive pro forma.",
      solution: [
        "Rapid 2-week feasibility assessment including site visit",
        "Identified $450K in soft cost savings through streamlined approvals approach",
        "Recommended alternate MEP routing reducing site work by 30%",
        "Value-engineered building envelope for better cost/performance",
      ],
      result: "Client moved forward with acquisition, incorporated all recommendations, project currently in permitting ahead of schedule.",
    },
    {
      badge: "Renovation",
      badgeColor: "bg-orange-100 text-orange-800",
      title: "48-Unit Adaptive Reuse",
      location: "Mid-Atlantic",
      challenge: "Historic building conversion with unknown conditions, aggressive timeline, and fixed exit cap rate requirement.",
      solution: [
        "Coordinated phased investigation to uncover hidden conditions early",
        "Negotiated time-and-materials allowances into GC contract",
        "Managed historic tax credit compliance and state agency coordination",
        "Implemented weekly cost tracking with 2-week look-ahead forecasts",
      ],
      result: "Completed renovation within 5% of budget despite significant unforeseen conditions, achieved targeted NOI and exit valuation.",
    },
  ]

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-16 lg:py-24">
        <Image src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80&auto=format&fit=crop" alt="City skyline" fill className="object-cover" sizes="100vw" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-6 bg-orange-100 text-orange-800 px-4 py-2 text-sm font-medium">
              Licensed General Contractor
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Why Kealee Development
            </h1>
            <p className="text-xl text-white/80 leading-relaxed">
              Led by a licensed general contractor and developer with 20+ years of hands-on delivery experience. <strong>350+ projects delivered</strong> spanning residential, multifamily, mixed-use, single-family, townhomes, complex renovations, and MEP/utilities-heavy scopes.
            </p>
            <p className="text-lg text-white/80 leading-relaxed mt-4">
              <strong>Independent, conflict-free owner advocacy.</strong> Senior leadership without full-time overhead.
            </p>
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Core Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {capabilities.map((capability) => {
              const Icon = capability.icon
              return (
                <Card key={capability.title} className="bg-gray-50 border-gray-200">
                  <CardContent className="pt-6">
                    <div className="bg-orange-100 rounded-xl w-14 h-14 flex items-center justify-center mb-4">
                      <Icon className="h-7 w-7 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {capability.title}
                    </h3>
                    <p className="text-sm text-gray-600">{capability.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Industry Experience */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Industries & Asset Types
          </h2>
          <Card className="bg-white border-gray-200">
            <CardContent className="pt-8 pb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Zap className="h-5 w-5 text-orange-600 mr-2" />
                    Residential Development
                  </h3>
                  <ul className="space-y-2 text-gray-700 ml-7">
                    <li>• Multifamily (garden-style, mid-rise, podium)</li>
                    <li>• Mixed-use (residential + retail/office)</li>
                    <li>• Townhomes and attached products</li>
                    <li>• Single-family development (10+ lots)</li>
                    <li>• Senior housing and workforce housing</li>
                    <li>• Adaptive reuse and historic renovations</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Zap className="h-5 w-5 text-orange-600 mr-2" />
                    Commercial & Industrial
                  </h3>
                  <ul className="space-y-2 text-gray-700 ml-7">
                    <li>• Office and flex/creative office</li>
                    <li>• Retail and restaurant build-outs</li>
                    <li>• Warehouse and light industrial</li>
                    <li>• Medical office and outpatient facilities</li>
                    <li>• Hospitality (select projects)</li>
                    <li>• Ground-up and tenant improvements</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Note:</strong> We do not exclude any real estate asset type. If your project is complex, high-stakes, and requires experienced oversight, we can help.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Case Snapshots */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Project Case Snapshots
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Real projects, real challenges, real results across multiple asset types and scenarios.
            </p>
          </div>

          <div className="space-y-8">
            {caseSnapshots.map((snapshot, index) => (
              <Card key={index} className="bg-gray-50 border-gray-200">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Badge className={`${snapshot.badgeColor} mb-2`}>
                            {snapshot.badge}
                          </Badge>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {snapshot.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{snapshot.location}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Challenge</h4>
                          <p className="text-gray-700">{snapshot.challenge}</p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Solution</h4>
                          <ul className="space-y-1">
                            {snapshot.solution.map((item, idx) => (
                              <li key={idx} className="flex items-start space-x-2 text-gray-700 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-1">Result</h4>
                          <p className="text-sm text-gray-700">{snapshot.result}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Qualifications */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Professional Background
          </h2>
          <Card className="bg-white border-gray-200">
            <CardContent className="pt-8 pb-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-6 w-6 text-orange-600 mt-1 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Licensed General Contractor</h3>
                    <p className="text-gray-600">
                      Active general contractor's license with hands-on field experience. Understands construction means, methods, and quality control from the ground up.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-6 w-6 text-orange-600 mt-1 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">350+ Projects Delivered Over 20+ Years</h3>
                    <p className="text-gray-600">
                      Two decades of project delivery across residential, multifamily, commercial, and mixed-use asset types. From $500K renovations to $50M+ ground-up developments.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-6 w-6 text-orange-600 mt-1 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Developer & Owner's Rep Experience</h3>
                    <p className="text-gray-600">
                      Experience on both sides of the table: as a developer managing capital and as an owner's rep protecting client interests. Understands ownership's perspective on risk and return. Coordinates design professionals and legal counsel when required.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-6 w-6 text-orange-600 mt-1 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Deep MEP, HVAC, and Utilities Expertise</h3>
                    <p className="text-gray-600">
                      Deep expertise in mechanical, electrical, plumbing, HVAC, and site utilities—the areas where cost overruns and delays most often occur. Can review shop drawings and coordinate complex systems.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-6 w-6 text-orange-600 mt-1 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Entitlements & Permitting</h3>
                    <p className="text-gray-600">
                      Successfully navigated entitlement processes in multiple states and jurisdictions, from straightforward permits to complex rezoning and variance approvals.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Put Our Experience to Work for Your Project
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Request a project review and we'll discuss how our experience applies to your specific situation and challenges.
          </p>
          <Button
            asChild
            className="bg-orange-600 hover:bg-orange-700 text-white rounded-2xl h-12 px-8"
          >
            <Link href="/development/contact">Request a Project Review</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
