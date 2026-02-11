import Link from "next/link";
import { 
  Clock, 
  TrendingUp, 
  Users, 
  Shield, 
  Target, 
  Zap,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Calendar,
  FileCheck,
  Phone,
  MessageSquare,
  DollarSign
} from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Save 10-20 Hours Per Week",
    description: "Stop chasing permits, following up with subs, and writing weekly reports. We handle the admin so you can focus on building.",
    examples: [
      "Automated permit status tracking",
      "Sub schedule coordination",
      "Weekly client reports (done for you)",
      "Inspection scheduling and follow-ups"
    ]
  },
  {
    icon: TrendingUp,
    title: "Improve Margins by 8-15%",
    description: "Better coordination = fewer delays = higher profits. We catch issues before they become expensive problems.",
    examples: [
      "Proactive risk identification",
      "Change order documentation",
      "Budget variance alerts",
      "Schedule optimization"
    ]
  },
  {
    icon: Users,
    title: "Scale Without Hiring Admin Staff",
    description: "Go from 1 to 5 projects without adding overhead. Our PM team scales with you.",
    examples: [
      "Multi-project coordination",
      "Centralized communication",
      "Document organization",
      "Quality control across all jobs"
    ]
  },
  {
    icon: Shield,
    title: "Professional Client Experience",
    description: "Compete with larger GCs on professionalism. Consistent communication builds trust and referrals.",
    examples: [
      "Weekly photo reports",
      "Proactive status updates",
      "Quick response times",
      "Professional documentation"
    ]
  }
];

const painPoints = [
  {
    problem: "I'm spending more time on admin than actual construction",
    solution: "We handle permits, reports, and coordination so you can focus on building",
    package: "Package A or B"
  },
  {
    problem: "Permits are killing my schedule and I can't track them all",
    solution: "Dedicated permit tracking across all jurisdictions with proactive follow-ups",
    package: "Package C"
  },
  {
    problem: "Clients keep calling on weekends asking for updates",
    solution: "Automatic weekly reports and status updates eliminate surprise calls",
    package: "All Packages"
  },
  {
    problem: "I want to take on more work but can't afford full-time staff",
    solution: "Our PM team scales with you - pay only for what you need",
    package: "Package B or C"
  },
  {
    problem: "Subs are unreliable and I'm constantly chasing them",
    solution: "We coordinate schedules, send reminders, and track completion",
    package: "Package B+"
  },
  {
    problem: "I'm losing money on change orders that aren't getting documented",
    solution: "We document every change, get approvals, and update budgets immediately",
    package: "Package C or D"
  }
];

const whoUses = [
  {
    type: "Solo GCs",
    size: "1-2 projects at a time",
    package: "Package A",
    saves: "6-10 hrs/week",
    description: "Professional reporting and permit tracking without hiring staff"
  },
  {
    type: "Growing Teams",
    size: "2-4 projects concurrent",
    package: "Package B",
    saves: "12-18 hrs/week",
    description: "Full coordination support to scale without admin overhead"
  },
  {
    type: "Established GCs",
    size: "5-10 active projects",
    package: "Package C",
    saves: "20-30 hrs/week",
    description: "Dedicated PM for multi-project management and client service"
  },
  {
    type: "Enterprise Builders",
    size: "10+ projects, multiple crews",
    package: "Package D",
    saves: "40+ hrs/week",
    description: "Full PM team with executive reporting and SLA guarantees"
  }
];

