import Link from "next/link";
import { ArrowRight, TrendingUp, Clock, DollarSign, CheckCircle, Star, Users } from "lucide-react";

const caseStudies = [
  {
    id: 1,
    contractor: "Martinez Brothers Construction",
    location: "Austin, TX",
    package: "Package C",
    projectType: "Multi-Family Development",
    challenge: "Managing 3 concurrent projects with overlapping permits and inspections",
    solution: "Kealee PM handled all permit tracking, inspection scheduling, and weekly reporting",
    results: [
      "Saved 15+ hours/week on admin tasks",
      "Zero permit delays across all 3 projects",
      "Margins improved by 12% due to better coordination",
      "Client satisfaction score: 4.9/5"
    ],
    testimonial: "Kealee's PM services freed me up to focus on the actual construction instead of chasing inspectors and permits. Best $9,500/month I've ever spent.",
    metrics: {
      timeSaved: "15 hrs/week",
      marginImprovement: "+12%",
      projectsManaged: 3,
      rating: 4.9
    }
  },
  {
    id: 2,
    contractor: "Elite Custom Homes",
    location: "San Francisco, CA",
    package: "Package D",
    projectType: "High-End Residential",
    challenge: "Complex permits in strict SF jurisdiction, needed white-glove client service",
    solution: "Dedicated PM team managing permits, daily photo reports, and owner communication",
    results: [
      "Permit approval in 6 weeks (typical: 12+ weeks)",
      "Daily client updates eliminated weekend calls",
      "Caught $47K in potential change orders before they became problems",
      "Won 2 additional projects from referrals"
    ],
    testimonial: "The daily reporting alone is worth it. My clients feel informed without me spending hours on updates. The permit acceleration saved us months.",
    metrics: {
      timeSaved: "20 hrs/week",
      permitSpeed: "50% faster",
      projectsManaged: 5,
      rating: 5.0
    }
  },
  {
    id: 3,
    contractor: "Precision Remodeling Co",
    location: "Denver, CO",
    package: "Package B",
    projectType: "Kitchen & Bath Remodels",
    challenge: "Growing from 1 to 3 concurrent projects, couldn't keep up with coordination",
    solution: "Kealee coordinated subs, tracked materials, and handled all client communication",
    results: [
      "Scaled from 1 to 3 projects without hiring admin staff",
      "Material delivery delays down 80%",
      "Sub no-shows eliminated (proactive follow-ups)",
      "Profit margins up 8%"
    ],
    testimonial: "I was drowning in calls and emails. Kealee handles the coordination so I can focus on the work. My margins are up because I'm not wasting time.",
    metrics: {
      timeSaved: "12 hrs/week",
      marginImprovement: "+8%",
      projectsManaged: 3,
      rating: 4.8
    }
  },
  {
    id: 4,
    contractor: "Cornerstone Builders",
    location: "Seattle, WA",
    package: "Package A",
    projectType: "Residential Additions",
    challenge: "Solo GC needed help with permits and weekly reporting to stay competitive",
    solution: "Kealee provided permit tracking and professional weekly reports to clients",
    results: [
      "Won 40% more bids due to professional reporting commitment",
      "Zero permit surprises or delays",
      "Clients appreciate weekly updates without asking",
      "Can now compete with larger GCs on professionalism"
    ],
    testimonial: "As a solo GC, I can't afford a full-time PM. Package A gives me the professional edge I need to compete without the overhead.",
    metrics: {
      timeSaved: "6 hrs/week",
      bidWinRate: "+40%",
      projectsManaged: 1,
      rating: 4.7
    }
  }
];

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Real Results from Real Contractors
            </h1>
            <p className="text-xl text-slate-300">
              See how general contractors are saving time, improving margins, and scaling their businesses with Kealee Ops Services.
            </p>
          </div>
        </div>
      </div>

      {/* Case Studies */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-16">
          {caseStudies.map((study, index) => (
            <div key={study.id} className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-8 text-white">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-semibold mb-3">
                      {study.package}
                    </div>
                    <h2 className="text-3xl font-bold mb-2">
                      {study.contractor}
                    </h2>
                    <p className="text-emerald-100">
                      {study.location} • {study.projectType}
                    </p>
                  </div>
                  
                  {/* Metrics */}
                  <div className="flex gap-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold">{study.metrics.timeSaved}</p>
                      <p className="text-xs text-emerald-100">Time Saved</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold">{study.metrics.rating}★</p>
                      <p className="text-xs text-emerald-100">Rating</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  {/* Challenge */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <span className="text-red-600 font-bold">!</span>
                      </div>
                      The Challenge
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {study.challenge}
                    </p>
                  </div>

                  {/* Solution */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      </div>
                      The Solution
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {study.solution}
                    </p>
                  </div>
                </div>

                {/* Results */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    Results Achieved
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {study.results.map((result, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700">{result}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Testimonial */}
                <div className="bg-slate-50 rounded-xl p-6 border-l-4 border-emerald-600">
                  <div className="flex gap-4 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-lg text-slate-700 italic leading-relaxed mb-4">
                    &quot;{study.testimonial}&quot;
                  </p>
                  <p className="font-semibold text-slate-900">
                    — {study.contractor}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Similar Results?
          </h2>
          <p className="text-xl mb-8 text-emerald-50">
            Join hundreds of GCs who have transformed their operations with Kealee
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing"
              className="px-8 py-3 bg-white text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
            >
              View Packages & Pricing
            </Link>
            <Link
              href="/signup"
              className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-4xl font-bold text-slate-900 mb-2">15hrs</p>
            <p className="text-slate-600">Average Time Saved/Week</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-slate-900 mb-2">10%+</p>
            <p className="text-slate-600">Margin Improvement</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-slate-900 mb-2">3x</p>
            <p className="text-slate-600">Project Capacity</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-slate-900 mb-2">4.9★</p>
            <p className="text-slate-600">Customer Satisfaction</p>
          </div>
        </div>
      </div>
    </div>
  );
}

