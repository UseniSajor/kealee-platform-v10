import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Kealee',
  description: 'Learn how Kealee protects your personal and project information.',
};

export default function PrivacyPage() {
  const lastUpdated = 'January 31, 2026';

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[var(--primary)] hover:underline mb-8"
      >
        ← Back to Home
      </Link>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-black tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-zinc-600">Last updated: {lastUpdated}</p>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm space-y-8">

        <section>
          <p className="text-zinc-600 leading-relaxed">
            Kealee is committed to protecting your privacy. This policy explains
            how we collect, use, and protect your information when you use our project
            management platform, including all integrated services (Project Management,
            Pre-Construction, Estimation, Finance & Trust, Marketplace, and Permits & Inspections).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black mb-4">Information We Collect</h2>
          <div className="text-zinc-600 space-y-3">
            <p className="font-semibold">Account Information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name, email, phone number, company name</li>
              <li>Business address and license information</li>
              <li>Billing and payment details</li>
            </ul>
            <p className="font-semibold mt-4">Project Information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Project addresses and property details</li>
              <li>Permit applications and inspection records</li>
              <li>Contracts, change orders, and financial documents</li>
              <li>Progress photos and site documentation</li>
              <li>Communications with vendors and subcontractors</li>
            </ul>
            <p className="font-semibold mt-4">Usage Information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Platform activity and feature usage</li>
              <li>Device information and browser type</li>
              <li>IP address and general location</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black mb-4">How We Use Your Information</h2>
          <div className="text-zinc-600 space-y-3">
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide operations management and coordination services</li>
              <li>Track permits and schedule inspections on your behalf</li>
              <li>Generate weekly reports and project status updates</li>
              <li>Facilitate communication with vendors and subcontractors</li>
              <li>Process payments and manage subscriptions</li>
              <li>Match contractors with project opportunities (marketplace)</li>
              <li>Improve our platform and develop new features</li>
              <li>Send service-related communications</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black mb-4">Information Sharing</h2>
          <div className="text-zinc-600 space-y-3">
            <p>We share your information with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Project stakeholders:</strong> Owners, contractors, and vendors
                connected to your projects (only relevant project information)
              </li>
              <li>
                <strong>Permit authorities:</strong> When submitting applications on your behalf
              </li>
              <li>
                <strong>Service providers:</strong> Cloud hosting, payment processing,
                communication tools
              </li>
              <li>
                <strong>Legal requirements:</strong> When required by law or legal process
              </li>
            </ul>
            <p className="mt-4 font-semibold">
              We never sell your personal information to third parties.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black mb-4">Data Security</h2>
          <div className="text-zinc-600 space-y-3">
            <p>We protect your data with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>256-bit SSL/TLS encryption for all data transmission</li>
              <li>Encrypted storage for sensitive documents</li>
              <li>Role-based access controls</li>
              <li>Regular security audits and penetration testing</li>
              <li>SOC 2 Type II compliant infrastructure</li>
              <li>Automated backup and disaster recovery</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black mb-4">Data Retention</h2>
          <div className="text-zinc-600 space-y-3">
            <ul className="list-disc pl-6 space-y-2">
              <li>Active account data is retained while your account is active</li>
              <li>Project records are retained for 7 years after project completion</li>
              <li>Financial records are retained per legal requirements</li>
              <li>You can request data deletion at any time (subject to legal holds)</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black mb-4">Your Rights</h2>
          <div className="text-zinc-600 space-y-3">
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data in a portable format</li>
              <li>Opt out of marketing communications</li>
              <li>Restrict certain processing activities</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black mb-4">Cookies and Tracking</h2>
          <div className="text-zinc-600 space-y-3">
            <p>We use cookies and similar technologies to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Keep you logged in to your account</li>
              <li>Remember your preferences</li>
              <li>Analyze platform usage and performance</li>
              <li>Deliver relevant content and features</li>
            </ul>
            <p className="mt-3">
              You can control cookies through your browser settings.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black mb-4">California Privacy Rights</h2>
          <div className="text-zinc-600 space-y-3">
            <p>
              California residents have additional rights under the CCPA, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Right to know what personal information is collected</li>
              <li>Right to delete personal information</li>
              <li>Right to opt-out of the sale of personal information (we do not sell data)</li>
              <li>Right to non-discrimination for exercising privacy rights</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black mb-4">Financial Data</h2>
          <div className="text-zinc-600 space-y-3">
            <p>For escrow and payment processing, we additionally collect and process:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Bank account information (via Plaid integration)</li>
              <li>Payment card details (processed by Stripe, not stored by us)</li>
              <li>Escrow transaction records and milestone payment history</li>
              <li>Identity verification documents for compliance</li>
            </ul>
            <p className="mt-3">
              Financial data is encrypted using bank-level security and stored in FDIC-insured
              accounts through our banking partners.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black mb-4">Contact Us</h2>
          <div className="text-zinc-600">
            <p>
              For privacy questions or to exercise your rights, contact us at:{' '}
              <a href="mailto:privacy@kealee.com" className="text-[var(--primary)] hover:underline">
                privacy@kealee.com
              </a>
            </p>
            <p className="mt-2">
              Kealee Inc.<br />
              1401 H Street NW, Suite 300<br />
              Washington, DC 20005
            </p>
          </div>
        </section>

      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-zinc-500">
        © 2026 Kealee. All rights reserved.
      </div>
    </main>
  );
}