export default function ContractorsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      
      {/* Hero */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Why General Contractors Choose Kealee
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              Stop losing time and money on administrative tasks. Let us handle the operations while you focus on building quality projects.
            </p>
            <Link
              href="/packages"
              className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 transition-colors"
            >
              See Packages &amp; Pricing
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Benefits */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Transform Your Operations
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            GCs who use Kealee save time, improve margins, and deliver better client experiences
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-emerald-100 rounded-lg flex items-center justify-center mb-6">
                <benefit.icon className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                {benefit.title}
              </h3>
              <p className="text-slate-600 mb-6">
                {benefit.description}
              </p>
              <div className="space-y-2">
                {benefit.examples.map((example, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    {example}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pain Points Solved */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Sound Familiar?
            </h2>
            <p className="text-xl text-slate-600">
              Here&apos;s how we solve common GC frustrations
            </p>
          </div>

          <div className="space-y-4">
            {painPoints.map((point, idx) => (
              <div key={idx} className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <p className="text-slate-700 mb-2">
                      <span className="font-semibold text-red-600">Problem:</span> &quot;{point.problem}&quot;
                    </p>
                    <p className="text-slate-700">
                      <span className="font-semibold text-emerald-600">Solution:</span> {point.solution}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                      {point.package}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Who Uses Kealee */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Find Your Fit
            </h2>
            <p className="text-xl text-slate-600">
              We support GCs of all sizes - from solo operators to enterprise builders
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whoUses.map((profile, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border-t-4 border-emerald-600">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                    {profile.type}
                  </h3>
                  <p className="text-sm text-slate-600">{profile.size}</p>
                </div>
                
                <div className="mb-4">
                  <p className="text-3xl font-bold text-emerald-600 mb-1">
                    {profile.saves}
                  </p>
                  <p className="text-xs text-slate-500">Time Saved</p>
                </div>

                <p className="text-sm text-slate-700 mb-4">
                  {profile.description}
                </p>

                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 mb-1">
                    RECOMMENDED
                  </p>
                  <p className="font-bold text-slate-900">{profile.package}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ROI Section */}
        <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-2xl p-12 mb-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">
              The ROI Math is Simple
            </h2>
            
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-slate-700">Your hourly rate (billable):</span>
                  <span className="text-2xl font-bold text-slate-900">$150/hr</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-slate-700">Time saved per week:</span>
                  <span className="text-2xl font-bold text-emerald-600">15 hours</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-slate-700">Value of time saved:</span>
                  <span className="text-2xl font-bold text-emerald-600">$2,250/week</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-slate-700">Monthly value:</span>
                  <span className="text-3xl font-bold text-emerald-600">$9,000</span>
                </div>
                <div className="flex justify-between items-center bg-emerald-100 rounded-lg p-4">
                  <span className="font-bold text-slate-900">Package B Cost:</span>
                  <span className="text-3xl font-bold text-emerald-600">$3,750</span>
                </div>
                <div className="pt-4 text-center">
                  <p className="text-lg text-slate-700 mb-2">
                    <span className="font-bold text-emerald-600">Net Benefit: $5,250/month</span>
                  </p>
                  <p className="text-sm text-slate-600">
                    Plus improved margins, fewer delays, and happier clients
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What You Get */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            What GCs Get with Kealee
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <FileCheck className="h-10 w-10 text-emerald-600 mb-4" />
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Permit & Inspection Tracking
              </h3>
              <p className="text-slate-600 text-sm">
                We monitor status, chase approvals, and schedule inspections so you don&apos;t have to.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <MessageSquare className="h-10 w-10 text-blue-600 mb-4" />
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Client Communication
              </h3>
              <p className="text-slate-600 text-sm">
                Professional weekly updates with photos. Keeps clients informed without weekend calls.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <Calendar className="h-10 w-10 text-purple-600 mb-4" />
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Sub Coordination
              </h3>
              <p className="text-slate-600 text-sm">
                Schedule coordination, delivery tracking, and follow-ups to keep jobs moving.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <BarChart3 className="h-10 w-10 text-orange-600 mb-4" />
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Budget Tracking
              </h3>
              <p className="text-slate-600 text-sm">
                Real-time budget monitoring with variance alerts so you catch overruns early.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <DollarSign className="h-10 w-10 text-green-600 mb-4" />
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Change Order Management
              </h3>
              <p className="text-slate-600 text-sm">
                Document, price, and track change orders from request to approval.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <Phone className="h-10 w-10 text-red-600 mb-4" />
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Priority Support
              </h3>
              <p className="text-slate-600 text-sm">
                Direct PM contact for urgent issues. Someone always has your back.
              </p>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            What GCs Are Saying
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">★</span>
                ))}
              </div>
              <p className="text-slate-700 italic mb-4">
                &quot;I was skeptical about paying for PM services, but the ROI is obvious. I&apos;m bidding on twice as many jobs because I&apos;m not buried in admin work.&quot;
              </p>
              <p className="font-semibold text-slate-900">
                — Mike Torres, Torres Construction
              </p>
              <p className="text-sm text-slate-600">Package B, Austin TX</p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">★</span>
                ))}
              </div>
              <p className="text-slate-700 italic mb-4">
                &quot;The permit tracking alone saves me hours every week. And my clients love the professional weekly reports. Worth every penny.&quot;
              </p>
              <p className="font-semibold text-slate-900">
                — Sarah Chen, Elite Custom Homes
              </p>
              <p className="text-sm text-slate-600">Package C, San Francisco CA</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Stop Drowning in Admin Work?
          </h2>
          <p className="text-xl mb-8 text-emerald-50">
            Join hundreds of GCs who have reclaimed their time and improved their margins
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/packages"
              className="px-8 py-3 bg-white text-sky-600 rounded-xl font-semibold hover:bg-sky-50 transition-colors"
            >
              View Packages
            </Link>
            <Link
              href="/contact"
              className="px-8 py-3 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/case-studies"
              className="px-8 py-3 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
            >
              Read Case Studies
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

