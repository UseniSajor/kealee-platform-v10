import Link from "next/link"

export const metadata = {
  title: "Pricing - Kealee Estimation",
  description:
    "Clear pricing for Kealee Estimation. PM Software tiers from $99/mo to Enterprise. Individual estimation services available.",
}

const platformTiers = [
  {
    name: "Starter",
    price: "$99",
    period: "/mo",
    description: "For individual estimators and small teams getting started.",
    features: [
      "Up to 5 estimates per month",
      "Basic AI scope analysis",
      "Cost database access",
      "PDF and Excel export",
      "Email support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Professional",
    price: "$299",
    period: "/mo",
    description: "For growing teams that need full estimation power.",
    features: [
      "Up to 25 estimates per month",
      "Advanced AI analysis",
      "Full cost database with RSMeans",
      "Assembly library access",
      "Takeoff tools",
      "Value engineering reports",
      "Priority support",
    ],
    cta: "Get Started",
    popular: true,
  },
  {
    name: "Business",
    price: "$599",
    period: "/mo",
    description: "For established firms handling multiple projects.",
    features: [
      "Up to 75 estimates per month",
      "Full AI suite with custom models",
      "Custom assembly library",
      "Team collaboration tools",
      "API integrations",
      "Benchmarking reports",
      "Dedicated support rep",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations with custom requirements.",
    features: [
      "Unlimited estimates",
      "Custom-trained AI models",
      "White-label options",
      "SSO and SAML authentication",
      "Custom integrations and API",
      "Dedicated account manager",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
  },
]

const individualServices = [
  { service: "Quick Estimate", price: "$199", turnaround: "Same day" },
  { service: "Conceptual Estimate", price: "$295 - $495", turnaround: "1-2 days" },
  { service: "Detailed Estimate", price: "$499 - $1,995", turnaround: "3-5 days" },
  { service: "Full Takeoff", price: "$999 - $2,495", turnaround: "1-3 days" },
  { service: "Value Engineering Review", price: "$695 - $1,995", turnaround: "2-3 days" },
  { service: "Bid Package Preparation", price: "$795 - $2,495", turnaround: "2-5 days" },
]

const featureComparison = [
  { feature: "Estimates per month", starter: "5", professional: "25", business: "75", enterprise: "Unlimited" },
  { feature: "AI scope analysis", starter: "Basic", professional: "Advanced", business: "Full suite", enterprise: "Custom models" },
  { feature: "Cost database", starter: "Standard", professional: "Full + RSMeans", business: "Full + RSMeans", enterprise: "Full + custom" },
  { feature: "Assembly library", starter: "-", professional: "Standard", business: "Custom", enterprise: "Custom" },
  { feature: "Takeoff tools", starter: "-", professional: "Included", business: "Included", enterprise: "Included" },
  { feature: "Value engineering", starter: "-", professional: "Included", business: "Included", enterprise: "Included" },
  { feature: "Team collaboration", starter: "-", professional: "-", business: "Included", enterprise: "Included" },
  { feature: "API access", starter: "-", professional: "-", business: "Included", enterprise: "Custom" },
  { feature: "Export formats", starter: "PDF, Excel", professional: "PDF, Excel, CSV", business: "All formats", enterprise: "All formats" },
  { feature: "Support", starter: "Email", professional: "Priority email", business: "Dedicated rep", enterprise: "Account manager + SLA" },
]

const faqs = [
  {
    question: "Can I try before I subscribe?",
    answer:
      "Yes. Your first estimate is free on any plan. We want you to see the quality before you commit. No credit card required to get started.",
  },
  {
    question: "What is included in each estimate?",
    answer:
      "Every estimate includes a CSI MasterFormat organized breakdown with material, labor, and equipment costs, overhead and profit markups, contingency analysis, and a professional summary you can use for bidding or budgeting.",
  },
  {
    question: "Can I switch plans or cancel anytime?",
    answer:
      "Yes. All subscriptions are month-to-month with no long-term commitment. Upgrade, downgrade, or cancel anytime from your account settings. Changes take effect at the start of your next billing cycle.",
  },
  {
    question: "What if I need more estimates than my plan allows?",
    answer:
      "You can purchase additional estimates individually at any time, or upgrade to the next plan tier for a better per-estimate rate. Enterprise plans offer unlimited estimates for high-volume teams.",
  },
]

export default function PricingPage() {
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
            Pricing
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
            Clear, Simple Pricing
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Choose a platform subscription for ongoing access to AI-powered
            estimation tools, or order individual estimation services as needed.
          </p>
        </div>
      </section>

      {/* PM Software (SaaS) Tiers */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ color: "#1A2B4A" }}
            >
              PM Software (SaaS)
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Self-serve estimation tools with AI-powered features. Pick the
              plan that matches your volume.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {platformTiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl p-6 border-2 flex flex-col ${
                  tier.popular
                    ? "relative"
                    : "border-gray-200 bg-white"
                }`}
                style={
                  tier.popular
                    ? { borderColor: "#F97316", backgroundColor: "#FFF7ED" }
                    : undefined
                }
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className="text-white text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ backgroundColor: "#F97316" }}
                    >
                      Most Popular
                    </span>
                  </div>
                )}
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: "#1A2B4A" }}
                >
                  {tier.name}
                </h3>
                <div className="mb-4">
                  <span
                    className="text-4xl font-bold"
                    style={{ color: "#1A2B4A" }}
                  >
                    {tier.price}
                  </span>
                  <span className="text-gray-600">{tier.period}</span>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  {tier.description}
                </p>
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature) => (
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
                <Link
                  href={tier.name === "Enterprise" ? "/contact" : "/dashboard"}
                  className={`block w-full text-center px-6 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    tier.popular
                      ? "text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                  }`}
                  style={
                    tier.popular ? { backgroundColor: "#F97316" } : undefined
                  }
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Individual Estimation Services */}
      <section className="py-20" style={{ backgroundColor: "#f9fafb" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ color: "#1A2B4A" }}
            >
              Individual Estimation Services
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Order estimation services one at a time without a subscription.
              Prices depend on project size and complexity.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-3 gap-4 px-6 py-4 text-sm font-medium text-gray-500 border-b" style={{ backgroundColor: "#f9fafb" }}>
              <div>Service</div>
              <div className="text-right">Price Range</div>
              <div className="text-right">Turnaround</div>
            </div>
            {individualServices.map((item) => (
              <div
                key={item.service}
                className="grid grid-cols-3 gap-4 px-6 py-4 border-b last:border-0 items-center"
              >
                <div
                  className="font-medium"
                  style={{ color: "#1A2B4A" }}
                >
                  {item.service}
                </div>
                <div
                  className="text-right font-semibold"
                  style={{ color: "#F97316" }}
                >
                  {item.price}
                </div>
                <div className="text-right text-gray-600">
                  {item.turnaround}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-600 mb-4">
              Need a precise quote? Contact us with your project details.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 text-white rounded-xl text-sm font-semibold transition-colors"
              style={{ backgroundColor: "#F97316" }}
            >
              Get a Quote
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ color: "#1A2B4A" }}
            >
              Feature Comparison
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See what is included in each plan at a glance.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-500 w-1/5">
                    Feature
                  </th>
                  <th className="text-center py-4 px-4 font-semibold" style={{ color: "#1A2B4A" }}>
                    Starter
                  </th>
                  <th className="text-center py-4 px-4 font-semibold" style={{ color: "#F97316" }}>
                    Professional
                  </th>
                  <th className="text-center py-4 px-4 font-semibold" style={{ color: "#1A2B4A" }}>
                    Business
                  </th>
                  <th className="text-center py-4 px-4 font-semibold" style={{ color: "#1A2B4A" }}>
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {featureComparison.map((row, idx) => (
                  <tr
                    key={row.feature}
                    className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {row.feature}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600">
                      {row.starter}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600">
                      {row.professional}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600">
                      {row.business}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600">
                      {row.enterprise}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20" style={{ backgroundColor: "#f9fafb" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: "#1A2B4A" }}
            >
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <details
                key={idx}
                className="bg-white border border-gray-200 rounded-xl group"
              >
                <summary className="cursor-pointer px-6 py-4 font-medium text-gray-900 flex items-center justify-between list-none">
                  <span>{faq.question}</span>
                  <svg
                    className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform shrink-0 ml-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div className="px-6 pb-4 text-gray-600">
                  {faq.answer}
                </div>
              </details>
            ))}
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
            Start Estimating Today
          </h2>
          <p className="text-xl mb-8 text-white/90 leading-relaxed">
            Your first estimate is free. No credit card required to get started.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-8 py-4 rounded-2xl text-lg font-semibold transition-colors text-white"
            style={{ backgroundColor: "#F97316" }}
          >
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  )
}
