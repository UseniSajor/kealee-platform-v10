import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FileText, Scale, AlertTriangle, CreditCard, Shield, Ban, RefreshCw, Gavel } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using the Kealee project management platform.',
};

export default function TermsPage() {
  const lastUpdated = 'January 15, 2025';
  const effectiveDate = 'January 15, 2025';

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">

            {/* Header */}
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="text-blue-600" size={32} />
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Terms of Service
              </h1>
              <p className="text-xl text-gray-600">
                The rules that govern your use of Kealee
              </p>
              <div className="flex justify-center gap-6 mt-4 text-sm text-gray-500">
                <p>Last updated: {lastUpdated}</p>
                <p>Effective: {effectiveDate}</p>
              </div>
            </div>

            {/* Introduction */}
            <div className="bg-blue-50 rounded-2xl p-8 mb-12">
              <p className="text-gray-700 leading-relaxed">
                Welcome to Kealee. These Terms of Service ("Terms") govern your access to and use of the Kealee
                platform, including our websites, mobile applications, and related services (collectively, the
                "Services"). By accessing or using our Services, you agree to be bound by these Terms. If you
                do not agree, please do not use our Services.
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
                  You must be 18+ and authorized to act for your business
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  You own your data; we have a license to provide our services
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Payment is due according to your subscription plan
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Either party can terminate with 30 days notice
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  We're not liable for permit denials or project outcomes
                </li>
              </ul>
            </div>

            {/* Terms Content */}
            <div className="prose prose-lg max-w-none">

              {/* Section 1 */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                  Account Registration and Eligibility
                </h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    <strong>1.1 Eligibility.</strong> To use Kealee, you must be at least 18 years old and capable of
                    forming a binding contract. If you are using Kealee on behalf of a company or organization, you
                    represent that you have authority to bind that entity to these Terms.
                  </p>
                  <p>
                    <strong>1.2 Account Creation.</strong> You must provide accurate, complete, and current information
                    when creating an account. You are responsible for maintaining the security of your account credentials
                    and for all activities that occur under your account.
                  </p>
                  <p>
                    <strong>1.3 Account Types.</strong> Kealee offers different account types (individual, team, enterprise).
                    Features and pricing vary by account type. You agree to use only the features available for your account type.
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                  Services Description
                </h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    <strong>2.1 Platform Services.</strong> Kealee provides project management tools, including
                    but not limited to: permit application processing, project tracking, document management, team collaboration,
                    and integration with third-party services.
                  </p>
                  <p>
                    <strong>2.2 Professional Services.</strong> Kealee also offers on-demand professional services including
                    architecture, engineering review, estimation, and project management support. These services are provided
                    by licensed professionals and are subject to additional terms specific to each service.
                  </p>
                  <p>
                    <strong>2.3 Service Availability.</strong> We strive to maintain 99.9% uptime but do not guarantee
                    uninterrupted access. Scheduled maintenance will be communicated in advance when possible.
                  </p>
                </div>
              </section>

              {/* Section 3 */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">3</span>
                  Fees and Payment
                </h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    <strong>3.1 Subscription Fees.</strong> Access to Kealee requires payment of subscription fees as
                    described on our pricing page. Fees are billed in advance on a monthly or annual basis, depending
                    on your selected plan.
                  </p>
                  <p>
                    <strong>3.2 Per-Service Fees.</strong> Certain services (such as permit processing or professional
                    services) are charged on a per-use basis. These fees are billed upon service completion or as otherwise specified.
                  </p>
                  <p>
                    <strong>3.3 Payment Terms.</strong> All fees are non-refundable except as expressly stated in these
                    Terms or required by law. We accept major credit cards and ACH transfers. Overdue amounts may incur
                    late fees of 1.5% per month.
                  </p>
                  <p>
                    <strong>3.4 Price Changes.</strong> We may change our prices with 30 days notice. Price changes will
                    apply to your next billing cycle.
                  </p>
                </div>
              </section>

              {/* Section 4 */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">4</span>
                  Your Content and Data
                </h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    <strong>4.1 Ownership.</strong> You retain all ownership rights to the content and data you upload
                    to Kealee ("Your Content"). We do not claim ownership of Your Content.
                  </p>
                  <p>
                    <strong>4.2 License to Kealee.</strong> By uploading content, you grant Kealee a non-exclusive,
                    worldwide license to use, store, display, and process Your Content solely for the purpose of
                    providing our Services to you.
                  </p>
                  <p>
                    <strong>4.3 Responsibility.</strong> You are solely responsible for Your Content. You represent
                    that you have all necessary rights to upload and share Your Content through our Services.
                  </p>
                  <p>
                    <strong>4.4 Data Export.</strong> You may export Your Content at any time through our platform's
                    export features. We will retain Your Content for 30 days after account termination to allow for export.
                  </p>
                </div>
              </section>

              {/* Section 5 */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">5</span>
                  Acceptable Use
                </h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    <strong>5.1 Permitted Use.</strong> You may use Kealee only for lawful business purposes related
                    to project management, project coordination, and related activities.
                  </p>
                  <p>
                    <strong>5.2 Prohibited Conduct.</strong> You agree not to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Violate any applicable laws or regulations</li>
                    <li>Infringe on intellectual property rights of others</li>
                    <li>Upload malicious code or attempt to breach our security</li>
                    <li>Share account credentials with unauthorized parties</li>
                    <li>Use the platform for fraudulent permit applications</li>
                    <li>Resell or redistribute our Services without authorization</li>
                    <li>Interfere with other users' use of the Services</li>
                  </ul>
                </div>
              </section>

              {/* Section 6 */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">6</span>
                  Permit Services Disclaimer
                </h2>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-4 text-gray-700">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-amber-600 flex-shrink-0 mt-1" size={20} />
                    <div>
                      <p className="font-semibold mb-2">Important Notice About Permit Services</p>
                      <p>
                        Kealee assists with permit application preparation and submission but does not guarantee
                        permit approval. Permit decisions are made solely by the applicable governmental jurisdictions.
                      </p>
                    </div>
                  </div>
                  <p>
                    <strong>6.1</strong> We are not responsible for permit denials, delays, or additional requirements
                    imposed by jurisdictions.
                  </p>
                  <p>
                    <strong>6.2</strong> Our AI review tools are designed to catch common issues but cannot guarantee
                    compliance with all jurisdiction-specific requirements.
                  </p>
                  <p>
                    <strong>6.3</strong> You remain ultimately responsible for ensuring your projects comply with all
                    applicable building codes, zoning requirements, and regulations.
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
                  <p>
                    <strong>7.1 Disclaimer of Warranties.</strong> THE SERVICES ARE PROVIDED "AS IS" WITHOUT WARRANTY
                    OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY,
                    FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                  </p>
                  <p>
                    <strong>7.2 Limitation of Liability.</strong> TO THE MAXIMUM EXTENT PERMITTED BY LAW, KEALEE'S
                    TOTAL LIABILITY FOR ANY CLAIMS ARISING FROM YOUR USE OF THE SERVICES SHALL NOT EXCEED THE AMOUNT
                    YOU PAID TO KEALEE IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
                  </p>
                  <p>
                    <strong>7.3 Exclusion of Damages.</strong> IN NO EVENT SHALL KEALEE BE LIABLE FOR ANY INDIRECT,
                    INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR
                    BUSINESS OPPORTUNITIES.
                  </p>
                </div>
              </section>

              {/* Section 8 */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">8</span>
                  Termination
                </h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    <strong>8.1 Termination by You.</strong> You may cancel your subscription at any time through
                    your account settings or by contacting support. Cancellation will be effective at the end of
                    your current billing period.
                  </p>
                  <p>
                    <strong>8.2 Termination by Kealee.</strong> We may suspend or terminate your access if you
                    violate these Terms, fail to pay fees, or engage in conduct that harms other users or our Services.
                  </p>
                  <p>
                    <strong>8.3 Effect of Termination.</strong> Upon termination, your right to use the Services
                    ends immediately. We will retain Your Content for 30 days to allow for export, after which it
                    may be deleted.
                  </p>
                </div>
              </section>

              {/* Section 9 */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">9</span>
                  Dispute Resolution
                </h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    <strong>9.1 Governing Law.</strong> These Terms are governed by the laws of the District of
                    Columbia, without regard to conflict of law principles.
                  </p>
                  <p>
                    <strong>9.2 Arbitration.</strong> Any disputes arising from these Terms or your use of the
                    Services shall be resolved through binding arbitration administered by the American Arbitration
                    Association. The arbitration shall take place in Washington, DC.
                  </p>
                  <p>
                    <strong>9.3 Class Action Waiver.</strong> You agree to resolve disputes with us on an individual
                    basis and waive any right to participate in class action lawsuits or class-wide arbitration.
                  </p>
                </div>
              </section>

              {/* Section 10 */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">10</span>
                  General Provisions
                </h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    <strong>10.1 Entire Agreement.</strong> These Terms, together with our Privacy Policy and any
                    service-specific terms, constitute the entire agreement between you and Kealee.
                  </p>
                  <p>
                    <strong>10.2 Modifications.</strong> We may modify these Terms at any time. We will notify you
                    of material changes via email or through the platform. Continued use after changes constitutes acceptance.
                  </p>
                  <p>
                    <strong>10.3 Severability.</strong> If any provision of these Terms is found unenforceable,
                    the remaining provisions will remain in effect.
                  </p>
                  <p>
                    <strong>10.4 No Waiver.</strong> Our failure to enforce any right or provision of these Terms
                    will not constitute a waiver of such right or provision.
                  </p>
                </div>
              </section>

            </div>

            {/* Contact */}
            <section className="mt-12 bg-gray-50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions?</h2>
              <p className="text-gray-600 mb-4">
                If you have questions about these Terms of Service, please contact us:
              </p>
              <div className="space-y-2 text-gray-600">
                <p><strong>Email:</strong> legal@kealee.com</p>
                <p><strong>Address:</strong> Kealee LLC, Washington, DC</p>
              </div>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
