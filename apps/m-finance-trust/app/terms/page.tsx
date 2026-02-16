import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | Kealee Finance & Trust',
  description: 'Terms of Service for the Kealee Finance & Trust platform. Read about service terms, user obligations, payment terms, and dispute resolution.',
}

export default function TermsOfServicePage() {
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
              <Link href="/privacy" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="bg-gray-50 border-b border-gray-200 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Terms of Service</h1>
            <p className="text-gray-500">Last updated: February 1, 2026</p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto prose-gray">
            {/* Introduction */}
            <div className="mb-10">
              <p className="text-gray-600 leading-relaxed mb-4">
                These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User,&quot; &quot;you,&quot; or &quot;your&quot;) and Kealee Platform, Inc. (&quot;Kealee,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) governing your access to and use of the Kealee Finance &amp; Trust platform, including our website, mobile applications, escrow services, payment processing, and related services (collectively, the &quot;Services&quot;).
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                By creating an account, accessing, or using our Services, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, you may not use our Services.
              </p>
              <p className="text-gray-600 leading-relaxed">
                If you are using the Services on behalf of a business or other legal entity, you represent that you have the authority to bind that entity to these Terms.
              </p>
            </div>

            {/* Section 1 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Description of Services</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Kealee Finance &amp; Trust provides a technology platform for construction project financial management, including but not limited to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li><strong>Escrow Services:</strong> Holding project funds in FDIC-insured accounts and releasing them based on milestone completion and user approval.</li>
                <li><strong>Payment Processing:</strong> Facilitating deposits, fund releases, and contractor payouts through integrated payment systems.</li>
                <li><strong>Budget Tracking:</strong> Real-time monitoring of project budgets, expenses, and financial status.</li>
                <li><strong>Milestone Management:</strong> Tools for defining, tracking, and approving project milestones tied to payment schedules.</li>
                <li><strong>Dispute Resolution:</strong> Mediation services for payment-related disputes between project parties.</li>
                <li><strong>Reporting:</strong> Financial reporting, transaction history, and tax documentation generation.</li>
              </ul>
              <p className="text-gray-600 leading-relaxed">
                Kealee acts as a technology platform and escrow agent. Kealee is not a bank, lending institution, general contractor, or construction company. We do not provide construction services, financial advice, legal advice, or guarantee the quality of any construction work.
              </p>
            </div>

            {/* Section 2 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Eligibility and Account Registration</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                To use our Services, you must:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li>Be at least 18 years of age.</li>
                <li>Be a legal resident of the United States or an entity organized under the laws of a U.S. state.</li>
                <li>Provide accurate, current, and complete information during registration and keep your account information updated.</li>
                <li>Maintain the security and confidentiality of your account credentials.</li>
                <li>Not have been previously suspended or removed from the platform.</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                For contractor accounts, you must additionally provide valid business licenses, proof of insurance, and other credentials as required by your jurisdiction. Kealee reserves the right to verify all credentials and deny access to any user who does not meet our verification standards.
              </p>
              <p className="text-gray-600 leading-relaxed">
                You are responsible for all activity that occurs under your account. You must immediately notify Kealee of any unauthorized use of your account or any other breach of security.
              </p>
            </div>

            {/* Section 3 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Escrow Account Terms</h2>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">3.1 Account Creation</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                When you create an escrow account, you agree to fund the account according to the project milestones and payment schedule established with your counterparty. Escrow accounts are established per project and are subject to the escrow fee described in Section 4.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">3.2 Fund Holding</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                All escrow funds are held in FDIC-insured accounts at our partner banking institution. Funds are insured up to $250,000 per depositor, per institution, in accordance with FDIC regulations. Kealee maintains escrow funds in segregated trust accounts separate from our operating funds.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">3.3 Fund Release</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Funds are released from escrow only upon satisfaction of the following conditions: (a) the contractor has submitted a milestone completion request, (b) any required verification has been completed, and (c) the project owner (homeowner) has approved the release through the platform. Fund releases are processed within 24-48 business hours of approval.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">3.4 Refund of Unused Funds</h3>
              <p className="text-gray-600 leading-relaxed">
                Upon project completion and final milestone approval, any remaining funds in the escrow account will be refunded to the depositing party within 5-7 business days via the original funding method, unless otherwise directed by the account holder or required by a dispute resolution process.
              </p>
            </div>

            {/* Section 4 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Fees and Payment Terms</h2>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">4.1 Escrow Fee</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Kealee charges a one-time escrow fee of 1% of the total project value, with a maximum cap of $500 per project. For users subscribed to Kealee PM Package C or Package D, the escrow fee is reduced to 0.5% of the project value. The escrow fee is charged at the time of account creation and is non-refundable once the escrow account has been established.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">4.2 Payment Processing Fees</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                The following fees apply to funding transactions:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li><strong>ACH bank transfers:</strong> No fee.</li>
                <li><strong>Credit or debit card payments:</strong> 2.9% of the transaction amount plus $0.30 per transaction.</li>
                <li><strong>Wire transfers:</strong> $25 flat fee per transfer.</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                Payment processing fees are the responsibility of the party initiating the payment unless otherwise agreed in writing between the project parties.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">4.3 Dispute Resolution Fee</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                If a dispute is submitted for mediation through our platform, a flat fee of $150 is charged to the party initiating the dispute. This fee covers the administrative costs of the mediation process.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">4.4 Rush Processing Fee</h3>
              <p className="text-gray-600 leading-relaxed">
                Expedited fund releases are available for a fee of $150 per request. Rush processing reduces the release timeline from 24-48 hours to approximately 4 business hours, subject to banking partner availability.
              </p>
            </div>

            {/* Section 5 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. User Obligations</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                By using our Services, you agree to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Provide truthful, accurate, and complete information in all interactions with the platform.</li>
                <li>Use the Services only for lawful purposes related to construction project management and finance.</li>
                <li>Not use the platform for money laundering, fraud, or any other illegal activity.</li>
                <li>Comply with all applicable local, state, and federal laws and regulations.</li>
                <li>Not interfere with or disrupt the security, integrity, or performance of the platform.</li>
                <li>Not attempt to gain unauthorized access to other users&apos; accounts or Kealee systems.</li>
                <li>Not use automated tools, bots, or scripts to access the platform without written consent.</li>
                <li>Respond promptly to milestone approvals, dispute notices, and other time-sensitive requests.</li>
                <li>Maintain valid and up-to-date payment methods for funding and receiving payments.</li>
              </ul>
            </div>

            {/* Section 6 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Contractor-Specific Obligations</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                If you register as a contractor, you additionally agree to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Maintain all required business licenses, permits, and insurance policies in good standing throughout the duration of any active project on the platform.</li>
                <li>Accurately represent the completion status of milestones and submit truthful completion requests.</li>
                <li>Perform all work in compliance with applicable building codes and industry standards.</li>
                <li>Promptly address and resolve any deficiencies identified during the verification process.</li>
                <li>Cooperate fully with any dispute resolution proceedings.</li>
              </ul>
            </div>

            {/* Section 7 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Dispute Resolution</h2>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">7.1 Platform Mediation</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                In the event of a dispute between project parties regarding milestone completion, payment amounts, or work quality, either party may initiate the Kealee dispute resolution process. Upon initiation, relevant escrow funds will be frozen until the dispute is resolved. Kealee will assign a mediation specialist to review documentation, communicate with both parties, and propose a resolution.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">7.2 Mediation Outcomes</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Mediation outcomes may include full or partial release of disputed funds, direction to correct deficiencies, or other remedies agreed upon by the parties. Mediation outcomes are non-binding recommendations unless both parties agree in writing to accept them as binding.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">7.3 Disputes with Kealee</h3>
              <p className="text-gray-600 leading-relaxed">
                Any disputes between you and Kealee relating to these Terms or our Services shall first be addressed through good-faith negotiations. If negotiations fail, disputes shall be resolved through binding arbitration administered by the American Arbitration Association (AAA) under its Commercial Arbitration Rules, conducted in the state of Maryland. Each party shall bear its own costs and attorney&apos;s fees unless the arbitrator determines otherwise.
              </p>
            </div>

            {/* Section 8 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, KEALEE AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OR INABILITY TO USE THE SERVICES.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                KEALEE&apos;S TOTAL AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICES SHALL NOT EXCEED THE TOTAL AMOUNT OF FEES PAID BY YOU TO KEALEE DURING THE TWELVE (12) MONTHS PRECEDING THE DATE OF THE CLAIM.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Kealee does not guarantee the quality, timeliness, or completion of any construction work performed by contractors on the platform. Kealee is not responsible for the actions or omissions of any contractor, homeowner, or other user of the platform. Users engage with each other at their own risk, and Kealee&apos;s role is limited to providing the technology platform and escrow services described herein.
              </p>
            </div>

            {/* Section 9 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Indemnification</h2>
              <p className="text-gray-600 leading-relaxed">
                You agree to indemnify, defend, and hold harmless Kealee and its officers, directors, employees, agents, and affiliates from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorney&apos;s fees) arising out of or related to: (a) your use of or access to the Services, (b) your violation of these Terms, (c) your violation of any applicable law or regulation, (d) any dispute between you and another user of the platform, or (e) any content or information you provide through the platform.
              </p>
            </div>

            {/* Section 10 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Intellectual Property</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                The Kealee platform, including all content, features, functionality, software, designs, trademarks, and documentation, is owned by Kealee Platform, Inc. and is protected by United States and international intellectual property laws. You are granted a limited, non-exclusive, non-transferable, revocable license to access and use the Services for their intended purpose.
              </p>
              <p className="text-gray-600 leading-relaxed">
                You may not copy, modify, distribute, sell, lease, or create derivative works based on the platform or any of its content without our prior written consent.
              </p>
            </div>

            {/* Section 11 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Termination</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                You may close your account at any time by contacting support. Account closure is subject to the completion or resolution of any active escrow accounts and outstanding obligations.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Kealee reserves the right to suspend or terminate your account at any time, with or without notice, for any reason, including but not limited to: violation of these Terms, fraudulent activity, failure to maintain required credentials, or any conduct that we determine, in our sole discretion, is harmful to the platform, other users, or Kealee.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Upon termination, your right to use the Services will immediately cease. Sections that by their nature should survive termination shall survive, including but not limited to Sections 7 through 14.
              </p>
            </div>

            {/* Section 12 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Governing Law and Jurisdiction</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the State of Maryland, without regard to its conflict of law provisions. For any disputes not subject to arbitration under Section 7.3, you agree to submit to the exclusive personal jurisdiction of the state and federal courts located in Montgomery County, Maryland, or the United States District Court for the District of Maryland.
              </p>
              <p className="text-gray-600 leading-relaxed">
                To the extent that our Services involve activities within the District of Columbia, the applicable laws of the District of Columbia shall apply to those specific activities.
              </p>
            </div>

            {/* Section 13 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Changes to These Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                Kealee reserves the right to modify these Terms at any time. We will provide notice of material changes by posting the updated Terms on our website with a revised &quot;Last Updated&quot; date and, for material changes, by notifying you via email or through the platform at least 30 days prior to the changes taking effect. Your continued use of the Services after the effective date of any modifications constitutes your acceptance of the updated Terms. If you do not agree to the modified Terms, you must discontinue use of the Services.
              </p>
            </div>

            {/* Section 14 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. General Provisions</h2>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">14.1 Entire Agreement</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                These Terms, together with our Privacy Policy and any additional agreements executed between you and Kealee, constitute the entire agreement between you and Kealee regarding the Services and supersede all prior agreements and understandings.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">14.2 Severability</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary so that these Terms shall otherwise remain in full force and effect.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">14.3 Waiver</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                The failure of Kealee to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">14.4 Assignment</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                You may not assign or transfer these Terms or your rights hereunder without the prior written consent of Kealee. Kealee may assign these Terms without restriction.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">14.5 Force Majeure</h3>
              <p className="text-gray-600 leading-relaxed">
                Kealee shall not be liable for any failure or delay in performance of its obligations under these Terms due to circumstances beyond its reasonable control, including but not limited to natural disasters, acts of government, pandemic, war, terrorism, labor disputes, internet or infrastructure outages, or banking system failures.
              </p>
            </div>

            {/* Contact */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Contact Information</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have any questions about these Terms, please contact us:
              </p>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <p className="text-gray-900 font-semibold mb-3">Kealee Platform, Inc.</p>
                <div className="space-y-1 text-gray-600 text-sm">
                  <p>Legal Department</p>
                  <p>
                    Email:{' '}
                    <a href="mailto:legal@kealee.com" className="text-emerald-600 hover:underline">
                      legal@kealee.com
                    </a>
                  </p>
                  <p>
                    Phone:{' '}
                    <a href="tel:3015758777" className="text-emerald-600 hover:underline">
                      (301) 575-8777
                    </a>
                  </p>
                  <p>Region: DC-Baltimore Corridor, Maryland</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-wrap justify-center gap-6 mb-6 text-sm">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link href="/help" className="hover:text-white transition-colors">Help</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
          <p className="text-sm">&copy; 2026 Kealee Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
