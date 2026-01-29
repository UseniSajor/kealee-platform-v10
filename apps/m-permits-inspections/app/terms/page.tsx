import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | Kealee Permits',
  description: 'Terms and conditions for using the Kealee permit application platform.',
};

export default function TermsPage() {
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
            <FileText className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Terms of Service
          </h1>
          <p className="text-gray-600">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12 space-y-8">

          <section>
            <p className="text-gray-600 leading-relaxed">
              Welcome to Kealee. These Terms of Service ("Terms") govern your access to and use of our
              permit application platform, including our websites, mobile applications, and related services.
              By using our Services, you agree to be bound by these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">1. Account Registration</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                <strong>1.1 Eligibility.</strong> You must be at least 18 years old and authorized
                to act for your business to use Kealee.
              </p>
              <p>
                <strong>1.2 Account Security.</strong> You are responsible for maintaining the security
                of your account credentials and for all activities under your account.
              </p>
              <p>
                <strong>1.3 Accurate Information.</strong> You must provide accurate and current
                information when creating an account and submitting permit applications.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">2. Permit Services</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                <strong>2.1 Description.</strong> Kealee assists with permit application preparation,
                AI-powered document review, and submission to applicable jurisdictions.
              </p>
              <p>
                <strong>2.2 No Guarantee of Approval.</strong> While our services are designed to
                improve approval rates, we do not guarantee that any permit will be approved.
                Approval decisions are made solely by the applicable governmental jurisdiction.
              </p>
              <p>
                <strong>2.3 User Responsibility.</strong> You remain responsible for ensuring your
                projects comply with all applicable building codes, zoning requirements, and regulations.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">3. Fees and Payment</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                <strong>3.1 Service Fees.</strong> Fees are charged on a per-permit basis as displayed
                at the time of submission. Government filing fees are additional and passed through at cost.
              </p>
              <p>
                <strong>3.2 Payment.</strong> Payment is due at the time of service submission. We accept
                major credit cards and ACH transfers.
              </p>
              <p>
                <strong>3.3 Refunds.</strong> Service fees are non-refundable once processing has begun.
                Government filing fees follow the refund policies of each jurisdiction.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">4. Your Content</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                <strong>4.1 Ownership.</strong> You retain ownership of all documents, plans, and data
                you upload ("Your Content"). We do not claim ownership of Your Content.
              </p>
              <p>
                <strong>4.2 License.</strong> By uploading content, you grant us a license to use,
                store, and process Your Content for the purpose of providing our services.
              </p>
              <p>
                <strong>4.3 Accuracy.</strong> You represent that all information you submit is
                accurate, complete, and does not infringe on any third-party rights.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">5. Prohibited Conduct</h2>
            <div className="space-y-3 text-gray-600">
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Submit fraudulent permit applications</li>
                <li>Provide false or misleading information</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Attempt to circumvent our security measures</li>
                <li>Use the service for any illegal purpose</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">6. Disclaimer and Limitation of Liability</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                <strong>6.1 Disclaimer.</strong> THE SERVICES ARE PROVIDED "AS IS" WITHOUT WARRANTIES
                OF ANY KIND. WE DO NOT WARRANT THAT PERMITS WILL BE APPROVED OR THAT REVIEWS WILL
                CATCH ALL ERRORS.
              </p>
              <p>
                <strong>6.2 Limitation.</strong> OUR LIABILITY IS LIMITED TO THE AMOUNT YOU PAID FOR
                THE SPECIFIC SERVICE GIVING RISE TO THE CLAIM. WE ARE NOT LIABLE FOR INDIRECT,
                INCIDENTAL, OR CONSEQUENTIAL DAMAGES.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">7. Termination</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                Either party may terminate this agreement at any time. Upon termination, you may
                request export of your data within 30 days. Fees for completed services remain due.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">8. Governing Law</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                These Terms are governed by the laws of the District of Columbia. Any disputes shall
                be resolved through binding arbitration in Washington, DC.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">9. Contact</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                Questions about these Terms? Contact us at{' '}
                <a href="mailto:legal@kealee.com" className="text-blue-600 hover:text-blue-700">
                  legal@kealee.com
                </a>
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
