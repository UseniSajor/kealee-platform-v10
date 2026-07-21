'use client'

import Link from 'next/link'

export default function HelpPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-neutral-900">Help & Documentation</h1>
        <p className="mt-2 text-lg text-neutral-600">
          Find answers to common questions and learn how to use Kealee
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/owner/onboarding"
          className="rounded-xl border border-blue-200 bg-blue-50 p-6 hover:bg-blue-100 transition-colors"
        >
          <h2 className="text-xl font-semibold text-blue-900">Getting Started</h2>
          <p className="mt-2 text-blue-800">
            New to Kealee? Take our interactive onboarding tour to learn the basics.
          </p>
        </Link>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-neutral-900">User Guide</h2>
          <p className="mt-2 text-neutral-600">
            Comprehensive guide covering all features and workflows.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-neutral-600">
            <li>• Creating and managing projects</li>
            <li>• Working with contracts</li>
            <li>• Milestone approval process</li>
            <li>• Payment and escrow management</li>
          </ul>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-neutral-900">FAQs</h2>
          <p className="mt-2 text-neutral-600">
            Answers to frequently asked questions.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-neutral-600">
            <li>• How does escrow work?</li>
            <li>• Can I modify a contract?</li>
            <li>• What if I need to dispute work?</li>
            <li>• How do I complete closeout?</li>
          </ul>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-neutral-900">Support</h2>
          <p className="mt-2 text-neutral-600">
            Need help? We're here for you.
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <p className="text-neutral-700">
              <strong>Email:</strong> support@kealee.com
            </p>
            <p className="text-neutral-700">
              <strong>Phone:</strong> 1-800-KEALEE-1
            </p>
            <p className="text-neutral-700">
              <strong>Hours:</strong> Mon-Fri, 9am-5pm EST
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-neutral-900">Quick Links</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Link
            href="/owner/projects/new"
            className="text-blue-600 underline underline-offset-4 hover:text-blue-700"
          >
            Create a New Project →
          </Link>
          <Link
            href="/owner/onboarding"
            className="text-blue-600 underline underline-offset-4 hover:text-blue-700"
          >
            Take Onboarding Tour →
          </Link>
        </div>
      </div>
    </main>
  )
}
