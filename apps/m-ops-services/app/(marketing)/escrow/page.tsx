import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Construction Escrow & Finance | Kealee Operations Services",
  description: "Secure construction payments with FDIC-insured escrow accounts and milestone-based payment management.",
};

export default function EscrowPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20">
        <Image src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1920&q=80&auto=format&fit=crop" alt="Financial planning" fill className="object-cover" sizes="100vw" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-white mb-6">
              Construction Escrow & Finance
            </h1>
            <p className="text-xl text-white/80">
              Protect your construction payments with secure, milestone-based escrow accounts.
              Built for contractors, project owners, and lenders.
            </p>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-white border-b border-zinc-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-12 max-w-5xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🏦</span>
              </div>
              <div>
                <div className="font-bold text-zinc-900">FDIC Insured</div>
                <div className="text-sm text-zinc-600">Up to $250,000</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🔒</span>
              </div>
              <div>
                <div className="font-bold text-zinc-900">SOC 2 Compliant</div>
                <div className="text-sm text-zinc-600">Audited security</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🛡️</span>
              </div>
              <div>
                <div className="font-bold text-zinc-900">256-bit Encryption</div>
                <div className="text-sm text-zinc-600">Bank-level security</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <div className="font-bold text-zinc-900">$100M+ Processed</div>
                <div className="text-sm text-zinc-600">Trusted platform</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-zinc-900 text-center mb-12">
              Complete Construction Payment Management
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="border border-zinc-200 rounded-2xl p-8">
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl text-sky-600">🏦</span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">Escrow Accounts</h3>
                <p className="text-zinc-600">
                  Secure FDIC-insured accounts hold funds until project milestones are met
                  and approved by all parties.
                </p>
              </div>
              <div className="border border-zinc-200 rounded-2xl p-8">
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl text-sky-600">📊</span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">Milestone Payments</h3>
                <p className="text-zinc-600">
                  Release funds based on project progress. Track completion, approve work,
                  and process payments seamlessly.
                </p>
              </div>
              <div className="border border-zinc-200 rounded-2xl p-8">
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl text-sky-600">💳</span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">ACH & Wire Transfers</h3>
                <p className="text-zinc-600">
                  Multiple payment methods supported. Fast, secure transfers directly to
                  contractor and subcontractor accounts.
                </p>
              </div>
              <div className="border border-zinc-200 rounded-2xl p-8">
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl text-sky-600">📈</span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">Financial Reporting</h3>
                <p className="text-zinc-600">
                  Real-time visibility into project finances. Track budgets, payments, and
                  remaining funds with detailed reports.
                </p>
              </div>
              <div className="border border-zinc-200 rounded-2xl p-8">
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl text-sky-600">🔔</span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">Automated Alerts</h3>
                <p className="text-zinc-600">
                  Stay informed with notifications for payment requests, approvals, and
                  disbursements.
                </p>
              </div>
              <div className="border border-zinc-200 rounded-2xl p-8">
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl text-sky-600">📋</span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">Complete Audit Trail</h3>
                <p className="text-zinc-600">
                  Full transaction history with timestamps, documentation, and approval
                  records for compliance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-zinc-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-zinc-900 text-center mb-12">
              How Construction Escrow Works
            </h2>
            <div className="relative">
              {/* Connecting Line */}
              <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-sky-200 -translate-y-1/2" style={{ zIndex: 0 }}></div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative" style={{ zIndex: 1 }}>
                <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 bg-sky-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                    1
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-3">Fund Escrow</h3>
                  <p className="text-zinc-600">
                    Project owner deposits funds into a secure FDIC-insured escrow account.
                  </p>
                </div>
                <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 bg-sky-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                    2
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-3">Work Progresses</h3>
                  <p className="text-zinc-600">
                    Contractor completes milestones and submits documentation for payment.
                  </p>
                </div>
                <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 bg-sky-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                    3
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-3">Approve & Release</h3>
                  <p className="text-zinc-600">
                    Owner reviews work and approves payment release through the platform.
                  </p>
                </div>
                <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 bg-sky-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                    4
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-3">Funds Disbursed</h3>
                  <p className="text-zinc-600">
                    Payment is transferred to contractor via ACH or wire within 1-2 business days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Built-in Protections */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-zinc-900 text-center mb-12">
              Built-in Protections for Everyone
            </h2>
            <div className="grid md:grid-cols-2 gap-12">
              {/* For Project Owners */}
              <div className="border border-zinc-200 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-zinc-900 mb-6">For Project Owners</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="text-sky-600 mr-3 text-xl">✓</span>
                    <div>
                      <div className="font-bold text-zinc-900">Pay-as-you-go protection</div>
                      <div className="text-zinc-600 text-sm">Funds only released for completed work</div>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-sky-600 mr-3 text-xl">✓</span>
                    <div>
                      <div className="font-bold text-zinc-900">Approval workflows</div>
                      <div className="text-zinc-600 text-sm">Review and approve each payment before release</div>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-sky-600 mr-3 text-xl">✓</span>
                    <div>
                      <div className="font-bold text-zinc-900">Detailed documentation</div>
                      <div className="text-zinc-600 text-sm">Track all work and payments with evidence</div>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-sky-600 mr-3 text-xl">✓</span>
                    <div>
                      <div className="font-bold text-zinc-900">Dispute resolution</div>
                      <div className="text-zinc-600 text-sm">Fair mediation process for disagreements</div>
                    </div>
                  </li>
                </ul>
              </div>

              {/* For Contractors */}
              <div className="border border-zinc-200 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-zinc-900 mb-6">For Contractors</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="text-sky-600 mr-3 text-xl">✓</span>
                    <div>
                      <div className="font-bold text-zinc-900">Guaranteed funds</div>
                      <div className="text-zinc-600 text-sm">Know payment is secured before starting work</div>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-sky-600 mr-3 text-xl">✓</span>
                    <div>
                      <div className="font-bold text-zinc-900">Fast payment processing</div>
                      <div className="text-zinc-600 text-sm">Receive funds 1-2 days after approval</div>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-sky-600 mr-3 text-xl">✓</span>
                    <div>
                      <div className="font-bold text-zinc-900">Clear milestone criteria</div>
                      <div className="text-zinc-600 text-sm">Understand exactly what's required for payment</div>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-sky-600 mr-3 text-xl">✓</span>
                    <div>
                      <div className="font-bold text-zinc-900">Payment transparency</div>
                      <div className="text-zinc-600 text-sm">Real-time status updates on all requests</div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fee Schedule */}
      <section className="py-20 bg-zinc-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-zinc-900 text-center mb-12">
              Clear Fee Schedule
            </h2>
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="text-left py-4 px-6 font-bold text-zinc-900">Service</th>
                    <th className="text-right py-4 px-6 font-bold text-zinc-900">Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  <tr>
                    <td className="py-4 px-6 text-zinc-700">Escrow Account Setup</td>
                    <td className="text-right py-4 px-6 text-zinc-900 font-bold">$295</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-zinc-700">Monthly Account Maintenance</td>
                    <td className="text-right py-4 px-6 text-zinc-900 font-bold">$49/mo</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-zinc-700">Payment Processing (per transaction)</td>
                    <td className="text-right py-4 px-6 text-zinc-900 font-bold">0.5% (min $25)</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-zinc-700">ACH Transfer</td>
                    <td className="text-right py-4 px-6 text-zinc-900 font-bold">$5</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-zinc-700">Wire Transfer (domestic)</td>
                    <td className="text-right py-4 px-6 text-zinc-900 font-bold">$25</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-zinc-700">Wire Transfer (international)</td>
                    <td className="text-right py-4 px-6 text-zinc-900 font-bold">$45</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-center text-zinc-600 mt-6">
              All fees clearly disclosed. No hidden charges. Volume discounts available for large projects.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-sky-600">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Protect Your Construction Payments
            </h2>
            <p className="text-xl text-sky-100 mb-8">
              Set up a secure escrow account today and eliminate payment disputes on your next project.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-white text-sky-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-zinc-50 transition-colors"
            >
              Get Started with Escrow
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
