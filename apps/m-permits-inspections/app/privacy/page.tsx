import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | Kealee Permits',
  description: 'Learn how Kealee collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
  const lastUpdated = 'January 15, 2025';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">

        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-600">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12 space-y-8">

          <section>
            <p className="text-gray-600 leading-relaxed">
              Kealee Construction LLC ("Kealee," "we," "us") is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, and safeguard your information when
              you use our permit application services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
            <div className="space-y-4 text-gray-600">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Information You Provide</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Account information (name, email, phone, company)</li>
                  <li>Permit application details and supporting documents</li>
                  <li>Property information and construction plans</li>
                  <li>Payment information</li>
                  <li>Communications with our team</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Automatically Collected</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Device and browser information</li>
                  <li>Usage data and page views</li>
                  <li>IP address and general location</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <div className="space-y-3 text-gray-600">
              <p>We use your information to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Process and submit permit applications on your behalf</li>
                <li>Perform AI-powered document review</li>
                <li>Communicate with you about your applications</li>
                <li>Coordinate with governmental jurisdictions</li>
                <li>Process payments</li>
                <li>Improve our services</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">3. Information Sharing</h2>
            <div className="space-y-3 text-gray-600">
              <p>We share your information with:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Governmental jurisdictions (as necessary to process permits)</li>
                <li>Service providers (hosting, payment processing)</li>
                <li>Professional partners (when you engage additional services)</li>
                <li>Legal authorities (when required by law)</li>
              </ul>
              <p className="mt-4">
                <strong>We never sell your personal information to third parties.</strong>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">4. Data Security</h2>
            <div className="space-y-3 text-gray-600">
              <p>We protect your information with:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>256-bit SSL/TLS encryption</li>
                <li>AES-256 encryption for stored data</li>
                <li>Regular security audits</li>
                <li>Role-based access controls</li>
                <li>Secure data centers</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">5. Data Retention</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                We retain your permit application data for 7 years after project completion to
                comply with construction industry record-keeping requirements. Account data is
                retained while your account is active. You may request deletion of your data
                (subject to legal retention requirements).
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">6. Your Rights</h2>
            <div className="space-y-3 text-gray-600">
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your data</li>
                <li>Opt out of marketing communications</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, contact us at{' '}
                <a href="mailto:privacy@kealee.com" className="text-blue-600 hover:text-blue-700">
                  privacy@kealee.com
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">7. Cookies</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                We use cookies for essential functionality, authentication, and to understand
                how you use our services. You can manage cookie preferences in your browser settings.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">8. Updates to This Policy</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                We may update this Privacy Policy periodically. We will notify you of material
                changes via email or through the platform.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">9. Contact Us</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                Questions about this Privacy Policy? Contact us:
              </p>
              <p>
                <strong>Email:</strong>{' '}
                <a href="mailto:privacy@kealee.com" className="text-blue-600 hover:text-blue-700">
                  privacy@kealee.com
                </a>
              </p>
              <p>
                <strong>Address:</strong> Kealee Construction LLC, Washington, DC
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
