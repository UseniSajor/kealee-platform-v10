import { Metadata } from 'next'
import Link from 'next/link'
import {
  Shield,
  Lock,
  CheckCircle,
  DollarSign,
  ArrowRight,
  Play,
  Eye,
  Clock,
  Users,
  CreditCard,
  Building2,
  Banknote,
  AlertTriangle,
  FileCheck,
  ThumbsUp,
  Wallet,
  Scale,
  BadgeCheck,
  Smartphone,
  Receipt,
  PiggyBank,
  BarChart3,
  ClipboardList,
  Hammer,
  FileText,
  TrendingUp,
  Bell,
  Calendar,
  Search,
  Star,
  Zap,
  LineChart,
  Calculator,
  UserCheck,
  MessageSquare,
  Camera
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Kealee Finance & Trust | Your Money is Protected Until the Work is Done',
  description: 'Secure escrow accounts for your projects. Your funds are FDIC-insured and only released when you approve completed work. Plus budget tracking, project management, and vetted contractors.',
  keywords: 'project escrow, payment protection, contractor payment, milestone payments, secure project payments, budget tracking, project management',
  openGraph: {
    title: 'Kealee Finance & Trust - Your Money is Protected',
    description: 'Secure escrow accounts for your projects. Funds only released when work is verified.',
    type: 'website',
  },
}

