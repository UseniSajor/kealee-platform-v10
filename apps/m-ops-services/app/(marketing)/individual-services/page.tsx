import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { OnDemandOps } from "@/components/marketing/OnDemandOps";

export const metadata: Metadata = {
  title: "Individual Operations Services | Kealee Operations Services",
  description: "Order construction operations services one at a time, no subscription required.",
};

export default function IndividualServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20">
        <Image src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80&auto=format&fit=crop" alt="Construction site" fill className="object-cover" sizes="100vw" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-white mb-6">
              Individual Operations Services
            </h1>
            <p className="text-xl text-white/80">
              Order services one at a time, no subscription required. Perfect for project-specific
              needs or when you want to try our services before committing to a package.
            </p>
          </div>
        </div>
      </section>

      {/* OnDemandOps Component */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <OnDemandOps />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-zinc-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-zinc-900 text-center mb-12">
              How It Works
            </h2>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-sky-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">Request</h3>
                <p className="text-zinc-600">
                  Select the service you need and submit your project details through our
                  online form or by phone.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-sky-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">Quote</h3>
                <p className="text-zinc-600">
                  We'll review your requirements and provide a detailed quote within 24 hours,
                  often sooner.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-sky-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">Execute</h3>
                <p className="text-zinc-600">
                  Once approved, we'll begin work immediately. You'll receive regular updates
                  throughout the process.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-sky-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  4
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">Deliver</h3>
                <p className="text-zinc-600">
                  We'll complete the work on schedule and deliver all documentation through
                  your preferred method.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Individual Services */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-zinc-900 text-center mb-12">
              Why Choose Individual Services?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="border border-zinc-200 rounded-2xl p-8">
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl text-sky-600">🎯</span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">
                  For Occasional Needs
                </h3>
                <p className="text-zinc-600">
                  Perfect for general contractors who need help with specific tasks but don't
                  require ongoing PM support.
                </p>
              </div>
              <div className="border border-zinc-200 rounded-2xl p-8">
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl text-sky-600">📋</span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">
                  Project-Specific Support
                </h3>
                <p className="text-zinc-600">
                  Address unique challenges on particular projects without committing to a
                  monthly package.
                </p>
              </div>
              <div className="border border-zinc-200 rounded-2xl p-8">
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl text-sky-600">✨</span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">
                  Try Before Committing
                </h3>
                <p className="text-zinc-600">
                  Experience our service quality and expertise before deciding on a managed
                  service package.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA to Packages */}
      <section className="py-20 bg-sky-600">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Need Regular Support? Save with a Package
            </h2>
            <p className="text-xl text-sky-100 mb-8">
              If you're ordering services frequently, our PM Managed Service Packages offer
              better value and dedicated support. Save up to 40% compared to individual service pricing.
            </p>
            <Link
              href="/packages"
              className="inline-block bg-white text-sky-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-zinc-50 transition-colors"
            >
              View Package Options
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
