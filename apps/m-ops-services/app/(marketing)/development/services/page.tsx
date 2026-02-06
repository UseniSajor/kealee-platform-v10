import { Metadata } from "next"
import Link from "next/link"
import { Button, Card, CardContent, Badge } from "@/components/ui"
import { ServiceTiers } from "@/components/development/ServiceTiers"
import { CheckCircle2, ArrowRight, TrendingUp, DollarSign, Landmark, Building2, Shield, FileCheck, Zap } from "lucide-react"

export const metadata: Metadata = {
  title: "Services - Owner's Rep & Development Advisory | Kealee Development",
  description: "Pre-development feasibility, full owner's representation, and strategic partnership services. C-PACE financing, historic tax credits, LIHTC, and incentive program coordination. Licensed GC with 350+ projects delivered.",
  keywords: "owner's representative, development advisory, C-PACE financing, historic tax credits, LIHTC, affordable housing, opportunity zones, new markets tax credits, owner's rep services",
}

export default function ServicesPage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Core Services
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Professional owner's representation and development advisory services designed to protect your capital and ensure successful project delivery—from rapid feasibility assessment to full lifecycle management.
            </p>
          </div>
        </div>
      </section>

      {/* Service Tiers */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ServiceTiers />
        </div>
      </section>

      {/* Detailed Tier Breakdown */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Tier 1 Details */}
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <Badge className="bg-blue-100 text-blue-800 text-base px-4 py-2">
                Tier 1
              </Badge>
              <h2 className="text-3xl font-bold text-gray-900">
                Feasibility & Pre-Development Review
              </h2>
            </div>
            <Card className="bg-white border-gray-200">
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">When to Use Tier 1</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Before capital is committed, we help owners determine what actually works. You're evaluating a potential acquisition or considering moving forward with a project and need an independent assessment before committing capital. This is your "second opinion" before you sign contracts or release earnest money.
                  </p>
                  <p className="text-gray-600 leading-relaxed mt-2">
                    <strong>Best for:</strong> Acquisitions, early design, investor diligence
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">What You Get</h3>
                  <ul className="space-y-2">
                    {[
                      "Zoning and entitlement path analysis",
                      "Constructability review and scope validation",
                      "Budget and schedule validation with AI-powered stress testing",
                      "Risk identification and mitigation planning",
                      "Opportunity identification: value engineering, alternate designs",
                      "Go/no-go recommendation with written feasibility report",
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-gray-700">
                        <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Timeline & Pricing</h3>
                  <p className="text-gray-600">
                    <strong>Duration:</strong> 2–3 weeks from kickoff<br />
                    <strong>Investment:</strong> $7,500–$15,000 (fixed fee, scaled to project complexity)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tier 2 Details */}
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <Badge className="bg-orange-100 text-orange-800 text-base px-4 py-2">
                Tier 2 - Most Popular
              </Badge>
              <h2 className="text-3xl font-bold text-gray-900">
                Owner's Rep / Development Management
              </h2>
            </div>
            <Card className="bg-white border-gray-200">
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">When to Use Tier 2</h3>
                  <p className="text-gray-600 leading-relaxed">
                    We manage the owner side of the project so nothing falls through the cracks. Your project is moving forward and you need experienced oversight from design through delivery. We act as your outsourced development department—coordinating all parties, protecting your budget, and ensuring quality execution.
                  </p>
                  <p className="text-gray-600 leading-relaxed mt-2">
                    <strong>Best for:</strong> Active developments, ground-up construction, and major renovations
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">What You Get</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Pre-Construction Phase</h4>
                      <ul className="space-y-1 text-sm text-gray-700">
                        <li className="flex items-start space-x-2">
                          <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                          <span>Architect and engineer coordination</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                          <span>Permitting and entitlement oversight</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                          <span>Budget development & validation</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                          <span>GC procurement, bid review, and contract structuring</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                          <span>Contract review & negotiation</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Construction Phase</h4>
                      <ul className="space-y-1 text-sm text-gray-700">
                        <li className="flex items-start space-x-2">
                          <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                          <span>Budget, schedule, pay app, and change-order control</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                          <span>Monthly reporting and risk management</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                          <span>Independent progress verification with automated alerts</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                          <span>Schedule and cost variance monitoring</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                          <span>Punch list, close-out, and C of O support</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Monthly Deliverables</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Comprehensive status report (budget, schedule, risks)</li>
                    <li>• Updated project budget with variance analysis</li>
                    <li>• Schedule dashboard with critical path updates</li>
                    <li>• Action items log and decision tracking</li>
                    <li>• Photo documentation and progress tracking</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Pricing Structure</h3>
                  <p className="text-gray-600">
                    <strong>Monthly Retainer:</strong> $5,000–$15,000/month (scaled to project size and complexity)<br />
                    <strong>Plus Milestone Fees:</strong> Pre-construction planning, GC bid, substantial completion milestones<br />
                    <strong>Typical Total:</strong> 1.5–3% of total construction budget over project lifecycle
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tier 3 Details */}
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <Badge className="bg-purple-100 text-purple-800 text-base px-4 py-2">
                Tier 3 - Select Projects
              </Badge>
              <h2 className="text-3xl font-bold text-gray-900">
                Strategic Partner / Promote Participation
              </h2>
            </div>
            <Card className="bg-white border-gray-200">
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">When to Use Tier 3</h3>
                  <p className="text-gray-600 leading-relaxed">
                    For select engagements where ownership wants to fully align incentives with their development partner. We reduce our retainer in exchange for participation in the sponsor promote—meaning our success is directly tied to yours.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">What You Get</h3>
                  <ul className="space-y-2">
                    {[
                      "All Tier 2 services included (full owner's rep coverage)",
                      "Strategic capital stack & exit strategy review",
                      "Lender & investor coordination and reporting",
                      "Value engineering focused on maximizing NOI and exit value",
                      "Promote participation: our upside tied to your upside",
                      "Enhanced alignment: we win when you win",
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-gray-700">
                        <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Pricing Structure</h3>
                  <p className="text-gray-600">
                    <strong>Reduced Monthly Retainer:</strong> 30–50% below Tier 2 rates<br />
                    <strong>Plus:</strong> 5–10% participation in sponsor promote (negotiated per project)<br />
                    <strong>Qualification:</strong> By invitation; typically $10M+ projects with clear value-add opportunity
                  </p>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> Tier 3 availability is limited to select engagements where we see meaningful upside potential and strong alignment with ownership. We evaluate each opportunity on a case-by-case basis.
                  </p>
                </div>
                
                <div className="mt-4 text-sm text-gray-600">
                  <p><strong>Independent, conflict-free owner advocacy.</strong> We don't sell materials, we don't bid your work, and we don't represent contractors. We represent you.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Specialized Capabilities */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Specialized Capabilities & Incentive Programs
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Beyond core owner's rep services, we coordinate specialized financing mechanisms, tax credit applications, and incentive programs to maximize your project economics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* C-PACE */}
            <Card className="bg-white border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3 mb-3">
                  <div className="bg-green-100 rounded-lg w-10 h-10 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">C-PACE Financing</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  Commercial Property Assessed Clean Energy (C-PACE) financing coordination for energy efficiency and renewable energy improvements.
                </p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>C-PACE application and lender coordination</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Energy audit and scope optimization</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Project documentation and compliance</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Historic Tax Credits */}
            <Card className="bg-white border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3 mb-3">
                  <div className="bg-purple-100 rounded-lg w-10 h-10 flex items-center justify-center shrink-0">
                    <Landmark className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Historic Tax Credits</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  Federal and state historic tax credit coordination for qualified rehabilitations and adaptive reuse projects.
                </p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Part 1, 2, 3 application coordination</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Secretary of Interior Standards compliance</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>State historic preservation office liaison</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Affordable Housing Tax Credits */}
            <Card className="bg-white border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3 mb-3">
                  <div className="bg-blue-100 rounded-lg w-10 h-10 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Affordable Housing Tax Credits (LIHTC)</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  Low-Income Housing Tax Credit program coordination for qualified affordable and workforce housing developments.
                </p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>LIHTC application and allocation coordination</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Compliance monitoring and documentation</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>State housing agency coordination</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* New Markets & Opportunity Zones */}
            <Card className="bg-white border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3 mb-3">
                  <div className="bg-orange-100 rounded-lg w-10 h-10 flex items-center justify-center shrink-0">
                    <DollarSign className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">New Markets & Opportunity Zones</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  New Markets Tax Credits (NMTC) and Qualified Opportunity Zone investment coordination for eligible projects.
                </p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>NMTC application and CDE coordination</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Opportunity Zone structuring and compliance</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>CDFI and impact investment coordination</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Additional Incentive Programs */}
            <Card className="bg-white border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3 mb-3">
                  <div className="bg-indigo-100 rounded-lg w-10 h-10 flex items-center justify-center shrink-0">
                    <FileCheck className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">State & Local Incentives</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  State and local incentive program coordination including TIF, abatements, and development grants.
                </p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>TIF district and tax increment financing</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Property tax abatements and exemptions</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Economic development grants and subsidies</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Energy & Sustainability */}
            <Card className="bg-white border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3 mb-3">
                  <div className="bg-emerald-100 rounded-lg w-10 h-10 flex items-center justify-center shrink-0">
                    <Zap className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Energy & Green Building Incentives</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  LEED, Energy Star, and utility rebate program coordination for sustainable development projects.
                </p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>LEED and green building certification</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Utility rebate and incentive applications</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Federal energy efficiency tax credits</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Shield className="h-5 w-5 text-orange-600 mr-2" />
                  Incentive Program Coordination
                </h3>
                <p className="text-gray-700 mb-4">
                  We don't prepare tax credit applications or provide legal/accounting advice—but we coordinate with your qualified professionals to ensure project delivery aligns with program requirements, deadlines, and compliance obligations.
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Our role:</strong> Project oversight ensuring construction, budget, and schedule meet program requirements • Coordination with tax credit consultants, attorneys, and accountants • Documentation and reporting support • Compliance tracking throughout construction
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Engagement CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Not Sure Which Tier Is Right for You?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Request a project review and we'll recommend the best service tier for your needs—with a transparent scope and fee proposal.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-2xl h-12 px-8"
            >
              <Link href="/development/contact">
                Request a Project Review
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-2 border-gray-300 hover:border-orange-600 rounded-2xl h-12 px-8"
            >
              <Link href="/development/how-it-works">
                See How We Work <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
