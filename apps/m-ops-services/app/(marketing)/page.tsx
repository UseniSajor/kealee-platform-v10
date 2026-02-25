import Link from "next/link";
/* eslint-disable @next/next/no-img-element */
import { Metadata } from "next";

import { HeroGC } from "@/components/marketing/HeroGC";
import { GCTestimonials } from "@/components/marketing/GCTestimonials";
import { ROICalculator } from "@/components/marketing/ROICalculator";
import { OnDemandOps } from "@/components/marketing/OnDemandOps";

export const metadata: Metadata = {
  title: "Your Operations Department, On Demand | Kealee Ops Services",
  description: "Outsource your PM operations to a dedicated team. Packages starting at $1,750/mo. Get permits, reporting, and vendor coordination handled—so you can focus on building.",
};

const packages = [
  {
    name: "Package A",
    price: "$1,750",
    popular: false,
    benefits: [
      "Permits and inspections tracking",
      "Client-ready weekly updates",
      "Vendor follow-ups and doc organization",
    ],
  },
  {
    name: "Package B",
    price: "$3,750",
    popular: true,
    benefits: [
      "Full admin and coordination support",
      "Permit and delivery follow-ups",
      "Weekly reporting with action items",
    ],
  },
  {
    name: "Package C",
    price: "$9,500",
    popular: false,
    benefits: [
      "Multi-project ops coverage",
      "Centralized vendor and sub comms",
      "Proactive risk tracking for all projects",
    ],
  },
  {
    name: "Package D",
    price: "$16,500",
    popular: false,
    benefits: [
      "Enterprise ops team coverage",
      "Standardized workflows across regions",
      "SLA-style response and executive reporting",
    ],
  },
];

