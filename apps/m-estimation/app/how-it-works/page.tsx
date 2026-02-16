import Link from "next/link"

export const metadata = {
  title: "How It Works - Kealee Estimation",
  description:
    "Learn how Kealee Estimation combines AI-powered analysis, CSI MasterFormat coding, and RSMeans cost data to deliver accurate construction estimates.",
}

const steps = [
  {
    step: 1,
    title: "Upload Construction Plans or Enter Project Details",
    description:
      "Start by uploading your construction plans, drawings, or specifications. We accept PDF, PNG, JPG, TIFF, and DWG files. If you do not have plans yet, describe your project type, size, location, and requirements in detail.",
    details: [
      "Drag and drop files directly into the platform",
      "Describe project scope, type, and location",
      "Include special requirements or site conditions",
      "Add budget constraints and timeline expectations",
      "No account required for your first estimate",
    ],
  },
  {
    step: 2,
    title: "AI-Powered Analysis & Cost Database Lookup",
    description:
      "Our AI engine analyzes your submission and performs scope identification, quantity extraction, and cost database lookup. It identifies all required work items, applies regional cost indices, and flags scope gaps and risks for review.",
    details: [
      "AI identifies all required CSI divisions and work items",
      "Quantities extracted from plans automatically",
      "Regional cost indices applied from RSMeans database",
      "Scope gaps and missing trades flagged for review",
      "Historical project data used for benchmarking",
    ],
  },
  {
    step: 3,
    title: "Assembly-Based Estimation with Material & Labor Breakdown",
    description:
      "The platform applies pre-built assemblies to generate a structured estimate. Each assembly bundles materials, labor, and equipment for common construction components, ensuring consistent and accurate pricing across your estimate.",
    details: [
      "Pre-built assemblies for walls, floors, roofing, MEP, and more",
      "Material costs from current market pricing data",
      "Labor rates based on local union and non-union scales",
      "Equipment costs included where applicable",
      "Overhead, profit, and contingency calculated automatically",
    ],
  },
  {
    step: 4,
    title: "Review, Adjust & Export Professional Estimates",
    description:
      "Review your completed estimate in the platform. Adjust quantities, swap materials, modify markups, or apply value engineering suggestions. When ready, export your estimate as a professional PDF, Excel workbook, or CSV file.",
    details: [
      "Interactive line-item editing in the platform",
      "Adjust quantities, unit costs, and markups",
      "Apply AI-suggested value engineering alternatives",
      "Export to PDF, Excel, or CSV formats",
      "Share with team members or stakeholders directly",
    ],
  },
]

const technologies = [
  {
    title: "AI Scope Analysis",
    description:
      "Our AI reads your plans and project descriptions to identify every required scope item, trade, and specification. It catches missing items and incomplete scope that manual review often misses, reducing change orders and cost overruns.",
    highlights: [
      "Natural language project understanding",
      "Plan and drawing interpretation",
      "Scope completeness verification",
      "Risk and gap identification",
    ],
  },
  {
    title: "CSI MasterFormat Coding",
    description:
      "Every estimate is organized using the CSI MasterFormat standard, the construction industry's universal system for organizing specifications and cost data. Division codes (like 03 for Concrete, 09 for Finishes) ensure your estimates are structured consistently.",
    highlights: [
      "Industry-standard organization",
      "All 50 CSI divisions supported",
      "Consistent formatting across projects",
      "Easy comparison with other estimates",
    ],
  },
  {
    title: "RSMeans Cost Data Integration",
    description:
      "Our cost database integrates RSMeans data with current material prices, labor rates, and equipment costs. Regional indices for all 50 states and major metro areas ensure your estimates reflect local market conditions accurately.",
    highlights: [
      "Current material and labor pricing",
      "Regional cost indices for all 50 states",
      "Updated regularly with market changes",
      "Historical cost trend analysis",
    ],
  },
]

