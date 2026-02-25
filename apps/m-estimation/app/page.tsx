import Link from "next/link"
// Image import removed - using <img> for external URLs
import { AIEstimationFeatures } from "@/components/marketing/AIEstimationFeatures"
import { CheckCircle2, Zap, Calculator, FileText, Target, TrendingUp, DollarSign, Package } from "lucide-react"

export const metadata = {
  title: "Kealee Estimation - Professional Cost Estimation",
  description: "Stop guessing on costs. AI-powered estimation with 95% accuracy. Quick budgets, detailed estimates, takeoff services, and value engineering for contractors, developers, and property owners.",
  keywords: "cost estimation, cost estimating, takeoff services, value engineering, contractor estimates, bid preparation, AI estimation",
}

export default function EstimationHomePage() {
  return (
    <div className="w-full min-h-screen bg-white">
      {/* Marketing Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="font-bold text-xl text-gray-900">
              Kealee <span className="text-blue-600">Estimation</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/services" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">Services</Link>
              <Link href="/pricing" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">Pricing</Link>
              <Link href="/how-it-works" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">How It Works</Link>
              <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">Sign In</Link>
              <Link href="/contact" className="inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-semibold transition-colors">
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 lg:py-28 px-4 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920&q=80&auto=format&fit=crop"
          alt="Professional reviewing cost estimation documents"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
                <Zap className="h-4 w-4" />
                <span>AI-Powered Estimates 3x Faster</span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Accurate Estimates. On Time. On Budget.
              </h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Professional cost estimation for contractors, developers, and property owners. AI-powered scope analysis, automated takeoff, and expert review—we deliver estimates you can bid with confidence.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-lg font-semibold transition-colors shadow-lg"
                >
                  Get Your First Estimate Free
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white/10 border-2 border-white/50 hover:border-white text-white rounded-2xl text-lg font-semibold transition-colors backdrop-blur-sm"
                >
                  View Pricing
                </Link>
              </div>

              <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-white/90">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-400" />
                  <span>AI Cost Analysis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-400" />
                  <span>95% Accuracy Rate</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-400" />
                  <span>Same-Day Turnaround</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Estimation Problems (Solved)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                problem: "Losing bids because your estimates are too high or too low?",
                solution: "AI benchmarking compares your numbers against industry data and historical projects, so you bid competitively every time.",
              },
              {
                problem: "Spending days on manual takeoff and pricing?",
                solution: "Upload plans and our AI extracts quantities automatically. Pre-built assemblies and a live cost database cut pricing time by 70%.",
              },
              {
                problem: "Cost overruns from missed scope items?",
                solution: "AI scope analysis identifies gaps, missing trades, and incomplete specifications before you finalize your estimate.",
              },
              {
                problem: "No time to do value engineering on every project?",
                solution: "Our AI analyzes your estimate and suggests cost-saving alternatives in minutes, not days—without sacrificing quality.",
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{item.problem}</h3>
                <p className="text-gray-600">{item.solution}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features */}
      <section className="py-20 bg-gray-50">
        <AIEstimationFeatures />
      </section>

      {/* Services */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">What We Deliver</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Calculator, title: "Quick Budget Estimates", description: "Get a reliable budget range in hours, not days. AI-powered analysis based on project type, size, and location." },
              { icon: FileText, title: "Detailed Estimates", description: "Line-by-line CSI-formatted estimates with material, labor, and equipment breakdowns. Ready for bidding." },
              { icon: Target, title: "Takeoff Services", description: "AI-assisted quantity extraction from plans. Upload PDFs or CAD files and get accurate quantities in minutes." },
              { icon: TrendingUp, title: "Value Engineering", description: "AI finds cost-saving alternatives without compromising quality. Reduce project costs by 10-25%." },
              { icon: DollarSign, title: "Bid Support", description: "Complete bid packages with competitive pricing, scope narratives, and professional formatting." },
              { icon: Package, title: "Cost Database Access", description: "Access our cost database with current material prices, labor rates, and equipment costs by region." },
            ].map((service) => {
              const Icon = service.icon
              return (
                <div key={service.title} className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="bg-blue-100 rounded-xl w-14 h-14 flex items-center justify-center mb-4">
                    <Icon className="h-7 w-7 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{service.title}</h3>
                  <p className="text-gray-600">{service.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Who We Serve */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Estimation Services for Everyone</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Whether you are a contractor, developer, or property owner—we provide accurate estimates for all project types and sizes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-blue-50 rounded-2xl p-8 border border-blue-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Contractors</h3>
              <p className="text-gray-600 mb-4">General contractors and subcontractors—get accurate estimates that win bids and protect your margins.</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>&#8226; Bid-ready estimates</li>
                <li>&#8226; Change order pricing</li>
                <li>&#8226; Competitive benchmarking</li>
                <li>&#8226; Volume discounts available</li>
              </ul>
            </div>
            <div className="bg-cyan-50 rounded-2xl p-8 border border-cyan-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Developers</h3>
              <p className="text-gray-600 mb-4">From feasibility studies to detailed budgets—we help you plan projects with accurate cost data.</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>&#8226; Conceptual budgets</li>
                <li>&#8226; Phased estimates</li>
                <li>&#8226; Value engineering</li>
                <li>&#8226; Cost forecasting</li>
              </ul>
            </div>
            <div className="bg-amber-50 rounded-2xl p-8 border border-amber-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Property Owners</h3>
              <p className="text-gray-600 mb-4">Renovating, building, or adding on? Know your costs before you commit to a contractor.</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>&#8226; Renovation estimates</li>
                <li>&#8226; New construction budgets</li>
                <li>&#8226; Contractor bid review</li>
                <li>&#8226; Plain-language reports</li>
              </ul>
            </div>
          </div>

          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Project Types We Estimate</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              "New Construction", "Residential Remodels", "Commercial Build-Outs", "Industrial Facilities",
              "Multi-Family Housing", "Tenant Improvements", "Additions & Expansions", "Site Development",
              "Concrete & Foundations", "Mechanical/Electrical", "Roofing & Waterproofing", "Interior Finishes",
              "Demolition Projects", "Change Orders", "Historical Renovations", "And More...",
            ].map((type) => (
              <div key={type} className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                <p className="font-medium text-gray-900 text-sm">{type}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">Ready to Estimate Smarter?</h2>
          <p className="text-xl mb-8 opacity-95">
            Get your first estimate free. See how AI-powered estimation saves time, reduces errors, and wins more bids.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 hover:bg-gray-100 rounded-2xl text-lg font-semibold transition-colors"
            >
              Get Started Free
            </Link>
            <a
              href="mailto:getstarted@kealee.com"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white hover:bg-white/10 rounded-2xl text-lg font-semibold transition-colors"
            >
              Email Us
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="font-bold text-xl text-white mb-4">Kealee <span className="text-blue-500">Estimation</span></div>
              <p className="text-sm text-gray-400">Professional cost estimation with AI-powered analysis, automated takeoff, and industry-standard cost databases.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Services</h3>
              <ul className="space-y-2">
                <li><Link href="/services" className="text-sm hover:text-blue-400 transition-colors">Estimation Services</Link></li>
                <li><Link href="/pricing" className="text-sm hover:text-blue-400 transition-colors">Pricing</Link></li>
                <li><Link href="/how-it-works" className="text-sm hover:text-blue-400 transition-colors">How It Works</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">We Serve</h3>
              <ul className="space-y-2 text-sm">
                <li>General Contractors</li>
                <li>Subcontractors</li>
                <li>Developers</li>
                <li>Property Owners</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Contact</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="mailto:getstarted@kealee.com" className="hover:text-blue-400 transition-colors">getstarted@kealee.com</a></li>
                <li><a href="tel:+13015758777" className="hover:text-blue-400 transition-colors">(301) 575-8777</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-gray-400 text-center">
            <p>&copy; {new Date().getFullYear()} Kealee Estimation. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
