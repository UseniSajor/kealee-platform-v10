import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PM Managed Service Packages | Kealee Operations Services",
  description: "Choose the right level of operations support for your projects with our PM managed service packages.",
};

export default function PackagesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20">
        <Image src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1920&q=80&auto=format&fit=crop" alt="Construction workers on site" fill className="object-cover" sizes="100vw" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-white mb-6">
              PM Managed Service Packages
            </h1>
            <p className="text-xl text-white/80">
              Choose the right level of operations support for your projects.
              From basic permit tracking to full portfolio management, we scale with your needs.
            </p>
          </div>
        </div>
      </section>

      {/* Package Cards */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {/* Package A */}
            <div className="border border-zinc-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <h3 className="text-2xl font-bold text-zinc-900 mb-2">Package A Starter</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-sky-600">$1,750</span>
                <span className="text-zinc-600">/month</span>
              </div>
              <div className="mb-6">
                <p className="text-sm font-bold text-zinc-700 mb-1">5-10 hours/week</p>
                <p className="text-sm text-zinc-600">Up to 2 projects</p>
                <p className="text-xs text-zinc-400">Max $500K/project &middot; $1M portfolio</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-sky-600 mr-2">✓</span>
                  <span className="text-zinc-600">Permit tracking</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-600 mr-2">✓</span>
                  <span className="text-zinc-600">Basic vendor follow-up</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-600 mr-2">✓</span>
                  <span className="text-zinc-600">Weekly status email</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-600 mr-2">✓</span>
                  <span className="text-zinc-600">Document management</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-600 mr-2">✓</span>
                  <span className="text-zinc-600">Email 48hr + monthly call</span>
                </li>
              </ul>
              <Link
                href="/contact"
                className="block w-full bg-sky-600 text-white text-center py-3 rounded-lg font-bold hover:bg-sky-700 transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Package B - Most Popular */}
            <div className="border-2 border-sky-600 rounded-2xl p-8 hover:shadow-lg transition-shadow relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-sky-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                MOST POPULAR
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-2">Package B Professional</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-sky-600">$7,850</span>
                <span className="text-zinc-600">/month</span>
              </div>
              <div className="mb-6">
                <p className="text-sm font-bold text-zinc-700 mb-1">15-20 hours/week</p>
                <p className="text-sm text-zinc-600">Up to 7 projects</p>
                <p className="text-xs text-zinc-400">Max $2M/project &middot; $14M portfolio</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-sky-600 mr-2">✓</span>
                  <span className="text-zinc-600">Everything in Package A</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-600 mr-2">✓</span>
                  <span className="text-zinc-600">Sub coordination</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-600 mr-2">✓</span>
                  <span className="text-zinc-600">Client communication</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-600 mr-2">✓</span>
                  <span className="text-zinc-600">Schedule management</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-600 mr-2">✓</span>
                  <span className="text-zinc-600">Change order support</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-600 mr-2">✓</span>
                  <span className="text-zinc-600">Priority email/phone 24hr + weekly calls</span>
                </li>
              </ul>
              <Link
                href="/contact"
                className="block w-full bg-sky-600 text-white text-center py-3 rounded-lg font-bold hover:bg-sky-700 transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Package C */}
            <div className="border border-zinc-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <h3 className="text-2xl font-bold text-zinc-900 mb-2">Package C Premium</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-sky-600">$17,560</span>
                <span className="text-zinc-600">/month</span>
              </div>
              <div className="mb-6">
                <p className="text-sm font-bold text-zinc-700 mb-1">30-40 hours/week</p>
                <p className="text-sm text-zinc-600">Up to 15 projects</p>
                <p className="text-xs text-zinc-400">Max $5M/project &middot; $75M portfolio</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-sky-600 mr-2">✓</span>
                  <span className="text-zinc-600">Everything in Package B</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-600 mr-2">✓</span>
                  <span className="text-zinc-600">Dedicated PM team</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-600 mr-2">✓</span>
                  <span className="text-zinc-600">Permit management</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-600 mr-2">✓</span>
                  <span className="text-zinc-600">QA/QC observation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-600 mr-2">✓</span>
                  <span className="text-zinc-600">CO management</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-600 mr-2">✓</span>
                  <span className="text-zinc-600">OAC meeting support</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-600 mr-2">✓</span>
                  <span className="text-zinc-600">4 site visits/month</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-600 mr-2">✓</span>
                  <span className="text-zinc-600">24/7 priority support</span>
                </li>
              </ul>
              <Link
                href="/contact"
                className="block w-full bg-sky-600 text-white text-center py-3 rounded-lg font-bold hover:bg-sky-700 transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Package D */}
            <div className="border border-zinc-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <h3 className="text-2xl font-bold text-zinc-900 mb-2">Package D Enterprise</h3>
              <div className="mb-6">
                <span className="text-3xl font-bold text-sky-600">From $112,000</span>
                <span className="text-zinc-600">/month</span>
              </div>
              <div className="mb-6">
                <p className="text-sm font-bold text-zinc-700 mb-1">40+ hours/week</p>
                <p className="text-sm text-zinc-600">15-20+ projects (D1-D4 sub-tiers)</p>
                <p className="text-xs text-zinc-400">Max $10M/project &middot; $150M portfolio</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-sky-600 mr-2">✓</span>
                  <span className="text-zinc-600">Everything in Package C</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-600 mr-2">✓</span>
                  <span className="text-zinc-600">Dedicated account manager 24/7</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-600 mr-2">✓</span>
                  <span className="text-zinc-600">8 site visits/month</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-600 mr-2">✓</span>
                  <span className="text-zinc-600">Executive reporting</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-600 mr-2">✓</span>
                  <span className="text-zinc-600">Custom SLAs &amp; integrations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-600 mr-2">✓</span>
                  <span className="text-zinc-600">White-glove service</span>
                </li>
              </ul>
              <Link
                href="/contact"
                className="block w-full bg-sky-600 text-white text-center py-3 rounded-lg font-bold hover:bg-sky-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Comparison Table */}
      <section className="py-20 bg-zinc-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-zinc-900 text-center mb-12">
              Detailed Package Comparison
            </h2>
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="text-left py-4 px-6 font-bold text-zinc-900">Feature</th>
                      <th className="text-center py-4 px-6 font-bold text-zinc-900">Package A</th>
                      <th className="text-center py-4 px-6 font-bold text-zinc-900 bg-sky-50">Package B</th>
                      <th className="text-center py-4 px-6 font-bold text-zinc-900">Package C</th>
                      <th className="text-center py-4 px-6 font-bold text-zinc-900">Package D</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    <tr>
                      <td className="py-4 px-6 text-zinc-700">Weekly hours</td>
                      <td className="text-center py-4 px-6 text-zinc-600">5-10</td>
                      <td className="text-center py-4 px-6 text-zinc-600 bg-sky-50">15-20</td>
                      <td className="text-center py-4 px-6 text-zinc-600">30-40</td>
                      <td className="text-center py-4 px-6 text-zinc-600">40+</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-zinc-700">Projects</td>
                      <td className="text-center py-4 px-6 text-zinc-600">Up to 2</td>
                      <td className="text-center py-4 px-6 text-zinc-600 bg-sky-50">Up to 7</td>
                      <td className="text-center py-4 px-6 text-zinc-600">Up to 15</td>
                      <td className="text-center py-4 px-6 text-zinc-600">15-20+</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-zinc-700">Permit tracking</td>
                      <td className="text-center py-4 px-6 text-sky-600">✓</td>
                      <td className="text-center py-4 px-6 text-sky-600 bg-sky-50">✓</td>
                      <td className="text-center py-4 px-6 text-sky-600">✓</td>
                      <td className="text-center py-4 px-6 text-sky-600">✓</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-zinc-700">Vendor coordination</td>
                      <td className="text-center py-4 px-6 text-zinc-400">Basic</td>
                      <td className="text-center py-4 px-6 text-sky-600 bg-sky-50">✓</td>
                      <td className="text-center py-4 px-6 text-sky-600">✓</td>
                      <td className="text-center py-4 px-6 text-sky-600">✓</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-zinc-700">Weekly reports</td>
                      <td className="text-center py-4 px-6 text-sky-600">✓</td>
                      <td className="text-center py-4 px-6 text-sky-600 bg-sky-50">✓</td>
                      <td className="text-center py-4 px-6 text-sky-600">✓</td>
                      <td className="text-center py-4 px-6 text-sky-600">✓</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-zinc-700">Budget tracking</td>
                      <td className="text-center py-4 px-6 text-zinc-400">—</td>
                      <td className="text-center py-4 px-6 text-zinc-400 bg-sky-50">—</td>
                      <td className="text-center py-4 px-6 text-sky-600">✓</td>
                      <td className="text-center py-4 px-6 text-sky-600">✓</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-zinc-700">Dedicated PM</td>
                      <td className="text-center py-4 px-6 text-zinc-400">—</td>
                      <td className="text-center py-4 px-6 text-zinc-400 bg-sky-50">—</td>
                      <td className="text-center py-4 px-6 text-sky-600">✓</td>
                      <td className="text-center py-4 px-6 text-sky-600">✓</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-zinc-700">Custom SLAs</td>
                      <td className="text-center py-4 px-6 text-zinc-400">—</td>
                      <td className="text-center py-4 px-6 text-zinc-400 bg-sky-50">—</td>
                      <td className="text-center py-4 px-6 text-zinc-400">—</td>
                      <td className="text-center py-4 px-6 text-sky-600">✓</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-zinc-700">Site visits/month</td>
                      <td className="text-center py-4 px-6 text-zinc-400">—</td>
                      <td className="text-center py-4 px-6 text-zinc-400 bg-sky-50">—</td>
                      <td className="text-center py-4 px-6 text-sky-600">4</td>
                      <td className="text-center py-4 px-6 text-sky-600">8</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-zinc-900 text-center mb-12">
              What's Included in Every Package
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-sky-600">🎯</span>
                </div>
                <h3 className="font-bold text-zinc-900 mb-2">Onboarding Call</h3>
                <p className="text-zinc-600 text-sm">
                  Dedicated setup session to understand your project needs
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-sky-600">📋</span>
                </div>
                <h3 className="font-bold text-zinc-900 mb-2">Project Setup</h3>
                <p className="text-zinc-600 text-sm">
                  Complete project configuration and team alignment
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-sky-600">📊</span>
                </div>
                <h3 className="font-bold text-zinc-900 mb-2">Weekly Status Reports</h3>
                <p className="text-zinc-600 text-sm">
                  Detailed updates on project progress and upcoming milestones
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-sky-600">📁</span>
                </div>
                <h3 className="font-bold text-zinc-900 mb-2">Document Management</h3>
                <p className="text-zinc-600 text-sm">
                  Organized storage and tracking of project documents
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-sky-600">💬</span>
                </div>
                <h3 className="font-bold text-zinc-900 mb-2">Email & Phone Support</h3>
                <p className="text-zinc-600 text-sm">
                  Direct access to your PM team during business hours
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-sky-600">🖥️</span>
                </div>
                <h3 className="font-bold text-zinc-900 mb-2">Portal Access</h3>
                <p className="text-zinc-600 text-sm">
                  24/7 access to project dashboards and documentation
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-sky-600">📸</span>
                </div>
                <h3 className="font-bold text-zinc-900 mb-2">Progress Photos</h3>
                <p className="text-zinc-600 text-sm">
                  Regular photo documentation of project milestones
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-sky-600">📅</span>
                </div>
                <h3 className="font-bold text-zinc-900 mb-2">Monthly Review</h3>
                <p className="text-zinc-600 text-sm">
                  Strategic review call to optimize project performance
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-zinc-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-zinc-900 text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-zinc-200 p-8">
                <h3 className="font-bold text-zinc-900 mb-3">
                  Can I switch packages as my needs change?
                </h3>
                <p className="text-zinc-600">
                  Absolutely. You can upgrade or downgrade your package at any time with 30 days notice.
                  We'll work with you to ensure a smooth transition between service levels.
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-zinc-200 p-8">
                <h3 className="font-bold text-zinc-900 mb-3">
                  What's included in the 14-day free trial?
                </h3>
                <p className="text-zinc-600">
                  Your trial includes full access to all features of your selected package. We'll onboard
                  your first project, provide dedicated PM support, and deliver our full service offering
                  so you can experience the value firsthand.
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-zinc-200 p-8">
                <h3 className="font-bold text-zinc-900 mb-3">
                  How quickly can you start managing my projects?
                </h3>
                <p className="text-zinc-600">
                  Most clients are fully onboarded within 5-7 business days. We'll schedule your initial
                  call within 48 hours of signup and begin project setup immediately after.
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-zinc-200 p-8">
                <h3 className="font-bold text-zinc-900 mb-3">
                  What happens during the onboarding process?
                </h3>
                <p className="text-zinc-600">
                  We'll conduct a comprehensive project review, set up your portal, configure workflows,
                  import existing documents, and establish communication protocols with your team and
                  stakeholders. The process is designed to be thorough yet efficient.
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-zinc-200 p-8">
                <h3 className="font-bold text-zinc-900 mb-3">
                  Can I add individual services to my package?
                </h3>
                <p className="text-zinc-600">
                  Yes. Package clients receive preferred pricing on individual services like permit
                  expediting, specialized inspections, or additional on-site visits beyond what's
                  included in your base package.
                </p>
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
              Start Your 14-Day Free Trial
            </h2>
            <p className="text-xl text-sky-100 mb-8">
              Experience the difference professional project management makes.
              No credit card required.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-white text-sky-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-zinc-50 transition-colors"
            >
              Get Started Today
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
