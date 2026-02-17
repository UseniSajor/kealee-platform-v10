import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Kealee Finance & Trust',
  description: 'Learn about our mission to make project payments safe and clear for everyone. Serving the DC-Baltimore corridor with secure escrow and project management.',
}

function ValueCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

function ComplianceBadge({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="text-center p-6">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <span className="text-emerald-700 font-bold text-sm">{title}</span>
      </div>
      <p className="text-sm text-gray-600 leading-snug">{description}</p>
    </div>
  )
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Kealee</span>
              <span className="text-sm text-emerald-600 font-semibold">Finance & Trust</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                Home
              </Link>
              <Link
                href="/contact"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A2B4A] via-[#1A2B4A] to-emerald-900 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Making Project Payments
            <span className="block text-emerald-400 mt-2">Safe and Clear for Everyone</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Kealee Finance &amp; Trust was built to solve the biggest problem in project payments:
            trust between homeowners and contractors when money is on the line.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-4">
                  Our Mission
                </span>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Fair payments, verified work, and peace of mind for every project.
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Too many building projects end in frustration. Homeowners worry about paying for
                  incomplete work. Contractors worry about not getting paid at all. The lack of trust
                  slows down projects, drives up costs, and leaves everyone unsatisfied.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  We created Kealee Finance &amp; Trust to eliminate that uncertainty. Our platform
                  holds project funds in secure escrow accounts, releases payments only when work is
                  verified, and gives both parties a clear view of every dollar at every stage.
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6">By the Numbers</h3>
                <div className="space-y-6">
                  <div>
                    <div className="text-3xl font-bold text-emerald-600">$250K</div>
                    <p className="text-gray-600 text-sm">FDIC insurance per depositor</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-emerald-600">24-48 hrs</div>
                    <p className="text-gray-600 text-sm">Contractor payout after approval</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-emerald-600">5 min</div>
                    <p className="text-gray-600 text-sm">Account setup time</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-emerald-600">$500</div>
                    <p className="text-gray-600 text-sm">Maximum escrow fee, any project size</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Escrow Works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How Escrow Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              A simple, secure process that protects both sides of every transaction.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-[#1A2B4A] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg">
                  1
                </div>
                <div className="flex-1 bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Project Setup</h3>
                  <p className="text-gray-600">
                    You and your contractor agree on the scope, price, and milestones for the project.
                    These milestones become the payment schedule in Kealee. Each milestone has a clear
                    deliverable and a dollar amount attached.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-[#1A2B4A] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg">
                  2
                </div>
                <div className="flex-1 bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Fund the Escrow Account</h3>
                  <p className="text-gray-600">
                    You deposit the project funds into your personal FDIC-insured escrow account. The
                    money is held securely and cannot be accessed by anyone without your approval.
                    The contractor can see that funds are available, giving them confidence to begin work.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-[#1A2B4A] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg">
                  3
                </div>
                <div className="flex-1 bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Work, Verify, Approve</h3>
                  <p className="text-gray-600">
                    As each milestone is completed, the work is verified by your project manager (or
                    self-verified for escrow-only accounts). You review the verification, check progress
                    photos, and approve the payment release with a single tap.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg">
                  4
                </div>
                <div className="flex-1 bg-emerald-50 rounded-xl p-6 border-2 border-emerald-300">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Contractor Gets Paid</h3>
                  <p className="text-gray-600">
                    Once approved, the milestone payment is released to the contractor within 24-48
                    hours. Your budget dashboard updates automatically. This cycle repeats for each
                    milestone until the project is complete.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Security &amp; Compliance</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Your financial data and funds are protected by the same standards used by major banks.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              <ComplianceBadge
                title="SOC 2"
                description="SOC 2 Type II certified for security and availability"
              />
              <ComplianceBadge
                title="256-bit"
                description="Bank-level SSL encryption for all data in transit"
              />
              <ComplianceBadge
                title="FDIC"
                description="Funds insured up to $250,000 per depositor"
              />
              <ComplianceBadge
                title="PCI"
                description="PCI-DSS Level 1 compliant for payment processing"
              />
            </div>

            <div className="bg-[#1A2B4A] rounded-2xl p-8 md:p-12 text-white">
              <h3 className="text-2xl font-bold mb-6">Licensed and Regulated</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-emerald-400 mb-2">Trust Account Compliance</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    All escrow funds are maintained in regulated trust accounts held at FDIC-insured
                    banking institutions. Funds are segregated from operating capital and audited
                    regularly to ensure compliance.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-emerald-400 mb-2">Data Protection</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Personal and financial data is encrypted at rest and in transit. We perform regular
                    security audits, penetration testing, and vulnerability assessments. Access to
                    sensitive data is restricted by role-based controls.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-emerald-400 mb-2">Fraud Prevention</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Multi-factor authentication, identity verification, and real-time transaction
                    monitoring protect against unauthorized access and fraudulent activity.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-emerald-400 mb-2">Regulatory Oversight</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Kealee operates in compliance with applicable state and federal regulations for
                    financial services and escrow management in the Maryland and District of Columbia
                    jurisdictions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Values */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Drives Us</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Our values shape every decision we make, from product design to customer support.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <ValueCard
              title="Clarity Over Complexity"
              description="Project finance should not require a law degree to understand. We use plain language, clear dashboards, and straightforward fee structures so everyone knows where they stand."
            />
            <ValueCard
              title="Fairness for Both Sides"
              description="We designed our platform to protect homeowners and contractors equally. Good work deserves prompt payment. Payments deserve verified work. Both are non-negotiable."
            />
            <ValueCard
              title="Security Without Compromise"
              description="We treat your money and data with the highest level of care. Bank-level encryption, FDIC insurance, and rigorous compliance are built into everything we do."
            />
            <ValueCard
              title="Local Knowledge"
              description="We know the DC-Baltimore corridor inside and out -- the contractors, the permit offices, the inspection processes. Local expertise means better service for our clients."
            />
            <ValueCard
              title="Technology That Serves People"
              description="Our platform automates the tedious parts of project finance so you can focus on what matters: getting your project done right, on time, and on budget."
            />
            <ValueCard
              title="Accountability at Every Level"
              description="From our internal operations to the contractors on our platform, we hold everyone to high standards. Verified credentials, documented work, and auditable transactions."
            />
          </div>
        </div>
      </section>

      {/* DC-Baltimore Corridor */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-[#1A2B4A] to-emerald-800 rounded-2xl p-8 md:p-12 text-white">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="inline-block px-3 py-1 bg-white/20 text-white rounded-full text-sm font-semibold mb-4">
                    Our Home Market
                  </span>
                  <h2 className="text-3xl font-bold mb-4">DC-Baltimore Corridor</h2>
                  <p className="text-gray-200 leading-relaxed mb-4">
                    Kealee Finance &amp; Trust is headquartered in the DC-Baltimore corridor, one of
                    the most active building markets in the Mid-Atlantic region. Our deep knowledge
                    of local regulations, permitting processes, and the contractor landscape gives our
                    clients an edge.
                  </p>
                  <p className="text-gray-200 leading-relaxed">
                    Whether you are renovating a row house in Baltimore, building an addition in
                    Bethesda, or managing a commercial project in DC, our team understands the local
                    context that makes your project unique.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/10 rounded-xl p-4">
                    <h4 className="font-semibold text-emerald-300 mb-1">Maryland</h4>
                    <p className="text-gray-300 text-sm">Baltimore, Montgomery County, Prince George&apos;s County, Howard County, Anne Arundel County</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <h4 className="font-semibold text-emerald-300 mb-1">District of Columbia</h4>
                    <p className="text-gray-300 text-sm">All wards and neighborhoods across the District</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <h4 className="font-semibold text-emerald-300 mb-1">Northern Virginia</h4>
                    <p className="text-gray-300 text-sm">Arlington, Fairfax, Loudoun, and surrounding areas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-emerald-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Protect Your Next Project?</h2>
          <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto">
            Set up your escrow account in minutes and start building with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/project/start"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-emerald-700 rounded-lg text-lg font-bold hover:bg-emerald-50 transition-colors shadow-lg"
            >
              Start Your Project
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white border-2 border-white rounded-lg text-lg font-semibold hover:bg-white hover:text-emerald-700 transition-colors"
            >
              Talk to Our Team
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-wrap justify-center gap-6 mb-6 text-sm">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/help" className="hover:text-white transition-colors">Help</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
          <p className="text-sm">&copy; 2026 Kealee Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