export default function HowItWorksPage() {
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
            How It Works
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
            How It Works
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            AI does the heavy lifting. Industry cost data keeps it accurate. You
            get professional estimates delivered in days, not weeks.
          </p>
        </div>
      </section>

      {/* 4-Step Process */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ color: "#1A2B4A" }}
            >
              Four Steps to an Accurate Estimate
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From plan upload to professional export in a streamlined workflow.
            </p>
          </div>

          <div className="space-y-16">
            {steps.map((step, idx) => (
              <div
                key={step.step}
                className={`flex flex-col lg:flex-row gap-8 items-start ${
                  idx % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Content */}
                <div className="lg:w-1/2">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0"
                      style={{ backgroundColor: "#F97316" }}
                    >
                      {step.step}
                    </div>
                    <h3
                      className="text-xl lg:text-2xl font-bold"
                      style={{ color: "#1A2B4A" }}
                    >
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {step.description}
                  </p>
                  <ul className="space-y-3">
                    {step.details.map((detail) => (
                      <li
                        key={detail}
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
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual placeholder */}
                <div className="lg:w-1/2">
                  <div
                    className="rounded-2xl p-8 border flex flex-col items-center justify-center min-h-[220px]"
                    style={{
                      backgroundColor: "#f9fafb",
                      borderColor: "#e5e7eb",
                    }}
                  >
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                      style={{ backgroundColor: "#1A2B4A" }}
                    >
                      <span className="text-3xl font-bold text-white">
                        {step.step}
                      </span>
                    </div>
                    <p
                      className="text-sm font-medium text-center"
                      style={{ color: "#1A2B4A" }}
                    >
                      {step.title}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20" style={{ backgroundColor: "#f9fafb" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ color: "#1A2B4A" }}
            >
              The Technology Behind Your Estimates
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We combine AI analysis, industry-standard organization, and
              current cost data to deliver estimates that are accurate, complete,
              and professionally formatted.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {technologies.map((tech) => (
              <div
                key={tech.title}
                className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: "#1A2B4A" }}
                >
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    {tech.title === "AI Scope Analysis" && (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    )}
                    {tech.title === "CSI MasterFormat Coding" && (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    )}
                    {tech.title === "RSMeans Cost Data Integration" && (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                      />
                    )}
                  </svg>
                </div>
                <h3
                  className="text-xl font-bold mb-3"
                  style={{ color: "#1A2B4A" }}
                >
                  {tech.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {tech.description}
                </p>
                <ul className="space-y-2">
                  {tech.highlights.map((highlight) => (
                    <li
                      key={highlight}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: "#2DD4BF" }}
                      />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats / Trust */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div
                className="text-4xl font-bold mb-2"
                style={{ color: "#F97316" }}
              >
                95%
              </div>
              <p className="text-gray-600 font-medium">Average Accuracy</p>
              <p className="text-sm text-gray-500 mt-1">
                Measured against actual project costs
              </p>
            </div>
            <div>
              <div
                className="text-4xl font-bold mb-2"
                style={{ color: "#F97316" }}
              >
                3x Faster
              </div>
              <p className="text-gray-600 font-medium">Than Manual Estimation</p>
              <p className="text-sm text-gray-500 mt-1">
                AI handles extraction and pricing lookups
              </p>
            </div>
            <div>
              <div
                className="text-4xl font-bold mb-2"
                style={{ color: "#F97316" }}
              >
                1-5 Days
              </div>
              <p className="text-gray-600 font-medium">Delivery Time</p>
              <p className="text-sm text-gray-500 mt-1">
                Quick budgets available same day
              </p>
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
            Ready to Try It?
          </h2>
          <p className="text-xl mb-8 text-white/90 leading-relaxed">
            Upload your plans and see how AI-powered estimation saves time,
            reduces errors, and delivers professional results.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-8 py-4 rounded-2xl text-lg font-semibold transition-colors text-white"
              style={{ backgroundColor: "#F97316" }}
            >
              Try It Now
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/50 hover:border-white text-white rounded-2xl text-lg font-semibold transition-colors"
            >
              View Services
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
