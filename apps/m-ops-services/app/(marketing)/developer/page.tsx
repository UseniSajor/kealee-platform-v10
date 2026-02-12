import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer Services | Kealee Operations Services",
  description: "End-to-end real estate development services from feasibility to construction closeout.",
};

export default function DeveloperPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20">
        <Image src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80&auto=format&fit=crop" alt="City skyline" fill className="object-cover" sizes="100vw" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block bg-violet-100 text-violet-700 px-4 py-2 rounded-full text-sm font-bold mb-6">
              DEVELOPMENT
            </div>
            <h1 className="text-5xl font-bold text-white mb-6">
              Developer Services
            </h1>
            <p className="text-xl text-white/80 mb-8">
              End-to-end real estate development services from feasibility through construction
              closeout. We guide your project from concept to completion.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-violet-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-violet-700 transition-colors"
            >
              Start Your Project
            </Link>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-zinc-900 text-center mb-12">
              Comprehensive Development Services
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="border border-zinc-200 rounded-2xl p-8">
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl text-violet-600">📊</span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">Feasibility Studies</h3>
                <p className="text-zinc-600">
                  Market analysis, site evaluation, zoning review, and preliminary financial
                  modeling to assess project viability.
                </p>
              </div>
              <div className="border border-zinc-200 rounded-2xl p-8">
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl text-violet-600">💰</span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">Pro Forma Modeling</h3>
                <p className="text-zinc-600">
                  Detailed financial projections including development costs, financing scenarios,
                  and ROI analysis for investor presentations.
                </p>
              </div>
              <div className="border border-zinc-200 rounded-2xl p-8">
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl text-violet-600">📋</span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">Entitlement Support</h3>
                <p className="text-zinc-600">
                  Navigate zoning, permitting, and approval processes. Coordinate with
                  municipalities and manage public hearing presentations.
                </p>
              </div>
              <div className="border border-zinc-200 rounded-2xl p-8">
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl text-violet-600">✏️</span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">Design Management</h3>
                <p className="text-zinc-600">
                  Coordinate architects, engineers, and consultants. Review plans for
                  constructability and budget alignment.
                </p>
              </div>
              <div className="border border-zinc-200 rounded-2xl p-8">
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl text-violet-600">🏗️</span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">Construction Oversight</h3>
                <p className="text-zinc-600">
                  Owner's representative services during construction. Quality control,
                  contractor management, and issue resolution.
                </p>
              </div>
              <div className="border border-zinc-200 rounded-2xl p-8">
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl text-violet-600">📈</span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">Budget & Schedule Control</h3>
                <p className="text-zinc-600">
                  Track development costs, manage change orders, and monitor schedule
                  adherence to protect your investment returns.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Types */}
      <section className="py-20 bg-zinc-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-zinc-900 text-center mb-6">
              Project Types We Support
            </h2>
            <p className="text-xl text-zinc-600 text-center mb-12">
              Experienced across all major commercial and residential development categories
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                <div className="font-bold text-zinc-900">Multi-Family</div>
              </div>
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                <div className="font-bold text-zinc-900">Mixed-Use</div>
              </div>
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                <div className="font-bold text-zinc-900">Commercial</div>
              </div>
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                <div className="font-bold text-zinc-900">Retail</div>
              </div>
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                <div className="font-bold text-zinc-900">Industrial</div>
              </div>
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                <div className="font-bold text-zinc-900">Townhome</div>
              </div>
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                <div className="font-bold text-zinc-900">Senior Living</div>
              </div>
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                <div className="font-bold text-zinc-900">Hospitality</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Development Phases */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-zinc-900 text-center mb-12">
              Development Phases We Support
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-violet-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">
                  Concept & Feasibility
                </h3>
                <p className="text-zinc-600">
                  Site selection, market research, preliminary budgets, and go/no-go analysis.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-violet-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">
                  Pre-Development
                </h3>
                <p className="text-zinc-600">
                  Entitlements, design development, contractor selection, and financing
                  coordination.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-violet-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">
                  Construction
                </h3>
                <p className="text-zinc-600">
                  Owner's rep services, quality oversight, schedule management, and budget
                  control.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-violet-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  4
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">
                  Closeout & Delivery
                </h3>
                <p className="text-zinc-600">
                  Punch list management, warranty coordination, occupancy preparation, and
                  final documentation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Development Packages */}
      <section className="py-20 bg-zinc-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-zinc-900 text-center mb-12">
              Development Service Packages
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Feasibility Only */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                <h3 className="text-2xl font-bold text-zinc-900 mb-2">Feasibility Only</h3>
                <div className="mb-6">
                  <span className="text-zinc-600">From </span>
                  <span className="text-4xl font-bold text-violet-600">$2,500</span>
                </div>
                <p className="text-zinc-600 mb-6">
                  Perfect for evaluating potential deals before committing significant resources.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <span className="text-violet-600 mr-2">✓</span>
                    <span className="text-zinc-600">Site analysis</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-violet-600 mr-2">✓</span>
                    <span className="text-zinc-600">Zoning review</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-violet-600 mr-2">✓</span>
                    <span className="text-zinc-600">Market overview</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-violet-600 mr-2">✓</span>
                    <span className="text-zinc-600">Preliminary budget</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-violet-600 mr-2">✓</span>
                    <span className="text-zinc-600">Go/no-go recommendation</span>
                  </li>
                </ul>
                <Link
                  href="/contact"
                  className="block w-full bg-violet-600 text-white text-center py-3 rounded-lg font-bold hover:bg-violet-700 transition-colors"
                >
                  Get Started
                </Link>
              </div>

              {/* Pre-Development - Most Popular */}
              <div className="bg-white border-2 border-violet-600 rounded-2xl p-8 hover:shadow-lg transition-shadow relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-violet-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                  MOST POPULAR
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 mb-2">Pre-Development</h3>
                <div className="mb-6">
                  <span className="text-zinc-600">From </span>
                  <span className="text-4xl font-bold text-violet-600">$7,500</span>
                  <span className="text-zinc-600">/month</span>
                </div>
                <p className="text-zinc-600 mb-6">
                  Complete pre-construction services from entitlements through contractor selection.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <span className="text-violet-600 mr-2">✓</span>
                    <span className="text-zinc-600">Everything in Feasibility</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-violet-600 mr-2">✓</span>
                    <span className="text-zinc-600">Entitlement management</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-violet-600 mr-2">✓</span>
                    <span className="text-zinc-600">Design coordination</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-violet-600 mr-2">✓</span>
                    <span className="text-zinc-600">Detailed pro forma</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-violet-600 mr-2">✓</span>
                    <span className="text-zinc-600">Contractor bidding</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-violet-600 mr-2">✓</span>
                    <span className="text-zinc-600">Financing support</span>
                  </li>
                </ul>
                <Link
                  href="/contact"
                  className="block w-full bg-violet-600 text-white text-center py-3 rounded-lg font-bold hover:bg-violet-700 transition-colors"
                >
                  Get Started
                </Link>
              </div>

              {/* Full Development */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                <h3 className="text-2xl font-bold text-zinc-900 mb-2">Full Development</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-violet-600">Custom</span>
                </div>
                <p className="text-zinc-600 mb-6">
                  End-to-end services from concept through construction closeout and delivery.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <span className="text-violet-600 mr-2">✓</span>
                    <span className="text-zinc-600">Everything in Pre-Development</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-violet-600 mr-2">✓</span>
                    <span className="text-zinc-600">Owner's rep during construction</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-violet-600 mr-2">✓</span>
                    <span className="text-zinc-600">Quality control oversight</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-violet-600 mr-2">✓</span>
                    <span className="text-zinc-600">Budget & schedule management</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-violet-600 mr-2">✓</span>
                    <span className="text-zinc-600">Lender coordination</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-violet-600 mr-2">✓</span>
                    <span className="text-zinc-600">Closeout & warranty management</span>
                  </li>
                </ul>
                <Link
                  href="/contact"
                  className="block w-full bg-violet-600 text-white text-center py-3 rounded-lg font-bold hover:bg-violet-700 transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-violet-600">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Develop Your Next Project?
            </h2>
            <p className="text-xl text-violet-100 mb-8">
              Let's discuss your development goals and how we can help bring your vision to life.
              Schedule a complimentary consultation today.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-white text-violet-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-zinc-50 transition-colors"
            >
              Schedule Consultation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
