import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Button, Card, CardContent, CardHeader, CardTitle, Separator } from "@/components/ui"
import { ProcessSteps } from "@/components/development/ProcessSteps"
import {
  Calendar,
  FileText,
  MessageSquare,
  TrendingUp,
  Shield,
  CheckCircle2,
  Camera,
  DollarSign,
  FileCheck,
  AlertCircle,
  Users,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Our Process - How We Work | Kealee Development",
  description: "Four-step owner's representation process: Initial assessment, team coordination, ongoing oversight, and successful delivery. Clear reporting and accountability every step of the way.",
}

export default function HowItWorksPage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-16 lg:py-24">
        <Image src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1920&q=80&auto=format&fit=crop" alt="Steel frame construction" fill className="object-cover" sizes="100vw" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Our Process
            </h1>
            <p className="text-xl text-white/80 leading-relaxed">
              Our proven four-step process keeps your project on track from initial assessment through successful delivery and close-out. Clear accountability, detailed reporting, and proactive risk management at every stage.
            </p>
          </div>
        </div>
      </section>

      {/* 4-Step Process */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProcessSteps />
        </div>
      </section>

      {/* Detailed Process */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            What Happens at Each Stage
          </h2>

          <div className="space-y-8">
            {/* Initial Assessment */}
            <Card className="bg-white border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-100 rounded-xl w-12 h-12 flex items-center justify-center shrink-0">
                    <Shield className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      1. Initial Assessment (Week 1)
                    </h3>
                    <p className="text-gray-600 mb-4">
                      We assess scope, risk, and delivery strategy. We start by understanding your project, goals, constraints, and current team. This includes:
                    </p>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start space-x-2">
                        <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                        <span>Review existing plans, budgets, contracts, and schedules</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                        <span>AI-powered analysis identifies gaps, risks, and immediate action items</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                        <span>Meet with your architect, engineers, and contractor (if selected)</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                        <span>Establish communication protocols and automated reporting cadence</span>
                      </li>
                    </ul>
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Deliverable:</strong> Initial assessment memo with findings, recommendations, and 30-day action plan
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Coordination */}
            <Card className="bg-white border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-100 rounded-xl w-12 h-12 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      2. Team Coordination (Ongoing)
                    </h3>
                    <p className="text-gray-600 mb-4">
                      We manage the team, monitor risk, and report clearly. We become the central point of coordination for all project participants:
                    </p>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start space-x-2">
                        <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                        <span>Run weekly coordination calls with design team and contractor</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                        <span>Automated tracking of action items, decisions, and deliverables</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                        <span>Coordinate with jurisdictions on entitlements and permits</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                        <span>Manage RFIs, submittals, and change requests</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                        <span>AI-powered risk alerts escalate issues before they become problems</span>
                      </li>
                    </ul>
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Deliverable:</strong> Weekly meeting minutes with action items and decisions log
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ongoing Oversight */}
            <Card className="bg-white border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-100 rounded-xl w-12 h-12 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      3. Ongoing Oversight (Monthly)
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Every month, you receive comprehensive reporting and proactive risk management:
                    </p>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start space-x-2">
                        <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                        <span>Budget variance analysis with updated projections</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                        <span>Schedule status with critical path updates</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                        <span>Pay application review and approval recommendation</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                        <span>Change order analysis and negotiation support</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                        <span>Risk register with mitigation strategies</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                        <span>Photo documentation and progress tracking</span>
                      </li>
                    </ul>
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Deliverable:</strong> Comprehensive monthly status report (15–25 pages) plus executive summary
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Successful Delivery */}
            <Card className="bg-white border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-100 rounded-xl w-12 h-12 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      4. Successful Delivery & Close-Out
                    </h3>
                    <p className="text-gray-600 mb-4">
                      We stay through the finish line to ensure proper close-out:
                    </p>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start space-x-2">
                        <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                        <span>Substantial completion walkthrough and punch list management</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                        <span>Final inspections and Certificate of Occupancy coordination</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                        <span>Close-out documentation: as-builts, warranties, manuals</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                        <span>Final budget reconciliation and lien releases</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                        <span>Warranty period tracking and contractor responsiveness</span>
                      </li>
                    </ul>
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Deliverable:</strong> Final project summary with lessons learned and full close-out documentation package
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Reporting Cadence */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What Clients Receive Monthly
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Every month, ownership receives comprehensive reporting and documentation designed to maintain complete visibility into project health, budget status, and risk exposure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="pt-6">
                <div className="bg-orange-100 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Comprehensive Status Report
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  15–25 page detailed report covering all aspects of project health. Executive summary for quick review.
                </p>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li className="flex items-start space-x-1">
                    <CheckCircle2 className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                    <span>Executive summary (2 pages)</span>
                  </li>
                  <li className="flex items-start space-x-1">
                    <CheckCircle2 className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                    <span>Budget variance analysis</span>
                  </li>
                  <li className="flex items-start space-x-1">
                    <CheckCircle2 className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                    <span>Schedule status and critical path</span>
                  </li>
                  <li className="flex items-start space-x-1">
                    <CheckCircle2 className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                    <span>Quality and safety observations</span>
                  </li>
                  <li className="flex items-start space-x-1">
                    <CheckCircle2 className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                    <span>Risk register with ratings</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="pt-6">
                <div className="bg-orange-100 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Budget & Cost Control
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Line-item budget tracking with variance analysis, change order management, and cost-to-complete projections.
                </p>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li className="flex items-start space-x-1">
                    <CheckCircle2 className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                    <span>Budget vs. actual (line-item)</span>
                  </li>
                  <li className="flex items-start space-x-1">
                    <CheckCircle2 className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                    <span>Change order log and analysis</span>
                  </li>
                  <li className="flex items-start space-x-1">
                    <CheckCircle2 className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                    <span>Cost-to-complete forecasts</span>
                  </li>
                  <li className="flex items-start space-x-1">
                    <CheckCircle2 className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                    <span>Contingency burn rate tracking</span>
                  </li>
                  <li className="flex items-start space-x-1">
                    <CheckCircle2 className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                    <span>Real-time alerts on budget concerns</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="pt-6">
                <div className="bg-orange-100 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Schedule Dashboard
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Visual schedule with critical path analysis, milestone tracking, and progress verification.
                </p>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li className="flex items-start space-x-1">
                    <CheckCircle2 className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                    <span>Critical path and float analysis</span>
                  </li>
                  <li className="flex items-start space-x-1">
                    <CheckCircle2 className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                    <span>Milestone completion status</span>
                  </li>
                  <li className="flex items-start space-x-1">
                    <CheckCircle2 className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                    <span>At-risk activities (color-coded)</span>
                  </li>
                  <li className="flex items-start space-x-1">
                    <CheckCircle2 className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                    <span>2-week look-ahead forecasts</span>
                  </li>
                  <li className="flex items-start space-x-1">
                    <CheckCircle2 className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                    <span>Weather delay tracking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="pt-6">
                <div className="bg-orange-100 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Pay Application Review
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Independent review and approval recommendation for all contractor payment requests.
                </p>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li className="flex items-start space-x-1">
                    <CheckCircle2 className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                    <span>Line-item payment verification</span>
                  </li>
                  <li className="flex items-start space-x-1">
                    <CheckCircle2 className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                    <span>Work-in-place validation</span>
                  </li>
                  <li className="flex items-start space-x-1">
                    <CheckCircle2 className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                    <span>Stored materials tracking</span>
                  </li>
                  <li className="flex items-start space-x-1">
                    <CheckCircle2 className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                    <span>Retainage and lien waiver review</span>
                  </li>
                  <li className="flex items-start space-x-1">
                    <CheckCircle2 className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                    <span>Approve/hold/reject recommendations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="pt-6">
                <div className="bg-orange-100 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                  <Camera className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Photo Documentation
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Organized visual documentation with annotations tracking progress and site conditions.
                </p>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li className="flex items-start space-x-1">
                    <CheckCircle2 className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                    <span>Progress photos by area/phase</span>
                  </li>
                  <li className="flex items-start space-x-1">
                    <CheckCircle2 className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                    <span>Quality issue documentation</span>
                  </li>
                  <li className="flex items-start space-x-1">
                    <CheckCircle2 className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                    <span>Before/during/after comparisons</span>
                  </li>
                  <li className="flex items-start space-x-1">
                    <CheckCircle2 className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                    <span>Timestamped and geotagged</span>
                  </li>
                  <li className="flex items-start space-x-1">
                    <CheckCircle2 className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                    <span>Organized by date and location</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Additional Monthly Deliverables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-orange-600" />
                  Permitting & Compliance Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Permit status dashboard (applications, approvals, inspections)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Inspection schedule and results tracking</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Code compliance verification</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Corrections and re-inspection coordination</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-orange-600" />
                  Communication & Coordination Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Weekly meeting minutes with action items</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Decision log with owner approvals tracked</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>RFI register and response tracking</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Submittal log (approved, pending, rejected)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Shield className="h-5 w-5 text-orange-600" />
                  Risk & Issue Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Active risk register with probability/impact ratings</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Mitigation action plans and status</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Emerging issue alerts (AI-powered)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Lessons learned and process improvements</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Camera className="h-5 w-5 text-orange-600" />
                  Visual Documentation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Progress photos organized by area and phase</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Quality observations with annotations</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Before/during/after comparisons</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Timestamped and geotagged metadata</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Change Order Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Change order request review and analysis</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Cost reasonableness assessment</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Scope and entitlement verification</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Approve/negotiate/reject recommendations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-600" />
                  Stakeholder Reporting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Lender-ready reporting formats</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Investor update packages</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Board-ready presentations (for institutions)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <span>Partner/LP quarterly summaries</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Delivery Note */}
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start space-x-4">
                <div className="bg-orange-600 rounded-full w-10 h-10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Reporting Cadence & Delivery
                  </h3>
                  <p className="text-gray-700 mb-3">
                    All monthly deliverables are provided within the first 5 business days of each month. Custom reporting formats available for lenders, investors, or board requirements.
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Format options:</strong> PDF reports, Excel dashboards, PowerPoint presentations, web-based portals • <strong>Distribution:</strong> Secure email, shared drive, or project portal • <strong>Ad-hoc reporting:</strong> Available upon request throughout the month
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Request a project review and we'll walk you through how we'd approach your specific situation.
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
