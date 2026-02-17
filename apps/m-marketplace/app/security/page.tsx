import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Shield, Lock, Server, Eye, Key, CheckCircle, AlertTriangle, FileCheck } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Security',
  description: 'Learn about Kealee\'s enterprise-grade security measures that protect your project data.',
};

export default function SecurityPage() {
  const certifications = [
    {
      name: 'SOC 2 Type II',
      description: 'Independently audited for security, availability, and confidentiality',
      icon: FileCheck,
    },
    {
      name: 'SSL/TLS Encryption',
      description: '256-bit encryption for all data in transit',
      icon: Lock,
    },
    {
      name: 'AES-256 Encryption',
      description: 'Industry-standard encryption for data at rest',
      icon: Key,
    },
    {
      name: '99.9% Uptime SLA',
      description: 'Enterprise-grade availability guarantee',
      icon: Server,
    },
  ];

  const securityFeatures = [
    {
      category: 'Infrastructure Security',
      icon: Server,
      items: [
        'Hosted on AWS with enterprise-grade data centers',
        'Multi-region redundancy for disaster recovery',
        'Automated backups with point-in-time recovery',
        'DDoS protection and web application firewall',
        'Network segmentation and intrusion detection',
        'Regular penetration testing by third parties',
      ],
    },
    {
      category: 'Data Protection',
      icon: Lock,
      items: [
        'End-to-end encryption for sensitive data',
        'Secure file storage with versioning',
        'Data classification and handling policies',
        'Automated data retention and deletion',
        'Secure data export capabilities',
        'GDPR and CCPA compliance ready',
      ],
    },
    {
      category: 'Access Control',
      icon: Key,
      items: [
        'Role-based access control (RBAC)',
        'Multi-factor authentication (MFA)',
        'Single sign-on (SSO) integration',
        'Session management and timeout',
        'Detailed access audit logs',
        'IP allowlisting for enterprises',
      ],
    },
    {
      category: 'Monitoring & Response',
      icon: Eye,
      items: [
        '24/7 security monitoring',
        'Real-time threat detection',
        'Automated anomaly detection',
        'Incident response procedures',
        'Regular vulnerability assessments',
        'Security event logging and alerting',
      ],
    },
  ];

  const complianceItems = [
    {
      name: 'SOC 2 Type II',
      status: 'Certified',
      description: 'Annual audit of security controls',
    },
    {
      name: 'GDPR',
      status: 'Compliant',
      description: 'EU data protection regulation',
    },
    {
      name: 'CCPA',
      status: 'Compliant',
      description: 'California privacy rights',
    },
    {
      name: 'HIPAA',
      status: 'Available',
      description: 'Healthcare data protection (Enterprise plans)',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">

          {/* Hero */}
          <div className="text-center mb-16 max-w-4xl mx-auto">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="text-blue-600" size={32} />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Enterprise-Grade Security
            </h1>
            <p className="text-xl text-gray-600">
              Your project data is protected by industry-leading security practices.
              We take security seriously so you can focus on building.
            </p>
          </div>

          {/* Certifications */}
          <div className="grid md:grid-cols-4 gap-6 mb-20 max-w-6xl mx-auto">
            {certifications.map((cert, idx) => (
              <div key={idx} className="bg-gray-50 rounded-2xl p-6 text-center">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <cert.icon className="text-blue-600" size={28} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{cert.name}</h3>
                <p className="text-sm text-gray-600">{cert.description}</p>
              </div>
            ))}
          </div>

          {/* Security Overview */}
          <div className="bg-blue-600 rounded-3xl p-12 mb-20 max-w-6xl mx-auto text-white">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">
                  Security Built Into Everything We Do
                </h2>
                <p className="text-blue-100 text-lg mb-6">
                  Projects involve sensitive information—contracts, blueprints, financial data,
                  and proprietary processes. We've built Kealee from the ground up with security as a
                  foundational principle, not an afterthought.
                </p>
                <div className="space-y-3">
                  {[
                    'All data encrypted at rest and in transit',
                    'Regular third-party security audits',
                    'Dedicated security team monitoring 24/7',
                    'Compliance with industry standards',
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <CheckCircle className="text-blue-200" size={20} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-blue-500 rounded-2xl p-8">
                <h3 className="text-xl font-bold mb-4">Security by the Numbers</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-4xl font-bold">99.9%</div>
                    <div className="text-blue-200">Uptime SLA</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold">256-bit</div>
                    <div className="text-blue-200">Encryption</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold">24/7</div>
                    <div className="text-blue-200">Monitoring</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold">0</div>
                    <div className="text-blue-200">Data breaches</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Features */}
          <div className="max-w-6xl mx-auto mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Comprehensive Security Measures
              </h2>
              <p className="text-xl text-gray-600">
                Multiple layers of protection for your data
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {securityFeatures.map((feature, idx) => (
                <div key={idx} className="bg-white rounded-2xl border-2 border-gray-200 p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <feature.icon className="text-blue-600" size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{feature.category}</h3>
                  </div>
                  <ul className="space-y-3">
                    {feature.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start gap-3 text-gray-600">
                        <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance */}
          <div className="bg-gray-50 rounded-3xl p-12 mb-20 max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Compliance & Certifications
              </h2>
              <p className="text-xl text-gray-600">
                Meeting the highest industry standards
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {complianceItems.map((item, idx) => (
                <div key={idx} className="bg-white rounded-xl p-6 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
                    <CheckCircle size={14} />
                    {item.status}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.name}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Responsible Disclosure */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="text-amber-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Responsible Disclosure Program
                  </h3>
                  <p className="text-gray-600 mb-4">
                    We appreciate the security research community and welcome responsible disclosure
                    of potential vulnerabilities. If you discover a security issue, please report it
                    to our security team.
                  </p>
                  <div className="space-y-2 text-gray-600">
                    <p><strong>Email:</strong> security@kealee.com</p>
                    <p><strong>PGP Key:</strong> Available upon request</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    We commit to acknowledging reports within 24 hours and providing status updates
                    throughout the resolution process.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-4xl mx-auto mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Security FAQs
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: 'Where is my data stored?',
                  a: 'All data is stored in AWS data centers in the United States. We use multiple availability zones for redundancy and maintain regular backups.',
                },
                {
                  q: 'Who has access to my data?',
                  a: 'Only authorized Kealee employees with a business need can access customer data, and all access is logged. We follow the principle of least privilege.',
                },
                {
                  q: 'What happens if there\'s a security incident?',
                  a: 'We have a documented incident response plan. In the event of a breach affecting your data, we will notify you within 72 hours as required by applicable regulations.',
                },
                {
                  q: 'Can I get a copy of your security documentation?',
                  a: 'Yes. Enterprise customers can request our SOC 2 report, security questionnaire responses, and other documentation through their account manager.',
                },
                {
                  q: 'Do you support SSO?',
                  a: 'Yes. We support SAML 2.0 and OAuth 2.0 for single sign-on integration with popular identity providers including Okta, Azure AD, and Google Workspace.',
                },
              ].map((faq, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-gray-600">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gray-900 rounded-3xl p-12 text-center text-white max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              Questions About Security?
            </h2>
            <p className="text-gray-300 mb-8 text-lg">
              Our security team is happy to discuss our practices and answer any questions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition"
              >
                Contact Security Team
              </Link>
              <Link
                href="/privacy"
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition"
              >
                View Privacy Policy
              </Link>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
