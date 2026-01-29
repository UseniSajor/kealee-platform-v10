import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Shield, Eye, Lock, Database, UserCheck, Bell } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how Kealee collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
  const lastUpdated = 'January 15, 2025';

  const sections = [
    {
      id: 'information-collected',
      title: 'Information We Collect',
      icon: Database,
      content: [
        {
          subtitle: 'Information You Provide',
          items: [
            'Account information (name, email, phone number, company name)',
            'Project details and construction documentation',
            'Payment and billing information',
            'Communications with our team',
            'Feedback and survey responses',
          ],
        },
        {
          subtitle: 'Information Collected Automatically',
          items: [
            'Device information (browser type, operating system)',
            'Usage data (pages visited, features used, time spent)',
            'IP address and general location',
            'Cookies and similar tracking technologies',
          ],
        },
      ],
    },
    {
      id: 'how-we-use',
      title: 'How We Use Your Information',
      icon: Eye,
      content: [
        {
          subtitle: 'Primary Uses',
          items: [
            'Providing and improving our construction management services',
            'Processing permits and coordinating with jurisdictions',
            'Managing your projects and team collaboration',
            'Processing payments and maintaining billing records',
            'Sending service-related communications',
            'Providing customer support',
          ],
        },
        {
          subtitle: 'Secondary Uses',
          items: [
            'Analyzing usage patterns to improve our platform',
            'Sending marketing communications (with your consent)',
            'Conducting research to develop new features',
            'Ensuring platform security and preventing fraud',
          ],
        },
      ],
    },
    {
      id: 'data-sharing',
      title: 'How We Share Your Information',
      icon: UserCheck,
      content: [
        {
          subtitle: 'We may share your information with:',
          items: [
            'Service providers who help operate our platform (hosting, payment processing)',
            'Government agencies when processing permits on your behalf',
            'Professional partners (architects, engineers) you engage through our platform',
            'Legal authorities when required by law or to protect rights',
          ],
        },
        {
          subtitle: 'We never:',
          items: [
            'Sell your personal information to third parties',
            'Share your project data with competitors',
            'Use your information for purposes you haven\'t consented to',
          ],
        },
      ],
    },
    {
      id: 'data-security',
      title: 'How We Protect Your Information',
      icon: Lock,
      content: [
        {
          subtitle: 'Security Measures',
          items: [
            '256-bit SSL/TLS encryption for all data in transit',
            'AES-256 encryption for data at rest',
            'SOC 2 Type II certified data centers',
            'Regular security audits and penetration testing',
            'Role-based access controls',
            'Multi-factor authentication options',
            '24/7 security monitoring',
          ],
        },
      ],
    },
    {
      id: 'your-rights',
      title: 'Your Rights and Choices',
      icon: Shield,
      content: [
        {
          subtitle: 'You have the right to:',
          items: [
            'Access your personal information',
            'Correct inaccurate data',
            'Delete your account and associated data',
            'Export your data in a portable format',
            'Opt out of marketing communications',
            'Restrict certain processing activities',
          ],
        },
        {
          subtitle: 'To exercise these rights:',
          items: [
            'Contact us at privacy@kealee.com',
            'Use the settings in your account dashboard',
            'We will respond within 30 days',
          ],
        },
      ],
    },
    {
      id: 'cookies',
      title: 'Cookies and Tracking',
      icon: Bell,
      content: [
        {
          subtitle: 'Types of cookies we use:',
          items: [
            'Essential cookies (required for platform functionality)',
            'Performance cookies (help us understand usage)',
            'Functional cookies (remember your preferences)',
            'Marketing cookies (only with your consent)',
          ],
        },
        {
          subtitle: 'Managing cookies:',
          items: [
            'Use our cookie preference center',
            'Adjust your browser settings',
            'Note: disabling essential cookies may affect functionality',
          ],
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">

            {/* Header */}
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="text-blue-600" size={32} />
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Privacy Policy
              </h1>
              <p className="text-xl text-gray-600">
                Your privacy matters. Here's how we protect it.
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Last updated: {lastUpdated}
              </p>
            </div>

            {/* Introduction */}
            <div className="bg-blue-50 rounded-2xl p-8 mb-12">
              <p className="text-gray-700 leading-relaxed">
                Kealee Construction LLC ("Kealee," "we," "us," or "our") is committed to protecting your privacy.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when
                you use our construction management platform and related services. By using Kealee, you agree
                to the collection and use of information in accordance with this policy.
              </p>
            </div>

            {/* Table of Contents */}
            <div className="bg-gray-50 rounded-2xl p-8 mb-12">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contents</h2>
              <nav className="grid md:grid-cols-2 gap-2">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
                  >
                    <section.icon size={16} />
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>

            {/* Sections */}
            <div className="space-y-12">
              {sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-24">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <section.icon className="text-blue-600" size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                  </div>

                  <div className="space-y-6 pl-16">
                    {section.content.map((block, idx) => (
                      <div key={idx}>
                        <h3 className="font-semibold text-gray-900 mb-3">{block.subtitle}</h3>
                        <ul className="space-y-2">
                          {block.items.map((item, itemIdx) => (
                            <li key={itemIdx} className="flex items-start gap-3 text-gray-600">
                              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* Data Retention */}
            <section className="mt-12 pt-12 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>
              <p className="text-gray-600 mb-4">
                We retain your personal information for as long as necessary to provide our services and fulfill
                the purposes outlined in this policy. Specifically:
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Account data is retained while your account is active
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Project data is retained for 7 years after project completion (for regulatory compliance)
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  Payment records are retained as required by tax laws
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  You can request deletion of your data at any time (subject to legal requirements)
                </li>
              </ul>
            </section>

            {/* Children's Privacy */}
            <section className="mt-12 pt-12 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
              <p className="text-gray-600">
                Kealee is designed for business use and is not intended for children under 18. We do not
                knowingly collect personal information from children. If you believe we have collected
                information from a child, please contact us immediately at privacy@kealee.com.
              </p>
            </section>

            {/* Changes to Policy */}
            <section className="mt-12 pt-12 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
              <p className="text-gray-600">
                We may update this Privacy Policy from time to time. We will notify you of any material changes
                by posting the new policy on this page and updating the "Last updated" date. For significant
                changes, we will provide additional notice via email or through the platform.
              </p>
            </section>

            {/* Contact */}
            <section className="mt-12 bg-gray-50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-600 mb-4">
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="space-y-2 text-gray-600">
                <p><strong>Email:</strong> privacy@kealee.com</p>
                <p><strong>Address:</strong> Kealee Construction LLC, Washington, DC</p>
              </div>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
