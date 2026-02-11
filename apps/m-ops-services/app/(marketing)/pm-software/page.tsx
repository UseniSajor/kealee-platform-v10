import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Construction PM Software | Kealee Operations Services",
  description: "Cloud-based project management software built specifically for construction contractors.",
};

export default function PMSoftwarePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-sky-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block bg-sky-100 text-sky-700 px-4 py-2 rounded-full text-sm font-bold mb-6">
              FOR CONTRACTORS
            </div>
            <h1 className="text-5xl font-bold text-zinc-900 mb-6">
              Construction Project Management Software
            </h1>
            <p className="text-xl text-zinc-600 mb-8">
              Cloud-based PM platform built specifically for construction contractors.
              Manage schedules, budgets, subs, and documentation in one place.
            </p>
            <Link
              href="#pricing"
              className="inline-block bg-sky-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-sky-700 transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-zinc-900 text-center mb-12">
              Everything You Need to Manage Construction Projects
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="border border-zinc-200 rounded-2xl p-8">
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl text-sky-600">📊</span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">Milestone Tracking</h3>
                <p className="text-zinc-600">
                  Track project milestones, dependencies, and critical path. Visual timeline views
                  keep everyone aligned on project progress.
                </p>
              </div>
              <div className="border border-zinc-200 rounded-2xl p-8">
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl text-sky-600">📸</span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">Progress Photos</h3>
                <p className="text-zinc-600">
                  Document job site progress with timestamped photos. Organize by location,
                  trade, or milestone for easy reference.
                </p>
              </div>
              <div className="border border-zinc-200 rounded-2xl p-8">
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl text-sky-600">💰</span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">Payment Management</h3>
                <p className="text-zinc-600">
                  Track draws, change orders, and payment applications. Generate AIA-compliant
                  billing documents automatically.
                </p>
              </div>
              <div className="border border-zinc-200 rounded-2xl p-8">
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl text-sky-600">👷</span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">Sub Coordination</h3>
                <p className="text-zinc-600">
                  Manage subcontractor schedules, RFIs, and submittals. Keep all trade
                  communication organized in one place.
                </p>
              </div>
              <div className="border border-zinc-200 rounded-2xl p-8">
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl text-sky-600">📅</span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">Schedule Management</h3>
                <p className="text-zinc-600">
                  Create and maintain project schedules with Gantt charts. Track delays,
                  reschedule activities, and analyze schedule impact.
                </p>
              </div>
              <div className="border border-zinc-200 rounded-2xl p-8">
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl text-sky-600">📁</span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">Document Control</h3>
                <p className="text-zinc-600">
                  Centralized document storage with version control. Share plans, specs, and
                  contracts securely with project stakeholders.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Tiers */}
      <section className="py-20 bg-zinc-50" id="pricing">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-zinc-900 text-center mb-12">
              Choose Your Platform Tier
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Essentials */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                <h3 className="text-2xl font-bold text-zinc-900 mb-2">Essentials</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-sky-600">$99</span>
                  <span className="text-zinc-600">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <span className="text-sky-600 mr-2">✓</span>
                    <span className="text-zinc-600">5 users</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-sky-600 mr-2">✓</span>
                    <span className="text-zinc-600">3 active projects</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-sky-600 mr-2">✓</span>
                    <span className="text-zinc-600">Basic reporting</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-sky-600 mr-2">✓</span>
                    <span className="text-zinc-600">Email support</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-sky-600 mr-2">✓</span>
                    <span className="text-zinc-600">Mobile app</span>
                  </li>
                </ul>
                <Link
                  href="#contact"
                  className="block w-full bg-sky-600 text-white text-center py-3 rounded-lg font-bold hover:bg-sky-700 transition-colors"
                >
                  Start Free Trial
                </Link>
              </div>

              {/* Performance - Most Popular */}
              <div className="bg-white border-2 border-sky-600 rounded-2xl p-8 hover:shadow-lg transition-shadow relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-sky-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                  MOST POPULAR
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 mb-2">Performance</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-sky-600">$199</span>
                  <span className="text-zinc-600">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <span className="text-sky-600 mr-2">✓</span>
                    <span className="text-zinc-600">20 users</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-sky-600 mr-2">✓</span>
                    <span className="text-zinc-600">10 active projects</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-sky-600 mr-2">✓</span>
                    <span className="text-zinc-600">Advanced analytics</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-sky-600 mr-2">✓</span>
                    <span className="text-zinc-600">Integrations</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-sky-600 mr-2">✓</span>
                    <span className="text-zinc-600">Priority support</span>
                  </li>
                </ul>
                <Link
                  href="#contact"
                  className="block w-full bg-sky-600 text-white text-center py-3 rounded-lg font-bold hover:bg-sky-700 transition-colors"
                >
                  Start Free Trial
                </Link>
              </div>

              {/* Scale */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                <h3 className="text-2xl font-bold text-zinc-900 mb-2">Scale</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-sky-600">$349</span>
                  <span className="text-zinc-600">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <span className="text-sky-600 mr-2">✓</span>
                    <span className="text-zinc-600">50 users</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-sky-600 mr-2">✓</span>
                    <span className="text-zinc-600">Up to 20 active projects</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-sky-600 mr-2">✓</span>
                    <span className="text-zinc-600">Custom workflows</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-sky-600 mr-2">✓</span>
                    <span className="text-zinc-600">API access</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-sky-600 mr-2">✓</span>
                    <span className="text-zinc-600">Dedicated support</span>
                  </li>
                </ul>
                <Link
                  href="#contact"
                  className="block w-full bg-sky-600 text-white text-center py-3 rounded-lg font-bold hover:bg-sky-700 transition-colors"
                >
                  Start Free Trial
                </Link>
              </div>

              {/* Enterprise */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                <h3 className="text-2xl font-bold text-zinc-900 mb-2">Enterprise</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-sky-600">Custom</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <span className="text-sky-600 mr-2">✓</span>
                    <span className="text-zinc-600">Unlimited users</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-sky-600 mr-2">✓</span>
                    <span className="text-zinc-600">Unlimited projects</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-sky-600 mr-2">✓</span>
                    <span className="text-zinc-600">SSO/SAML</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-sky-600 mr-2">✓</span>
                    <span className="text-zinc-600">Custom integrations</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-sky-600 mr-2">✓</span>
                    <span className="text-zinc-600">SLA & account manager</span>
                  </li>
                </ul>
                <Link
                  href="#contact"
                  className="block w-full bg-sky-600 text-white text-center py-3 rounded-lg font-bold hover:bg-sky-700 transition-colors"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-zinc-900 text-center mb-6">
              Integrates With Your Favorite Tools
            </h2>
            <p className="text-xl text-zinc-600 text-center mb-12">
              Connect with the software you already use to streamline your workflow
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="border border-zinc-200 rounded-2xl p-6 flex items-center justify-center hover:shadow-md transition-shadow">
                <span className="font-bold text-zinc-700">QuickBooks</span>
              </div>
              <div className="border border-zinc-200 rounded-2xl p-6 flex items-center justify-center hover:shadow-md transition-shadow">
                <span className="font-bold text-zinc-700">Procore</span>
              </div>
              <div className="border border-zinc-200 rounded-2xl p-6 flex items-center justify-center hover:shadow-md transition-shadow">
                <span className="font-bold text-zinc-700">Google Drive</span>
              </div>
              <div className="border border-zinc-200 rounded-2xl p-6 flex items-center justify-center hover:shadow-md transition-shadow">
                <span className="font-bold text-zinc-700">Dropbox</span>
              </div>
              <div className="border border-zinc-200 rounded-2xl p-6 flex items-center justify-center hover:shadow-md transition-shadow">
                <span className="font-bold text-zinc-700">DocuSign</span>
              </div>
              <div className="border border-zinc-200 rounded-2xl p-6 flex items-center justify-center hover:shadow-md transition-shadow">
                <span className="font-bold text-zinc-700">Slack</span>
              </div>
              <div className="border border-zinc-200 rounded-2xl p-6 flex items-center justify-center hover:shadow-md transition-shadow">
                <span className="font-bold text-zinc-700">Microsoft Teams</span>
              </div>
              <div className="border border-zinc-200 rounded-2xl p-6 flex items-center justify-center hover:shadow-md transition-shadow">
                <span className="font-bold text-zinc-700">Zapier</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-sky-600">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Start Your Free Trial Today
            </h2>
            <p className="text-xl text-sky-100 mb-8">
              No credit card required. Full access to all features for 14 days.
            </p>
            <Link
              href="#contact"
              className="inline-block bg-white text-sky-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-zinc-50 transition-colors"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
