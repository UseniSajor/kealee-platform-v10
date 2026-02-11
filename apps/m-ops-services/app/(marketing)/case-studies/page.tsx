import Link from "next/link";
import { CheckCircle2, AlertCircle, Lightbulb, TrendingUp, Star } from "lucide-react";

export const metadata = {
  title: "Case Studies - Operations Services | Kealee",
  description: "See how GCs are saving time and growing with Kealee Ops. Real results from Martinez Brothers Construction, Elite Custom Homes, Precision Remodeling, and more.",
};

const caseStudies = [
  {
    id: 1,
    company: "Martinez Brothers Construction",
    location: "Austin, TX",
    package: "Package C",
    projectType: "Residential Projects (8 active)",
    challenge: "Managing 8 active residential projects with a 3-person office team. Spending 25+ hours/week on admin, permits, and vendor follow-ups.",
    solution: "Package C with dedicated PM team handling all coordination, permits, and weekly client reporting.",
    results: [
      "Admin time reduced by 80%",
      "Took on 4 additional projects without hiring",
      "Saved $12K/month in staffing costs",
      "Permit delays eliminated across all projects",
    ],
    testimonial: "We went from drowning in paperwork to actually building. Kealee handles everything we used to lose sleep over.",
    quoteAuthor: "Carlos Martinez, Owner",
  },
  {
    id: 2,
    company: "Elite Custom Homes",
    location: "San Francisco, CA",
    package: "Package D",
    projectType: "High-End Residential (15 projects)",
    challenge: "High-end residential builder struggling with inconsistent project reporting and client communication across 15 projects.",
    solution: "Package D with standardized workflows, executive reporting, and dedicated account manager.",
    results: [
      "Client satisfaction up 40%",
      "Change order disputes reduced by 65%",
      "On-time delivery improved from 60% to 92%",
      "Won 3 additional projects from referrals",
    ],
    testimonial: "Our clients now get professional weekly updates. The difference in trust and retention has been remarkable.",
    quoteAuthor: "Jennifer Chen, President",
  },
  {
    id: 3,
    company: "Precision Remodeling Co",
    location: "Denver, CO",
    package: "Package B",
    projectType: "Kitchen/Bath Remodels (3 concurrent)",
    challenge: "Solo GC running 3 kitchen/bath remodels. Losing 15 hours/week to permit follow-ups and vendor scheduling.",
    solution: "Package B with full vendor coordination, permit tracking, and weekly reporting.",
    results: [
      "15 hours/week freed up for actual building",
      "Took on 2 more projects within first quarter",
      "Revenue up 40% in first quarter",
      "Sub no-shows eliminated with proactive coordination",
    ],
    testimonial: "I got my weekends back. Kealee handles the admin so I can focus on what I do best — building.",
    quoteAuthor: "Mike Torres, Owner",
  },
  {
    id: 4,
    company: "Cornerstone Builders",
    location: "Seattle, WA",
    package: "Individual Services",
    projectType: "Commercial Projects (2 active)",
    challenge: "Established GC needed help with specific projects but did not want a full package commitment.",
    solution: "Individual services for permit follow-up and weekly reporting on 2 commercial projects.",
    results: [
      "Permit approval time reduced by 45%",
      "Saved 8 hours/week on coordination tasks",
      "Later upgraded to Package A after seeing results",
      "Zero permit-related delays on both projects",
    ],
    testimonial: "We started with just permit tracking. The quality was so good we signed up for a full package within 2 months.",
    quoteAuthor: "Sarah Kim, Project Manager",
  },
];

const stats = [
  {
    value: "150+",
    label: "GCs Served",
  },
  {
    value: "22 hrs/week",
    label: "Avg Saved",
  },
  {
    value: "95%",
    label: "Retention Rate",
  },
  {
    value: "14-Day",
    label: "Free Trial",
  },
];

export default function CaseStudiesPage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-gradient-to-b from-zinc-50 to-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Case Studies
            </h1>
            <p className="text-xl text-zinc-600 leading-relaxed">
              See how GCs are saving time and growing with Kealee Ops. Real contractors, real results, real impact on their businesses.
            </p>
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {caseStudies.map((study) => (
              <div key={study.id} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-xl transition">
                {/* Header */}
                <div className="bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-8 lg:px-8 text-white">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold mb-3">
                        {study.package}
                      </div>
                      <h2 className="text-3xl font-bold mb-2">
                        {study.company}
                      </h2>
                      <p className="text-sky-100">
                        {study.location} • {study.projectType}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 lg:p-8">
                  {/* Challenge */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      </div>
                      Challenge
                    </h3>
                    <p className="text-zinc-600 leading-relaxed pl-10">
                      {study.challenge}
                    </p>
                  </div>

                  {/* Solution */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-8 h-8 bg-sky-100 rounded-xl flex items-center justify-center">
                        <Lightbulb className="h-5 w-5 text-sky-600" />
                      </div>
                      Solution
                    </h3>
                    <p className="text-zinc-600 leading-relaxed pl-10">
                      {study.solution}
                    </p>
                  </div>

                  {/* Results */}
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                      Results
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-10">
                      {study.results.map((result, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                          <span className="text-gray-700 font-medium">{result}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Testimonial */}
                  <div className="bg-zinc-50 rounded-2xl p-6 border-l-4 border-sky-500">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-lg text-gray-700 leading-relaxed mb-4">
                      &quot;{study.testimonial}&quot;
                    </p>
                    <p className="font-bold text-gray-900">
                      — {study.quoteAuthor}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-zinc-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, idx) => (
              <div key={idx}>
                <p className="text-4xl font-bold text-sky-600 mb-2">{stat.value}</p>
                <p className="text-sm text-zinc-600 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-sky-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to See Results Like These?
          </h2>
          <p className="text-lg text-sky-100 mb-8">
            Join 150+ GCs who are saving time and growing their businesses with Kealee Ops. Start your 14-day free trial today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-8 py-3 text-sm font-bold text-sky-700 shadow-sm transition hover:bg-sky-50"
            >
              Start Free Trial
            </Link>
            <Link
              href="/pricing"
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
