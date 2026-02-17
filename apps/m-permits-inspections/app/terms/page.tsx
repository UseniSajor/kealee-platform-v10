import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Kealee Permits & Inspections',
  description:
    'Terms and conditions governing your use of the Kealee Permits & Inspections construction permit management and inspection coordination platform.',
};

export default function TermsPage() {
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
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
              <path d="M14 2v4a2 2 0 0 0 2 2h4" />
              <path d="M10 9H8" />
              <path d="M16 13H8" />
              <path d="M16 17H8" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-[#1A2B4A] mb-4">
            Terms of Service
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
              Welcome to Kealee Permits &amp; Inspections. These Terms of Service (&quot;Terms&quot;) constitute
              a legally binding agreement between you (&quot;User,&quot; &quot;you,&quot; or &quot;your&quot;)
              and Kealee LLC (&quot;Kealee,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;)
              governing your access to and use of the Kealee Permits &amp; Inspections platform, including our
              websites, applications, tools, and related services (collectively, the &quot;Platform&quot; or
              &quot;Services&quot;).
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              Please read these Terms carefully before using the Platform. By creating an account, accessing,
              or using any part of the Services, you agree to be bound by these Terms. If you do not agree to
              these Terms, you must not use the Platform.
            </p>
          </section>

          {/* 1. Acceptance of Terms */}
          <section>
            <h2 className="text-xl font-bold text-[#1A2B4A] mb-4">1. Acceptance of Terms</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                <strong>1.1 Agreement.</strong> By accessing or using the Platform, you confirm that you have
                read, understood, and agree to be bound by these Terms, as well as our{' '}
                <Link href="/privacy" className="text-[#2DD4BF] hover:text-[#22C55E] font-medium">
                  Privacy Policy
                </Link>
                , which is incorporated herein by reference.
              </p>
              <p>
                <strong>1.2 Authority.</strong> If you are using the Platform on behalf of a company,
                organization, or other legal entity, you represent and warrant that you have the authority to
                bind that entity to these Terms. In such cases, &quot;you&quot; and &quot;your&quot; refer to
                both you individually and the entity you represent.
              </p>
              <p>
                <strong>1.3 Eligibility.</strong> You must be at least 18 years old and legally capable of
                entering into a binding contract to use the Platform. If you are a licensed contractor, you
                represent that your license is current and in good standing.
              </p>
            </div>
          </section>

          {/* 2. Description of Service */}
          <section>
            <h2 className="text-xl font-bold text-[#1A2B4A] mb-4">2. Description of Service</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                <strong>2.1 Platform Overview.</strong> The Kealee Permits &amp; Inspections platform provides
                construction permit management and inspection coordination services, including but not limited
                to: permit application preparation, AI-powered document review, permit submission to
                governmental jurisdictions, permit status tracking, inspection scheduling and coordination,
                and compliance verification tools.
              </p>
              <p>
                <strong>2.2 Facilitator Role.</strong> Kealee acts as a facilitator between you and the
                relevant governmental permitting authorities. We assist in preparing and submitting permit
                applications but do not have authority over permit approval decisions, which are made solely
                by the applicable governmental jurisdiction.
              </p>
              <p>
                <strong>2.3 No Professional Advice.</strong> The Platform does not provide legal, engineering,
                or architectural advice. Information and tools provided through the Platform are for
                informational purposes and to assist with permit-related workflows. You should consult
                qualified professionals for advice specific to your construction project.
              </p>
            </div>
          </section>

          {/* 3. User Accounts */}
          <section>
            <h2 className="text-xl font-bold text-[#1A2B4A] mb-4">3. User Accounts</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                <strong>3.1 Registration.</strong> To access most features of the Platform, you must create an
                account by providing accurate and complete information, including your name, email address,
                company information, and contractor license details where applicable.
              </p>
              <p>
                <strong>3.2 Account Security.</strong> You are responsible for maintaining the confidentiality
                of your account credentials and for all activities that occur under your account. You agree to
                notify us immediately of any unauthorized use of your account.
              </p>
              <p>
                <strong>3.3 Accurate Information.</strong> You must keep your account information current and
                accurate. Inaccurate information may result in permit application delays, rejections, or
                suspension of your account.
              </p>
              <p>
                <strong>3.4 One Account Per Entity.</strong> Each individual or business entity may maintain
                one account. Multiple accounts for the same entity may be consolidated or terminated at our
                discretion.
              </p>
            </div>
          </section>

          {/* 4. Permit Submissions */}
          <section>
            <h2 className="text-xl font-bold text-[#1A2B4A] mb-4">4. Permit Submissions</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                <strong>4.1 User Responsibility for Accuracy.</strong> You are solely responsible for the
                accuracy, completeness, and legality of all information, documents, and materials submitted
                through the Platform for permit applications. This includes construction plans, engineering
                calculations, property information, scope of work descriptions, and all supporting
                documentation.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-900 font-semibold mb-2">Important: Government Submission Accuracy</p>
                <p className="text-amber-800 text-sm">
                  Information submitted through the Platform may be transmitted directly to governmental
                  agencies and becomes part of official public records. Submitting false, misleading, or
                  fraudulent information to government permitting authorities is a violation of applicable
                  law and may result in civil or criminal penalties. Kealee is not responsible for verifying
                  the truthfulness of user-submitted information and relies on you to ensure all submissions
                  are accurate and lawful.
                </p>
              </div>
              <p>
                <strong>4.2 Document Standards.</strong> All submitted documents must meet the requirements of
                the applicable jurisdiction. We may reject or request revisions to submissions that do not
                meet minimum quality or format standards before forwarding them to government agencies.
              </p>
              <p>
                <strong>4.3 No Guarantee of Approval.</strong> While our services are designed to improve the
                quality and completeness of permit applications, we make no guarantee that any permit will be
                approved. Approval decisions are made solely by the applicable governmental jurisdiction based
                on their codes, regulations, and review processes.
              </p>
              <p>
                <strong>4.4 Processing Times.</strong> Permit processing times vary by jurisdiction, project
                complexity, and current workloads. Estimated timelines provided by the Platform are
                approximations and are not guaranteed.
              </p>
              <p>
                <strong>4.5 Revisions and Resubmissions.</strong> If a jurisdiction requires revisions to your
                permit application, we will notify you promptly. Additional fees may apply for revision
                processing and resubmission services.
              </p>
            </div>
          </section>

          {/* 5. Inspection Services */}
          <section>
            <h2 className="text-xl font-bold text-[#1A2B4A] mb-4">5. Inspection Services</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                <strong>5.1 Coordination.</strong> Our inspection coordination services assist you in
                scheduling and managing required construction inspections with local building departments and,
                where available, third-party inspection providers. We coordinate scheduling logistics but do
                not perform inspections ourselves.
              </p>
              <p>
                <strong>5.2 Site Readiness.</strong> You are responsible for ensuring your construction site is
                ready and accessible for scheduled inspections. Failure to have the site prepared may result in
                failed inspections, rescheduling fees, or project delays for which Kealee is not responsible.
              </p>
              <p>
                <strong>5.3 Inspection Results.</strong> Inspection results and outcomes are determined by the
                inspecting authority. We relay results as received but do not control inspection decisions. If
                corrections are required, you are responsible for completing them and scheduling re-inspections.
              </p>
              <p>
                <strong>5.4 Scheduling Availability.</strong> Inspection scheduling is subject to the
                availability of the relevant inspection authority. We make reasonable efforts to accommodate
                your preferred dates but cannot guarantee specific time slots.
              </p>
            </div>
          </section>

          {/* 6. Fees and Payments */}
          <section>
            <h2 className="text-xl font-bold text-[#1A2B4A] mb-4">6. Fees and Payments</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                <strong>6.1 Service Fees.</strong> Fees for our services are displayed at the time of
                submission and vary based on permit type, jurisdiction, and service level selected.
                Subscription-based plans are billed on a recurring basis as described at the time of purchase.
              </p>
              <p>
                <strong>6.2 Government Fees.</strong> Government filing fees, permit fees, and other
                jurisdiction-imposed charges are separate from Kealee service fees and are passed through to
                you at cost. These fees are set by the respective governmental authority and are subject to
                change without notice from Kealee.
              </p>
              <p>
                <strong>6.3 Payment Terms.</strong> Payment is due at the time of service submission unless
                otherwise agreed upon under a subscription plan. We accept major credit cards and ACH bank
                transfers. All payments are processed securely through our third-party payment processor.
              </p>
              <p>
                <strong>6.4 Refunds.</strong> Kealee service fees are non-refundable once permit processing
                has begun. Government filing fees are subject to the refund policies of each jurisdiction. If
                a permit application is rejected due to a Kealee processing error, we will reprocess the
                application at no additional charge.
              </p>
              <p>
                <strong>6.5 Late Payments.</strong> Overdue balances may be subject to a late payment fee of
                1.5% per month or the maximum rate permitted by applicable law, whichever is less. We reserve
                the right to suspend services for accounts with outstanding balances.
              </p>
            </div>
          </section>

          {/* 7. Intellectual Property */}
          <section>
            <h2 className="text-xl font-bold text-[#1A2B4A] mb-4">7. Intellectual Property</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                <strong>7.1 Your Content.</strong> You retain full ownership of all documents, plans,
                specifications, and data you upload to the Platform (&quot;Your Content&quot;). We do not claim
                any ownership rights over Your Content.
              </p>
              <p>
                <strong>7.2 License Grant.</strong> By uploading content to the Platform, you grant Kealee a
                non-exclusive, royalty-free, worldwide license to use, store, reproduce, and process Your
                Content solely for the purpose of providing the Services, including submitting permit
                applications and coordinating inspections on your behalf.
              </p>
              <p>
                <strong>7.3 Kealee Property.</strong> The Platform, including its design, software, algorithms,
                AI models, user interface, trademarks, logos, and all related intellectual property, is owned
                by Kealee LLC and is protected by applicable intellectual property laws. You may
                not copy, modify, distribute, or reverse-engineer any part of the Platform.
              </p>
              <p>
                <strong>7.4 Feedback.</strong> If you provide suggestions, ideas, or feedback about the
                Platform, you grant us a perpetual, irrevocable, royalty-free license to use that feedback to
                improve our services without any obligation to you.
              </p>
            </div>
          </section>

          {/* 8. Limitation of Liability */}
          <section>
            <h2 className="text-xl font-bold text-[#1A2B4A] mb-4">8. Limitation of Liability</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                <strong>8.1 Disclaimer of Warranties.</strong> THE PLATFORM AND ALL SERVICES ARE PROVIDED
                &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS
                OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
                MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT
                THAT PERMITS WILL BE APPROVED, THAT INSPECTIONS WILL PASS, OR THAT THE PLATFORM WILL BE
                UNINTERRUPTED OR ERROR-FREE.
              </p>
              <p>
                <strong>8.2 Limitation of Damages.</strong> TO THE MAXIMUM EXTENT PERMITTED BY LAW, KEALEE&apos;S
                TOTAL LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR YOUR USE OF THE
                PLATFORM SHALL NOT EXCEED THE TOTAL AMOUNT YOU PAID TO KEALEE IN THE TWELVE (12) MONTHS
                PRECEDING THE EVENT GIVING RISE TO THE CLAIM.
              </p>
              <p>
                <strong>8.3 Exclusion of Consequential Damages.</strong> IN NO EVENT SHALL KEALEE BE LIABLE
                FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT
                LIMITED TO LOSS OF PROFITS, DATA, BUSINESS OPPORTUNITIES, PROJECT DELAYS, CONSTRUCTION
                DOWNTIME, OR REGULATORY PENALTIES, REGARDLESS OF THE CAUSE OF ACTION OR THEORY OF LIABILITY.
              </p>
              <p>
                <strong>8.4 Government Actions.</strong> Kealee is not responsible for actions, decisions,
                delays, or errors by governmental jurisdictions, including but not limited to permit denials,
                inspection failures, code changes, or processing delays.
              </p>
            </div>
          </section>

          {/* 9. Indemnification */}
          <section>
            <h2 className="text-xl font-bold text-[#1A2B4A] mb-4">9. Indemnification</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                You agree to indemnify, defend, and hold harmless Kealee LLC, its officers,
                directors, employees, agents, and affiliates from and against any and all claims, damages,
                losses, liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising out
                of or related to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Your use of the Platform or Services</li>
                <li>Any information, documents, or materials you submit through the Platform</li>
                <li>Your violation of these Terms or any applicable law or regulation</li>
                <li>Your violation of any rights of a third party</li>
                <li>Any claim that information you submitted was false, misleading, or fraudulent</li>
                <li>Any construction-related claims, damages, or disputes arising from projects for which you obtained permits through the Platform</li>
              </ul>
            </div>
          </section>

          {/* 10. Dispute Resolution */}
          <section>
            <h2 className="text-xl font-bold text-[#1A2B4A] mb-4">10. Dispute Resolution</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                <strong>10.1 Informal Resolution.</strong> Before initiating any formal dispute resolution
                proceeding, you agree to first contact us at{' '}
                <a href="mailto:legal@kealee.com" className="text-[#2DD4BF] hover:text-[#22C55E] font-medium">
                  legal@kealee.com
                </a>{' '}
                and attempt to resolve the dispute informally for a period of at least thirty (30) days.
              </p>
              <p>
                <strong>10.2 Binding Arbitration.</strong> Any dispute, controversy, or claim arising out of or
                relating to these Terms or the Services that is not resolved informally shall be settled by
                binding arbitration administered by the American Arbitration Association (&quot;AAA&quot;) under
                its Commercial Arbitration Rules. The arbitration shall be conducted by a single arbitrator in
                Washington, DC.
              </p>
              <p>
                <strong>10.3 Class Action Waiver.</strong> YOU AGREE THAT ANY DISPUTE RESOLUTION PROCEEDING
                WILL BE CONDUCTED ONLY ON AN INDIVIDUAL BASIS AND NOT IN A CLASS, CONSOLIDATED, OR
                REPRESENTATIVE ACTION. If this class action waiver is found to be unenforceable, then the
                entirety of this arbitration provision shall be null and void.
              </p>
              <p>
                <strong>10.4 Small Claims Exception.</strong> Notwithstanding the foregoing, either party may
                bring an individual action in small claims court for disputes within the court&apos;s jurisdictional
                limits.
              </p>
            </div>
          </section>

          {/* 11. Governing Law */}
          <section>
            <h2 className="text-xl font-bold text-[#1A2B4A] mb-4">11. Governing Law</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the State of
                Maryland and the District of Columbia, without regard to conflict of law principles. For any
                disputes not subject to arbitration, you consent to the exclusive jurisdiction of the state and
                federal courts located in the State of Maryland or the District of Columbia.
              </p>
              <p className="mt-3">
                You acknowledge that Kealee provides permit services across multiple jurisdictions in the
                Maryland, Virginia, and Washington, DC metropolitan area, and that the laws and permitting
                requirements of each jurisdiction may differ. You are responsible for understanding the
                specific requirements that apply to your project location.
              </p>
            </div>
          </section>

          {/* 12. Termination */}
          <section>
            <h2 className="text-xl font-bold text-[#1A2B4A] mb-4">12. Termination</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                <strong>12.1 By You.</strong> You may terminate your account at any time by contacting us at{' '}
                <a href="mailto:legal@kealee.com" className="text-[#2DD4BF] hover:text-[#22C55E] font-medium">
                  legal@kealee.com
                </a>
                . Termination does not relieve you of any obligation to pay fees already incurred. Active
                permit applications in progress at the time of termination will be completed unless you
                instruct us otherwise in writing.
              </p>
              <p>
                <strong>12.2 By Kealee.</strong> We may suspend or terminate your access to the Platform at
                any time for violation of these Terms, fraudulent activity, non-payment, or any conduct that we
                reasonably believe is harmful to the Platform, other users, or governmental partners. We will
                provide notice when reasonably practicable.
              </p>
              <p>
                <strong>12.3 Effect of Termination.</strong> Upon termination, your right to access the Platform
                ceases immediately. You may request an export of your data within thirty (30) days of
                termination. After that period, we may delete your data, subject to legal retention
                requirements for permit records. Sections of these Terms that by their nature should survive
                termination (including Limitation of Liability, Indemnification, and Dispute Resolution) shall
                survive.
              </p>
            </div>
          </section>

          {/* 13. Changes to Terms */}
          <section>
            <h2 className="text-xl font-bold text-[#1A2B4A] mb-4">13. Changes to These Terms</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                We reserve the right to modify these Terms at any time. When we make material changes, we will
                update the &quot;Last updated&quot; date at the top of this page and notify you via email or
                through a prominent notice on the Platform at least thirty (30) days before the changes take
                effect.
              </p>
              <p>
                Your continued use of the Platform after the effective date of any changes constitutes your
                acceptance of the updated Terms. If you do not agree to the modified Terms, you must stop
                using the Platform and may terminate your account as described in Section 12.
              </p>
            </div>
          </section>

          {/* 14. Contact */}
          <section>
            <h2 className="text-xl font-bold text-[#1A2B4A] mb-4">14. Contact Information</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                If you have any questions or concerns about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 rounded-xl p-6 mt-4 space-y-2">
                <p>
                  <strong className="text-gray-900">Email:</strong>{' '}
                  <a href="mailto:legal@kealee.com" className="text-[#2DD4BF] hover:text-[#22C55E] font-medium">
                    legal@kealee.com
                  </a>
                </p>
                <p>
                  <strong className="text-gray-900">Company:</strong> Kealee LLC
                </p>
                <p>
                  <strong className="text-gray-900">Address:</strong> Washington, DC Metropolitan Area
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
