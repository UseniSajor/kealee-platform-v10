import { Metadata } from 'next';
import { ShieldCheck, Target, CheckCircle, Ban, UserCog, AlertOctagon, Flag, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Acceptable Use Policy | Kealee Platform',
  description:
    'Guidelines for acceptable use of the Kealee construction management platform and related services.',
};

export default function LegalAcceptableUsePage() {
  const lastUpdated = 'February 2026';

  return (
    <>
      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="text-blue-600" size={32} />
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
          Acceptable Use Policy
        </h1>
        <p className="text-xl text-gray-600">
          Guidelines for responsible use of the Kealee Platform
        </p>
        <p className="text-sm text-gray-500 mt-4">
          Last updated: {lastUpdated}
        </p>
      </div>

      {/* Introduction */}
      <div className="bg-blue-50 rounded-2xl p-8 mb-12">
        <p className="text-gray-700 leading-relaxed">
          Kealee LLC (&ldquo;Kealee,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
          provides the Kealee Platform to support construction professionals in managing projects
          efficiently and collaboratively. This Acceptable Use Policy (&ldquo;AUP&rdquo;) outlines
          the rules and guidelines for using the Platform. All users must comply with this policy
          in addition to our Terms of Service. Violation of this policy may result in suspension
          or termination of your account.
        </p>
      </div>

      {/* Table of Contents */}
      <div className="bg-gray-50 rounded-2xl p-8 mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Contents</h2>
        <nav className="grid md:grid-cols-2 gap-2">
          <a href="#purpose" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
            <Target size={16} />
            Purpose
          </a>
          <a href="#permitted-use" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
            <CheckCircle size={16} />
            Permitted Use
          </a>
          <a href="#prohibited-use" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
            <Ban size={16} />
            Prohibited Use
          </a>
          <a href="#account-responsibility" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
            <UserCog size={16} />
            Account Responsibility
          </a>
          <a href="#enforcement" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
            <AlertOctagon size={16} />
            Enforcement
          </a>
          <a href="#reporting" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
            <Flag size={16} />
            Reporting Violations
          </a>
          <a href="#contact" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
            <Globe size={16} />
            Contact
          </a>
        </nav>
      </div>

      {/* Sections */}
      <div className="space-y-12">

        {/* Section 1 */}
        <section id="purpose" className="scroll-mt-24">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Target className="text-blue-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">1. Purpose</h2>
          </div>
          <div className="space-y-4 pl-16 text-gray-600">
            <p>
              This Acceptable Use Policy establishes guidelines to ensure that all users of the
              Kealee Platform can benefit from a secure, reliable, and professional environment.
              The Kealee Platform is designed for construction industry professionals to manage
              projects, coordinate teams, track permits, estimate costs, and collaborate with
              stakeholders.
            </p>
            <p>
              By using the Platform, you agree to use it in a manner consistent with its intended
              purpose and in compliance with all applicable laws, regulations, and industry standards.
              This policy applies to all users, including project owners, general contractors,
              subcontractors, architects, engineers, and any other individuals or organizations
              accessing the Platform.
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section id="permitted-use" className="scroll-mt-24">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="text-blue-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">2. Permitted Use</h2>
          </div>
          <div className="space-y-6 pl-16">
            <p className="text-gray-600">
              The Kealee Platform is intended for the following legitimate business activities:
            </p>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Project Management</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Creating, managing, and tracking construction projects and milestones
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Managing project budgets, schedules, and resource allocation
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Tracking change orders, RFIs, submittals, and punch lists
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Document Management</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Uploading, storing, and sharing project documents, plans, and specifications
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Managing document versions and maintaining audit trails
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Sharing documents with authorized project stakeholders
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Team Coordination</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Communicating with project team members and stakeholders
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Coordinating with contractors, subcontractors, and vendors
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Managing bid processes and contractor selection
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Cost Estimation</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Using cost estimation tools for project planning and budgeting
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Accessing cost database information for accurate project pricing
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Generating and comparing project estimates
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section id="prohibited-use" className="scroll-mt-24">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Ban className="text-red-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">3. Prohibited Use</h2>
          </div>
          <div className="space-y-6 pl-16">
            <p className="text-gray-600">
              The following activities are strictly prohibited on the Kealee Platform:
            </p>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Unauthorized Access</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                  Accessing or attempting to access accounts, systems, or data that you are not authorized to use
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                  Circumventing or attempting to bypass any security measures, access controls, or authentication mechanisms
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                  Using another user&rsquo;s credentials without their explicit authorization
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Reverse Engineering</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                  Decompiling, disassembling, reverse engineering, or otherwise attempting to derive the source code of the Platform
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                  Copying, modifying, or creating derivative works based on the Platform or its underlying technology
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                  Removing, altering, or obscuring any proprietary notices, labels, or marks on the Platform
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Data Scraping</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                  Using automated tools, bots, scrapers, or crawlers to extract data from the Platform
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                  Systematically downloading, copying, or harvesting user data or content
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                  Using the Platform&rsquo;s APIs in ways that exceed documented rate limits or authorized use
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Harmful Content</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                  Uploading or transmitting viruses, malware, ransomware, or any other malicious code
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                  Uploading content that is defamatory, harassing, threatening, or discriminatory
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                  Distributing spam, phishing attempts, or unsolicited commercial communications through the Platform
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Illegal Activity</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                  Using the Platform for any purpose that violates applicable local, state, federal, or international laws or regulations
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                  Submitting fraudulent permit applications, falsified documents, or misleading project information
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                  Engaging in bid rigging, price fixing, or other anticompetitive practices through the Platform
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                  Reselling, sublicensing, or redistributing the Platform or its services without written authorization
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section id="account-responsibility" className="scroll-mt-24">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <UserCog className="text-blue-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">4. Account Responsibility</h2>
          </div>
          <div className="space-y-6 pl-16">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Credentials</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  You are responsible for maintaining the confidentiality of your account credentials, including passwords and API keys
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Use strong, unique passwords and enable multi-factor authentication when available
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Notify Kealee immediately at support@kealee.com if you suspect unauthorized access to your account
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Authorized Users</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  You are responsible for all activity conducted through your account, whether by you or by users you have authorized
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Ensure that all individuals you grant access to comply with this Acceptable Use Policy and the Terms of Service
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Promptly remove access for team members who leave your organization or no longer require Platform access
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Activity Monitoring</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Kealee reserves the right to monitor Platform usage to ensure compliance with this policy and to protect the security of the Platform
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Monitoring is conducted in accordance with our Privacy Policy and applicable laws
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Automated systems may flag unusual activity for review to help protect your account and data
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section id="enforcement" className="scroll-mt-24">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <AlertOctagon className="text-blue-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">5. Enforcement</h2>
          </div>
          <div className="space-y-6 pl-16">
            <p className="text-gray-600">
              Kealee takes violations of this policy seriously. Depending on the severity and nature
              of the violation, we may take one or more of the following actions:
            </p>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Warnings</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  For minor or first-time violations, we may issue a written warning and request that you cease the prohibited activity
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  We will provide details of the violation and guidance on how to come into compliance
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Suspension</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  For repeated or serious violations, we may temporarily suspend your access to the Platform
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  During suspension, your data will be preserved and you will be notified of the duration and conditions for reinstatement
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Termination</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  For severe violations, including illegal activity, security breaches, or persistent policy violations despite warnings, we may permanently terminate your account
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Upon termination, you will have 30 days to export your data before it is permanently deleted
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  We reserve the right to report illegal activities to the appropriate law enforcement authorities
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 6 */}
        <section id="reporting" className="scroll-mt-24">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Flag className="text-blue-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">6. Reporting Violations</h2>
          </div>
          <div className="space-y-4 pl-16 text-gray-600">
            <p>
              If you become aware of any activity that violates this Acceptable Use Policy, we encourage
              you to report it promptly. You can report violations through the following channels:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                <strong>Email:</strong>&nbsp;abuse@kealee.com
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                Use the &ldquo;Report&rdquo; feature available within the Platform
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                Contact our support team at support@kealee.com
              </li>
            </ul>
            <p>
              All reports are reviewed promptly and treated confidentially. We will not retaliate against
              users who report violations in good faith.
            </p>
          </div>
        </section>

        {/* Section 7 - Contact */}
        <section id="contact" className="scroll-mt-24">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Globe className="text-blue-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">7. Contact</h2>
          </div>
          <div className="pl-16">
            <p className="text-gray-600 mb-4">
              If you have questions about this Acceptable Use Policy, please contact us:
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

      {/* Changes to Policy */}
      <section className="mt-12 pt-12 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
        <p className="text-gray-600">
          We may update this Acceptable Use Policy from time to time. We will notify you of material
          changes by posting the updated policy on this page and updating the &ldquo;Last updated&rdquo;
          date. Continued use of the Platform after changes are posted constitutes acceptance of the
          updated policy.
        </p>
      </section>
    </>
  );
}
