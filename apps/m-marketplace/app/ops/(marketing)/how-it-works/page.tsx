import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Users, Phone, Rocket, FileText, TrendingUp, Shield, Zap, Clock, BarChart3 } from "lucide-react";

export const metadata = {
  title: "How It Works - Operations Services | Kealee",
  description: "Getting started with Kealee Ops is simple. Choose a package, complete onboarding, and start saving 20+ hours per week within 48 hours.",
};

export default function HowItWorksPage() {
  const steps = [
    {
      number: "1",
      icon: Users,
      title: "Choose Your Package",
      description: "Select Package A-D or start with individual services. 14-day free trial on all packages.",
      details: [
        "Package A: Perfect for solo GCs managing 1-2 projects",
        "Package B: Ideal for 3-5 active projects with full coordination",
        "Package C: Comprehensive support for 6-15 projects",
        "Package D: Enterprise-level for 15+ projects with dedicated account manager",
        "Individual Services: Pick only what you need, no commitment",
        "All packages include 14-day free trial — see results before you pay",
      ],
    },
    {
      number: "2",
      icon: Phone,
      title: "Onboarding Call",
      description: "30-minute call with your dedicated PM. We learn your projects, workflows, and preferences.",
      details: [
        "Meet your dedicated project manager who will handle your operations",
        "Walk through your active projects and upcoming deadlines",
        "Share access to systems you use (email, project management, etc.)",
        "Define communication preferences and escalation procedures",
        "Set up weekly reporting format tailored to your clients",
        "Answer any questions about how the service works",
      ],
    },
    {
      number: "3",
      icon: Rocket,
      title: "We Start Working",
      description: "Your ops team begins handling permits, vendor follow-ups, reporting, and coordination within 48 hours.",
      details: [
        "Catalog all active permits and inspections across your projects",
        "Set up vendor and subcontractor communication channels",
        "Begin daily permit tracking and inspection scheduling",
        "Organize project documentation as it comes in",
        "Coordinate between teams, clients, and jurisdictions",
        "Proactively flag issues before they become problems",
      ],
    },
    {
      number: "4",
      icon: FileText,
      title: "Weekly Reports",
      description: "Every Monday, receive a detailed progress report covering all active projects, issues, and next steps.",
      details: [
        "Client-ready reports delivered by 8am Monday morning",
        "Status updates on permits, inspections, and deliveries",
        "Progress photos with annotations and commentary",
        "Action items and upcoming milestones for the week",
        "Risk alerts and proactive recommendations",
        "Budget and schedule variance tracking",
      ],
    },
    {
      number: "5",
      icon: TrendingUp,
      title: "Scale As Needed",
      description: "Upgrade, downgrade, or add individual services anytime. No long-term contracts.",
      details: [
        "Month-to-month flexibility with no cancellation penalties",
        "Upgrade to a higher package as your business grows",
        "Downgrade or pause service if project volume decreases",
        "Add individual services to your package anytime",
        "Cancel anytime with 30 days notice — no questions asked",
        "We grow with you, not against you",
      ],
    },
  ];

  const firstThirtyDays = [
    {
      week: "Week 1",
      focus: "Onboarding & Setup",
      items: [
        "30-minute onboarding call with your dedicated PM",
        "Account setup and system access configuration",
        "Complete project intake for all active jobs",
        "Define reporting preferences and communication protocols",
      ],
    },
    {
      week: "Week 2",
      focus: "Operations Begin",
      items: [
        "Permit tracking and inspection scheduling begins",
        "First vendor and subcontractor follow-ups",
        "Document organization system established",
        "First weekly report delivered Monday morning",
      ],
    },
    {
      week: "Week 3",
      focus: "Workflow Optimization",
      items: [
        "Second weekly report with refinements based on feedback",
        "Active coordination across all projects",
        "Proactive issue identification and escalation",
        "Communication workflows optimized for your team",
      ],
    },
    {
      week: "Week 4",
      focus: "Full Cadence Established",
      items: [
        "All operations running at full speed",
        "Consistent weekly reporting delivery",
        "Monthly performance review and recommendations",
        "You're saving 20+ hours per week on operations tasks",
      ],
    },
  ];

  const benefits = [
    {
      icon: Shield,
      title: "No Long-Term Contracts",
      description: "Month-to-month flexibility. Cancel anytime with no penalties.",
    },
    {
      icon: Zap,
      title: "14-Day Free Trial",
      description: "See results before you pay. No credit card required to start.",
    },
    {
      icon: Clock,
      title: "20+ Hours Saved Per Week",
      description: "Our average GC saves over 20 hours weekly on operations tasks.",
    },
    {
      icon: BarChart3,
      title: "Dedicated PM Team",
      description: "Real people who know your projects and business, not a call center.",
    },
  ];

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-16 lg:py-24">
        <Image src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1920&q=80&auto=format&fit=crop" alt="Steel frame construction" fill className="object-cover" sizes="100vw" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              How It Works
            </h1>
            <p className="text-xl text-white/80 leading-relaxed">
              Getting started with Kealee Ops is simple. Choose your package, complete a quick onboarding call, and start saving time within 48 hours.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/ops/pricing"
                className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-sky-600"
              >
                View Pricing
              </Link>
              <Link
                href="/ops/contact"
                className="inline-flex items-center justify-center rounded-2xl border-2 border-white/30 px-6 py-3 text-sm font-bold text-white transition hover:border-white/50 hover:bg-white/10"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Steps */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              5 Simple Steps to Better Operations
            </h2>
            <p className="text-lg text-zinc-600">
              From first contact to full operations support in under a week
            </p>
          </div>

          <div className="space-y-8">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="bg-white rounded-2xl border border-zinc-200 p-6 lg:p-8 hover:shadow-lg transition">
                  <div className="flex items-start gap-6">
                    <div className="text-6xl font-bold text-sky-100 hidden sm:block select-none">
                      {step.number}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-sky-100 rounded-2xl w-12 h-12 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-sky-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                      </div>
                      <p className="text-lg text-zinc-600 mb-4">{step.description}</p>
                      <ul className="space-y-2">
                        {step.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-700">
                            <CheckCircle2 className="h-5 w-5 text-sky-600 mt-0.5 shrink-0" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* First 30 Days */}
      <section className="py-16 bg-zinc-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What to Expect in Your First 30 Days
            </h2>
            <p className="text-lg text-zinc-600">
              See exactly how we transition your operations from day one
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {firstThirtyDays.map((period, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-zinc-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-sky-100 rounded-xl px-3 py-1">
                    <span className="text-sm font-bold text-sky-700">{period.week}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{period.focus}</h3>
                </div>
                <ul className="space-y-3 text-zinc-600">
                  {period.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-sky-600 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Kealee Ops */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Kealee Ops
            </h2>
            <p className="text-lg text-zinc-600">
              Flexible, risk-free operations support that scales with your business
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl border border-zinc-200 p-6 text-center hover:shadow-lg transition">
                  <div className="bg-sky-100 rounded-2xl w-14 h-14 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-7 w-7 text-sky-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-zinc-600">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-sky-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-sky-100 mb-8">
            Start your 14-day free trial and see how much time you save in the first week. No credit card required.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/ops/contact"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-8 py-3 text-sm font-bold text-sky-700 shadow-sm transition hover:bg-sky-50"
            >
              Start Free Trial
            </Link>
            <Link
              href="/ops/pricing"
              className="inline-flex items-center justify-center rounded-2xl border-2 border-white px-8 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
