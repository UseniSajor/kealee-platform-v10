import Link from "next/link"

export const metadata = {
  title: "Construction Estimation Services - Kealee Estimation",
  description:
    "Professional construction estimation services: quick estimates, detailed estimates, full takeoff, AI-powered analysis, assembly library, and cost database access.",
}

const services = [
  {
    title: "Quick Estimates",
    price: "$199",
    description:
      "Get a reliable cost range in hours. Submit your project description, type, and location and our AI generates a budget estimate with confidence ranges and regional cost adjustments.",
    features: [
      "Same-day turnaround",
      "AI-powered scope analysis",
      "Regional cost adjustments",
      "Confidence ranges included",
    ],
  },
  {
    title: "Detailed Estimates",
    price: "$499",
    description:
      "Line-by-line CSI MasterFormat estimates with material, labor, and equipment breakdowns. Built from drawings and specifications, ready for bidding and budgeting.",
    features: [
      "CSI MasterFormat organized",
      "Material, labor, and equipment splits",
      "Subcontractor scoping included",
      "Markup and contingency analysis",
    ],
  },
  {
    title: "Full Takeoff",
    price: "$999",
    description:
      "Complete quantity extraction from your construction plans. Upload PDFs or CAD files and receive organized quantity reports by CSI division with measurement verification.",
    features: [
      "AI-assisted quantity extraction",
      "Multiple file formats supported",
      "CSI-organized output",
      "Professional measurement verification",
    ],
  },
  {
    title: "AI-Powered Analysis",
    price: "Included",
    description:
      "Every estimate includes AI scope analysis that identifies gaps, missing trades, and incomplete specifications. Our AI benchmarks your project against industry data for competitive pricing.",
    features: [
      "Scope gap identification",
      "Missing trade detection",
      "Competitive benchmarking",
      "Risk assessment flagging",
    ],
  },
  {
    title: "Assembly Library",
    price: "Included",
    description:
      "Access pre-built assemblies for common construction components. An 8-inch CMU wall, a standard door frame, a concrete slab - assemblies bundle line items so estimates are consistent and fast.",
    features: [
      "Pre-built component groups",
      "Customizable assemblies",
      "Consistent estimating standards",
      "Faster estimate creation",
    ],
  },
  {
    title: "Cost Database",
    price: "Included",
    description:
      "Access current material prices, labor rates, and equipment costs by region. Our database integrates RSMeans cost data and is updated regularly to reflect current market conditions.",
    features: [
      "Regional cost indices for all 50 states",
      "Current material and labor rates",
      "RSMeans data integration",
      "Updated regularly",
    ],
  },
]

const processSteps = [
  {
    step: 1,
    title: "Upload Plans",
    description:
      "Upload your construction plans, project descriptions, or specifications. We accept PDF, PNG, JPG, TIFF, and DWG files. You can also describe your project in detail.",
  },
  {
    step: 2,
    title: "AI Analysis",
    description:
      "Our AI reviews your submission, performs scope analysis, extracts quantities, applies regional cost data, and generates initial pricing with flagged risks and gaps.",
  },
  {
    step: 3,
    title: "Get Estimate",
    description:
      "Receive your completed estimate in a professional CSI-organized format with material, labor, and equipment breakdowns. Export to PDF, Excel, or CSV.",
  },
]

export default function ServicesPage() {
  return (
    <div className="w-full min-h-screen" style={{ backgroundColor: "#ffffff" }}>
      {/* Breadcrumb */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Home
            </Link>
          </li>
          <li>
            <span className="mx-1">/</span>
          </li>
          <li className="font-medium" style={{ color: "#1A2B4A" }}>
            Services
          </li>
        </ol>
      </nav>

      {/* Hero */}
      <section
        className="py-16 lg:py-24 px-4"
        style={{ backgroundColor: "#1A2B4A" }}
      >
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Construction Estimation Services
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            From quick budget estimates to full quantity takeoffs, we combine
            AI-powered analysis with industry-standard cost data to deliver
            accurate estimates you can bid with confidence.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ color: "#1A2B4A" }}
            >
              What We Offer
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the level of detail your project requires. Every service
              includes AI-powered analysis and access to our cost database.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <div
                key={service.title}
                className="rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="text-xl font-bold"
                    style={{ color: "#1A2B4A" }}
                  >
                    {service.title}
                  </h3>
                  <span
                    className="text-lg font-bold"
                    style={{ color: "#F97316" }}
                  >
                    {service.price}
                  </span>
                </div>
                <p className="text-gray-600 mb-6 flex-1">
                  {service.description}
                </p>
                <ul className="space-y-3">
                  {service.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <svg
                        className="h-4 w-4 mt-0.5 shrink-0"
                        style={{ color: "#2DD4BF" }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - 3-Step Process */}
      <section className="py-20" style={{ backgroundColor: "#f9fafb" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ color: "#1A2B4A" }}
            >
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Three simple steps from project submission to delivered estimate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {processSteps.map((step) => (
              <div key={step.step} className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold text-white"
                  style={{ backgroundColor: "#F97316" }}
                >
                  {step.step}
                </div>
                <h3
                  className="text-xl font-bold mb-3"
                  style={{ color: "#1A2B4A" }}
                >
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {/* Connecting line for desktop */}
          <div className="hidden md:block max-w-2xl mx-auto mt-[-180px] mb-[120px]">
            <div className="flex items-center justify-between px-16">
              <div className="flex-1 h-0.5" style={{ backgroundColor: "#2DD4BF" }} />
              <div className="w-4" />
              <div className="flex-1 h-0.5" style={{ backgroundColor: "#2DD4BF" }} />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-20 text-white"
        style={{ backgroundColor: "#1A2B4A" }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to Get an Accurate Estimate?
          </h2>
          <p className="text-xl mb-8 text-white/90 leading-relaxed">
            Upload your plans and let our AI-powered estimation platform do the
            heavy lifting. Get started in your dashboard today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-8 py-4 rounded-2xl text-lg font-semibold transition-colors text-white"
              style={{ backgroundColor: "#F97316" }}
            >
              Start Estimating
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/50 hover:border-white text-white rounded-2xl text-lg font-semibold transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
