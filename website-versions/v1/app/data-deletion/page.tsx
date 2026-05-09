import { Metadata } from 'next'
import Link from 'next/link'
import { Shield, Trash2, Mail, Clock, CheckCircle, FileText, AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Data Deletion Request | Kealee',
  description: 'Request deletion of your personal data from Kealee platform. Learn what data we hold, how to request deletion, and what happens after your request.',
}

const DATA_CATEGORIES = [
  {
    name: 'Account Information',
    examples: 'Name, email address, phone number, password hash',
    retention: 'Until account deletion or request',
  },
  {
    name: 'Project Intake Data',
    examples: 'Project details, address, budget, design preferences, form responses',
    retention: 'Until project completion + 3 years, or on request',
  },
  {
    name: 'Site Capture Media',
    examples: 'Property photos, videos, voice notes, 3D scan data',
    retention: 'Until project completion + 1 year, or on request',
  },
  {
    name: 'Digital Twin Data',
    examples: 'Property spatial models, system nodes, observations, AI-generated summaries',
    retention: 'Until account deletion or on request',
  },
  {
    name: 'Payment Records',
    examples: 'Transaction IDs, payment amounts, billing history (card details stored by Stripe)',
    retention: 'Required by law: 7 years for financial records',
  },
  {
    name: 'Communications',
    examples: 'SMS messages sent via Kealee, email history, support tickets',
    retention: '2 years or on request (legal hold may apply)',
  },
  {
    name: 'Usage & Analytics',
    examples: 'Page views, feature usage, session data',
    retention: 'Anonymized within 90 days; raw logs deleted within 12 months',
  },
  {
    name: 'AI Interaction Data',
    examples: 'KeaBot conversation history, AI-generated concept packages',
    retention: 'Until account deletion or on request',
  },
]

const DELETION_TIMELINE = [
  {
    step: 1,
    label: 'Submit your request',
    desc: 'Use the form below or email privacy@kealee.com with your name, email, and request type.',
    time: 'Immediately',
  },
  {
    step: 2,
    label: 'Verification',
    desc: "We'll verify your identity to protect against unauthorized deletion requests. Expect a confirmation email within 1 business day.",
    time: '1 business day',
  },
  {
    step: 3,
    label: 'Processing',
    desc: 'We locate all data associated with your account across our systems and begin the deletion process.',
    time: 'Up to 10 days',
  },
  {
    step: 4,
    label: 'Confirmation',
    desc: "You'll receive a written confirmation specifying what was deleted, what was retained (with legal basis), and the completion date.",
    time: 'Within 30 days total',
  },
]

