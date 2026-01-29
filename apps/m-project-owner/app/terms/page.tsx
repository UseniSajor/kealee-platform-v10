import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | Kealee Project Owner Portal',
  description: 'Terms and conditions for using the Kealee project owner portal.',
};

export default function TermsPage() {
  const lastUpdated = 'January 15, 2025';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">

        <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8">
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600">Last updated: {lastUpdated}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12 space-y-8">

          <section>
            <p className="text-gray-600 leading-relaxed">
              These Terms govern your use of the Kealee Project Owner Portal, which provides
              project owners with visibility into their construction projects.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">1. Portal Access</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                <strong>1.1 Invitation Required.</strong> Access to the portal is provided by
                invitation from your contractor or project manager. You must accept the invitation
                and create an account to access project information.
              </p>
              <p>
                <strong>1.2 Account Security.</strong> You are responsible for maintaining the
                confidentiality of your login credentials and for all activities under your account.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">2. Portal Features</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                <strong>2.1 Project Visibility.</strong> The portal provides access to project
                updates, photos, documents, timelines, and financial information as shared by
                your contractor.
              </p>
              <p>
                <strong>2.2 Communication.</strong> You can communicate with your project team
                through the portal. All communications are logged for record-keeping.
              </p>
              <p>
                <strong>2.3 Information Accuracy.</strong> Project information is provided by
                your contractor. Kealee does not independently verify this information.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">3. Your Responsibilities</h2>
            <div className="space-y-3 text-gray-600">
              <ul className="list-disc pl-6 space-y-2">
                <li>Keep your account credentials secure</li>
                <li>Review project information in a timely manner</li>
                <li>Provide feedback and approvals as requested</li>
                <li>Not share confidential project information inappropriately</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">4. Limitation of Liability</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                Kealee provides the portal as a communication and visibility tool. We are not
                responsible for the construction work, contractor performance, or project outcomes.
                Your relationship with your contractor is governed by your separate agreement with them.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">5. Contact</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                Questions? Contact us at{' '}
                <a href="mailto:support@kealee.com" className="text-indigo-600 hover:text-indigo-700">
                  support@kealee.com
                </a>
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