/**
 * m-finance-trust LANDING PAGE
 *
 * TARGET AUDIENCES:
 * - Homeowners: Want assurance their money is safe
 * - Contractors: Want to know they'll get paid when work is done
 *
 * PHILOSOPHY:
 * - Plain English, no financial jargon
 * - Emphasize protection and trust
 * - Show the flow is automatic and simple
 * - Highlight broader platform benefits beyond just escrow
 */

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
    <div className="p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-emerald-200 transition-all duration-300">
      <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
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
  description,
  audience
}: {
  icon: React.ReactNode
  title: string
  description: string
  audience?: 'homeowner' | 'contractor'
}) {
  const audienceColors = {
    homeowner: 'bg-blue-100 text-blue-600',
    contractor: 'bg-orange-100 text-orange-600'
  }

  return (
    <div className="flex gap-5 p-6 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300">
      <div className="flex-shrink-0">
        <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div>
        {audience && (
          <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full mb-2 ${audienceColors[audience]}`}>
            {audience === 'homeowner' ? 'For Homeowners' : 'For Contractors'}
          </span>
        )}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

// Flow Step Component
function FlowStep({
  number,
  title,
  description,
  icon
}: {
  number: number
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mb-4 shadow-lg">
        {icon}
      </div>
      <div className="absolute -top-2 -right-2 w-7 h-7 bg-white border-2 border-emerald-600 rounded-full flex items-center justify-center text-sm font-bold text-emerald-600">
        {number}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  )
}

// Payment Method Card
function PaymentMethodCard({
  icon,
  title,
  description,
  badge,
  timing
}: {
  icon: React.ReactNode
  title: string
  description: string
  badge?: string
  timing: string
}) {
  return (
    <div className="relative p-6 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all">
      {badge && (
        <span className="absolute -top-3 left-4 px-3 py-1 text-xs font-bold bg-emerald-500 text-white rounded-full">
          {badge}
        </span>
      )}
      <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-3">{description}</p>
      <p className="text-xs text-emerald-600 font-medium">{timing}</p>
    </div>
  )
}

// Platform Feature Card (for "More Than Just Escrow" section)
function PlatformFeatureCard({
  icon,
  title,
  description,
  color = 'emerald'
}: {
  icon: React.ReactNode
  title: string
  description: string
  color?: 'emerald' | 'blue' | 'purple' | 'orange' | 'indigo'
}) {
  const colorClasses = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    indigo: 'bg-indigo-100 text-indigo-600',
  }

  return (
    <div className="flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all">
      <div className={`w-11 h-11 ${colorClasses[color]} rounded-lg flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  )
}

// FAQ Item Component
function FAQItem({
  question,
  answer
}: {
  question: string
  answer: string
}) {
  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{question}</h3>
      <p className="text-gray-600 leading-relaxed">{answer}</p>
    </div>
  )
}

export default function FinanceTrustLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Shield className="h-7 w-7 text-emerald-600" />
              <span className="text-xl font-bold text-gray-900">Kealee</span>
              <span className="text-sm text-emerald-600 font-semibold">Finance & Trust</span>
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
                href="#platform"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Platform Features
              </Link>
              <Link
                href="#pricing"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="#faq"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Questions
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
                href="/project/start"
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Start Your Project
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-emerald-900 to-gray-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyek0zNiAxNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>

        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium mb-6">
              <Lock className="h-4 w-4" />
              FDIC Insured • Bank-Level Security • Full Project Management
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Your Money is Protected
              <span className="block text-emerald-400 mt-2">Your Project is Managed</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Secure payments, real-time budget tracking, vetted contractors, and
              a dedicated project manager — all in one platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/project/start"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-emerald-700 rounded-lg text-lg font-bold hover:bg-emerald-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
              >
                Start Your Project
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white border-2 border-white rounded-lg text-lg font-semibold hover:bg-white hover:text-emerald-700 transition-all duration-200"
              >
                <Play className="mr-2 h-5 w-5" />
                See How It Works
              </Link>
            </div>

            {/* Trust Line */}
            <div className="flex flex-wrap justify-center gap-6 text-gray-300 text-sm">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                Funds insured up to $250,000
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                Vetted contractors only
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                Real-time budget tracking
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* The Problem We Solve */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 md:p-12">
              <div className="flex items-start gap-4 mb-6">
                <AlertTriangle className="h-8 w-8 text-red-500 flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    The Biggest Fears in Building Projects
                  </h2>
                  <p className="text-gray-700 text-lg">
                    "What if the contractor disappears with my money? What if the project goes over budget? How do I know if the work is done right?"
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mb-8">
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-red-600 mb-1">73%</div>
                  <p className="text-sm text-gray-600">worry about payments</p>
                </div>
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-red-600 mb-1">$14K</div>
                  <p className="text-sm text-gray-600">avg loss when things go wrong</p>
                </div>
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-red-600 mb-1">68%</div>
                  <p className="text-sm text-gray-600">projects go over budget</p>
                </div>
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-red-600 mb-1">45%</div>
                  <p className="text-sm text-gray-600">disputes over payments</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-emerald-200">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="h-6 w-6 text-emerald-600" />
                  <h3 className="text-lg font-bold text-gray-900">Kealee Solves All of This</h3>
                </div>
                <p className="text-gray-600">
                  Your money stays in a secure account <strong>you control</strong>. You get a dedicated project manager
                  who verifies work before you pay. Real-time budget tracking catches overruns before they happen.
                  And you only work with vetted, insured contractors.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* More Than Just Escrow Section */}
      <section id="platform" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-4">
              THE COMPLETE PLATFORM
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              More Than Just Payment Protection
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Kealee is a full project management platform. Your escrow account connects to everything —
              budget tracking, contractor management, permit coordination, and more.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <PlatformFeatureCard
              icon={<BarChart3 className="h-5 w-5" />}
              title="Real-Time Budget Tracking"
              description="See exactly where every dollar goes. Get alerts before you go over budget. Compare actual vs. estimated costs."
              color="blue"
            />

            <PlatformFeatureCard
              icon={<UserCheck className="h-5 w-5" />}
              title="Dedicated Project Manager"
              description="A real person assigned to your project. They verify work, coordinate contractors, and keep things on track."
              color="purple"
            />

            <PlatformFeatureCard
              icon={<Search className="h-5 w-5" />}
              title="Vetted Contractors Only"
              description="Every contractor is licensed, insured, and background-checked. We verify before they can bid on your project."
              color="emerald"
            />

            <PlatformFeatureCard
              icon={<FileText className="h-5 w-5" />}
              title="Permit Coordination"
              description="We handle permit applications, inspections scheduling, and compliance tracking. No city hall headaches."
              color="orange"
            />

            <PlatformFeatureCard
              icon={<Camera className="h-5 w-5" />}
              title="Photo Documentation"
              description="Daily progress photos from the job site. See exactly what's happening without leaving your couch."
              color="indigo"
            />

            <PlatformFeatureCard
              icon={<Bell className="h-5 w-5" />}
              title="Smart Notifications"
              description="Get alerts for milestones, inspections, payment approvals, and budget updates. Stay informed, not overwhelmed."
              color="blue"
            />

            <PlatformFeatureCard
              icon={<ClipboardList className="h-5 w-5" />}
              title="Change Order Management"
              description="All changes documented, priced, and approved before work happens. No surprise charges at the end."
              color="purple"
            />

            <PlatformFeatureCard
              icon={<Calendar className="h-5 w-5" />}
              title="Schedule Tracking"
              description="Visual timeline shows what's done, what's next, and if you're on track. Know your completion date."
              color="emerald"
            />

            <PlatformFeatureCard
              icon={<MessageSquare className="h-5 w-5" />}
              title="All Communication in One Place"
              description="Messages, documents, approvals — everything logged and searchable. No more digging through emails."
              color="orange"
            />
          </div>

          {/* Integration Callout */}
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                    <Zap className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Everything Works Together</h3>
                  <p className="text-gray-600">
                    When a contractor completes a milestone, your PM verifies it, the inspection passes,
                    you approve on your phone, and payment releases automatically. Budget updates in real-time.
                    No manual tracking, no spreadsheets, no confusion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Escrow Features */}
      <section id="escrow" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-4">
              PAYMENT PROTECTION
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Your Money is Protected
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Bank-level security with you in complete control
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon={<PiggyBank className="h-6 w-6 text-emerald-600" />}
              title="FDIC-Insured Accounts"
              description="Your project funds sit in an FDIC-insured account. Protected up to $250,000 by the federal government."
            />

            <FeatureCard
              icon={<FileCheck className="h-6 w-6 text-emerald-600" />}
              title="Work Verified First"
              description="Before any money moves, your project manager inspects the work. No cutting corners, no paying for incomplete work."
            />

            <FeatureCard
              icon={<ThumbsUp className="h-6 w-6 text-emerald-600" />}
              title="You Approve Every Payment"
              description="One tap on your phone to approve. If you're not happy, the money doesn't move. Period."
            />

            <FeatureCard
              icon={<Eye className="h-6 w-6 text-emerald-600" />}
              title="Complete Transparency"
              description="Real-time dashboard shows exactly where your money is. Every transaction logged and visible."
            />

            <FeatureCard
              icon={<Scale className="h-6 w-6 text-emerald-600" />}
              title="Fair Dispute Resolution"
              description="If there's a disagreement, funds freeze while we help work it out. $150 flat fee, professional mediation."
            />

            <FeatureCard
              icon={<Receipt className="h-6 w-6 text-emerald-600" />}
              title="Automatic Tax Docs"
              description="1099s, W-9 management, and payment records generated automatically. Tax time made easy."
            />
          </div>
        </div>
      </section>

      {/* How It Works - The Flow */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Payments Work
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Automatic, secure, and always in your control
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            {/* Flow Diagram */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 relative">
              {/* Connecting Lines (Desktop) */}
              <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-emerald-200 -z-10"></div>

              <FlowStep
                number={1}
                title="Contract Signed"
                description="You and contractor agree on work, price, and milestones"
                icon={<FileCheck className="h-7 w-7" />}
              />

              <FlowStep
                number={2}
                title="You Fund the Account"
                description="Money goes into your secure, FDIC-insured account"
                icon={<Wallet className="h-7 w-7" />}
              />

              <FlowStep
                number={3}
                title="Work Gets Verified"
                description="PM inspects, inspection passes, you review"
                icon={<BadgeCheck className="h-7 w-7" />}
              />

              <FlowStep
                number={4}
                title="You Approve, They're Paid"
                description="One tap releases payment. Contractor paid in 24-48 hours"
                icon={<ThumbsUp className="h-7 w-7" />}
              />
            </div>

            {/* Detailed Flow */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">What Happens at Each Milestone</h3>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Hammer className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Contractor finishes a phase of work</p>
                    <p className="text-sm text-gray-500">Photos uploaded, completion submitted in the app</p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowRight className="h-5 w-5 text-gray-400 rotate-90" />
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserCheck className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Your project manager verifies the work</p>
                    <p className="text-sm text-gray-500">On-site inspection, quality check, budget update</p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowRight className="h-5 w-5 text-gray-400 rotate-90" />
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">City inspection passes (when required)</p>
                    <p className="text-sm text-gray-500">We schedule and track all inspections for you</p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowRight className="h-5 w-5 text-gray-400 rotate-90" />
                </div>

                <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-xl border-2 border-emerald-300">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">You tap "Approve" on your phone</p>
                    <p className="text-sm text-gray-500">Contractor paid within 24-48 hours. Budget updated automatically.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center mt-12">
              <Link
                href="/project/start"
                className="inline-flex items-center justify-center px-8 py-4 bg-emerald-600 text-white rounded-lg text-lg font-bold hover:bg-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Start Your Protected Project
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits for Both Sides */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Fair for Everyone
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Homeowners feel safe. Contractors get paid. Everyone wins.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <BenefitCard
                icon={<Lock className="h-7 w-7 text-emerald-600" />}
                title="Your Money Stays Safe"
                description="Funds stay in your secured account until you're satisfied with the work. No chasing contractors for refunds."
                audience="homeowner"
              />

              <BenefitCard
                icon={<DollarSign className="h-7 w-7 text-emerald-600" />}
                title="Guaranteed Payment for Good Work"
                description="When you complete verified work, the money is already there waiting. No chasing homeowners for payment."
                audience="contractor"
              />

              <BenefitCard
                icon={<LineChart className="h-7 w-7 text-emerald-600" />}
                title="Budget Tracking That Actually Works"
                description="Real-time updates, change order alerts, and cost comparisons. Know exactly where you stand financially."
                audience="homeowner"
              />

              <BenefitCard
                icon={<Clock className="h-7 w-7 text-emerald-600" />}
                title="Fast Payouts, No Waiting"
                description="Approved payments processed immediately. Funds hit your account within 24-48 hours."
                audience="contractor"
              />

              <BenefitCard
                icon={<UserCheck className="h-7 w-7 text-emerald-600" />}
                title="Your Own Project Manager"
                description="A real person who verifies work, coordinates schedules, and keeps contractors accountable."
                audience="homeowner"
              />

              <BenefitCard
                icon={<Star className="h-7 w-7 text-emerald-600" />}
                title="Build Your Reputation"
                description="Successfully completed projects add to your verified track record. More trust means more work."
                audience="contractor"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Easy Ways to Fund Your Project
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose what works best for you. All methods are secure.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              <PaymentMethodCard
                icon={<Building2 className="h-6 w-6 text-emerald-600" />}
                title="Bank Transfer (ACH)"
                description="Connect your bank securely via Plaid"
                badge="Recommended"
                timing="3-5 business days • No fees"
              />

              <PaymentMethodCard
                icon={<CreditCard className="h-6 w-6 text-emerald-600" />}
                title="Credit or Debit Card"
                description="Visa, Mastercard, American Express"
                timing="Instant • 2.9% + $0.30 fee"
              />

              <PaymentMethodCard
                icon={<Banknote className="h-6 w-6 text-emerald-600" />}
                title="Wire Transfer"
                description="For larger deposits over $50,000"
                timing="Same day • $25 per transfer"
              />
            </div>

            {/* Security Badges */}
            <div className="mt-10 pt-8 border-t border-gray-200">
              <div className="flex flex-wrap items-center justify-center gap-8">
                <div className="flex items-center gap-2 text-gray-500">
                  <Lock className="h-5 w-5" />
                  <span className="text-sm font-medium">256-bit SSL</span>
                </div>
                <div className="h-6 w-px bg-gray-300" />
                <div className="flex items-center gap-2 text-gray-500">
                  <Shield className="h-5 w-5" />
                  <span className="text-sm font-medium">PCI-DSS Compliant</span>
                </div>
                <div className="h-6 w-px bg-gray-300" />
                <div className="flex items-center gap-2 text-gray-500">
                  <BadgeCheck className="h-5 w-5" />
                  <span className="text-sm font-medium">SOC 2 Certified</span>
                </div>
                <div className="h-6 w-px bg-gray-300" />
                <div className="flex items-center gap-2 text-gray-500">
                  <Building2 className="h-5 w-5" />
                  <span className="text-sm font-medium">FDIC Insured</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Clear Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              You see exactly what you pay. No hidden charges.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                {/* Escrow Fee */}
                <div className="p-8 text-center">
                  <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-7 w-7 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Escrow Protection</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-1">
                    1%
                    <span className="text-lg font-normal text-gray-500"> of project value</span>
                  </div>
                  <p className="text-emerald-600 font-medium mb-4">Maximum $500 cap</p>
                  <ul className="text-left text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>FDIC-insured account</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>Unlimited milestones</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>Real-time budget tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>Mobile app access</span>
                    </li>
                  </ul>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Full PM clients: Reduced to <strong>0.5%</strong>
                    </p>
                  </div>
                </div>

                {/* Payment Processing */}
                <div className="p-8 text-center">
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-7 w-7 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Processing</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-1">
                    2.9%
                    <span className="text-lg font-normal text-gray-500"> + $0.30</span>
                  </div>
                  <p className="text-blue-600 font-medium mb-4">Per transaction (card)</p>
                  <ul className="text-left text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>ACH transfers: No fee</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Cards: 2.9% + $0.30</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Wire: $25 flat fee</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Powered by Stripe</span>
                    </li>
                  </ul>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Contractor payouts via Stripe Connect
                    </p>
                  </div>
                </div>
              </div>

              {/* Dispute Resolution */}
              <div className="bg-gray-50 p-6 border-t border-gray-200">
                <div className="flex items-center justify-between max-w-xl mx-auto">
                  <div className="flex items-center gap-3">
                    <Scale className="h-6 w-6 text-gray-500" />
                    <div>
                      <p className="font-semibold text-gray-900">Dispute Resolution</p>
                      <p className="text-sm text-gray-500">If you ever need it</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">$150</p>
                    <p className="text-sm text-gray-500">flat fee</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Example Calculation */}
            <div className="mt-8 bg-emerald-50 rounded-xl p-6 border border-emerald-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-emerald-600" />
                Example: $50,000 Kitchen Remodel
              </h4>
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Escrow Fee (1%)</p>
                  <p className="font-semibold text-gray-900">$500 (capped)</p>
                </div>
                <div>
                  <p className="text-gray-500">ACH Funding</p>
                  <p className="font-semibold text-gray-900">$0</p>
                </div>
                <div>
                  <p className="text-gray-500">Budget Tracking</p>
                  <p className="font-semibold text-gray-900">Included</p>
                </div>
                <div>
                  <p className="text-gray-500">Total Cost</p>
                  <p className="font-semibold text-emerald-600">$500 (1%)</p>
                </div>
              </div>
            </div>

            {/* PM Services Upsell */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Want a dedicated project manager?{' '}
                <Link href="/pricing" className="text-emerald-600 font-semibold hover:underline">
                  See our full PM packages →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Common Questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            <FAQItem
              question="What happens if I'm not happy with the work?"
              answer="Don't approve the payment. It's that simple. Your funds stay in the secure account until you're satisfied. If there's a dispute, we freeze the funds and help mediate a resolution that's fair for everyone."
            />

            <FAQItem
              question="Do I need a project manager, or can I just use escrow?"
              answer="You can use escrow protection on its own — it works great for simple projects. For larger or complex projects, we recommend our PM packages for hands-on oversight. Either way, your money is protected."
            />

            <FAQItem
              question="How does budget tracking work?"
              answer="When you set up your project, we create a budget from your contract. As milestones are completed and payments approved, the budget updates automatically. You'll see actual vs. estimated costs in real-time, plus alerts if change orders push you over budget."
            />

            <FAQItem
              question="How fast do contractors get paid after I approve?"
              answer="Approved payments are processed immediately. Contractors typically see funds in their account within 24-48 hours, depending on their bank."
            />

            <FAQItem
              question="Is my money really safe?"
              answer="Yes. Your funds are held in FDIC-insured accounts at our partner bank, protected up to $250,000. We use bank-level security with 256-bit encryption, and we're PCI-DSS and SOC 2 compliant."
            />

            <FAQItem
              question="What if my project goes over budget?"
              answer="You'll see it coming! Our budget tracking shows you projections and alerts you to potential overruns before they happen. You can add more funds anytime. Any unused funds are refunded at project completion."
            />
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-20 bg-emerald-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Start Your Project?
            </h2>
            <p className="text-xl text-emerald-100 mb-8">
              Protected payments. Real-time budget tracking. Vetted contractors. One platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/project/start"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-emerald-700 rounded-lg text-lg font-bold hover:bg-emerald-50 transition-all duration-200 shadow-lg"
              >
                Start Your Project
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white border-2 border-white rounded-lg text-lg font-semibold hover:bg-white hover:text-emerald-700 transition-all duration-200"
              >
                Talk to Our Team
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contractor CTA */}
      <div className="text-center text-sm text-gray-500 py-6 bg-gray-100">
        <p>
          Are you a contractor?{' '}
          <Link href="/contractors" className="text-emerald-600 hover:text-emerald-700 underline">
            Learn how Kealee guarantees your payments and grows your business
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
                <Shield className="h-6 w-6 text-emerald-500" />
                <span className="text-white font-bold text-lg">Kealee</span>
              </div>
              <p className="text-sm leading-relaxed">
                The complete project management platform. Protected payments, budget tracking, vetted contractors, and dedicated project managers.
              </p>
            </div>

            {/* Get Started */}
            <div>
              <h4 className="text-white font-semibold mb-4">Get Started</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/project/start" className="hover:text-white transition-colors">Start Your Project</Link></li>
                <li><Link href="/contractors" className="hover:text-white transition-colors">For Contractors</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#escrow" className="hover:text-white transition-colors">Payment Protection</Link></li>
                <li><Link href="#platform" className="hover:text-white transition-colors">Budget Tracking</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="/help" className="hover:text-white transition-colors">Get Help</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About Kealee</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/legal/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/legal/acceptable-use" className="hover:text-white transition-colors">Acceptable Use</Link></li>
              </ul>
            </div>
          </div>

          {/* Security & Compliance */}
          <div className="border-t border-gray-800 pt-8 mb-8">
            <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Lock className="h-3 w-3" /> 256-bit SSL Encryption
              </span>
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" /> PCI-DSS Level 1
              </span>
              <span className="flex items-center gap-1">
                <BadgeCheck className="h-3 w-3" /> SOC 2 Type II
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" /> FDIC Insured
              </span>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="text-center">
            <p className="text-sm">
              © 2026 Kealee Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
