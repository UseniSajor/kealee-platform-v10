import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Shield, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy — Kealee Platform',
  description: 'Privacy Policy for the Kealee Platform. Learn how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-[#0F0F19]">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#CC5500]/10 mb-6">
              <Shield className="w-8 h-8 text-[#CC5500]" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
            <p className="text-gray-400">Effective Date: March 5, 2026</p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">

            <p className="text-gray-600 leading-relaxed text-lg mb-12">
              Kealee Platform (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is operated by <strong>Kealee Construction LLC</strong>. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website at <strong>kealee.com</strong> and associated services (collectively, the &quot;Platform&quot;).
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">1. Information We Collect</h2>

            <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">Personal Information</h3>
            <p className="text-gray-600 leading-relaxed">When you create an account, purchase a product, or interact with our Platform, we may collect:</p>
            <ul className="text-gray-600 space-y-2 list-disc pl-6 mt-3">
              <li>Full name and email address</li>
              <li>Phone number</li>
              <li>Company or organization name</li>
              <li>Billing and payment information (processed securely via Stripe)</li>
              <li>Project details and uploaded documents</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">Usage Data</h3>
            <p className="text-gray-600 leading-relaxed">We automatically collect certain information when you access the Platform, including:</p>
            <ul className="text-gray-600 space-y-2 list-disc pl-6 mt-3">
              <li>IP address and browser type</li>
              <li>Pages visited and time spent on pages</li>
              <li>Device type and operating system</li>
              <li>Referring URLs and search terms</li>
              <li>Interaction data (clicks, scrolls, feature usage)</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">Cookies and Tracking Technologies</h3>
            <p className="text-gray-600 leading-relaxed">
              We use cookies, pixels, and similar technologies to enhance your experience, analyze usage patterns, and deliver relevant content. You can manage cookie preferences through your browser settings.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-600 leading-relaxed">We use the information we collect to:</p>
            <ul className="text-gray-600 space-y-2 list-disc pl-6 mt-3">
              <li>Operate, maintain, and improve the Platform</li>
              <li>Process transactions and send related information (confirmations, invoices)</li>
              <li>Send you communications about your account, projects, and platform updates</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Personalize your experience and deliver tailored content</li>
              <li>Analyze usage trends to improve our services</li>
              <li>Detect, prevent, and address technical issues and fraud</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">3. Third-Party Services</h2>
            <p className="text-gray-600 leading-relaxed">
              We work with trusted third-party service providers to operate the Platform. These providers have access to your information only as needed to perform services on our behalf and are obligated to protect it:
            </p>
            <ul className="text-gray-600 space-y-2 list-disc pl-6 mt-3">
              <li><strong>Supabase</strong> — Authentication and user account management</li>
              <li><strong>Stripe</strong> — Payment processing and billing</li>
              <li><strong>Meta (Facebook) Platform</strong> — Advertising, analytics, and social login integration</li>
              <li><strong>Anthropic (Claude AI)</strong> — AI-powered features including estimation, document analysis, and chat assistance</li>
              <li><strong>Resend</strong> — Transactional and marketing email delivery</li>
              <li><strong>Twilio</strong> — SMS notifications</li>
              <li><strong>Vercel</strong> — Website hosting and performance analytics</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">4. Data Sharing and Disclosure</h2>
            <p className="text-gray-600 leading-relaxed">We do not sell your personal information. We may share your information in the following circumstances:</p>
            <ul className="text-gray-600 space-y-2 list-disc pl-6 mt-3">
              <li>With service providers who assist in platform operations (as listed above)</li>
              <li>When required by law, regulation, or legal process</li>
              <li>To protect the rights, property, or safety of Kealee, our users, or others</li>
              <li>In connection with a merger, acquisition, or sale of assets (with notice to you)</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">5. Data Retention</h2>
            <p className="text-gray-600 leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide you services. If you request deletion of your account, we will delete or anonymize your personal data within <strong>30 days</strong>, except where we are required to retain it for legal, accounting, or regulatory purposes.
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              Usage data and aggregated analytics may be retained in anonymized form indefinitely to improve our services.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">6. Data Security</h2>
            <p className="text-gray-600 leading-relaxed">
              We implement industry-standard security measures to protect your information, including encryption in transit (TLS/SSL), encrypted storage, secure authentication, and regular security audits. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">7. Your Rights</h2>
            <p className="text-gray-600 leading-relaxed">Depending on your location, you may have the following rights regarding your personal data:</p>
            <ul className="text-gray-600 space-y-2 list-disc pl-6 mt-3">
              <li><strong>Access</strong> — Request a copy of the personal data we hold about you</li>
              <li><strong>Correction</strong> — Request correction of inaccurate or incomplete data</li>
              <li><strong>Deletion</strong> — Request deletion of your personal data (see our <Link href="/data-deletion" className="text-[#57A7DB] hover:underline">Data Deletion page</Link>)</li>
              <li><strong>Portability</strong> — Request a machine-readable copy of your data</li>
              <li><strong>Objection</strong> — Object to processing of your data for certain purposes</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              To exercise any of these rights, please contact us at{' '}
              <a href="mailto:info@kealee.com" className="text-[#57A7DB] hover:underline">info@kealee.com</a>.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">8. Children&apos;s Privacy</h2>
            <p className="text-gray-600 leading-relaxed">
              The Platform is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected data from a child, please contact us immediately.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">9. Changes to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and updating the effective date. Your continued use of the Platform after changes are posted constitutes your acceptance of the updated policy.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">10. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 rounded-xl p-6 mt-4">
              <p className="text-gray-900 font-semibold">Kealee Construction LLC</p>
              <p className="text-gray-600 mt-2">
                <Mail className="w-4 h-4 inline mr-2 text-[#57A7DB]" />
                <a href="mailto:info@kealee.com" className="text-[#57A7DB] hover:underline">info@kealee.com</a>
              </p>
              <p className="text-gray-600 mt-1">
                Website:{' '}
                <a href="https://kealee.com" className="text-[#57A7DB] hover:underline">kealee.com</a>
              </p>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
