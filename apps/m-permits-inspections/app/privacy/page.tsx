import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Kealee Permits & Inspections',
  description:
    'Learn how Kealee Permits & Inspections collects, uses, and protects your personal information when you use our construction permit and inspection management platform.',
};

export default function PrivacyPage() {
  const lastUpdated = 'February 1, 2026';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">

        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#1A2B4A] hover:text-[#2DD4BF] font-medium mb-8 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-[#1A2B4A] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-[#1A2B4A] mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-500">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12 space-y-10 leading-relaxed">

          {/* Intro */}
          <section>
            <p className="text-gray-600 leading-relaxed">
              Kealee LLC (&quot;Kealee,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates
              the Kealee Permits &amp; Inspections platform (the &quot;Platform&quot;). We are committed to
              protecting the privacy and security of the personal and professional information you share with
              us. This Privacy Policy describes the types of information we collect, how we use and protect
              that information, and your rights regarding your data when you use our construction permit
              management and inspection coordination services.
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              By accessing or using the Platform, you acknowledge that you have read and understood this
              Privacy Policy. If you do not agree with these practices, please do not use the Platform.
            </p>
          </section>

          {/* 1. Information We Collect */}
          <section>
            <h2 className="text-xl font-bold text-[#1A2B4A] mb-4">1. Information We Collect</h2>
            <div className="space-y-5 text-gray-600">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">1.1 Information You Provide Directly</h3>
                <p className="mb-2">When you create an account, submit permit applications, or interact with our services, you may provide:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Account registration details (full name, email address, phone number, company name, contractor license number)</li>
                  <li>Permit application information (project address, property details, scope of work descriptions, construction plans, engineering documents, and site surveys)</li>
                  <li>Supporting permit documents such as architectural drawings, structural calculations, energy compliance reports, and plot plans</li>
                  <li>Government-issued identification when required for permit submissions to local jurisdictions</li>
                  <li>Payment and billing information (processed securely through our third-party payment processor)</li>
                  <li>Inspection scheduling preferences and availability</li>
                  <li>Communications with our support team, including emails, chat messages, and phone records</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">1.2 Information Collected Automatically</h3>
                <p className="mb-2">When you access the Platform, we automatically collect:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Device information (browser type, operating system, device identifier)</li>
                  <li>Usage data (pages visited, features used, time spent on the Platform, click patterns)</li>
                  <li>IP address and approximate geographic location</li>
                  <li>Referral source and search terms used to find our Platform</li>
                  <li>Log data including access times, error logs, and server response information</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">1.3 Information from Third Parties</h3>
                <p className="mb-2">We may receive information from:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Government permitting portals and jurisdictional databases (permit status updates, review comments, inspection results)</li>
                  <li>Identity verification services</li>
                  <li>Business partners and referral sources</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 2. How We Use Information */}
          <section>
            <h2 className="text-xl font-bold text-[#1A2B4A] mb-4">2. How We Use Your Information</h2>
            <div className="space-y-4 text-gray-600">
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Process permit applications:</strong> Prepare, review, and submit permit applications to the appropriate local, county, or state jurisdictions on your behalf</li>
                <li><strong>Coordinate inspections:</strong> Schedule, track, and manage construction inspections with local building departments and third-party inspection services</li>
                <li><strong>Perform AI-powered document review:</strong> Analyze uploaded plans and documents to identify potential compliance issues before submission</li>
                <li><strong>Facilitate government data submission:</strong> Transmit required information to governmental agencies in the format and manner they require for permit processing</li>
                <li><strong>Provide status updates:</strong> Notify you of changes to your permit application status, upcoming inspections, required corrections, and approval decisions</li>
                <li><strong>Process payments:</strong> Charge service fees and pass through applicable government filing fees</li>
                <li><strong>Improve our services:</strong> Analyze usage patterns to enhance Platform features, streamline workflows, and improve permit approval rates</li>
                <li><strong>Communicate with you:</strong> Respond to inquiries, send service-related notices, and provide customer support</li>
                <li><strong>Ensure compliance:</strong> Comply with legal obligations, enforce our terms, and protect against fraud or misuse</li>
                <li><strong>Generate analytics:</strong> Create aggregated, de-identified reports about permit processing trends and timelines (no individual data is disclosed)</li>
              </ul>
            </div>
          </section>

          {/* 3. Data Sharing */}
          <section>
            <h2 className="text-xl font-bold text-[#1A2B4A] mb-4">3. Data Sharing and Disclosure</h2>
            <div className="space-y-4 text-gray-600">
              <p>We share your information only in the following circumstances:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Government jurisdictions:</strong> We submit your permit application data, construction documents, and supporting materials directly to local, county, and state permitting authorities as required to process your permits. This is a core function of our service.</li>
                <li><strong>Inspection authorities:</strong> We share relevant project information with building departments, fire marshals, and other inspection authorities to facilitate required construction inspections.</li>
                <li><strong>Service providers:</strong> We engage trusted third-party vendors for hosting, cloud storage, payment processing, email delivery, and analytics. These providers are contractually bound to protect your data and use it only for the services they provide to us.</li>
                <li><strong>Professional partners:</strong> If you opt in to additional services (e.g., expediter services, plan review consultants), we may share relevant project information with those partners.</li>
                <li><strong>Legal requirements:</strong> We may disclose information when required by law, court order, subpoena, or government investigation, or to protect the rights, safety, or property of Kealee, our users, or the public.</li>
                <li><strong>Business transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change.</li>
              </ul>
              <p className="mt-4 font-semibold text-gray-900">
                We never sell, rent, or trade your personal information to third parties for marketing purposes.
              </p>
            </div>
          </section>

          {/* 4. Data Security */}
          <section>
            <h2 className="text-xl font-bold text-[#1A2B4A] mb-4">4. Data Security</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                We take the security of your data seriously, particularly given the sensitive nature of
                construction documents, permit applications, and government submissions. We implement
                industry-standard technical and organizational measures, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>256-bit SSL/TLS encryption for all data transmitted between your device and our servers</li>
                <li>AES-256 encryption for data stored at rest, including uploaded documents and permit files</li>
                <li>Role-based access controls ensuring only authorized personnel can access your information</li>
                <li>Regular security audits and vulnerability assessments conducted by independent third parties</li>
                <li>Secure, SOC 2-compliant cloud infrastructure hosted in the United States</li>
                <li>Multi-factor authentication available for all user accounts</li>
                <li>Automated monitoring for unauthorized access attempts and suspicious activity</li>
                <li>Employee security training and strict data handling procedures</li>
              </ul>
              <p className="mt-4">
                Permit documents and construction plans are stored in encrypted, access-controlled environments.
                Documents submitted to government portals are transmitted through secure channels. While no
                method of transmission or storage is completely secure, we continually evaluate and improve our
                security practices to protect your information.
              </p>
            </div>
          </section>

          {/* 5. Your Rights */}
          <section>
            <h2 className="text-xl font-bold text-[#1A2B4A] mb-4">5. Your Rights</h2>
            <div className="space-y-4 text-gray-600">
              <p>Depending on your location and applicable law, you may have the following rights regarding your personal information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                <li><strong>Correction:</strong> Request that we correct inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request that we delete your personal information, subject to legal retention requirements (see below)</li>
                <li><strong>Data portability:</strong> Request an export of your data in a commonly used, machine-readable format</li>
                <li><strong>Opt out of marketing:</strong> Unsubscribe from promotional communications at any time (service-related communications will continue)</li>
                <li><strong>Withdraw consent:</strong> Where processing is based on consent, you may withdraw consent at any time</li>
                <li><strong>Restrict processing:</strong> Request that we limit how we use your data in certain circumstances</li>
              </ul>
              <p className="mt-4">
                Please note that permit application records and related construction documents may be subject
                to legal retention requirements. We retain permit application data for a minimum of seven (7)
                years after project completion to comply with construction industry record-keeping obligations and
                applicable statutes of limitation. Account data is retained while your account remains active
                and for a reasonable period afterward.
              </p>
              <p className="mt-3">
                To exercise any of these rights, please contact us at{' '}
                <a href="mailto:privacy@kealee.com" className="text-[#2DD4BF] hover:text-[#22C55E] font-medium">
                  privacy@kealee.com
                </a>
                . We will respond to your request within 30 days.
              </p>
            </div>
          </section>

          {/* 6. Cookies */}
          <section>
            <h2 className="text-xl font-bold text-[#1A2B4A] mb-4">6. Cookies and Tracking Technologies</h2>
            <div className="space-y-4 text-gray-600">
              <p>We use cookies and similar tracking technologies to operate and improve the Platform:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Essential cookies:</strong> Required for core Platform functionality, including authentication, session management, and security. These cannot be disabled.</li>
                <li><strong>Functional cookies:</strong> Remember your preferences, such as language settings, saved form data, and display options.</li>
                <li><strong>Analytics cookies:</strong> Help us understand how users interact with the Platform so we can improve features and performance. We use aggregated, anonymized analytics data.</li>
                <li><strong>Performance cookies:</strong> Monitor Platform performance and help us identify and resolve technical issues.</li>
              </ul>
              <p className="mt-4">
                We do not use advertising or third-party tracking cookies. You can manage your cookie
                preferences through your browser settings. Disabling essential cookies may affect Platform
                functionality.
              </p>
            </div>
          </section>

          {/* 7. Third-Party Services */}
          <section>
            <h2 className="text-xl font-bold text-[#1A2B4A] mb-4">7. Third-Party Services</h2>
            <div className="space-y-4 text-gray-600">
              <p>Our Platform integrates with or relies on the following categories of third-party services:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Payment processing:</strong> We use Stripe to securely process payments. Your payment card details are handled directly by Stripe and are never stored on our servers. Stripe&apos;s privacy policy governs their handling of your payment data.</li>
                <li><strong>Cloud hosting and storage:</strong> Our Platform and your data are hosted on secure, SOC 2-compliant cloud infrastructure within the United States.</li>
                <li><strong>Government permitting portals:</strong> We interact with various local, county, and state government permitting systems to submit applications and retrieve status updates on your behalf. These portals are governed by their respective government privacy policies.</li>
                <li><strong>Email and communication services:</strong> We use third-party providers to deliver transactional emails (permit status updates, inspection reminders) and support communications.</li>
                <li><strong>Document processing:</strong> We may use AI-powered tools to review construction documents for compliance. Document data processed by these tools is not retained beyond the review session.</li>
              </ul>
              <p className="mt-4">
                We carefully vet all third-party service providers and require them to maintain appropriate
                data protection standards. However, we are not responsible for the privacy practices of
                government portals or other third-party websites linked from the Platform.
              </p>
            </div>
          </section>

          {/* 8. Children's Privacy */}
          <section>
            <h2 className="text-xl font-bold text-[#1A2B4A] mb-4">8. Children&apos;s Privacy</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                The Platform is designed for use by construction professionals, contractors, and business
                entities. It is not intended for use by individuals under the age of 18. We do not knowingly
                collect personal information from children under 13 years of age (or under 16 in certain
                jurisdictions). If we become aware that we have collected personal information from a child
                under the applicable age, we will take steps to delete that information promptly. If you
                believe a child has provided us with personal information, please contact us at{' '}
                <a href="mailto:privacy@kealee.com" className="text-[#2DD4BF] hover:text-[#22C55E] font-medium">
                  privacy@kealee.com
                </a>
                .
              </p>
            </div>
          </section>

          {/* 9. Changes to This Policy */}
          <section>
            <h2 className="text-xl font-bold text-[#1A2B4A] mb-4">9. Changes to This Privacy Policy</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices,
                technology, legal requirements, or other factors. When we make material changes, we will:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Update the &quot;Last updated&quot; date at the top of this page</li>
                <li>Notify you via email or through a prominent notice on the Platform</li>
                <li>Where required by law, obtain your consent to the updated policy</li>
              </ul>
              <p className="mt-3">
                We encourage you to review this Privacy Policy periodically to stay informed about how we
                protect your information. Your continued use of the Platform after any changes constitutes
                your acceptance of the updated Privacy Policy.
              </p>
            </div>
          </section>

          {/* 10. Contact */}
          <section>
            <h2 className="text-xl font-bold text-[#1A2B4A] mb-4">10. Contact Us</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                If you have any questions, concerns, or requests regarding this Privacy Policy or our
                data practices, please contact us:
              </p>
              <div className="bg-gray-50 rounded-xl p-6 mt-4 space-y-2">
                <p>
                  <strong className="text-gray-900">Email:</strong>{' '}
                  <a href="mailto:privacy@kealee.com" className="text-[#2DD4BF] hover:text-[#22C55E] font-medium">
                    privacy@kealee.com
                  </a>
                </p>
                <p>
                  <strong className="text-gray-900">Company:</strong> Kealee LLC
                </p>
                <p>
                  <strong className="text-gray-900">Address:</strong> Washington, DC Metropolitan Area
                </p>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                We aim to respond to all privacy-related inquiries within 30 business days.
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
