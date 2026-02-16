import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Help & Support | Kealee Finance & Trust',
  description: 'Get help with escrow accounts, payments, milestone releases, and dispute resolution. Contact our support team for assistance.',
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{question}</h3>
      <p className="text-gray-600 leading-relaxed">{answer}</p>
    </div>
  )
}

function KBCategory({
  title,
  description,
  articles,
  color,
}: {
  title: string
  description: string
  articles: string[]
  color: string
}) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    red: 'bg-red-100 text-red-700 border-red-200',
  }

  return (
    <div className={`rounded-xl border p-6 ${colorMap[color] || colorMap.emerald}`}>
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm opacity-80 mb-4">{description}</p>
      <ul className="space-y-2">
        {articles.map((article, i) => (
          <li key={i} className="text-sm font-medium opacity-90 flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
            {article}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
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
      <section className="bg-[#1A2B4A] py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Help & Support</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Find answers to common questions or reach out to our team. We are here to help you
            navigate escrow, payments, and everything in between.
          </p>
        </div>
      </section>

      {/* Emergency Support Banner */}
      <section className="bg-red-50 border-b border-red-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full uppercase tracking-wide">
              Emergency
            </span>
            <p className="text-red-800 font-medium text-sm">
              For urgent payment or escrow issues, call our emergency line:{' '}
              <a href="tel:3015758777" className="underline font-bold">
                (301) 575-8777
              </a>{' '}
              — available 24/7 for active escrow accounts.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Quick answers to the questions we hear most from homeowners and contractors.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            <FAQItem
              question="What is construction escrow and how does it protect me?"
              answer="Construction escrow is a secure holding account for your project funds. When you deposit money into escrow, it is held in an FDIC-insured account and only released when specific milestones are completed and approved. This protects homeowners from paying for unfinished work and guarantees contractors that funds are available when they complete verified work."
            />

            <FAQItem
              question="How are milestone payments released?"
              answer="When a contractor completes a project milestone, they submit a completion request through the platform. Your project manager then verifies the work quality and completeness. Once verified, you receive a notification to review and approve the release. After your approval, funds are transferred to the contractor within 24-48 hours."
            />

            <FAQItem
              question="What happens if there is a dispute over completed work?"
              answer="If you disagree with a milestone completion claim, funds remain frozen in your escrow account while the dispute is resolved. Kealee provides professional mediation services for a flat fee of $150. Our mediation team reviews documentation, photos, and statements from both parties to reach a fair resolution. If mediation does not resolve the issue, the dispute can be escalated through the legal process outlined in the service agreement."
            />

            <FAQItem
              question="Are my funds insured and protected?"
              answer="Yes. All escrow funds are held in FDIC-insured accounts at our partner bank, insured up to $250,000 per depositor. We use 256-bit SSL encryption, are PCI-DSS Level 1 compliant, and maintain SOC 2 Type II certification. Your money is as safe as it would be in your own bank."
            />

            <FAQItem
              question="How long does it take to set up an escrow account?"
              answer="You can create an escrow account in about 5 minutes. You will need your project details, contract amount, and milestone schedule. Once created, you can fund the account via ACH bank transfer (3-5 business days, no fees), credit card (instant, 2.9% + $0.30 fee), or wire transfer (same day, $25 fee)."
            />

            <FAQItem
              question="Can I add more funds to my escrow account later?"
              answer="Absolutely. You can add funds at any time through your dashboard. This is common when change orders are approved or when the project scope expands. Your budget tracking dashboard will automatically update to reflect the new total."
            />

            <FAQItem
              question="What fees does Kealee charge for escrow services?"
              answer="Kealee charges a one-time escrow fee of 1% of the project value, capped at a maximum of $500 per project. If you are subscribed to our PM Package C or D, the rate is reduced to 0.5%. Payment processing fees depend on your funding method: ACH transfers are free, credit cards are 2.9% + $0.30, and wire transfers are a flat $25."
            />

            <FAQItem
              question="What happens to unused funds when my project is complete?"
              answer="Any remaining funds in your escrow account after the final milestone is approved and released are refunded to you. Refunds are processed via the same method used to fund the account and typically arrive within 5-7 business days."
            />
          </div>
        </div>
      </section>

      {/* Knowledge Base Categories */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Knowledge Base</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Browse our guides and articles organized by topic.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <KBCategory
              title="Getting Started"
              description="New to Kealee? Start here."
              color="emerald"
              articles={[
                'How to create your first escrow account',
                'Understanding milestone-based payments',
                'Setting up your project budget',
                'Inviting your contractor to the platform',
                'Funding your account step by step',
              ]}
            />

            <KBCategory
              title="Payments & Funding"
              description="Everything about money movement."
              color="blue"
              articles={[
                'Accepted payment methods and fees',
                'How ACH transfers work',
                'Processing times for each payment type',
                'Understanding payment confirmations',
                'Requesting a refund of unused funds',
              ]}
            />

            <KBCategory
              title="Escrow & Milestones"
              description="Managing your protected funds."
              color="amber"
              articles={[
                'How escrow protection works',
                'Creating and editing milestones',
                'Approving a milestone release',
                'Viewing your escrow balance and history',
                'What FDIC insurance covers',
              ]}
            />

            <KBCategory
              title="Disputes & Resolution"
              description="When things do not go as planned."
              color="red"
              articles={[
                'How to file a dispute',
                'The mediation process explained',
                'What happens to funds during a dispute',
                'Escalation options beyond mediation',
                'Preventing disputes with clear milestones',
              ]}
            />
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Contact Support</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Cannot find what you are looking for? Our support team is ready to help.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">@</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-600 text-sm mb-3">
                Send us a detailed message and we will respond within one business day.
              </p>
              <a
                href="mailto:support@kealee.com"
                className="text-emerald-600 font-semibold hover:underline"
              >
                support@kealee.com
              </a>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">T</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone Support</h3>
              <p className="text-gray-600 text-sm mb-3">
                Speak with a support specialist during business hours.
              </p>
              <a
                href="tel:3015758777"
                className="text-emerald-600 font-semibold hover:underline"
              >
                (301) 575-8777
              </a>
              <p className="text-xs text-gray-500 mt-1">Mon-Fri 9AM - 6PM ET</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">!</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Emergency Line</h3>
              <p className="text-gray-600 text-sm mb-3">
                For urgent escrow or payment issues that cannot wait.
              </p>
              <a
                href="tel:3015758777"
                className="text-red-600 font-semibold hover:underline"
              >
                (301) 575-8777
              </a>
              <p className="text-xs text-gray-500 mt-1">24/7 for active escrow accounts</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-wrap justify-center gap-6 mb-6 text-sm">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
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
