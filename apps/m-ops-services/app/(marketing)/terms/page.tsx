import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Kealee',
  description: 'Terms of service for using Kealee project management services.',
};

export default function TermsPage() {
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
        <h1 className="text-4xl font-black tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-zinc-600">Last updated: {lastUpdated}</p>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm space-y-8">

        <section>
          <p className="text-zinc-600 leading-relaxed">
            Welcome to Kealee. By using our platform, you agree to these terms.
            Please read them carefully before using our project management services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black mb-4">1. Service Description</h2>
          <div className="text-zinc-600 space-y-3">
            <p>
              Kealee provides integrated project management services including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Project Management (os-pm) - Milestone tracking and team coordination</li>
              <li>Pre-Construction - Design to contractor selection workflow</li>
              <li>AI Estimation Engine - Cost projections and bid preparation</li>
              <li>Finance & Trust - Escrow management and milestone payments</li>
              <li>Permits & Inspections - Permit tracking and inspection scheduling</li>
              <li>Marketplace - Contractor matching and verification</li>
              <li>Operations Support - Vendor coordination and weekly reporting</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black mb-4">2. Subscription Packages</h2>
          <div className="text-zinc-600 space-y-3">
            <p>
              We offer tiered subscription packages (A through D) with varying levels of service.
              Each package includes specific deliverables and service levels as described at the
              time of purchase.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Package pricing is billed monthly in advance</li>
              <li>Free trials are available for select packages as advertised</li>
              <li>Package upgrades take effect immediately upon confirmation</li>
              <li>Downgrades take effect at the next billing cycle</li>
              <li>Individual services are billed per service upon completion</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black mb-4">3. Escrow and Payment Terms</h2>
          <div className="text-zinc-600 space-y-3">
            <p>
              For projects using our Finance & Trust module:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>All project funds are held in FDIC-insured escrow accounts</li>
              <li>Milestone payments require approval from project owner</li>
              <li>Escrow fees apply as disclosed at account setup</li>
              <li>Disputes are handled through our resolution process</li>
              <li>Wire transfers for amounts over $50,000 may have additional fees</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black mb-4">4. User Responsibilities</h2>
          <div className="text-zinc-600 space-y-3">
            <p>As a user of our platform, you agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate project and contact information</li>
              <li>Respond to requests for information in a timely manner</li>
              <li>Maintain proper licensing and insurance for your business</li>
              <li>Not use the platform for fraudulent or illegal purposes</li>
              <li>Keep your account credentials secure</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black mb-4">5. Service Level Commitments</h2>
          <div className="text-zinc-600 space-y-3">
            <p>
              We commit to the following service levels for active subscriptions:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Weekly status reports delivered by end of business Friday</li>
              <li>Permit status updates within 24 hours of changes</li>
              <li>Response to service requests within one business day</li>
              <li>Vendor follow-ups as needed to maintain project schedules</li>
              <li>Platform availability of 99.5% uptime (excluding scheduled maintenance)</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black mb-4">6. Intellectual Property</h2>
          <div className="text-zinc-600 space-y-3">
            <p>
              You retain ownership of all project documents, plans, and materials you upload.
              We retain rights to our platform, reports, templates, and processes.
            </p>
            <p>
              By using our services, you grant us a limited license to use your materials
              solely for providing the requested services.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black mb-4">7. Limitation of Liability</h2>
          <div className="text-zinc-600 space-y-3">
            <p>
              Kealee Ops Services provides operations support and coordination. We are not:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Licensed general contractors or construction managers</li>
              <li>Responsible for construction means, methods, or safety</li>
              <li>Guaranteeing permit approvals or inspection outcomes</li>
              <li>Liable for delays caused by third parties or government agencies</li>
            </ul>
            <p className="mt-3">
              Our liability is limited to the fees paid for services in the preceding 12 months.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black mb-4">8. Cancellation Policy</h2>
          <div className="text-zinc-600 space-y-3">
            <ul className="list-disc pl-6 space-y-2">
              <li>Monthly subscriptions can be canceled at any time</li>
              <li>Cancellation takes effect at the end of the current billing period</li>
              <li>Free trial cancellations incur no charges if done before trial ends</li>
              <li>Individual services are final once work has commenced</li>
              <li>Escrow funds are released or returned according to project agreement terms</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black mb-4">9. Dispute Resolution</h2>
          <div className="text-zinc-600 space-y-3">
            <p>
              Any disputes arising from these terms shall be resolved through binding arbitration
              in accordance with the rules of the American Arbitration Association. The venue
              shall be Washington, DC.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black mb-4">10. Contact</h2>
          <div className="text-zinc-600">
            <p>
              Questions about these terms? Contact us at{' '}
              <a href="mailto:legal@kealee.com" className="text-[var(--primary)] hover:underline">
                legal@kealee.com
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
