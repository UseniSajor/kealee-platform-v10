"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { HeroGC } from "@/components/marketing/HeroGC";
import { GCTestimonials } from "@/components/marketing/GCTestimonials";
import { ROICalculator } from "@/components/marketing/ROICalculator";

// JSON-LD Structured Data for SEO
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://ops.kealee.com/#organization",
      name: "Kealee Ops Services",
      url: "https://ops.kealee.com",
      logo: {
        "@type": "ImageObject",
        url: "https://ops.kealee.com/logo.png",
      },
      description:
        "Professional construction operations management for general contractors. Permits, inspections, vendor coordination, and weekly reporting.",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "sales",
        availableLanguage: "English",
      },
      sameAs: [
        "https://www.linkedin.com/company/kealee",
        "https://twitter.com/kealee",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://ops.kealee.com/#website",
      url: "https://ops.kealee.com",
      name: "Kealee Ops Services",
      publisher: { "@id": "https://ops.kealee.com/#organization" },
    },
    {
      "@type": "Service",
      "@id": "https://ops.kealee.com/#service",
      name: "GC Operations Management",
      provider: { "@id": "https://ops.kealee.com/#organization" },
      serviceType: "Construction Operations Outsourcing",
      areaServed: { "@type": "Country", name: "United States" },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "GC Operations Packages",
        itemListElement: [
          {
            "@type": "Offer",
            name: "Package A - Solo GC",
            price: "1750",
            priceCurrency: "USD",
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: "1750",
              priceCurrency: "USD",
              unitText: "month",
            },
          },
          {
            "@type": "Offer",
            name: "Package B - Growing Team",
            price: "3750",
            priceCurrency: "USD",
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: "3750",
              priceCurrency: "USD",
              unitText: "month",
            },
          },
          {
            "@type": "Offer",
            name: "Package C - Multiple Projects",
            price: "9500",
            priceCurrency: "USD",
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: "9500",
              priceCurrency: "USD",
              unitText: "month",
            },
          },
          {
            "@type": "Offer",
            name: "Package D - Enterprise GC",
            price: "16500",
            priceCurrency: "USD",
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: "16500",
              priceCurrency: "USD",
              unitText: "month",
            },
          },
        ],
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How much time can GCs save with Kealee Ops Services?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "On average, general contractors save 22+ hours per week by offloading permits, inspections, vendor communications, and weekly reporting to our team.",
          },
        },
        {
          "@type": "Question",
          name: "What is included in the free trial?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The 14-day free trial includes full access to Package B features: operations department handoff, permit/delivery follow-ups, and weekly reporting with action items.",
          },
        },
      ],
    },
  ],
};

const packages = [
  {
    name: "Package A",
    label: "Solo GC",
    price: "$1,750",
    period: "/mo",
    highlight: false,
    icon: "user",
    benefits: [
      "Permits + inspections tracking (so you stop chasing statuses)",
      "Client-ready weekly updates (without losing your Saturday)",
      "Vendor follow-ups + doc organization (POs, COs, receipts)",
    ],
  },
  {
    name: "Package B",
    label: "Growing Team",
    price: "$3,750",
    period: "/mo",
    highlight: true,
    badge: "MOST POPULAR",
    icon: "users",
    benefits: [
      "We become your operations department (handoff admin + coordination)",
      "Permit/delivery follow-ups to protect schedule and margin",
      "Weekly reporting + action items so subs stay accountable",
    ],
  },
  {
    name: "Package C",
    label: "Multiple Projects",
    price: "$9,500",
    period: "/mo",
    highlight: false,
    icon: "building",
    benefits: [
      "Multi-project ops coverage for active pipelines",
      "Centralized vendor/sub comms with consistent status cadence",
      "Proactive risk tracking: permits, inspections, delays, COs",
    ],
  },
  {
    name: "Package D",
    label: "Enterprise GC",
    price: "$16,500",
    period: "/mo",
    highlight: false,
    icon: "enterprise",
    benefits: [
      "Enterprise ops team coverage + escalations",
      "Standardized workflows + reporting across regions/crews",
      "SLA-style response + structured weekly executive reporting",
    ],
  },
];

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 2000, suffix: string = "") {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(target * easeOut));
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration, hasAnimated]);

  return { count, ref, suffix };
}

// Stats component with animation
function AnimatedStat({ value, label, suffix = "", prefix = "" }: { value: number; label: string; suffix?: string; prefix?: string }) {
  const { count, ref } = useAnimatedCounter(value);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl font-black tracking-tight text-white md:text-5xl">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className="mt-2 text-sm font-medium text-white/80">{label}</div>
    </div>
  );
}

