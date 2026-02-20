import { Metadata } from 'next';
import { Shield, Database, Eye, UserCheck, Lock, Bell, Clock, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | Kealee Platform',
  description:
    'Learn how Kealee collects, uses, and protects your personal information on the Kealee construction management platform.',
};

export default function LegalPrivacyPage() {
  const lastUpdated = 'February 2026';

  return (
    <>
      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Shield className="text-blue-600" size={32} />
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
          Privacy Policy
        </h1>
        <p className="text-xl text-gray-600">
          How we collect, use, and protect your information
        </p>
        <p className="text-sm text-gray-500 mt-4">
          Last updated: {lastUpdated}
        </p>
      </div>

      {/* Introduction */}
      <div className="bg-blue-50 rounded-2xl p-8 mb-12">
        <p className="text-gray-700 leading-relaxed">
          Kealee LLC (&ldquo;Kealee,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
          is committed to protecting your privacy. This Privacy Policy describes how we collect, use,
          disclose, and safeguard your information when you use the Kealee Platform and related services.
          By accessing or using the Kealee Platform, you consent to the data practices described in this policy.
        </p>
      </div>

      {/* Table of Contents */}
      <div className="bg-gray-50 rounded-2xl p-8 mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Contents</h2>
        <nav className="grid md:grid-cols-2 gap-2">
          <a href="#information-collected" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
            <Database size={16} />
            Information We Collect
          </a>
          <a href="#how-we-use" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
            <Eye size={16} />
            How We Use Information
          </a>
          <a href="#data-sharing" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
            <UserCheck size={16} />
            Data Sharing
          </a>
          <a href="#data-security" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
            <Lock size={16} />
            Data Security
          </a>
          <a href="#data-retention" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
            <Clock size={16} />
            Data Retention
          </a>
          <a href="#your-rights" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
            <Shield size={16} />
            Your Rights
          </a>
          <a href="#cookies" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
            <Bell size={16} />
            Cookies &amp; Tracking
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
        <section id="information-collected" className="scroll-mt-24">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Database className="text-blue-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">1. Information We Collect</h2>
          </div>
          <div className="space-y-6 pl-16">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Account Information</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Name, email address, phone number, and company name
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Business address and professional role or title
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Account credentials and authentication information
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Billing and payment information (processed securely through Stripe)
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Project Data</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Project documents, plans, specifications, and drawings
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Bid submissions, cost estimates, and financial project data
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Permit applications and correspondence with jurisdictions
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Team communications, RFIs, change orders, and meeting notes
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Usage Analytics</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Pages visited, features used, and actions taken on the Platform
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Session duration, click patterns, and navigation paths
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Error logs and performance data
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Device Information</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Browser type and version, operating system, and device type
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  IP address and general geographic location
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Screen resolution and language preferences
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section id="how-we-use" className="scroll-mt-24">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Eye className="text-blue-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">2. How We Use Information</h2>
          </div>
          <div className="space-y-6 pl-16">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Service Delivery</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Providing, operating, and maintaining the Kealee Platform and its features
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Processing permit applications, bids, and project documents
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Facilitating team collaboration and stakeholder communication
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Processing payments and managing subscription billing
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Communication</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Sending service-related notifications, updates, and alerts
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Responding to support requests and inquiries
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Sending marketing communications (with your consent; you may opt out at any time)
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Improvement</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Analyzing usage patterns to improve features and user experience
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Developing new products, features, and services
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Conducting research and generating aggregated, anonymized analytics
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Compliance</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Complying with legal obligations and regulatory requirements
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Enforcing our Terms of Service and preventing fraud or abuse
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Protecting the rights, safety, and property of Kealee and our users
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section id="data-sharing" className="scroll-mt-24">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <UserCheck className="text-blue-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">3. Data Sharing</h2>
          </div>
          <div className="space-y-6 pl-16">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Third-Party Service Providers</h3>
              <p className="text-gray-600 mb-3">
                We share information with trusted service providers who assist in operating the Platform:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <strong>Stripe</strong> &mdash; for secure payment processing and billing management
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <strong>Supabase</strong> &mdash; for database hosting, authentication, and file storage
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Cloud infrastructure providers for hosting and content delivery
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Analytics providers for understanding platform usage
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Legal Requirements</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  When required by law, regulation, legal process, or governmental request
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  To protect the rights, property, or safety of Kealee, our users, or the public
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  To enforce our Terms of Service or investigate potential violations
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Business Transfers</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  In connection with a merger, acquisition, reorganization, or sale of assets, your information may be transferred as part of that transaction
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  We will notify you of any such transfer and any choices you may have regarding your information
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">What We Do Not Do</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  We do not sell your personal information to third parties
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  We do not share your project data with competitors or unrelated businesses
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  We do not use your information for purposes beyond what is described in this policy
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section id="data-security" className="scroll-mt-24">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Lock className="text-blue-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">4. Data Security</h2>
          </div>
          <div className="space-y-6 pl-16">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Encryption</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  All data transmitted between your device and the Kealee Platform is encrypted using TLS 1.2 or higher
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Data stored on our servers is encrypted at rest using AES-256 encryption
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Payment information is processed in compliance with PCI DSS standards through Stripe
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Access Controls</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Role-based access controls limit data access to authorized personnel only
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Multi-factor authentication is available for all accounts
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Employee access to user data is logged and restricted on a need-to-know basis
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Regular Audits</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  We conduct regular security assessments and vulnerability testing
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Our infrastructure is continuously monitored for potential security threats
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  We maintain an incident response plan and will notify affected users of any data breach in accordance with applicable law
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section id="data-retention" className="scroll-mt-24">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Clock className="text-blue-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">5. Data Retention</h2>
          </div>
          <div className="space-y-6 pl-16">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Active Account Data</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Account and profile data is retained for the duration of your active account
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Project data is retained for 7 years after project completion for regulatory compliance
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Payment and billing records are retained as required by tax and financial regulations
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Deleted Account Cleanup</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Upon account deletion, personal data is removed within 30 days
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Anonymized usage data may be retained for analytics and service improvement
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Certain records may be retained longer when required by law or for legitimate business purposes (such as resolving disputes)
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 6 */}
        <section id="your-rights" className="scroll-mt-24">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Shield className="text-blue-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">6. Your Rights</h2>
          </div>
          <div className="space-y-6 pl-16">
            <p className="text-gray-600">
              Depending on your jurisdiction, you may have the following rights regarding your personal information:
            </p>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Available Rights</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <strong>Access</strong> &mdash; Request a copy of the personal information we hold about you
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <strong>Correction</strong> &mdash; Request that we correct inaccurate or incomplete personal information
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <strong>Deletion</strong> &mdash; Request that we delete your personal information, subject to legal retention requirements
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <strong>Portability</strong> &mdash; Request your data in a structured, machine-readable format for transfer to another service
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <strong>Opt-out</strong> &mdash; Unsubscribe from marketing communications at any time using the link in any marketing email or through your account settings
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">How to Exercise Your Rights</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Contact us at privacy@kealee.com with your request
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Use the data management tools available in your account settings
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  We will respond to verified requests within 30 days
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 7 */}
        <section id="cookies" className="scroll-mt-24">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Bell className="text-blue-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">7. Cookies &amp; Tracking</h2>
          </div>
          <div className="space-y-6 pl-16">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Analytics</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  We use analytics cookies to understand how users interact with the Platform
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Analytics data is aggregated and does not identify individual users
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Preferences</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Functional cookies remember your settings, preferences, and login state
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Essential cookies are required for the Platform to function and cannot be disabled
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Marketing</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Marketing cookies are only placed with your explicit consent
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  You can manage your cookie preferences at any time through your browser settings or our cookie preference center
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Disabling non-essential cookies will not affect core Platform functionality
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 8 - Contact */}
        <section id="contact" className="scroll-mt-24">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Globe className="text-blue-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">8. Contact</h2>
          </div>
          <div className="pl-16">
            <p className="text-gray-600 mb-4">
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="space-y-2 text-gray-600">
                <p><strong>Kealee LLC</strong></p>
                <p>Washington, DC</p>
                <p><strong>Email:</strong> privacy@kealee.com</p>
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
          We may update this Privacy Policy from time to time. We will notify you of material changes
          by posting the updated policy on this page, updating the &ldquo;Last updated&rdquo; date, and
          sending you an email notification. We encourage you to review this policy periodically. Your
          continued use of the Platform after changes are posted constitutes your acceptance of the
          updated policy.
        </p>
      </section>
    </>
  );
}
