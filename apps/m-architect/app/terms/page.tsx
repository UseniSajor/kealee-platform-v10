import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | Kealee Architecture',
  description: 'Terms and conditions for using Kealee architecture services.',
};

export default function TermsPage() {
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
            <FileText className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600">Last updated: {lastUpdated}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12 space-y-8">

          <section>
            <p className="text-gray-600 leading-relaxed">
              These Terms of Service govern your use of Kealee's architecture services platform.
              By using our services, you agree to be bound by these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">1. Architecture Services</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                <strong>1.1 Description.</strong> Kealee connects you with licensed architects
                for schematic design, design development, construction documents, and related services.
              </p>
              <p>
                <strong>1.2 Licensed Professionals.</strong> All architects in our network are
                licensed in the applicable jurisdiction. Architect stamps and seals are provided
                as part of the service where required.
              </p>
              <p>
                <strong>1.3 Scope of Work.</strong> Each project engagement includes a defined
                scope of work. Changes to scope may affect pricing and timeline.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">2. Intellectual Property</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                <strong>2.1 Deliverables.</strong> Upon full payment, you receive a license to
                use all deliverables (drawings, plans, models) for your project. You may not
                reuse designs for other projects without permission.
              </p>
              <p>
                <strong>2.2 Your Materials.</strong> You retain ownership of materials you provide
                (site surveys, existing drawings, project briefs).
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">3. Fees and Payment</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                <strong>3.1 Subscription Plans.</strong> Architecture services are provided on
                monthly subscription or project-based pricing as displayed at the time of engagement.
              </p>
              <p>
                <strong>3.2 Payment Terms.</strong> Monthly subscriptions are billed in advance.
                Project fees are billed per milestone as defined in your agreement.
              </p>
              <p>
                <strong>3.3 Revisions.</strong> Each plan includes a specified number of revision
                rounds. Additional revisions may incur extra charges.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">4. Your Responsibilities</h2>
            <div className="space-y-3 text-gray-600">
              <p>You agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate project information and requirements</li>
                <li>Respond to requests for clarification in a timely manner</li>
                <li>Review deliverables and provide feedback within specified timeframes</li>
                <li>Obtain necessary permits and approvals for your project</li>
                <li>Comply with all applicable building codes and regulations</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">5. Limitation of Liability</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                <strong>5.1 Professional Standards.</strong> Our architects maintain professional
                liability insurance and adhere to industry standards of care.
              </p>
              <p>
                <strong>5.2 Limitation.</strong> Our liability is limited to the fees paid for
                the specific service giving rise to the claim. We are not liable for project
                costs, delays, or consequential damages.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">6. Termination</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                Either party may terminate with 30 days written notice. Upon termination,
                you will receive all completed deliverables for work paid. Fees for work
                completed are non-refundable.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">7. Contact</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                Questions? Contact us at{' '}
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
