import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | Kealee Project Owner Portal',
  description: 'Learn how Kealee protects your personal information.',
};

export default function PrivacyPage() {
  const lastUpdated = 'January 15, 2025';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">

        <Link href="/" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-8">
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: {lastUpdated}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12 space-y-8">

          <section>
            <p className="text-gray-600 leading-relaxed">
              This Privacy Policy explains how we handle your information when you use the
              Kealee Project Owner Portal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Information We Collect</h2>
            <div className="space-y-3 text-gray-600">
              <ul className="list-disc pl-6 space-y-2">
                <li>Account information (name, email, phone)</li>
                <li>Project viewing activity</li>
                <li>Communications within the portal</li>
                <li>Feedback and approvals you provide</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
            <div className="space-y-3 text-gray-600">
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide access to your project information</li>
                <li>Facilitate communication with your project team</li>
                <li>Send notifications about project updates</li>
                <li>Improve our services</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Information Sharing</h2>
            <div className="space-y-3 text-gray-600">
              <p>Your information is shared with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your contractor and project team (for project communication)</li>
                <li>Service providers (hosting, email delivery)</li>
              </ul>
              <p className="mt-4 font-medium">We never sell your personal information.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Rights</h2>
            <div className="space-y-3 text-gray-600">
              <p>You can:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal information</li>
                <li>Update your account details</li>
                <li>Request account deletion</li>
                <li>Opt out of marketing communications</li>
              </ul>
              <p className="mt-4">
                Contact us at{' '}
                <a href="mailto:privacy@kealee.com" className="text-indigo-600 hover:text-indigo-700">
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