export default function OpsServicesHomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative">
        <img
          src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1920&q=80&auto=format&fit=crop"
          alt="Project site aerial view"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-black tracking-tight text-white md:text-6xl">
            Your Operations Department, On Demand
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-xl text-white/80">
            Outsource your PM operations to a dedicated team that handles permits, reporting, vendor coordination, and admin work—so you can focus on building and growing your business.
          </p>

          {/* Stats */}
          <div className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-8 text-center">
            <div>
              <div className="text-3xl font-black text-sky-400">150+</div>
              <div className="mt-1 text-sm text-white/70">Contractors served</div>
            </div>
            <div>
              <div className="text-3xl font-black text-sky-400">22 hrs/week</div>
              <div className="mt-1 text-sm text-white/70">saved</div>
            </div>
            <div>
              <div className="text-3xl font-black text-sky-400">$3.2M</div>
              <div className="mt-1 text-sm text-white/70">avg project value</div>
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/packages"
              className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-8 py-4 text-base font-black text-white shadow-sm transition hover:bg-sky-600"
            >
              See Packages
            </Link>
            <Link
              href="/schedule"
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-8 py-4 text-base font-black text-zinc-900 shadow-sm transition hover:bg-zinc-50"
            >
              Schedule Consultation
            </Link>
          </div>
        </div>
        </div>
      </section>

      {/* Five Core Services */}
      <section className="bg-zinc-50 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-black tracking-tight text-zinc-900">
              Our Core Services
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-zinc-600">
              Everything GCs, builders, and contractors need to run projects professionally
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* PM Managed Services - Highlighted */}
            <Link
              href="/packages"
              className="group rounded-2xl border-2 border-sky-500 bg-white p-6 shadow-lg transition hover:shadow-xl"
            >
              <div className="mb-3 inline-block rounded-lg bg-sky-100 px-3 py-1 text-xs font-black text-sky-700">
                MOST POPULAR
              </div>
              <h3 className="text-xl font-black text-zinc-900">
                PM Managed Services
              </h3>
              <p className="mt-2 text-sm text-zinc-600">
                Full operations support with dedicated team handling permits, reporting, and vendor coordination.
              </p>
              <div className="mt-4 text-sm font-black text-sky-500 group-hover:underline">
                View packages →
              </div>
            </Link>

            {/* PM Software */}
            <Link
              href="/pm-software"
              className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-sky-500 hover:shadow-md"
            >
              <div className="mb-2 inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                Available Standalone
              </div>
              <h3 className="text-xl font-black text-zinc-900">
                PM Software Platform
              </h3>
              <p className="mt-2 text-sm text-zinc-600">
                Cloud-based project management tools for contractors. Use it independently or
                pair with our managed services for full-coverage support.
              </p>
              <div className="mt-4 text-sm font-black text-sky-500 group-hover:underline">
                Learn more →
              </div>
            </Link>

            {/* Individual Services */}
            <Link
              href="/individual-services"
              className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-sky-500 hover:shadow-md"
            >
              <h3 className="text-xl font-black text-zinc-900">
                Individual Services
              </h3>
              <p className="mt-2 text-sm text-zinc-600">
                Pay-per-service options for permit filing, inspections, estimates, and more.
              </p>
              <div className="mt-4 text-sm font-black text-sky-500 group-hover:underline">
                Browse services →
              </div>
            </Link>

            {/* Escrow & Finance */}
            <Link
              href="/escrow"
              className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-sky-500 hover:shadow-md"
            >
              <h3 className="text-xl font-black text-zinc-900">
                Escrow &amp; Finance
              </h3>
              <p className="mt-2 text-sm text-zinc-600">
                Secure escrow accounts with milestone-based payment releases and financial tracking.
              </p>
              <div className="mt-4 text-sm font-black text-sky-500 group-hover:underline">
                Explore escrow →
              </div>
            </Link>

            {/* Developer Services */}
            <Link
              href="/developer"
              className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-sky-500 hover:shadow-md"
            >
              <h3 className="text-xl font-black text-zinc-900">
                Developer Services
              </h3>
              <p className="mt-2 text-sm text-zinc-600">
                Feasibility studies, pro forma analysis, entitlement support, and full development management.
              </p>
              <div className="mt-4 text-sm font-black text-sky-500 group-hover:underline">
                View developer services →
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* PM Managed Services Feature */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-black tracking-tight text-zinc-900">
              PM Managed Services Packages
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-zinc-600">
              Choose the level of operations support that matches your workload
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-4">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className={
                  pkg.popular
                    ? "rounded-2xl border-2 border-sky-500 bg-white p-6 shadow-lg"
                    : "rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
                }
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-black text-zinc-900">
                      {pkg.name}
                    </h3>
                    <div className="mt-2 text-2xl font-black text-sky-500">
                      {pkg.price}
                      <span className="text-sm font-normal text-zinc-500">/mo</span>
                    </div>
                  </div>
                  {pkg.popular && (
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-700">
                      MOST POPULAR
                    </span>
                  )}
                </div>

                <ul className="mt-6 space-y-3 text-sm text-zinc-700">
                  {pkg.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2">
                      <span className="mt-0.5 text-sky-500">✓</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/packages"
                  className="mt-6 block w-full rounded-xl bg-zinc-900 py-3 text-center text-sm font-black text-white transition hover:bg-zinc-800"
                >
                  Learn More
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/packages"
              className="text-base font-black text-sky-500 hover:underline"
            >
              Compare all packages in detail →
            </Link>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="bg-zinc-50 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-3xl font-black tracking-tight text-zinc-900">
            Common Contractor Challenges We Solve
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-black text-zinc-900">
                Drowning in admin?
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                We handle permits, vendor follow-ups, and weekly reports so you can stay on the jobsite and focus on the work that actually makes money.
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-black text-zinc-900">
                Can't scale without hiring?
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                Get a full ops team without W-2 overhead, benefits, or training costs. Scale your support up or down as projects change.
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-black text-zinc-900">
                Projects running over budget?
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                Professional oversight catches issues early—before they turn into expensive delays or change orders that eat your margin.
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-black text-zinc-900">
                No time for estimating?
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                Our team handles takeoffs and bid support, giving you accurate numbers fast so you can respond to opportunities quickly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <ROICalculator />
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-zinc-50 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <GCTestimonials />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-sky-500 to-sky-600 py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-4xl font-black tracking-tight text-white">
            Start Your 14-Day Free Trial
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-sky-50">
            No credit card required. Full access to Package B features. Cancel anytime.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-8 py-4 text-base font-black text-zinc-900 shadow-lg transition hover:bg-zinc-50"
            >
              Start Free Trial
            </Link>
            <Link
              href="/packages"
              className="inline-flex items-center justify-center rounded-2xl border-2 border-white px-8 py-4 text-base font-black text-white transition hover:bg-white/10"
            >
              View All Packages
            </Link>
          </div>

          <p className="mt-6 text-sm text-sky-100">
            Join 150+ GCs, builders, and contractors using Kealee Ops Services
          </p>
        </div>
      </section>
    </main>
  );
}
