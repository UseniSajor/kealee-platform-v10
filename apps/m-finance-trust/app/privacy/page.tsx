import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | Kealee Finance & Trust',
  description: 'Learn how Kealee Finance & Trust collects, uses, and protects your personal and financial information.',
}

export default function PrivacyPolicyPage() {
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
              <Link href="/terms" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="bg-gray-50 border-b border-gray-200 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Privacy Policy</h1>
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
                Kealee Platform, Inc. (&quot;Kealee,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy and the security of your personal and financial information. This Privacy Policy describes how we collect, use, disclose, and safeguard your information when you use the Kealee Finance &amp; Trust platform, including our website, mobile applications, and related services (collectively, the &quot;Services&quot;).
              </p>
              <p className="text-gray-600 leading-relaxed">
                By using our Services, you consent to the data practices described in this policy. If you do not agree with the practices described herein, please do not use our Services.
              </p>
            </div>

            {/* Section 1 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">1.1 Information You Provide</h3>
              <p className="text-gray-600 leading-relaxed mb-3">
                We collect information that you voluntarily provide when you register for an account, create an escrow account, make a payment, or communicate with us. This may include:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li>Full name, email address, phone number, and mailing address</li>
                <li>Date of birth and government-issued identification for identity verification</li>
                <li>Bank account information, payment card details, and other financial information necessary to process transactions</li>
                <li>Business name, license numbers, and insurance information (for contractors)</li>
                <li>Project details, contract documents, and milestone schedules</li>
                <li>Communications, messages, and support requests you send to us</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">1.2 Information Collected Automatically</h3>
              <p className="text-gray-600 leading-relaxed mb-3">
                When you access our Services, we may automatically collect certain information, including:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li>Device information (device type, operating system, browser type)</li>
                <li>IP address and approximate geographic location</li>
                <li>Usage data such as pages visited, features used, and time spent on the platform</li>
                <li>Cookies and similar tracking technologies (see Section 5)</li>
                <li>Log data including access times, error reports, and referring URLs</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">1.3 Information from Third Parties</h3>
              <p className="text-gray-600 leading-relaxed mb-3">
                We may receive information about you from third-party sources, including:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Identity verification services for KYC (Know Your Customer) compliance</li>
                <li>Payment processors (such as Stripe) for transaction data</li>
                <li>Banking partners (via Plaid) for account verification</li>
                <li>Credit reporting agencies for fraud prevention</li>
                <li>Public databases for contractor license and insurance verification</li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                We use the information we collect for the following purposes:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Provide and operate our Services:</strong> Create and manage accounts, process escrow transactions, facilitate milestone-based payments, and deliver the core platform functionality.</li>
                <li><strong>Verify identity and prevent fraud:</strong> Comply with KYC and anti-money laundering (AML) regulations, verify contractor credentials, and detect fraudulent activity.</li>
                <li><strong>Process payments:</strong> Execute deposits, fund releases, refunds, and disbursements through our payment processing partners.</li>
                <li><strong>Communicate with you:</strong> Send transaction confirmations, milestone notifications, payment approvals, security alerts, and customer support responses.</li>
                <li><strong>Improve our Services:</strong> Analyze usage patterns, troubleshoot issues, develop new features, and enhance platform performance and security.</li>
                <li><strong>Comply with legal obligations:</strong> Meet regulatory requirements, respond to legal requests, and fulfill tax reporting obligations (such as generating 1099 forms).</li>
                <li><strong>Protect our users:</strong> Enforce our terms of service, resolve disputes, and protect the rights and safety of our users and the public.</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Share Your Information</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>With project counterparties:</strong> Limited project-related information is shared between homeowners and contractors on the same project (such as names, contact information, and milestone status) as necessary to facilitate the project.</li>
                <li><strong>With service providers:</strong> We share information with trusted third-party vendors who perform services on our behalf, including payment processing (Stripe), bank account verification (Plaid), identity verification, cloud hosting, and customer support tools. These providers are contractually obligated to protect your information.</li>
                <li><strong>With banking partners:</strong> Financial information is shared with our FDIC-insured banking partner to create and manage escrow accounts and process transactions.</li>
                <li><strong>For legal compliance:</strong> We may disclose information when required by law, regulation, legal process, or governmental request, including tax reporting to the IRS.</li>
                <li><strong>For safety and fraud prevention:</strong> We may share information when we believe in good faith that disclosure is necessary to prevent fraud, protect safety, or enforce our agreements.</li>
                <li><strong>In business transfers:</strong> If Kealee is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction, subject to the protections described in this policy.</li>
              </ul>
            </div>

            {/* Section 4 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We take the security of your information seriously and implement robust technical and organizational measures to protect it, including:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li><strong>Encryption:</strong> All data is encrypted in transit using 256-bit SSL/TLS encryption and at rest using AES-256 encryption.</li>
                <li><strong>Access controls:</strong> Role-based access controls ensure that only authorized personnel can access sensitive data, with multi-factor authentication required for all internal systems.</li>
                <li><strong>Compliance certifications:</strong> We maintain SOC 2 Type II certification and PCI-DSS Level 1 compliance.</li>
                <li><strong>Regular audits:</strong> We conduct regular security audits, penetration testing, and vulnerability assessments.</li>
                <li><strong>Monitoring:</strong> Real-time transaction monitoring and anomaly detection systems alert our security team to suspicious activity.</li>
                <li><strong>Data segregation:</strong> Customer escrow funds are held in segregated trust accounts separate from Kealee operating funds.</li>
              </ul>
              <p className="text-gray-600 leading-relaxed">
                While we strive to protect your information, no method of electronic transmission or storage is completely secure. We cannot guarantee absolute security, but we are committed to maintaining industry-leading protections.
              </p>
            </div>

            {/* Section 5 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Cookies and Tracking Technologies</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We use cookies and similar tracking technologies to enhance your experience on our platform. These include:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li><strong>Essential cookies:</strong> Required for the platform to function, including session management, authentication, and security features.</li>
                <li><strong>Analytics cookies:</strong> Help us understand how users interact with our platform so we can improve functionality and user experience.</li>
                <li><strong>Preference cookies:</strong> Remember your settings and preferences for a more personalized experience.</li>
              </ul>
              <p className="text-gray-600 leading-relaxed">
                You can manage cookie preferences through your browser settings. Disabling essential cookies may impact your ability to use certain features of our platform.
              </p>
            </div>

            {/* Section 6 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We retain your personal information for as long as necessary to provide our Services and fulfill the purposes described in this policy, unless a longer retention period is required or permitted by law. Specifically:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Account data:</strong> Retained for the duration of your account and for a reasonable period after account closure to comply with legal obligations.</li>
                <li><strong>Transaction records:</strong> Retained for a minimum of seven (7) years to comply with financial regulations and tax reporting requirements.</li>
                <li><strong>Communication records:</strong> Retained for a minimum of three (3) years or as required for dispute resolution.</li>
                <li><strong>Usage data:</strong> Aggregated and anonymized usage data may be retained indefinitely for analytics purposes.</li>
              </ul>
            </div>

            {/* Section 7 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Depending on your jurisdiction, you may have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li><strong>Right of access:</strong> You may request a copy of the personal information we hold about you.</li>
                <li><strong>Right to correction:</strong> You may request that we correct inaccurate or incomplete personal information.</li>
                <li><strong>Right to deletion:</strong> You may request that we delete your personal information, subject to legal retention requirements. Note that transaction records may need to be retained for regulatory compliance.</li>
                <li><strong>Right to data portability:</strong> You may request a machine-readable copy of certain personal information.</li>
                <li><strong>Right to restrict processing:</strong> You may request that we limit how we use your information in certain circumstances.</li>
                <li><strong>Right to object:</strong> You may object to our processing of your personal information for direct marketing purposes.</li>
                <li><strong>Right to withdraw consent:</strong> Where processing is based on consent, you may withdraw your consent at any time.</li>
              </ul>
              <p className="text-gray-600 leading-relaxed">
                To exercise any of these rights, please contact us at{' '}
                <a href="mailto:privacy@kealee.com" className="text-emerald-600 hover:underline">
                  privacy@kealee.com
                </a>
                . We will respond to your request within 30 days. We may ask you to verify your identity before processing your request.
              </p>
            </div>

            {/* Section 8 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children&apos;s Privacy</h2>
              <p className="text-gray-600 leading-relaxed">
                Our Services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If we learn that we have collected personal information from a child under 18, we will take steps to delete that information promptly. If you believe a child has provided us with personal information, please contact us at{' '}
                <a href="mailto:privacy@kealee.com" className="text-emerald-600 hover:underline">
                  privacy@kealee.com
                </a>
                .
              </p>
            </div>

            {/* Section 9 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes to This Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of material changes by posting the updated policy on our website with a new &quot;Last Updated&quot; date and, where required, by sending you a notification via email or through the platform. We encourage you to review this policy periodically.
              </p>
            </div>

            {/* Section 10 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <p className="text-gray-900 font-semibold mb-3">Kealee Platform, Inc.</p>
                <div className="space-y-1 text-gray-600 text-sm">
                  <p>Privacy Inquiries</p>
                  <p>
                    Email:{' '}
                    <a href="mailto:privacy@kealee.com" className="text-emerald-600 hover:underline">
                      privacy@kealee.com
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

            {/* Section 11 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. State-Specific Disclosures</h2>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">California Residents</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you are a California resident, you may have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information we collect and how it is used, the right to request deletion, and the right to opt out of the sale of personal information. Kealee does not sell personal information. To exercise your CCPA rights, contact us at{' '}
                <a href="mailto:privacy@kealee.com" className="text-emerald-600 hover:underline">
                  privacy@kealee.com
                </a>
                .
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Maryland Residents</h3>
              <p className="text-gray-600 leading-relaxed">
                If you are a Maryland resident, you may have rights under the Maryland Personal Information Protection Act. We comply with all applicable Maryland data protection requirements. For questions about your rights under Maryland law, contact us at the address above.
              </p>
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
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
          <p className="text-sm">&copy; 2026 Kealee Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
