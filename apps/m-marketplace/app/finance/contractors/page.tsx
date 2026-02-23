import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'For Contractors | Kealee Finance & Trust',
  description: 'Get paid faster with Kealee Finance. Escrow-protected payments, milestone-based releases, and guaranteed funds for verified project work.',
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number
  title: string
  description: string
}) {
  return (
    <div className="relative bg-white rounded-xl border border-gray-200 p-8 text-center hover:shadow-lg transition-shadow">
      <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold shadow-lg">
        {number}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

function BenefitRow({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-emerald-600 text-sm font-bold">&#10003;</span>
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

export default function ContractorsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/finance" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Kealee</span>
              <span className="text-sm text-emerald-600 font-semibold">Finance & Trust</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/finance" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                Home
              </Link>
              <Link href="/finance/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                Sign In
              </Link>
              <Link
                href="/finance/project/start"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1A2B4A] via-[#1A2B4A] to-emerald-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyek0zNiAxNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>

        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F59E0B]/20 text-[#F59E0B] rounded-full text-sm font-medium mb-6">
              For Contractors &amp; Trade Professionals
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Get Paid Faster
              <span className="block text-emerald-400 mt-2">with Kealee Finance</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              No more chasing payments. Funds are secured in escrow before you start,
              and released as soon as your work is verified.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/finance/project/start"
                className="inline-flex items-center justify-center px-8 py-4 bg-emerald-500 text-white rounded-lg text-lg font-bold hover:bg-emerald-600 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
              >
                Join Kealee Today
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white border-2 border-white rounded-lg text-lg font-semibold hover:bg-white hover:text-[#1A2B4A] transition-all"
              >
                See How It Works
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-gray-300 text-sm">
              <span className="flex items-center gap-2">
                <span className="text-emerald-400">&#10003;</span>
                Guaranteed funds before work starts
              </span>
              <span className="flex items-center gap-2">
                <span className="text-emerald-400">&#10003;</span>
                24-48 hour payouts after approval
              </span>
              <span className="flex items-center gap-2">
                <span className="text-emerald-400">&#10003;</span>
                Free to join, no monthly fees
              </span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-4">
              WHY CONTRACTORS CHOOSE KEALEE
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built to Solve Your Biggest Payment Problems
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Stop worrying about getting paid. Kealee secures funds upfront and releases them
              the moment your work is verified.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            <BenefitRow
              title="Escrow-Protected Payments"
              description="Project funds are deposited into a secure escrow account before work begins. You can see the funds are there, giving you confidence to start the job."
            />
            <BenefitRow
              title="Milestone-Based Releases"
              description="Get paid as you complete each phase of work, not just at the end of the project. Steady cash flow keeps your business running smoothly."
            />
            <BenefitRow
              title="Faster Payouts"
              description="Once work is verified and the homeowner approves, your payment is processed immediately. Funds hit your account within 24-48 hours."
            />
            <BenefitRow
              title="No More Payment Chasing"
              description="The money is already in escrow. No awkward conversations, no late payments, no collections. Approve, release, done."
            />
            <BenefitRow
              title="Fair Dispute Resolution"
              description="If there is a disagreement, funds are frozen (not lost) and our mediation team helps work it out. A flat $150 fee, no expensive lawyers."
            />
            <BenefitRow
              title="Build Your Verified Track Record"
              description="Every completed project on Kealee adds to your verified profile. Homeowners can see your track record, leading to more project opportunities."
            />
            <BenefitRow
              title="Professional Dashboard"
              description="Track all your active projects, pending payments, completed milestones, and earnings in one clean dashboard. No spreadsheets needed."
            />
            <BenefitRow
              title="Automatic Tax Documentation"
              description="1099s and payment records are generated automatically at year end. Kealee handles the paperwork so you can focus on the work."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works for Contractors
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps from job start to payment in your account.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
            <StepCard
              number={1}
              title="Get Invited to a Project"
              description="A homeowner creates a project on Kealee and invites you, or you connect through our marketplace. Review the project scope, milestones, and budget. Accept the contract through the platform."
            />
            <StepCard
              number={2}
              title="Complete Work & Submit"
              description="Do great work as agreed. When you finish a milestone, submit a completion request through the app with progress photos and documentation. The project manager or homeowner reviews it."
            />
            <StepCard
              number={3}
              title="Get Paid in 24-48 Hours"
              description="Once your work is verified and the homeowner approves the release, your payment is processed immediately. Funds arrive in your bank account within 24-48 hours via direct deposit."
            />
          </div>

          {/* Visual Flow */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6 text-center">The Payment Flow</h3>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center">
                <div className="flex-1">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 font-bold">$</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Homeowner Funds Escrow</p>
                  <p className="text-xs text-gray-500">Before work starts</p>
                </div>
                <div className="text-gray-300 text-2xl hidden md:block">&rarr;</div>
                <div className="flex-1">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-amber-600 font-bold">&#9881;</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">You Complete a Milestone</p>
                  <p className="text-xs text-gray-500">Submit for verification</p>
                </div>
                <div className="text-gray-300 text-2xl hidden md:block">&rarr;</div>
                <div className="flex-1">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-purple-600 font-bold">&#10003;</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Work is Verified</p>
                  <p className="text-xs text-gray-500">PM or homeowner approves</p>
                </div>
                <div className="text-gray-300 text-2xl hidden md:block">&rarr;</div>
                <div className="flex-1">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-emerald-600 font-bold">$</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">You Get Paid</p>
                  <p className="text-xs text-gray-500">24-48 hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Fee Structure */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Clear, Simple Pricing for Contractors
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              No monthly fees. No subscription. You only pay when you get paid.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {/* Free to Join */}
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-8 text-center relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-xs font-bold">
                  MOST POPULAR
                </span>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Join the Platform</h3>
                <div className="text-4xl font-bold text-emerald-600 mb-1">Free</div>
                <p className="text-gray-500 text-sm mb-6">No monthly or annual fees</p>
                <ul className="text-left text-sm text-gray-600 space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold mt-0.5">&#10003;</span>
                    Create your contractor profile
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold mt-0.5">&#10003;</span>
                    Accept project invitations
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold mt-0.5">&#10003;</span>
                    Dashboard and milestone tracking
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold mt-0.5">&#10003;</span>
                    Automatic 1099 generation
                  </li>
                </ul>
              </div>

              {/* Payout Fee */}
              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Payout Processing</h3>
                <div className="text-4xl font-bold text-gray-900 mb-1">0.25%</div>
                <p className="text-gray-500 text-sm mb-6">Per payout via Stripe Connect</p>
                <ul className="text-left text-sm text-gray-600 space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold mt-0.5">&#10003;</span>
                    Direct deposit to your bank
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold mt-0.5">&#10003;</span>
                    Processed within 24-48 hours
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold mt-0.5">&#10003;</span>
                    Detailed payment receipts
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold mt-0.5">&#10003;</span>
                    Secure Stripe processing
                  </li>
                </ul>
              </div>

              {/* Rush Processing */}
              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Rush Payout</h3>
                <div className="text-4xl font-bold text-gray-900 mb-1">$150</div>
                <p className="text-gray-500 text-sm mb-6">Optional, per request</p>
                <ul className="text-left text-sm text-gray-600 space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold mt-0.5">&#10003;</span>
                    Funds in ~4 business hours
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold mt-0.5">&#10003;</span>
                    Available on any milestone
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold mt-0.5">&#10003;</span>
                    Priority support included
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold mt-0.5">&#10003;</span>
                    Great for payroll deadlines
                  </li>
                </ul>
              </div>
            </div>

            {/* Example Calculation */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4">Example: $50,000 Kitchen Remodel (4 Milestones)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-gray-700 font-semibold">Milestone</th>
                      <th className="text-right py-2 text-gray-700 font-semibold">Amount</th>
                      <th className="text-right py-2 text-gray-700 font-semibold">Payout Fee (0.25%)</th>
                      <th className="text-right py-2 text-gray-700 font-semibold">You Receive</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 text-gray-600">Demo &amp; Prep</td>
                      <td className="py-2 text-right text-gray-900">$10,000</td>
                      <td className="py-2 text-right text-gray-500">$25.00</td>
                      <td className="py-2 text-right text-emerald-600 font-semibold">$9,975.00</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 text-gray-600">Rough-In (Plumbing/Electric)</td>
                      <td className="py-2 text-right text-gray-900">$15,000</td>
                      <td className="py-2 text-right text-gray-500">$37.50</td>
                      <td className="py-2 text-right text-emerald-600 font-semibold">$14,962.50</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 text-gray-600">Cabinets &amp; Counters</td>
                      <td className="py-2 text-right text-gray-900">$15,000</td>
                      <td className="py-2 text-right text-gray-500">$37.50</td>
                      <td className="py-2 text-right text-emerald-600 font-semibold">$14,962.50</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-gray-600">Final Punch List</td>
                      <td className="py-2 text-right text-gray-900">$10,000</td>
                      <td className="py-2 text-right text-gray-500">$25.00</td>
                      <td className="py-2 text-right text-emerald-600 font-semibold">$9,975.00</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300">
                      <td className="py-3 font-bold text-gray-900">Total</td>
                      <td className="py-3 text-right font-bold text-gray-900">$50,000</td>
                      <td className="py-3 text-right font-bold text-gray-500">$125.00</td>
                      <td className="py-3 text-right font-bold text-emerald-600">$49,875.00</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Total cost to you: $125 on a $50,000 project (0.25%). Compare that to the cost of late payments,
                collections, or unpaid invoices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Kealee vs. the Old Way</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              See what changes when your payments are protected by escrow.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-3 border-b border-gray-200 bg-gray-50">
                <div className="p-4 font-semibold text-gray-900 text-sm"></div>
                <div className="p-4 font-semibold text-gray-500 text-sm text-center">Without Kealee</div>
                <div className="p-4 font-semibold text-emerald-600 text-sm text-center">With Kealee</div>
              </div>
              <div className="divide-y divide-gray-100">
                <div className="grid grid-cols-3">
                  <div className="p-4 text-sm font-medium text-gray-900">Payment Guarantee</div>
                  <div className="p-4 text-sm text-gray-500 text-center">Hope for the best</div>
                  <div className="p-4 text-sm text-emerald-600 text-center font-semibold">Funds secured in escrow</div>
                </div>
                <div className="grid grid-cols-3 bg-gray-50">
                  <div className="p-4 text-sm font-medium text-gray-900">Time to Get Paid</div>
                  <div className="p-4 text-sm text-gray-500 text-center">30-90 days (or never)</div>
                  <div className="p-4 text-sm text-emerald-600 text-center font-semibold">24-48 hours</div>
                </div>
                <div className="grid grid-cols-3">
                  <div className="p-4 text-sm font-medium text-gray-900">Payment Disputes</div>
                  <div className="p-4 text-sm text-gray-500 text-center">Lawyers and lawsuits</div>
                  <div className="p-4 text-sm text-emerald-600 text-center font-semibold">$150 flat-fee mediation</div>
                </div>
                <div className="grid grid-cols-3 bg-gray-50">
                  <div className="p-4 text-sm font-medium text-gray-900">Cash Flow</div>
                  <div className="p-4 text-sm text-gray-500 text-center">Unpredictable</div>
                  <div className="p-4 text-sm text-emerald-600 text-center font-semibold">Milestone-based, predictable</div>
                </div>
                <div className="grid grid-cols-3">
                  <div className="p-4 text-sm font-medium text-gray-900">Tax Docs</div>
                  <div className="p-4 text-sm text-gray-500 text-center">Track it yourself</div>
                  <div className="p-4 text-sm text-emerald-600 text-center font-semibold">Generated automatically</div>
                </div>
                <div className="grid grid-cols-3 bg-gray-50">
                  <div className="p-4 text-sm font-medium text-gray-900">Reputation</div>
                  <div className="p-4 text-sm text-gray-500 text-center">Word of mouth</div>
                  <div className="p-4 text-sm text-emerald-600 text-center font-semibold">Verified track record</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial-style Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-[#1A2B4A] to-emerald-800 rounded-2xl p-8 md:p-12">
              <div className="grid md:grid-cols-3 gap-8 text-white text-center">
                <div>
                  <div className="text-4xl font-bold text-emerald-400 mb-2">24-48h</div>
                  <p className="text-gray-300 text-sm">Average payment time after approval</p>
                </div>
                <div>
                  <div className="text-4xl font-bold text-emerald-400 mb-2">0.25%</div>
                  <p className="text-gray-300 text-sm">Your only cost per payout</p>
                </div>
                <div>
                  <div className="text-4xl font-bold text-emerald-400 mb-2">$0</div>
                  <p className="text-gray-300 text-sm">Monthly or annual platform fee</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-emerald-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Stop Chasing Payments?
            </h2>
            <p className="text-xl text-emerald-100 mb-8">
              Join Kealee today and get paid reliably for every project. Free to sign up, no commitment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/finance/project/start"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-emerald-700 rounded-lg text-lg font-bold hover:bg-emerald-50 transition-colors shadow-lg"
              >
                Create Your Contractor Profile
              </Link>
              <Link
                href="/finance/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white border-2 border-white rounded-lg text-lg font-semibold hover:bg-white hover:text-emerald-700 transition-colors"
              >
                Talk to Our Team
              </Link>
            </div>
            <p className="text-emerald-200 text-sm mt-6">
              Questions? Contact us at{' '}
              <a href="mailto:finance@kealee.com" className="underline text-white">
                finance@kealee.com
              </a>{' '}
              or call{' '}
              <a href="tel:3015758777" className="underline text-white">
                (301) 575-8777
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-wrap justify-center gap-6 mb-6 text-sm">
            <Link href="/finance" className="hover:text-white transition-colors">Home</Link>
            <Link href="/finance/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/finance/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link href="/finance/help" className="hover:text-white transition-colors">Help</Link>
            <Link href="/finance/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/finance/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
          <p className="text-sm">&copy; 2026 Kealee Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
