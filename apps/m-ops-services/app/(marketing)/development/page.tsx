import { Metadata } from "next"
import Link from "next/link"
import { Button, Card, CardContent, Badge, Separator } from "@/components/ui"
import { ServiceTiers } from "@/components/development/ServiceTiers"
import { ProcessSteps } from "@/components/development/ProcessSteps"
import { FAQSection } from "@/components/development/FAQSection"
import {
  Shield,
  Target,
  TrendingUp,
  CheckCircle2,
  Download,
  ArrowRight,
  Building2,
  Users2,
  Landmark,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Kealee Development - Owner's Representative & Development Advisory Services",
  description: "Licensed GC providing owner's representation and development advisory for residential, multifamily, and mixed-use projects nationwide. 350+ projects delivered. Protect your capital from feasibility through C of O.",
  keywords: "owner's representative, development advisory, construction oversight, real estate development, owner's rep services, licensed general contractor, development management",
}

export default function DevelopmentHomePage() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-orange-100 text-orange-800 px-4 py-2 text-sm font-medium">
              Owner's Rep Services • Nationwide
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Owner's Representation & Development Advisory for Real Estate Projects That Can't Afford Mistakes
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Kealee Development protects owner capital by managing entitlement, design, and construction risk—acting as your senior development partner from feasibility through Certificate of Occupancy. Backed by AI-powered project analytics and automated risk monitoring.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-2xl h-14 px-8 text-lg font-semibold"
              >
                <Link href="/development/contact">Request a Project Review</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-2 border-gray-300 hover:border-orange-600 rounded-2xl h-14 px-8 text-lg font-semibold"
              >
                <a href="/kealee-development-1pager.pdf" download className="inline-flex items-center space-x-2">
                  <Download className="h-5 w-5" />
                  <span>Download 1-Pager</span>
                </a>
              </Button>
            </div>

            {/* Trust Bullets */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-orange-600" />
                <span>20+ Years Experience</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-orange-600" />
                <span>Licensed General Contractor</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-orange-600" />
                <span>Nationwide Coverage</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-orange-600" />
                <span>350+ Projects Delivered</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              What We Do
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-4">
              Real estate development fails most often due to poor coordination, misaligned incentives, and unmanaged risk. Kealee Development acts as the owner's representative, ensuring your project is designed, approved, built, and delivered in alignment with your budget, schedule, and exit strategy.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              We operate nationwide, coordinating your project team while providing senior-level oversight without the cost of full-time staff. Our AI-powered monitoring systems track project health in real-time, while automated reporting keeps you informed every step of the way.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-gray-50 border-gray-200 text-center">
              <CardContent className="pt-8 pb-6">
                <div className="bg-orange-100 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Protect Your Capital
                </h3>
                <p className="text-gray-600">
                  Independent oversight backed by automated risk alerts catches issues before they become costly problems, ensuring your budget and schedule stay on track.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 border-gray-200 text-center">
              <CardContent className="pt-8 pb-6">
                <div className="bg-orange-100 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <Target className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Expert Coordination
                </h3>
                <p className="text-gray-600">
                  We actively manage your architects, engineers, contractors, and consultants—keeping everyone aligned with intelligent workflow automation and clear accountability.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 border-gray-200 text-center">
              <CardContent className="pt-8 pb-6">
                <div className="bg-orange-100 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Maximize Value
                </h3>
                <p className="text-gray-600">
                  From feasibility through delivery, we optimize your project for cost, quality, and exit strategy.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

        {/* Who We Serve */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Who We Serve
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We work with owners who value professional oversight and need experienced development leadership without building an internal team.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              <div className="flex flex-col items-center text-center">
                <div className="bg-white rounded-2xl w-20 h-20 flex items-center justify-center mb-4 shadow-sm">
                  <Building2 className="h-10 w-10 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Developers (10+ units)
                </h3>
                <p className="text-gray-600">
                  Small to mid-size developers executing multifamily, mixed-use, and residential projects.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="bg-white rounded-2xl w-20 h-20 flex items-center justify-center mb-4 shadow-sm">
                  <Users2 className="h-10 w-10 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  High-Net-Worth Owners & Family Offices
                </h3>
                <p className="text-gray-600">
                  Sophisticated capital seeking experienced representation for complex real estate projects.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="bg-white rounded-2xl w-20 h-20 flex items-center justify-center mb-4 shadow-sm">
                  <Landmark className="h-10 w-10 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Non-Profits & Institutions
                </h3>
                <p className="text-gray-600">
                  Organizations requiring fiduciary-level oversight, housing organizations, and institutional owners.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="bg-white rounded-2xl w-20 h-20 flex items-center justify-center mb-4 shadow-sm">
                  <Building2 className="h-10 w-10 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  First-Time Developers
                </h3>
                <p className="text-gray-600">
                  Owners undertaking complex or unfamiliar projects who need experienced guidance.
                </p>
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <p className="text-sm text-gray-600">
                <strong>Minimum engagement:</strong> 10 units or equivalent complexity • <strong>Geography:</strong> Nationwide
              </p>
            </div>
          </div>
        </section>

      {/* Service Tiers */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Service Tiers
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the level of engagement that fits your project complexity and risk profile.
            </p>
          </div>
          <ServiceTiers />
          <div className="text-center mt-12">
            <Button
              asChild
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-2xl"
            >
              <Link href="/development/services">
                View Full Service Details <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Process Preview */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our proven process keeps your project on track from start to finish.
            </p>
          </div>
          <ProcessSteps />
          <div className="text-center mt-12">
            <Button
              asChild
              variant="outline"
              className="border-2 border-gray-300 hover:border-orange-600 rounded-2xl"
            >
              <Link href="/development/how-it-works">
                Learn More About Our Process <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Case Snapshots */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Project Experience
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Real results from real projects across multiple asset types.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="pt-6">
                <Badge className="bg-blue-100 text-blue-800 mb-4">Multifamily</Badge>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  124-Unit Garden-Style Apartments
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Rescued stalled project with budget overruns and GC disputes. Renegotiated contracts, stabilized schedule, delivered 3 months early.
                </p>
                <p className="text-sm font-medium text-orange-600">
                  Saved $1.2M in change orders
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="pt-6">
                <Badge className="bg-green-100 text-green-800 mb-4">Mixed-Use</Badge>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  32-Unit Mixed-Use Development
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Provided full owner's rep from entitlement through C of O. Coordinated complex approvals, managed design changes, delivered on budget.
                </p>
                <p className="text-sm font-medium text-orange-600">
                  Zero budget overruns
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="pt-6">
                <Badge className="bg-purple-100 text-purple-800 mb-4">Townhomes</Badge>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  18-Unit Luxury Townhomes
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Tier 1 feasibility identified $450K in soft cost savings and alternate MEP routing that reduced site work by 30%.
                </p>
                <p className="text-sm font-medium text-orange-600">
                  Project green-lit after review
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button
              asChild
              variant="outline"
              className="border-2 border-gray-300 hover:border-orange-600 rounded-2xl"
            >
              <Link href="/development/experience">
                View Full Experience <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about working with Kealee Development.
            </p>
          </div>
          <FAQSection />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-orange-600 to-orange-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to Protect Your Project?
          </h2>
          <p className="text-xl mb-8 opacity-95">
            Request a complimentary project review. We'll assess your needs and provide a transparent scope and fee proposal within 48 hours.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              className="bg-white text-orange-600 hover:bg-gray-100 rounded-2xl h-14 px-8 text-lg font-semibold"
            >
              <Link href="/development/contact">Request a Project Review</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 rounded-2xl h-14 px-8 text-lg font-semibold"
            >
              <a href="mailto:getstarted@kealee.com" className="inline-flex items-center space-x-2">
                <span>Email Us Directly</span>
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