const EXCEPTIONS = [
  {
    category: 'Legal obligations',
    detail: 'Financial transaction records must be retained for 7 years under applicable tax and accounting laws.',
  },
  {
    category: 'Active dispute or legal hold',
    detail: 'If there is an ongoing legal dispute, arbitration, or regulatory inquiry involving your account, certain records may be retained until resolution.',
  },
  {
    category: 'Fraud prevention',
    detail: 'Anonymized fraud signals (e.g., IP address hashes) may be retained up to 3 years for security purposes.',
  },
  {
    category: 'Third-party processors',
    detail: 'Stripe retains payment records per their own policies. We will forward your deletion request to applicable sub-processors.',
  },
]

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div style={{ backgroundColor: '#1A2B4A' }} className="py-16 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <Trash2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Data Deletion Request
          </h1>
          <p className="mt-3 text-lg text-blue-200">
            You have the right to request deletion of your personal data. We take this seriously and will process your request promptly.
          </p>
          <p className="mt-2 text-sm text-blue-300">
            Last updated: March 20, 2026
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 space-y-14">

        {/* Your Rights */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <Shield className="h-6 w-6" style={{ color: '#E8793A' }} />
            <h2 className="text-xl font-bold" style={{ color: '#1A2B4A' }}>Your Privacy Rights</h2>
          </div>
          <div className="rounded-2xl bg-orange-50 border border-orange-100 p-6 space-y-3 text-gray-700">
            <p>
              Under applicable privacy laws including the <strong>California Consumer Privacy Act (CCPA)</strong>, <strong>General Data Protection Regulation (GDPR)</strong>, and other state and national laws, you have the right to:
            </p>
            <ul className="space-y-2 ml-4">
              {[
                'Know what personal data we hold about you',
                'Request deletion of your personal data',
                'Request correction of inaccurate data',
                'Opt out of sale of your data (Kealee does not sell personal data)',
                'Data portability — receive a copy of your data in a machine-readable format',
                'Non-discrimination for exercising your privacy rights',
              ].map((right) => (
                <li key={right} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                  {right}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Data We Hold */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <FileText className="h-6 w-6" style={{ color: '#E8793A' }} />
            <h2 className="text-xl font-bold" style={{ color: '#1A2B4A' }}>Data We May Hold About You</h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#1A2B4A' }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-blue-200">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-blue-200">Examples</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-blue-200 hidden sm:table-cell">Default Retention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {DATA_CATEGORIES.map((cat, i) => (
                  <tr key={cat.name} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{cat.name}</td>
                    <td className="px-4 py-3 text-gray-500">{cat.examples}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{cat.retention}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* How to Request */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <Clock className="h-6 w-6" style={{ color: '#E8793A' }} />
            <h2 className="text-xl font-bold" style={{ color: '#1A2B4A' }}>Deletion Process &amp; Timeline</h2>
          </div>
          <div className="space-y-4">
            {DELETION_TIMELINE.map((item) => (
              <div key={item.step} className="flex gap-4">
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: '#E8793A' }}
                >
                  {item.step}
                </div>
                <div className="flex-1 pb-4 border-b border-gray-100 last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-gray-800">{item.label}</h3>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{item.time}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* What Can't Be Deleted */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <AlertCircle className="h-6 w-6" style={{ color: '#E8793A' }} />
            <h2 className="text-xl font-bold" style={{ color: '#1A2B4A' }}>What We May Be Required to Retain</h2>
          </div>
          <p className="mb-4 text-sm text-gray-500">
            Certain data may be exempt from deletion based on legal obligations. We will always inform you of any exceptions in our response.
          </p>
          <div className="space-y-3">
            {EXCEPTIONS.map((ex) => (
              <div key={ex.category} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4">
                <h3 className="text-sm font-semibold text-gray-800">{ex.category}</h3>
                <p className="mt-1 text-sm text-gray-500">{ex.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Submit Request */}
        <section id="submit">
          <div className="flex items-center gap-3 mb-5">
            <Mail className="h-6 w-6" style={{ color: '#E8793A' }} />
            <h2 className="text-xl font-bold" style={{ color: '#1A2B4A' }}>Submit a Deletion Request</h2>
          </div>

          <div className="rounded-2xl border-2 border-orange-100 bg-orange-50 p-6 space-y-6">
            <p className="text-sm text-gray-600">
              To submit a data deletion request, contact us using any of the methods below. Include your <strong>full name</strong>, <strong>email address on file</strong>, and <strong>type of request</strong> (deletion, access, correction, or portability).
            </p>

            {/* Email */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Email (Recommended — fastest response)</h3>
              <a
                href="mailto:privacy@kealee.com?subject=Data%20Deletion%20Request&body=Full%20Name%3A%0AEmail%20on%20file%3A%0ARequest%20type%3A%20Deletion%0AAdditional%20details%3A"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#1A2B4A' }}
              >
                <Mail className="h-4 w-4" />
                privacy@kealee.com
              </a>
              <p className="mt-2 text-xs text-gray-500">
                Use subject line: <em>"Data Deletion Request"</em>. We respond within 1 business day.
              </p>
            </div>

            {/* What to include */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">What to include in your request</h3>
              <ul className="space-y-1.5 text-sm text-gray-600">
                {[
                  'Your full name as registered with Kealee',
                  'Email address associated with your Kealee account',
                  'Phone number (optional, helps locate your records)',
                  'Type of request: Full deletion / Specific data category / Data access copy / Correction',
                  'Any project addresses or IDs if you want targeted deletion',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Authorized agent */}
            <div className="rounded-xl bg-white px-4 py-3 text-sm text-gray-500 border border-gray-100">
              <strong className="text-gray-700">Authorized Agents:</strong> If you are submitting on behalf of another person (e.g., a parent for a minor, or a legal representative), include proof of authorization such as a signed letter or power of attorney.
            </div>
          </div>
        </section>

        {/* Contact */}
        <section>
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-6 text-center">
            <h3 className="font-semibold text-gray-800 mb-1">Questions about your data?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Our privacy team is here to help. We respond to all privacy inquiries within 1 business day.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="mailto:privacy@kealee.com"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white"
                style={{ backgroundColor: '#E8793A' }}
              >
                <Mail className="h-4 w-4" /> privacy@kealee.com
              </a>
              <Link
                href="/privacy"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <FileText className="h-4 w-4" /> Privacy Policy
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
