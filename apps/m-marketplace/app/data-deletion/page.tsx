import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Trash2, Mail, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Data Deletion Request — Kealee Platform',
  description: 'Request deletion of your personal data from the Kealee Platform.',
};

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-[#0F0F19]">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#CC5500]/10 mb-6">
              <Trash2 className="w-8 h-8 text-[#CC5500]" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Data Deletion Request</h1>
            <p className="text-gray-400">Request removal of your personal data from the Kealee Platform</p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">

            <p className="text-gray-600 leading-relaxed text-lg mb-12">
              At Kealee, we respect your right to control your personal data. You may request the deletion of your account and all associated personal information at any time. This page explains how to submit a deletion request and what to expect.
            </p>

            {/* How to Request */}
            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">How to Request Data Deletion</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              To request deletion of your data, send an email to:
            </p>
            <div className="bg-[#57A7DB]/10 border border-[#57A7DB]/20 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-3">
                <Mail className="w-6 h-6 text-[#57A7DB] flex-shrink-0" />
                <div>
                  <a href="mailto:info@kealee.com?subject=Data%20Deletion%20Request" className="text-lg font-semibold text-[#57A7DB] hover:underline">
                    info@kealee.com
                  </a>
                  <p className="text-gray-600 text-sm mt-1">
                    Subject line: <strong>&quot;Data Deletion Request&quot;</strong>
                  </p>
                </div>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed">
              In your email, please include:
            </p>
            <ul className="text-gray-600 space-y-2 list-disc pl-6 mt-3">
              <li>Your full name</li>
              <li>The email address associated with your Kealee account</li>
              <li>A brief statement requesting data deletion</li>
            </ul>

            {/* What Gets Deleted */}
            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">What Data Will Be Deleted</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Upon processing your request, we will delete or anonymize the following data:
            </p>
            <ul className="text-gray-600 space-y-2 list-disc pl-6">
              <li>Your account profile information (name, email, phone number, company)</li>
              <li>Project data and uploaded documents</li>
              <li>Chat and communication history</li>
              <li>Usage data and activity logs linked to your account</li>
              <li>Any data shared with third-party integrations on your behalf (e.g., Meta/Facebook, Stripe)</li>
            </ul>

            {/* What May Be Retained */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mt-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Data We May Need to Retain</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Certain data may be retained where required by law, such as transaction records for tax and accounting purposes, or data needed to resolve disputes or enforce our agreements. Any retained data will be minimized and securely stored.
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">Deletion Timeline</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#57A7DB]/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-[#57A7DB]" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Step 1: Submit Your Request</p>
                  <p className="text-gray-600 text-sm">Email us at info@kealee.com with the subject &quot;Data Deletion Request.&quot;</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#57A7DB]/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-[#57A7DB]" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Step 2: Identity Verification</p>
                  <p className="text-gray-600 text-sm">We will verify your identity to protect against unauthorized deletion requests. You will receive a confirmation email within 5 business days.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#57A7DB]/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-[#57A7DB]" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Step 3: Data Deletion</p>
                  <p className="text-gray-600 text-sm">Your data will be permanently deleted within <strong>30 days</strong> of verification. You will receive a final confirmation email once the process is complete.</p>
                </div>
              </div>
            </div>

            {/* Meta/Facebook Compliance */}
            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Meta/Facebook Data Deletion</h2>
            <p className="text-gray-600 leading-relaxed">
              If you signed up or logged in using Facebook, or if your data was collected through Meta/Facebook integrations, this page serves as the data deletion callback URL as required by the <strong>Meta Platform Terms</strong>. Submitting a deletion request as described above will also remove any data obtained through Facebook APIs.
            </p>

            {/* Contact */}
            <div className="bg-gray-50 rounded-xl p-6 mt-12">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Questions?</h2>
              <p className="text-gray-600">
                For questions about data deletion or your privacy rights, contact us at{' '}
                <a href="mailto:info@kealee.com" className="text-[#57A7DB] hover:underline">info@kealee.com</a>{' '}
                or review our{' '}
                <Link href="/privacy" className="text-[#57A7DB] hover:underline">Privacy Policy</Link>.
              </p>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
