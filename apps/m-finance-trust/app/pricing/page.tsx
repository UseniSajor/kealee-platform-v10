import Link from 'next/link';
import { Check, Shield, Zap, Lock, DollarSign } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Transparent, Fair Pricing
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Simple, affordable fees that protect both homeowners and contractors. No hidden costs, no surprises.
          </p>
        </div>

        {/* Main Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">
          {/* Escrow Fee */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-emerald-500 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </span>
            </div>
            
            <div className="text-center mb-6">
              <Shield className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Escrow Protection
              </h2>
              <div className="text-5xl font-bold text-slate-900 mb-2">
                1%
              </div>
              <p className="text-slate-600">
                of project amount<br />
                <span className="text-sm">(Maximum $500 per project)</span>
              </p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">Milestone-based fund releases</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">3-party approval system</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">Dispute resolution support</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">Payment protection guarantee</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">Full transaction history</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">Automated release triggers</span>
              </div>
            </div>

            <Link
              href="/escrow/new"
              className="block w-full text-center py-3 px-6 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Create Escrow Account
            </Link>
          </div>

          {/* Payment Processing */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
            <div className="text-center mb-6">
              <DollarSign className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Payment Processing
              </h2>
              <div className="text-5xl font-bold text-slate-900 mb-2">
                2.9%
              </div>
              <p className="text-slate-600">
                + $0.30 per transaction
              </p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">Credit card processing</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">ACH bank transfers</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">Instant payment confirmation</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">Fraud protection included</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">PCI compliance handled</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">Automatic invoicing</span>
              </div>
            </div>

            <Link
              href="/deposit"
              className="block w-full text-center py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Make a Payment
            </Link>
          </div>
        </div>

        {/* Package Discounts */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8 max-w-5xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-6">
            📦 Package Discounts Available
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Package C Subscribers
              </h3>
              <p className="text-slate-700 mb-3">
                Save on escrow fees when you subscribe to Package C or D
              </p>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                0.5%
              </div>
              <p className="text-sm text-slate-600">
                Reduced escrow fee (normally 1%)
              </p>
            </div>
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Enterprise Package D
              </h3>
              <p className="text-slate-700 mb-3">
                Premium customers get the best rates
              </p>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                0.5%
              </div>
              <p className="text-sm text-slate-600">
                + priority support for fund releases
              </p>
            </div>
          </div>
        </div>

        {/* Fee Breakdown Examples */}
        <div className="max-w-5xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">
            Example Fee Calculations
          </h2>
          
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                      Project Amount
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                      Escrow Fee (1%)
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                      Package C/D Rate (0.5%)
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                      Your Savings
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="px-6 py-4 text-slate-700">$50,000</td>
                    <td className="px-6 py-4 text-slate-900 font-semibold">$500</td>
                    <td className="px-6 py-4 text-emerald-600 font-semibold">$250</td>
                    <td className="px-6 py-4 text-purple-600 font-semibold">Save $250</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="px-6 py-4 text-slate-700">$100,000</td>
                    <td className="px-6 py-4 text-slate-900 font-semibold">$500 (max)</td>
                    <td className="px-6 py-4 text-emerald-600 font-semibold">$500</td>
                    <td className="px-6 py-4 text-purple-600 font-semibold">Same rate</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-slate-700">$250,000</td>
                    <td className="px-6 py-4 text-slate-900 font-semibold">$500 (max)</td>
                    <td className="px-6 py-4 text-emerald-600 font-semibold">$500</td>
                    <td className="px-6 py-4 text-purple-600 font-semibold">Same rate</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="px-6 py-4 text-slate-700">$500,000+</td>
                    <td className="px-6 py-4 text-slate-900 font-semibold">$500 (max)</td>
                    <td className="px-6 py-4 text-emerald-600 font-semibold">$500</td>
                    <td className="px-6 py-4 text-slate-600">Contact for enterprise rates</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-center text-sm text-slate-600 mt-4">
            💡 Escrow fees are capped at $500 regardless of project size
          </p>
        </div>

        {/* Additional Services */}
        <div className="max-w-5xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">
            Additional Services
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <Zap className="h-10 w-10 text-yellow-500 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Rush Processing
              </h3>
              <p className="text-slate-600 mb-4 text-sm">
                Expedited fund release for urgent situations
              </p>
              <div className="text-2xl font-bold text-slate-900 mb-1">
                $150
              </div>
              <p className="text-xs text-slate-500">per rush request</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <Lock className="h-10 w-10 text-blue-500 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Dispute Resolution
              </h3>
              <p className="text-slate-600 mb-4 text-sm">
                Professional mediation for payment disputes
              </p>
              <div className="text-2xl font-bold text-slate-900 mb-1">
                $150
              </div>
              <p className="text-xs text-slate-500">flat fee</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <Shield className="h-10 w-10 text-purple-500 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Insurance Verification
              </h3>
              <p className="text-slate-600 mb-4 text-sm">
                Verify contractor insurance and bonds
              </p>
              <div className="text-2xl font-bold text-slate-900 mb-1">
                Free
              </div>
              <p className="text-xs text-slate-500">included with escrow</p>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="max-w-5xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">
            How We Compare
          </h2>
          
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">Feature</th>
                    <th className="px-6 py-4 text-center">Kealee Finance</th>
                    <th className="px-6 py-4 text-center">Traditional Escrow</th>
                    <th className="px-6 py-4 text-center">No Escrow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="px-6 py-4 font-medium text-slate-900">Escrow Fee</td>
                    <td className="px-6 py-4 text-center text-emerald-600 font-semibold">1% (max $500)</td>
                    <td className="px-6 py-4 text-center text-slate-600">2-3%</td>
                    <td className="px-6 py-4 text-center text-slate-400">N/A</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">Payment Protection</td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-slate-400 mx-auto" /></td>
                    <td className="px-6 py-4 text-center text-slate-400">✗</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium text-slate-900">Milestone Releases</td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-slate-400 mx-auto" /></td>
                    <td className="px-6 py-4 text-center text-slate-400">✗</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">Real-time Dashboard</td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                    <td className="px-6 py-4 text-center text-slate-400">✗</td>
                    <td className="px-6 py-4 text-center text-slate-400">✗</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium text-slate-900">Dispute Resolution</td>
                    <td className="px-6 py-4 text-center text-emerald-600 font-semibold">$150</td>
                    <td className="px-6 py-4 text-center text-slate-600">$500+</td>
                    <td className="px-6 py-4 text-center text-slate-600">Legal fees</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">Setup Time</td>
                    <td className="px-6 py-4 text-center text-emerald-600 font-semibold">5 minutes</td>
                    <td className="px-6 py-4 text-center text-slate-600">1-2 days</td>
                    <td className="px-6 py-4 text-center text-slate-400">N/A</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium text-slate-900">Support</td>
                    <td className="px-6 py-4 text-center text-emerald-600 font-semibold">24/7 Chat</td>
                    <td className="px-6 py-4 text-center text-slate-600">Business hours</td>
                    <td className="px-6 py-4 text-center text-slate-400">N/A</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">
            Pricing FAQs
          </h2>
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-bold text-slate-900 mb-2">
                When is the escrow fee charged?
              </h3>
              <p className="text-slate-600">
                The escrow fee is charged when you create the escrow account and fund it. It&apos;s a one-time fee per project, not per milestone.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-bold text-slate-900 mb-2">
                Who pays the processing fee?
              </h3>
              <p className="text-slate-600">
                The payment processing fee (2.9% + $0.30) is typically paid by the party making the payment (homeowner). However, this can be negotiated in your contract.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-bold text-slate-900 mb-2">
                Is there a minimum project size?
              </h3>
              <p className="text-slate-600">
                No minimum! Our $500 maximum escrow fee makes us especially attractive for larger projects ($50,000+), but we welcome projects of all sizes.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-bold text-slate-900 mb-2">
                Can I get a refund if I cancel?
              </h3>
              <p className="text-slate-600">
                Escrow fees are non-refundable once the account is created, as our protection is in place. However, if no funds have been released, we can work with you on disputed amounts.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-bold text-slate-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-slate-600">
                We accept all major credit cards (Visa, Mastercard, Amex, Discover) and ACH bank transfers. ACH transfers have lower fees and are recommended for larger amounts.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-bold text-slate-900 mb-2">
                How long do fund releases take?
              </h3>
              <p className="text-slate-600">
                Standard releases take 1-2 business days. Rush processing ($150) gets funds released within 4 business hours.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl p-12 text-center text-white max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Protect Your Next Project?
          </h2>
          <p className="text-xl mb-8 text-emerald-50">
            Set up your escrow account in 5 minutes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/escrow/new"
              className="px-8 py-3 bg-white text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
            >
              Create Escrow Account
            </Link>
            <Link
              href="/contact"
              className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Talk to an Expert
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
