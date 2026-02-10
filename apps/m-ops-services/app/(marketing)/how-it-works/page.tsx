import Link from "next/link";
import { CheckCircle2, Users, FileText, TrendingUp, Clock, Shield, Zap, BarChart3 } from "lucide-react";

export const metadata = {
  title: "How It Works - Operations Services | Kealee",
  description: "Our proven 4-step process for outsourcing your construction operations. From onboarding to daily execution, see how Kealee becomes your ops department.",
};

export default function HowItWorksPage() {
  const steps = [
    {
      step: "01",
      icon: Users,
      title: "Onboarding (Week 1)",
      description: "We learn your business, systems, and communication style",
      details: [
        "Understand your current projects and pain points",
        "Connect to your systems (project management, email, etc.)",
        "Meet your team, subs, and key vendors",
        "Set up communication protocols and reporting preferences",
        "Define escalation procedures and decision authority",
      ],
    },
    {
      step: "02",
      icon: FileText,
      title: "Transition (Week 2)",
      description: "We take over operations tasks and establish workflows",
      details: [
        "Catalog all active permits and inspections",
        "Organize existing project documentation",
        "Establish vendor/sub communication channels",
        "Set up weekly reporting cadence",
        "Begin tracking all deliverables and deadlines",
      ],
    },
    {
      step: "03",
      icon: TrendingUp,
      title: "Daily Execution (Ongoing)",
      description: "We handle your operations so you can focus on building",
      details: [
        "Track permits and coordinate inspections daily",
        "Follow up with vendors on deliveries and subs on schedules",
        "Organize documents (POs, invoices, lien waivers) as they arrive",
        "Monitor project progress and flag issues proactively",
        "Coordinate between teams, clients, and jurisdictions",
      ],
    },
    {
      step: "04",
      icon: Clock,
      title: "Weekly Reporting (Every Monday)",
      description: "Professional updates delivered to you and your clients",
      details: [
        "Client-ready weekly reports sent by 8am Monday",
        "Status updates on all permits, inspections, and deliveries",
        "Action items list for upcoming week",
        "Risk alerts and recommendations",
        "Budget and schedule variance tracking",
      ],
    },
  ];

  const weeklyDeliverables = {
    forClients: [
      "Professional progress report (delivered Monday 8am)",
      "Progress photos with annotations",
      "Schedule updates and upcoming milestones",
      "Any issues or decisions needed",
      "Budget status summary",
    ],
    forYou: [
      "Permit status and inspection schedule",
      "Vendor delivery tracking and follow-ups",
      "Sub coordination and accountability",
      "Document organization (current week)",
      "Risk alerts and recommended actions",
      "Budget vs. actual tracking",
    ],
  };

  const whyKealee = [
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
      icon: BarChart3,
      title: "Save 20+ Hours/Week",
      description: "Our average GC saves 20+ hours per week on operations tasks.",
    },
    {
      icon: Users,
      title: "Dedicated Team",
      description: "Real people who know your projects, not a call center.",
    },
  ];

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-gradient-to-b from-zinc-50 to-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              How It Works
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              We integrate with your business in 4 simple steps—then handle your operations while you focus on building.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
              >
                View Pricing
              </Link>
              <Link
                href="/gc-services/contact"
                className="inline-flex items-center justify-center rounded-xl border-2 border-gray-300 px-6 py-3 text-sm font-bold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Process */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our 4-Step Process
            </h2>
            <p className="text-lg text-gray-600">
              From first call to full operations coverage in under two weeks
            </p>
          </div>

          <div className="space-y-8">
            {steps.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="bg-gray-50 rounded-2xl border border-gray-200 p-6 lg:p-8">
                  <div className="flex items-start gap-6">
                    <div className="text-6xl font-bold text-emerald-100 hidden sm:block">{item.step}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-emerald-100 rounded-xl w-12 h-12 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-emerald-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">{item.title}</h3>
                      </div>
                      <p className="text-lg text-gray-600 mb-4">{item.description}</p>
                      <ul className="space-y-2">
                        {item.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-700">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
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

      {/* What You Get Weekly */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What You Get Every Week
            </h2>
            <p className="text-lg text-gray-600">
              Consistent, professional operations support delivered weekly
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">For Your Clients</h3>
              <ul className="space-y-3 text-gray-700">
                {weeklyDeliverables.forClients.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">For You (Internal)</h3>
              <ul className="space-y-3 text-gray-700">
                {weeklyDeliverables.forYou.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Kealee */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why GCs Choose Kealee
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyKealee.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="text-center p-6">
                  <div className="bg-emerald-100 rounded-2xl w-14 h-14 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-7 w-7 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-emerald-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Your Operations Under Control?
          </h2>
          <p className="text-lg text-emerald-100 mb-8">
            Start your 14-day free trial and see how much time you get back in the first week.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/gc-services/contact"
              className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3 text-sm font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
            >
              Start Free Trial
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-xl border-2 border-white px-8 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
