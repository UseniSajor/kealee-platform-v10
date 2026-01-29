import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | Kealee Architecture',
  description: 'Learn how Kealee protects your personal information.',
};

export default function PrivacyPage() {
  const lastUpdated = 'January 15, 2025';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: {lastUpdated}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12 space-y-8">

          <section>
            <p className="text-gray-600 leading-relaxed">
              Kealee Construction LLC is committed to protecting your privacy. This policy
              explains how we handle your information when you use our architecture services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Information We Collect</h2>
            <div className="space-y-3 text-gray-600">
              <ul className="list-disc pl-6 space-y-2">
                <li>Account information (name, email, phone, company)</li>
                <li>Project details and design requirements</li>
                <li>Site information and existing drawings</li>
                <li>Communications and feedback</li>
                <li>Payment information</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
            <div className="space-y-3 text-gray-600">
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide architecture services and deliverables</li>
                <li>Coordinate with assigned architects</li>
                <li>Process payments</li>
                <li>Communicate about your projects</li>
                <li>Improve our services</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Information Sharing</h2>
            <div className="space-y-3 text-gray-600">
              <p>We share your project information with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Assigned architects and design professionals</li>
                <li>Service providers (cloud hosting, payment processing)</li>
                <li>Permit authorities (when submitting permit drawings)</li>
              </ul>
              <p className="mt-4 font-medium">
                We never sell your personal information.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Data Security</h2>
            <div className="space-y-3 text-gray-600">
              <p>We protect your data with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>256-bit encryption</li>
                <li>Secure file storage</li>
                <li>Access controls</li>
                <li>Regular security audits</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Rights</h2>
            <div className="space-y-3 text-gray-600">
              <p>You can:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request data deletion</li>
                <li>Export your data</li>
                <li>Opt out of marketing emails</li>
              </ul>
              <p className="mt-4">
                Contact us at{' '}
                <a href="mailto:privacy@kealee.com" className="text-blue-600 hover:text-blue-700">
                  privacy@kealee.com
                </a>
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
