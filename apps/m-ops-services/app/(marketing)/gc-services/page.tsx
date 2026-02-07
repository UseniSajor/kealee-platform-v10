import { Metadata } from "next"
import Link from "next/link"
import { Button, Card, CardContent, Badge } from "@/components/ui"
import { AIFeaturesShowcase } from "@/components/gc-services/AIFeaturesShowcase"
import {
  Shield,
  Clock,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Calendar,
  FileText,
  Users,
  DollarSign,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Kealee Operations Services - Professional Ops Support for General Contractors",
  description: "Outsource your operations department. Permit tracking, weekly reporting, vendor coordination, and project management for GCs and builders. From $1,750/month. Free 14-day trial.",
  keywords: "general contractor operations, GC operations, construction project management, contractor services, permit tracking, vendor coordination, weekly reporting",
}

export default function GCServicesHomePage() {
  const packages = [
    {
      name: "Package A",
      label: "Solo GC",
      price: "$1,750",
      period: "/month",
      description: "Essential ops support for solo GCs running 1-3 projects",
      features: [
        "Permit + inspection tracking",
        "Client-ready weekly updates",
        "Vendor follow-ups + docs",
        "Single project focus",
      ],
      cta: "Start Trial",
    },
    {
      name: "Package B",
      label: "Growing Team",
      price: "$3,750",
      period: "/month",
      description: "Full ops coverage for growing contractors with 3-8 active jobs",
      features: [
        "Multi-project coordination",
        "Weekly reporting + action items",
        "Sub/vendor accountability",
        "Permit/delivery follow-ups",
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Package C",
      label: "Multiple Projects",
      price: "$9,500",
      period: "/month",
      description: "Enterprise ops for contractors managing 8+ concurrent projects",
      features: [
        "Centralized multi-project ops",
        "Proactive risk tracking",
        "Executive-level reporting",
        "Priority response times",
      ],
      cta: "Start Trial",
    },
    {
      name: "Package D",
      label: "Enterprise GC",
      price: "$16,500",
      period: "/month",
      description: "Full ops team replacement for enterprise contractors",
      features: [
        "Dedicated ops manager",
        "SLA response guarantees",
        "Custom workflows",
        "Multi-region support",
      ],
      cta: "Contact Sales",
    },
  ]

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-blue-100 text-blue-800 px-4 py-2 text-sm font-medium">
              Professional Operations Support for GCs & Builders
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Get Your Weekends Back. Let Us Handle Your Operations.
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Stop losing 20+ hours per week on admin chaos. Kealee Operations Services becomes your outsourced operations department—powered by AI-driven risk monitoring and automated workflows. We handle permits, vendor coordination, weekly reporting, and documentation so you can stay on-site and sell the next job.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 px-8 text-lg font-semibold"
              >
                <Link href="/gc-services/contact">Start Free 14-Day Trial</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-2 border-gray-300 hover:border-blue-600 rounded-2xl h-14 px-8 text-lg font-semibold"
              >
                <Link href="/gc-services/pricing">View All Pricing</Link>
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                <span>14-Day Free Trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                <span>Cancel Anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              GC Pain Points (Solved)
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We solve the operational headaches that keep contractors from building and selling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                problem: "Losing 20+ hours/week on admin?",
                solution: "We take permits, inspections, vendor comms, and reporting off your plate so you can stay on-site and sell the next job.",
              },
              {
                problem: "Permit delays killing margins?",
                solution: "AI-powered tracking + automated follow-ups reduce schedule slip and the expensive domino effect it creates across trades. Get alerts before delays impact your schedule.",
              },
              {
                problem: "Sub/vendor coordination eating your evenings?",
                solution: "Centralized comms and consistent updates keep everyone aligned—without you playing phone tag all day.",
              },
              {
                problem: "Weekly reporting always behind?",
                solution: "AI-assisted reporting generates consistent, client-ready weekly updates with action items—so you look sharp and stay ahead of surprises. Automated data collection saves hours.",
              },
            ].map((item, idx) => (
              <Card key={idx} className="bg-gray-50 border-gray-200">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {item.problem}
                  </h3>
                  <p className="text-gray-600">{item.solution}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Operations Packages for GCs
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Pick the level of ops coverage you need today—upgrade as you grow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg) => (
              <Card
                key={pkg.name}
                className={`${
                  pkg.popular
                    ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200"
                    : "bg-white border-gray-200"
                } relative`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="pt-8">
                  <div className="text-sm font-semibold text-gray-600">{pkg.name}</div>
                  <div className="text-lg font-medium text-gray-900 mt-1">{pkg.label}</div>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">{pkg.price}</span>
                    <span className="text-gray-600">{pkg.period}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">{pkg.description}</p>
                  
                  <ul className="mt-6 space-y-3">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    className={`w-full mt-6 ${
                      pkg.popular
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-900 hover:bg-gray-800 text-white"
                    } rounded-xl`}
                  >
                    <Link href="/gc-services/contact">{pkg.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features */}
      <section className="py-20 bg-gray-50">
        <AIFeaturesShowcase />
      </section>

      {/* What You Get */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Core Services
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="pt-8 text-center">
                <div className="bg-blue-100 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Permit & Inspection Tracking
                </h3>
                <p className="text-gray-600">
                  We track every permit and inspection so you never miss a deadline or fail due to missed paperwork.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="pt-8 text-center">
                <div className="bg-blue-100 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Vendor & Sub Coordination
                </h3>
                <p className="text-gray-600">
                  We handle vendor follow-ups, delivery coordination, and sub scheduling—keeping everyone on track.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="pt-8 text-center">
                <div className="bg-blue-100 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Client-Ready Reporting
                </h3>
                <p className="text-gray-600">
                  Professional weekly updates delivered to your clients—without you losing your Saturday putting them together.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to Focus on Building Instead of Admin?
          </h2>
          <p className="text-xl mb-8 opacity-95">
            Join hundreds of GCs who got their weekends back. Start your free 14-day trial—no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              className="bg-white text-blue-600 hover:bg-gray-100 rounded-2xl h-14 px-8 text-lg font-semibold"
            >
              <Link href="/gc-services/contact">Start Free Trial</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 rounded-2xl h-14 px-8 text-lg font-semibold"
            >
              <a href="mailto:getstarted@kealee.com">Email Us</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