// Icon components
function CheckIcon() {
  return (
    <svg className="h-5 w-5 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export default function MarketingHomePage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Gradient background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-sky-400/20 to-cyan-300/20 blur-3xl" />
        <div className="absolute top-1/2 -left-40 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-blue-400/15 to-indigo-300/15 blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 h-[450px] w-[450px] rounded-full bg-gradient-to-tl from-cyan-400/10 to-sky-300/10 blur-3xl" />
      </div>

      <main className="relative min-h-screen">
        {/* Glassmorphism Header */}
        <header
          className={`sticky top-0 z-50 transition-all duration-300 ${
            isScrolled
              ? "bg-white/70 shadow-lg shadow-black/5 backdrop-blur-xl"
              : "bg-transparent"
          }`}
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 shadow-lg shadow-sky-500/25">
                <span className="text-sm font-black text-white">K</span>
              </div>
              <span className="text-lg font-black tracking-tight text-zinc-900">
                Kealee Ops
              </span>
            </Link>
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-zinc-600">
              <Link className="transition hover:text-zinc-900" href="/pricing">
                Pricing
              </Link>
              <Link className="transition hover:text-zinc-900" href="/how-it-works">
                How it works
              </Link>
              <Link className="transition hover:text-zinc-900" href="/case-studies">
                Case studies
              </Link>
              <Link className="transition hover:text-zinc-900" href="/contractors">
                Contractors
              </Link>
              <Link
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
                href="/login"
              >
                Sign in
              </Link>
            </nav>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-6 py-12">
          {/* Hero Section with Glassmorphism */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 shadow-2xl md:p-12">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-sky-500/30 to-cyan-500/30 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 blur-3xl" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-sky-300 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
                </span>
                Built for General Contractors
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight text-white md:text-5xl lg:text-6xl">
                Get Back to Building.{" "}
                <span className="bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
                  We Handle the Operations.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-300">
                <span className="font-semibold text-white">
                  Professional construction operations for GCs who want to scale.
                </span>{" "}
                We become your operations department - permits, inspections, vendor
                coordination, documentation, and weekly reporting.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:shadow-xl hover:shadow-sky-500/30"
                >
                  Start Free 14-Day Trial
                  <ArrowRightIcon />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 text-base font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  View All Packages
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-white/10 pt-8">
                <div className="flex -space-x-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-800 bg-gradient-to-br from-zinc-200 to-zinc-300 text-xs font-bold text-zinc-600"
                    >
                      GC
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} />
                    ))}
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">
                    Trusted by <span className="font-semibold text-white">150+</span> general contractors nationwide
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Animated Stats Section */}
          <section className="relative mt-16 overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 p-8 shadow-xl md:p-12">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.05)_75%)] bg-[length:20px_20px] opacity-50" />
            <div className="relative z-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <AnimatedStat value={22} suffix="+" label="Hours saved per week" />
              <AnimatedStat value={150} suffix="+" label="GCs trust us" />
              <AnimatedStat value={98} suffix="%" label="Client satisfaction" />
              <AnimatedStat value={500} prefix="$" suffix="K+" label="Saved in delays annually" />
            </div>
          </section>

          {/* Enhanced Hero Component */}
          <section className="mt-16">
            <HeroGC />
          </section>

          {/* Pain Points Section with Glassmorphism */}
          <section className="mt-16">
            <div className="text-center">
              <h2 className="text-3xl font-black tracking-tight text-zinc-900 md:text-4xl">
                General Contractor Pain Points{" "}
                <span className="bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">
                  Solved
                </span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600">
                Stop drowning in admin work. Focus on what you do best - building.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {[
                {
                  q: "Losing 20+ hours/week on admin?",
                  a: "We take permits, inspections, vendor comms, and reporting off your plate so you can stay on site and sell the next job.",
                  icon: "clock",
                  gradient: "from-rose-500 to-orange-500",
                },
                {
                  q: "Permit delays killing margins?",
                  a: "Proactive tracking + follow-ups reduce schedule slip and the expensive domino effect it creates across trades.",
                  icon: "alert",
                  gradient: "from-amber-500 to-yellow-500",
                },
                {
                  q: "Sub/vendor coordination eating your evenings?",
                  a: "Centralized comms and consistent updates keep everyone aligned - without you playing phone tag all day.",
                  icon: "phone",
                  gradient: "from-sky-500 to-blue-500",
                },
                {
                  q: "Weekly reporting always behind?",
                  a: "We produce consistent, client-ready weekly updates with action items - so you look sharp and stay ahead of surprises.",
                  icon: "report",
                  gradient: "from-emerald-500 to-teal-500",
                },
              ].map((item, index) => (
                <div
                  key={item.q}
                  className="group relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/70 p-6 shadow-lg shadow-zinc-200/50 backdrop-blur-sm transition-all hover:shadow-xl hover:shadow-zinc-200/50"
                >
                  <div className={`absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br ${item.gradient} opacity-10 blur-2xl transition-all group-hover:opacity-20`} />
                  <div className="relative z-10">
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} text-white shadow-lg`}>
                      <span className="text-lg font-bold">{index + 1}</span>
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-zinc-900">{item.q}</h3>
                    <p className="mt-2 text-base leading-relaxed text-zinc-600">
                      {item.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Packages Section with Modern Cards */}
          <section className="mt-20">
            <div className="text-center">
              <h2 className="text-3xl font-black tracking-tight text-zinc-900 md:text-4xl">
                Packages for{" "}
                <span className="bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">
                  Every GC
                </span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600">
                Pick the level of ops coverage you need today - upgrade as you take on more work.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-4">
              {packages.map((p) => (
                <div
                  key={p.name}
                  className={`group relative overflow-hidden rounded-2xl transition-all ${
                    p.highlight
                      ? "scale-[1.02] bg-gradient-to-br from-sky-600 to-cyan-600 p-[2px] shadow-2xl shadow-sky-500/25 lg:scale-105"
                      : "border border-zinc-200/50 bg-white/70 shadow-lg shadow-zinc-200/50 backdrop-blur-sm hover:shadow-xl"
                  }`}
                >
                  <div
                    className={`relative h-full rounded-[14px] p-6 ${
                      p.highlight ? "bg-white" : ""
                    }`}
                  >
                    {p.badge && (
                      <div className="absolute -top-0 right-4 rounded-b-lg bg-gradient-to-r from-sky-500 to-cyan-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                        {p.badge}
                      </div>
                    )}

                    <div className="mb-4">
                      <span className="text-sm font-bold text-zinc-500">{p.name}</span>
                      <h3 className="mt-1 text-xl font-black text-zinc-900">{p.label}</h3>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-zinc-900">{p.price}</span>
                      <span className="text-base font-medium text-zinc-500">{p.period}</span>
                    </div>

                    <ul className="mt-6 space-y-3">
                      {p.benefits.map((b) => (
                        <li key={b} className="flex items-start gap-3 text-sm text-zinc-600">
                          <CheckIcon />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6">
                      <Link
                        href="/signup"
                        className={`group/btn flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
                          p.highlight
                            ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/25 hover:shadow-xl"
                            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                        }`}
                      >
                        {p.highlight ? "Start Free Trial" : "Get Started"}
                        <ArrowRightIcon />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ROI Calculator */}
          <section className="mt-20">
            <ROICalculator />
          </section>

          {/* Testimonials */}
          <section className="mt-20">
            <GCTestimonials />
          </section>

          {/* Final CTA Section with Glassmorphism */}
          <section className="relative mt-20 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 shadow-2xl md:p-12">
            <div className="absolute inset-0">
              <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
              <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
            </div>

            <div className="relative z-10 mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-sky-300 backdrop-blur-sm">
                Limited Time Offer
              </div>

              <h2 className="mt-6 text-3xl font-black tracking-tight text-white md:text-4xl">
                Start Your Free 14-Day Trial Today
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-300">
                Get your first project set up and see how fast ops tasks disappear.
                No credit card required. Cancel anytime.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:shadow-xl hover:shadow-sky-500/30"
                >
                  Start Free Trial - Package B
                  <ArrowRightIcon />
                </Link>
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-4 text-lg font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  See How It Works
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-400">
                <span className="flex items-center gap-2">
                  <CheckIcon />
                  No credit card required
                </span>
                <span className="flex items-center gap-2">
                  <CheckIcon />
                  Full Package B access
                </span>
                <span className="flex items-center gap-2">
                  <CheckIcon />
                  Cancel anytime
                </span>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-20 border-t border-zinc-200 pt-12">
            <div className="grid gap-8 md:grid-cols-4">
              <div className="md:col-span-2">
                <Link href="/" className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 shadow-lg shadow-sky-500/25">
                    <span className="text-sm font-black text-white">K</span>
                  </div>
                  <span className="text-lg font-black tracking-tight text-zinc-900">
                    Kealee Ops
                  </span>
                </Link>
                <p className="mt-4 max-w-sm text-sm text-zinc-600">
                  Professional construction operations management for general contractors.
                  Let us become your operations department.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-zinc-900">Product</h4>
                <ul className="mt-4 space-y-3 text-sm text-zinc-600">
                  <li>
                    <Link href="/pricing" className="hover:text-zinc-900">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="/how-it-works" className="hover:text-zinc-900">
                      How it works
                    </Link>
                  </li>
                  <li>
                    <Link href="/case-studies" className="hover:text-zinc-900">
                      Case studies
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-bold text-zinc-900">Company</h4>
                <ul className="mt-4 space-y-3 text-sm text-zinc-600">
                  <li>
                    <Link href="/contractors" className="hover:text-zinc-900">
                      For Contractors
                    </Link>
                  </li>
                  <li>
                    <Link href="/login" className="hover:text-zinc-900">
                      Sign in
                    </Link>
                  </li>
                  <li>
                    <Link href="/signup" className="hover:text-zinc-900">
                      Start trial
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-200 pt-8 text-sm text-zinc-500">
              <p>&copy; {new Date().getFullYear()} Kealee Ops Services. All rights reserved.</p>
              <div className="flex gap-6">
                <Link href="#" className="hover:text-zinc-900">
                  Privacy
                </Link>
                <Link href="#" className="hover:text-zinc-900">
                  Terms
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </>
  );
}
