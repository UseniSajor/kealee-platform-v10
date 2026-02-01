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
  PiggyBank
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Kealee Finance & Trust | Your Money is Protected Until the Work is Done',
  description: 'Secure escrow accounts for construction projects. Your funds are FDIC-insured and only released when you approve completed work. No more paying upfront and hoping for the best.',
  keywords: 'construction escrow, payment protection, contractor payment, milestone payments, secure construction payments',
  openGraph: {
    title: 'Kealee Finance & Trust - Your Money is Protected',
    description: 'Secure escrow accounts for construction. Funds only released when work is verified.',
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
                href="#escrow"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Escrow Protection
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
                Protect Your Project
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
              FDIC Insured • Bank-Level Security
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Your Money is Protected
              <span className="block text-emerald-400 mt-2">Until the Work is Done</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              No more paying upfront and hoping for the best.
              Your funds stay safe until you approve each completed phase.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/project/start"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-emerald-700 rounded-lg text-lg font-bold hover:bg-emerald-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
              >
                Protect Your Project
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
                256-bit encryption
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                You control when money moves
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
                    The #1 Fear in Construction Projects
                  </h2>
                  <p className="text-gray-700 text-lg">
                    "What if I pay the contractor and they don't finish the work?"
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-red-600 mb-1">73%</div>
                  <p className="text-sm text-gray-600">of homeowners worry about contractor payments</p>
                </div>
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-red-600 mb-1">$14,000</div>
                  <p className="text-sm text-gray-600">average loss when projects go wrong</p>
                </div>
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-red-600 mb-1">45%</div>
                  <p className="text-sm text-gray-600">of disputes are over payment timing</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-emerald-200">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="h-6 w-6 text-emerald-600" />
                  <h3 className="text-lg font-bold text-gray-900">Kealee Solves This</h3>
                </div>
                <p className="text-gray-600">
                  Your money goes into a secure account that <strong>you control</strong>.
                  Contractors can see the funds are there (so they know they'll get paid),
                  but the money only moves when you approve that the work is done right.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="escrow" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Your Money is Protected
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple, automatic protection at every step
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon={<PiggyBank className="h-6 w-6 text-emerald-600" />}
              title="Funds Held Securely"
              description="Your project money sits in an FDIC-insured account. It's there when needed, protected when not."
            />

            <FeatureCard
              icon={<FileCheck className="h-6 w-6 text-emerald-600" />}
              title="Work Gets Verified First"
              description="Before any money moves, the work is inspected and verified. No cutting corners."
            />

            <FeatureCard
              icon={<ThumbsUp className="h-6 w-6 text-emerald-600" />}
              title="You Approve Each Release"
              description="One tap on your phone to approve. If you're not happy, the money doesn't move."
            />

            <FeatureCard
              icon={<Eye className="h-6 w-6 text-emerald-600" />}
              title="See Every Dollar"
              description="Real-time dashboard shows exactly where your money is. No surprises, no hidden fees."
            />

            <FeatureCard
              icon={<Scale className="h-6 w-6 text-emerald-600" />}
              title="Disputes Get Resolved"
              description="If there's a problem, funds are frozen while we help you work it out. Fair for everyone."
            />

            <FeatureCard
              icon={<Smartphone className="h-6 w-6 text-emerald-600" />}
              title="Manage From Anywhere"
              description="Check balances, approve payments, and see progress from your phone. It's that easy."
            />
          </div>
        </div>
      </section>

      {/* How It Works - The Flow */}
      <section id="how-it-works" className="py-20 bg-white">
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
                description="You and contractor agree on the work and price"
                icon={<FileCheck className="h-7 w-7" />}
              />

              <FlowStep
                number={2}
                title="You Fund the Account"
                description="Money goes into your secure project account"
                icon={<Wallet className="h-7 w-7" />}
              />

              <FlowStep
                number={3}
                title="Work Gets Done"
                description="Contractor completes each phase, gets verified"
                icon={<BadgeCheck className="h-7 w-7" />}
              />

              <FlowStep
                number={4}
                title="You Approve, They're Paid"
                description="One tap releases payment for completed work"
                icon={<ThumbsUp className="h-7 w-7" />}
              />
            </div>

            {/* Detailed Flow */}
            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">What Happens at Each Milestone</h3>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Contractor finishes a phase of work</p>
                    <p className="text-sm text-gray-500">Example: Framing is complete</p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowRight className="h-5 w-5 text-gray-400 rotate-90" />
                </div>

                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 font-bold">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Project manager verifies the work</p>
                    <p className="text-sm text-gray-500">Our PM confirms quality standards are met</p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowRight className="h-5 w-5 text-gray-400 rotate-90" />
                </div>

                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Inspection passes (when required)</p>
                    <p className="text-sm text-gray-500">City inspector signs off on the work</p>
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
                    <p className="text-sm text-gray-500">Contractor is paid within 24-48 hours</p>
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
      <section className="py-20 bg-gray-50">
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
                title="Your Money Doesn't Disappear"
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
                icon={<Eye className="h-7 w-7 text-emerald-600" />}
                title="See Where Every Dollar Goes"
                description="Real-time dashboard shows your balance, pending releases, and complete transaction history."
                audience="homeowner"
              />

              <BenefitCard
                icon={<Clock className="h-7 w-7 text-emerald-600" />}
                title="Fast Payouts, No Waiting"
                description="Approved payments are processed immediately. Funds hit your account within 24-48 hours."
                audience="contractor"
              />

              <BenefitCard
                icon={<Shield className="h-7 w-7 text-emerald-600" />}
                title="Dispute Protection"
                description="If something goes wrong, funds are frozen while we help resolve it. You're never left holding the bag."
                audience="homeowner"
              />

              <BenefitCard
                icon={<BadgeCheck className="h-7 w-7 text-emerald-600" />}
                title="Builds Your Reputation"
                description="Successfully completed projects add to your verified track record. More trust means more work."
                audience="contractor"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-20 bg-white">
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
                <div className="h-6 w-px bg-gray-200" />
                <div className="flex items-center gap-2 text-gray-500">
                  <Shield className="h-5 w-5" />
                  <span className="text-sm font-medium">PCI-DSS Compliant</span>
                </div>
                <div className="h-6 w-px bg-gray-200" />
                <div className="flex items-center gap-2 text-gray-500">
                  <BadgeCheck className="h-5 w-5" />
                  <span className="text-sm font-medium">SOC 2 Certified</span>
                </div>
                <div className="h-6 w-px bg-gray-200" />
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
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Fees
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
                      <span>One-tap approvals</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>Real-time dashboard</span>
                    </li>
                  </ul>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Package C & D clients: Reduced to <strong>0.5%</strong>
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
                      Contractor payouts processed via Stripe Connect
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
                <Receipt className="h-5 w-5 text-emerald-600" />
                Example: $50,000 Kitchen Remodel
              </h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Escrow Fee (1%)</p>
                  <p className="font-semibold text-gray-900">$500 (capped)</p>
                </div>
                <div>
                  <p className="text-gray-500">ACH Funding</p>
                  <p className="font-semibold text-gray-900">$0</p>
                </div>
                <div>
                  <p className="text-gray-500">Total Protection Cost</p>
                  <p className="font-semibold text-emerald-600">$500 (1% of project)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white">
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
              question="What if the contractor needs money for materials upfront?"
              answer="We recommend contractors who can work with milestone-based payments. For materials, the first milestone can include material costs that are released when materials are delivered and verified on site."
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
              answer="You can add more funds to your account at any time. We recommend keeping a 10-15% buffer for unexpected changes. Any unused funds are refunded to you at project completion."
            />

            <FAQItem
              question="Can I see my tax documents?"
              answer="Yes! We generate 1099s and other tax documents automatically. You can download them anytime from your dashboard. We also manage W-9 collection from contractors."
            />
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-20 bg-emerald-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Protect Your Project?
            </h2>
            <p className="text-xl text-emerald-100 mb-8">
              Your money stays safe. Contractors get paid fairly. Everyone sleeps better.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/project/start"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-emerald-700 rounded-lg text-lg font-bold hover:bg-emerald-50 transition-all duration-200 shadow-lg"
              >
                Protect Your Project
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
            Learn how Kealee guarantees your payments
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
                Secure payment protection for construction projects. Your money is safe until the work is done.
              </p>
            </div>

            {/* Get Started */}
            <div>
              <h4 className="text-white font-semibold mb-4">Get Started</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/project/start" className="hover:text-white transition-colors">Protect Your Project</Link></li>
                <li><Link href="/contractors" className="hover:text-white transition-colors">For Contractors</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>

            {/* Learn More */}
            <div>
              <h4 className="text-white font-semibold mb-4">Learn More</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="#escrow" className="hover:text-white transition-colors">Escrow Protection</Link></li>
                <li><Link href="#faq" className="hover:text-white transition-colors">Common Questions</Link></li>
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
