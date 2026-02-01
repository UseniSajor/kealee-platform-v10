import { Metadata } from 'next'
import Link from 'next/link'
import {
  CheckCircle,
  Shield,
  DollarSign,
  Eye,
  Users,
  Bell,
  Home,
  ArrowRight,
  Play,
  BookOpen,
  ShieldCheck,
  LayoutDashboard,
  Clock,
  FileText,
  ClipboardCheck,
  Lock,
  UserCheck
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Kealee | Build Your Project Without the Stress',
  description: 'We handle the contractors, permits, inspections, and payments. You just approve when you\'re ready. No upfront fees, pay only when work is done right.',
  keywords: 'construction project management, home renovation, contractor management, permit handling, home improvement',
  openGraph: {
    title: 'Kealee - Build Your Project Without the Stress',
    description: 'We handle contractors, permits, inspections, and payments. You just approve when you\'re ready.',
    type: 'website',
  },
}

// Feature Card Component
function FeatureCard({
  icon,
  title,
  description
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-blue-200 transition-all duration-300">
      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

// Benefit Card Component
function BenefitCard({
  icon,
  title,
  description
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex gap-5 p-6 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300">
      <div className="flex-shrink-0">
        <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

// Integration Card Component
function IntegrationCard({
  title,
  description
}: {
  title: string
  description: string
}) {
  return (
    <div className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-300">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  )
}

// Step Component
function Step({
  number,
  title,
  children
}: {
  number: number
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="relative flex flex-col items-center text-center md:items-start md:text-left">
      {/* Step Number */}
      <div className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-lg">
        {number}
      </div>

      {/* Content */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <div className="text-gray-600 space-y-1">
        {children}
      </div>
    </div>
  )
}

export default function ProjectOwnerLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-7 w-7 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Kealee</span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                href="#how-it-works"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                How It Works
              </Link>
              <Link
                href="#pricing"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="#why-kealee"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Why Kealee
              </Link>
              <Link
                href="/permits/intake"
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Start a Permit
              </Link>
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/projects/new"
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Start Your Project
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyek0zNiAxNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>

        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Build Your Project
              <span className="block text-blue-400 mt-2">Without the Stress</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              We handle the contractors, permits, inspections, and payments.
              You just approve when you're ready.
            </p>

            {/* CTA Buttons - HIGH VISIBILITY with strong contrast */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/projects/new"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-700 rounded-lg text-lg font-bold hover:bg-blue-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
              >
                Start Your Project
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="#demo"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white border-2 border-white rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-700 transition-all duration-200"
              >
                <Play className="mr-2 h-5 w-5" />
                See How It Works
              </Link>
            </div>

            {/* Trust Line */}
            <p className="text-gray-300 text-sm md:text-base">
              No upfront fees • Pay only when work is done right • Cancel anytime
            </p>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              We Handle Everything
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Focus on your vision. We take care of the details.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon={<CheckCircle className="h-6 w-6 text-blue-600" />}
              title="We Make Sure You're Ready"
              description="Before anything starts, we confirm everything is in place. No surprises."
            />

            <FeatureCard
              icon={<Shield className="h-6 w-6 text-blue-600" />}
              title="Your Money Stays Safe"
              description="Funds are held securely and only released when you approve completed work."
            />

            <FeatureCard
              icon={<DollarSign className="h-6 w-6 text-blue-600" />}
              title="Pay Only for Done Work"
              description="No upfront contractor payments. You approve each phase before any money moves."
            />

            <FeatureCard
              icon={<Eye className="h-6 w-6 text-blue-600" />}
              title="Always Know What's Happening"
              description="See every update, inspection, and milestone in one simple dashboard."
            />

            <FeatureCard
              icon={<Users className="h-6 w-6 text-blue-600" />}
              title="One Place for Everyone"
              description="Architects, contractors, inspectors—everyone communicates through your project hub."
            />

            <FeatureCard
              icon={<Bell className="h-6 w-6 text-blue-600" />}
              title="We Alert You When Needed"
              description="Get notified only when your approval is needed. We handle the rest."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Getting Started is Easy
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps. We guide you through each one.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            {/* Steps Grid */}
            <div className="grid md:grid-cols-3 gap-12 md:gap-8 relative">
              {/* Connecting Line (Desktop) */}
              <div className="hidden md:block absolute top-7 left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] h-0.5 bg-gray-300"></div>

              <Step number={1} title="Tell Us About Your Project">
                <p className="text-base">Answer a few quick questions. Takes about 5 minutes.</p>
                <p className="text-sm text-gray-500 mt-2">We'll figure out what permits and approvals you need.</p>
              </Step>

              <Step number={2} title="We Set Everything Up">
                <p className="text-base">We handle permits, find qualified contractors, and create your project plan.</p>
                <p className="text-sm text-gray-500 mt-2">You review and approve. No construction knowledge needed.</p>
              </Step>

              <Step number={3} title="Approve As You Go">
                <p className="text-base">Watch progress from your phone. Approve completed work with one tap.</p>
                <p className="text-sm text-gray-500 mt-2">Money only moves when you say so.</p>
              </Step>
            </div>

            {/* CTA */}
            <div className="text-center mt-16">
              <Link
                href="/projects/new"
                className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-bold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Start Your Project
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Homeowners Trust Kealee Section */}
      <section id="why-kealee" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Homeowners Trust Kealee
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <BenefitCard
                icon={<BookOpen className="h-7 w-7 text-blue-600" />}
                title="No Construction Experience Needed"
                description="We speak plain English, not contractor jargon. Our platform guides you through every decision with clear explanations."
              />

              <BenefitCard
                icon={<ShieldCheck className="h-7 w-7 text-blue-600" />}
                title="Protection Built In"
                description="Permits can't expire without you knowing. Work can't be paid for until it passes inspection. We catch problems before they cost you money."
              />

              <BenefitCard
                icon={<LayoutDashboard className="h-7 w-7 text-blue-600" />}
                title="Everything in One Place"
                description="No more spreadsheets, email chains, or wondering who to call. Your entire project lives in one simple dashboard."
              />

              <BenefitCard
                icon={<Clock className="h-7 w-7 text-blue-600" />}
                title="Save Time, Avoid Headaches"
                description="We coordinate the contractors, chase the permits, and schedule the inspections. You just approve when you're ready."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Everything Works Together Section */}
      <section id="integrations" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Everything Works Together
              </h2>
              <p className="text-xl text-gray-600">
                One platform. No juggling between apps or contractors.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <IntegrationCard
                title="Design & Architecture"
                description="When your plans are ready, we automatically move to permits. No handoff meetings needed."
              />

              <IntegrationCard
                title="Permits & Inspections"
                description="We track every permit and schedule every inspection. You get notified of results."
              />

              <IntegrationCard
                title="Secure Payments"
                description="Your project funds are held safely. Released only when work is verified complete."
              />

              <IntegrationCard
                title="Vetted Contractors"
                description="We connect you with licensed, insured professionals. Check their ratings and reviews."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 mb-12">
              No hidden fees. No surprises. You only pay when your project moves forward.
            </p>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 md:p-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
                Most Popular
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">Project Management</h3>
              <p className="text-gray-600 mb-6">Everything you need to manage your construction project</p>

              <div className="text-5xl font-bold text-gray-900 mb-2">
                3%
                <span className="text-xl font-normal text-gray-500"> of project cost</span>
              </div>
              <p className="text-gray-500 mb-8">Minimum $500 • Maximum $5,000</p>

              <ul className="text-left space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Permit tracking & management</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Secure payment protection</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Contractor verification</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Inspection coordination</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">24/7 project dashboard</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Dedicated support team</span>
                </li>
              </ul>

              <Link
                href="/projects/new"
                className="block w-full py-4 bg-blue-600 text-white rounded-lg text-lg font-bold hover:bg-blue-700 transition-colors"
              >
                Get Started Free
              </Link>
              <p className="text-sm text-gray-500 mt-4">No payment required until your project starts</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Section - HIGH CONTRAST */}
      <section className="py-20 bg-blue-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Build Without the Stress?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Start in 5 minutes. No credit card needed. We'll guide you through everything.
            </p>

            {/* HIGH CONTRAST BUTTONS - white on dark background */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/projects/new"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-700 rounded-lg text-lg font-bold hover:bg-blue-50 transition-all duration-200 shadow-lg"
              >
                Start Your Project
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="#demo"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white border-2 border-white rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-700 transition-all duration-200"
              >
                Watch Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* DIY Disclaimer */}
      <div className="text-center text-sm text-gray-500 py-6 bg-gray-100">
        <p>
          Want to manage your own project?{' '}
          <Link href="/pm" className="text-blue-600 hover:text-blue-700 underline">
            Check out our DIY Project Management tools
          </Link>.
        </p>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Home className="h-6 w-6 text-blue-500" />
                <span className="text-white font-bold text-lg">Kealee</span>
              </div>
              <p className="text-sm leading-relaxed">
                Construction project management made simple for homeowners.
              </p>
            </div>

            {/* Get Started */}
            <div>
              <h4 className="text-white font-semibold mb-4">Get Started</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/projects/new" className="hover:text-white transition-colors">Start a Project</Link></li>
                <li><Link href="/permits/intake" className="hover:text-white transition-colors">Start a Permit</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>

            {/* Learn More */}
            <div>
              <h4 className="text-white font-semibold mb-4">Learn More</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">Common Questions</Link></li>
                <li><Link href="/help" className="hover:text-white transition-colors">Get Help</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About Kealee</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-sm">
              © 2026 Kealee Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
