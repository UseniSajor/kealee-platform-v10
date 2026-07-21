import { Metadata } from 'next';
import { FileText, Scale, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | Kealee Platform',
  description:
    'Terms and conditions governing the use of the Kealee construction management platform and related services.',
};

export default function LegalTermsPage() {
  const lastUpdated = 'February 2026';

  return (
    <>
      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileText className="text-blue-600" size={32} />
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
          Terms of Service
        </h1>
        <p className="text-xl text-gray-600">
          The terms that govern your use of the Kealee Platform
        </p>
        <p className="text-sm text-gray-500 mt-4">
          Last updated: {lastUpdated}
        </p>
      </div>

      {/* Introduction */}
      <div className="bg-blue-50 rounded-2xl p-8 mb-12">
        <p className="text-gray-700 leading-relaxed">
          Kealee LLC (&ldquo;Kealee,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
          operates the Kealee Platform, a construction management advisory technology platform.
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the Kealee
          Platform, including all websites, applications, tools, and related services
          (collectively, the &ldquo;Services&rdquo;). By accessing or using our Services, you agree to
          be bound by these Terms. If you do not agree to these Terms, you may not use the Services.
        </p>
      </div>

      {/* Quick Summary */}
      <div className="bg-gray-50 rounded-2xl p-8 mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Scale size={20} />
          Quick Summary
        </h2>
        <p className="text-gray-600 mb-4 text-sm">
          While you should read the full terms below, here are the key points:
        </p>
        <ul className="space-y-2 text-gray-600">
          <li className="flex items-start gap-3">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
            Kealee provides construction management advisory technology and project coordination tools
          </li>
          <li className="flex items-start gap-3">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
            You own your data; we license it only to provide the Services to you
          </li>
          <li className="flex items-start gap-3">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
            All payments are processed through the Kealee Platform on a subscription basis
          </li>
          <li className="flex items-start gap-3">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
            We target 99.9% uptime with scheduled maintenance communicated in advance
          </li>
          <li className="flex items-start gap-3">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
            These Terms are governed by the laws of Washington, DC
          </li>
        </ul>
      </div>

      {/* Terms Content */}
      <div className="prose prose-lg max-w-none">

        {/* Section 1 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">1</span>
            Agreement to Terms
          </h2>
          <div className="space-y-4 text-gray-600">
            <p>
              <strong>1.1 Acceptance.</strong> By creating an account, accessing, or using the
              Kealee Platform, you acknowledge that you have read, understood, and agree to be
              bound by these Terms and our Privacy Policy. If you are using the Services on behalf
              of a company, organization, or other entity, you represent and warrant that you have
              the authority to bind that entity to these Terms.
            </p>
            <p>
              <strong>1.2 Eligibility.</strong> You must be at least 18 years of age and capable of
              forming a legally binding contract to use the Services. The Services are intended for
              business use by construction professionals, general contractors, project owners, and
              related industry participants.
            </p>
            <p>
              <strong>1.3 Modifications.</strong> We reserve the right to modify these Terms at any
              time. We will provide notice of material changes by email or through the Platform at
              least 30 days before the changes take effect. Your continued use of the Services after
              the effective date of any modifications constitutes your acceptance of the updated Terms.
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">2</span>
            Description of Services
          </h2>
          <div className="space-y-4 text-gray-600">
            <p>
              <strong>2.1 Platform Overview.</strong> Kealee Platform provides construction management
              advisory technology, owner&rsquo;s representative coordination, and project management
              tools for general contractors and project owners.
            </p>
            <p>
              <strong>2.2 Service Components.</strong> The Platform includes, but is not limited to,
              the following capabilities:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Bid management and contractor coordination</li>
              <li>Cost estimation and cost database tools</li>
              <li>Document management and version control</li>
              <li>Permit application processing and tracking</li>
              <li>Project scheduling, budgeting, and milestone tracking</li>
              <li>Change order and RFI management</li>
              <li>Team communication and collaboration features</li>
              <li>Marketplace services connecting project owners with qualified professionals</li>
            </ul>
            <p>
              <strong>2.3 Professional Services.</strong> Kealee also offers managed professional
              services including construction management advisory, owner&rsquo;s representative
              coordination, permit management, and project management support. These services are
              subject to the specific terms of your subscription package.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">3</span>
            Scope of Services
          </h2>
          <div className="space-y-4 text-gray-600">
            <p>
              <strong>3.1 Advisory Nature.</strong> The Services provided through the Kealee
              Platform are advisory in nature. Kealee acts as a technology-enabled coordination
              layer and does not replace licensed professionals where required by law.
            </p>
            <p>
              <strong>3.2 CM Advisory Services.</strong> Construction management advisory services
              include project oversight, budget monitoring, schedule analysis, and risk identification.
              These services are informational and do not constitute professional engineering,
              architectural, or legal advice.
            </p>
            <p>
              <strong>3.3 Owner&rsquo;s Rep Services.</strong> Owner&rsquo;s representative coordination
              includes communication facilitation between project stakeholders, document routing, and
              progress reporting. Kealee coordinates on behalf of project owners but does not assume
              the legal obligations of a licensed owner&rsquo;s representative unless separately contracted.
            </p>
            <p>
              <strong>3.4 Permit Management.</strong> Kealee assists with permit application preparation,
              submission tracking, and jurisdiction coordination. Permit approval decisions are made
              solely by the applicable governmental authorities. Kealee does not guarantee permit approval.
            </p>
            <p>
              <strong>3.5 Cost Estimation.</strong> Cost estimation tools provide data-informed projections
              based on available market data. Estimates are advisory and should be validated by qualified
              professionals before making financial commitments.
            </p>
            <p>
              <strong>3.6 Document Management.</strong> The Platform provides secure storage, version
              control, and sharing capabilities for project documents. You are responsible for maintaining
              your own backup copies of critical project documentation.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">4</span>
            Service Availability
          </h2>
          <div className="space-y-4 text-gray-600">
            <p>
              <strong>4.1 Uptime Commitment.</strong> Kealee targets 99.9% uptime for the Platform,
              measured on a monthly basis, excluding scheduled maintenance windows and force majeure events.
            </p>
            <p>
              <strong>4.2 Scheduled Maintenance.</strong> We will provide at least 48 hours advance notice
              for scheduled maintenance that may affect service availability. Maintenance windows will be
              scheduled during off-peak hours whenever possible.
            </p>
            <p>
              <strong>4.3 Unscheduled Downtime.</strong> In the event of unscheduled downtime, we will
              use commercially reasonable efforts to restore service as quickly as possible and will
              communicate status updates through our status page and email notifications.
            </p>
            <p>
              <strong>4.4 No Guarantee.</strong> While we strive for continuous availability, we do not
              guarantee that the Services will be uninterrupted, error-free, or available at all times.
              Temporary service interruptions may occur due to maintenance, updates, or circumstances
              beyond our control.
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">5</span>
            Payment Terms
          </h2>
          <div className="space-y-4 text-gray-600">
            <p>
              <strong>5.1 Payment Processing.</strong> All payments for the Services are processed
              through the Kealee Platform. We use third-party payment processors (including Stripe)
              to handle payment transactions securely. You agree to provide accurate and complete
              billing information.
            </p>
            <p>
              <strong>5.2 Subscription Billing.</strong> Platform access is billed on a recurring
              subscription basis (monthly or annually, depending on your selected plan). Subscription
              fees are charged in advance at the beginning of each billing cycle. Your subscription
              will automatically renew unless you cancel before the renewal date.
            </p>
            <p>
              <strong>5.3 Managed Services Billing.</strong> Fees for managed professional services
              (PM services, permit services, operations services) are billed according to the terms
              of your selected service package. Per-service and per-use fees are billed upon service
              delivery or as otherwise specified.
            </p>
            <p>
              <strong>5.4 Price Changes.</strong> We may adjust pricing with at least 30 days written
              notice. Price changes will take effect at the start of your next billing cycle following
              the notice period.
            </p>
            <p>
              <strong>5.5 Refund Policy.</strong> Subscription fees are generally non-refundable.
              If you cancel your subscription, you will retain access to the Services through the
              end of your current paid billing period. Refund requests for extenuating circumstances
              will be reviewed on a case-by-case basis at our discretion.
            </p>
            <p>
              <strong>5.6 Late Payments.</strong> Overdue amounts may be subject to a late fee of
              1.5% per month or the maximum amount permitted by applicable law, whichever is less.
              We reserve the right to suspend access to the Services for accounts with overdue balances.
            </p>
          </div>
        </section>

        {/* Section 6 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">6</span>
            Data Handling
          </h2>
          <div className="space-y-4 text-gray-600">
            <p>
              <strong>6.1 Data Ownership.</strong> You retain all ownership rights to the data,
              documents, and content you upload to the Kealee Platform (&ldquo;Your Data&rdquo;).
              We do not claim ownership of Your Data.
            </p>
            <p>
              <strong>6.2 License to Kealee.</strong> By uploading data to the Platform, you grant
              Kealee a non-exclusive, worldwide, royalty-free license to use, store, process, and
              display Your Data solely for the purpose of providing, maintaining, and improving the
              Services for you.
            </p>
            <p>
              <strong>6.3 Data Retention.</strong> We retain Your Data for as long as your account
              is active and for a reasonable period thereafter to allow for data export. Following
              account termination, Your Data will be retained for 30 days, after which it may be
              permanently deleted.
            </p>
            <p>
              <strong>6.4 Deletion Rights.</strong> You may request deletion of Your Data at any
              time by contacting us or through the Platform&rsquo;s account settings. We will
              process deletion requests within 30 days, subject to our legal obligations to retain
              certain records (such as billing and tax records).
            </p>
            <p>
              <strong>6.5 Data Export.</strong> You may export Your Data at any time using the
              Platform&rsquo;s export features. We will make Your Data available in standard,
              machine-readable formats.
            </p>
            <p>
              <strong>6.6 Data Security.</strong> We implement industry-standard security measures
              to protect Your Data, as described in our Privacy Policy. However, no method of
              electronic storage or transmission is 100% secure, and we cannot guarantee absolute security.
            </p>
          </div>
        </section>

        {/* Section 7 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">7</span>
            Limitation of Liability
          </h2>
          <div className="space-y-4 text-gray-600">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-4 text-gray-700">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-amber-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-semibold mb-2">Important Notice</p>
                  <p>
                    The following limitations apply to the maximum extent permitted by applicable law.
                  </p>
                </div>
              </div>
            </div>
            <p>
              <strong>7.1 Disclaimer of Warranties.</strong> THE SERVICES ARE PROVIDED &ldquo;AS IS&rdquo;
              AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED,
              INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
              PURPOSE, TITLE, AND NON-INFRINGEMENT.
            </p>
            <p>
              <strong>7.2 Limitation of Liability.</strong> TO THE MAXIMUM EXTENT PERMITTED BY LAW,
              KEALEE&rsquo;S TOTAL AGGREGATE LIABILITY FOR ANY AND ALL CLAIMS ARISING OUT OF OR RELATED
              TO THESE TERMS OR YOUR USE OF THE SERVICES SHALL NOT EXCEED THE TOTAL AMOUNT YOU PAID
              TO KEALEE IN THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM.
            </p>
            <p>
              <strong>7.3 Exclusion of Consequential Damages.</strong> IN NO EVENT SHALL KEALEE BE
              LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
              INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, LOSS OF DATA, LOSS OF BUSINESS
              OPPORTUNITIES, PROJECT DELAYS, PERMIT DENIALS, OR COST OVERRUNS, REGARDLESS OF
              WHETHER SUCH DAMAGES WERE FORESEEABLE.
            </p>
            <p>
              <strong>7.4 Construction Outcomes.</strong> Kealee is not liable for the outcome of
              any construction project, permit application, inspection result, or contractor
              performance. The Platform provides tools and advisory services, but ultimate
              responsibility for project outcomes rests with the project participants.
            </p>
          </div>
        </section>

        {/* Section 8 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">8</span>
            Governing Law
          </h2>
          <div className="space-y-4 text-gray-600">
            <p>
              <strong>8.1 Jurisdiction.</strong> These Terms are governed by and construed in
              accordance with the laws of the District of Columbia, United States, without regard
              to its conflict of law provisions.
            </p>
            <p>
              <strong>8.2 Dispute Resolution.</strong> Any disputes arising from or related to these
              Terms or your use of the Services shall be resolved through binding arbitration
              administered by the American Arbitration Association in Washington, DC. You agree to
              resolve disputes on an individual basis and waive any right to participate in class
              action proceedings.
            </p>
            <p>
              <strong>8.3 Injunctive Relief.</strong> Notwithstanding the foregoing, either party may
              seek injunctive or other equitable relief in any court of competent jurisdiction to
              prevent the actual or threatened infringement of intellectual property rights.
            </p>
          </div>
        </section>

        {/* Section 9 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">9</span>
            Contact
          </h2>
          <div className="space-y-4 text-gray-600">
            <p>
              If you have questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="space-y-2 text-gray-600">
                <p><strong>Kealee LLC</strong></p>
                <p>Washington, DC</p>
                <p><strong>Email:</strong> legal@kealee.com</p>
                <p><strong>Website:</strong> kealee.com</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
