import Link from "next/link"
import Image from "next/image"
import { CheckCircle2, Zap } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export const metadata = {
  title: "Pricing - Kealee Estimation",
  description: "Clear pricing for construction estimation services. Platform access starting at $99/month. Individual estimation services available.",
}

const platformTiers = [
  {
    name: "Essentials",
    price: "$99",
    period: "/month",
    description: "For individual estimators and small teams getting started.",
    features: [
      "Up to 5 estimates/month",
      "Basic AI scope analysis",
      "Cost database access",
      "PDF/Excel export",
      "Email support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Performance",
    price: "$199",
    period: "/month",
    description: "For growing teams that need more power and accuracy.",
    features: [
      "Up to 20 estimates/month",
      "Advanced AI analysis",
      "Full cost database",
      "Assembly library access",
      "Takeoff tools",
      "Value engineering",
      "Priority support",
    ],
    cta: "Get Started",
    popular: true,
  },
  {
    name: "Scale",
    price: "$349",
    period: "/month",
    description: "For established firms handling multiple projects.",
    features: [
      "Up to 50 estimates/month",
      "Full AI suite",
      "Custom assemblies",
      "Team collaboration",
      "Integration APIs",
      "Benchmarking reports",
      "Dedicated support",
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
      "Custom AI models",
      "White-label options",
      "SSO/SAML authentication",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
  },
]

const individualServices = [
  { service: "Quick Budget Estimate", price: "$295", turnaround: "Same day" },
  { service: "Conceptual Estimate", price: "$495 - $995", turnaround: "1-2 days" },
  { service: "Detailed Estimate", price: "$995 - $2,995", turnaround: "3-5 days" },
  { service: "Takeoff Services", price: "$395 - $1,495", turnaround: "1-3 days" },
  { service: "Value Engineering Review", price: "$695 - $1,995", turnaround: "2-3 days" },
  { service: "Bid Package Preparation", price: "$795 - $2,495", turnaround: "2-5 days" },
]

const faqs = [
  {
    question: "Can I try before I commit?",
    answer: "Yes. Your first estimate is free on any plan. We want you to see the quality of our work before you subscribe.",
  },
  {
    question: "What is included in each estimate?",
    answer: "Every estimate includes a CSI-organized breakdown with material, labor, and equipment costs, overhead and profit markups, and a professional summary. Detailed estimates also include scope narratives and exclusions.",
  },
  {
    question: "How accurate are your estimates?",
    answer: "Our AI-assisted estimates achieve 95% accuracy on average when measured against actual project costs. Accuracy depends on the completeness of project information provided.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes. All platform subscriptions are month-to-month with no long-term commitment. Cancel anytime from your account settings.",
  },
  {
    question: "Do you cover my region?",
    answer: "We provide estimates for projects across the United States with regional cost adjustments. Our cost database includes regional indices for all 50 states and major metropolitan areas.",
  },
  {
    question: "What file formats do you accept for takeoff?",
    answer: "We accept PDF, PNG, JPG, TIFF, and DWG files. For best results, provide scaled architectural and structural drawings.",
  },
]

export default function PricingPage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-16 lg:py-24 px-4 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1920&q=80&auto=format&fit=crop"
          alt="Financial planning and cost analysis workspace"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Clear, Simple Pricing
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Choose a platform subscription for ongoing access, or order individual estimation services as needed. First estimate free on every plan.
            </p>
          </div>
        </div>
      </section>

      {/* Platform Tiers */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Platform Access</h2>
            <p className="text-gray-600">Self-serve estimation tools with AI-powered features</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {platformTiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl p-6 border-2 ${
                  tier.popular
                    ? 'border-blue-600 bg-blue-50 relative'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                  <span className="text-gray-600">{tier.period}</span>
                </div>
                <p className="text-sm text-gray-600 mb-6">{tier.description}</p>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contact"
                  className={`block w-full text-center px-6 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    tier.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Individual Services */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Individual Services</h2>
            <p className="text-gray-600">Order estimation services one at a time without a subscription</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-gray-50 text-sm font-medium text-gray-500 border-b">
              <div>Service</div>
              <div className="text-right">Price Range</div>
              <div className="text-right">Turnaround</div>
            </div>
            {individualServices.map((item) => (
              <div key={item.service} className="grid grid-cols-3 gap-4 px-6 py-4 border-b last:border-0 items-center">
                <div className="font-medium text-gray-900">{item.service}</div>
                <div className="text-right text-gray-900 font-semibold">{item.price}</div>
                <div className="text-right text-gray-600">{item.turnaround}</div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-600 mb-4">
              Prices depend on project size and complexity. Contact us for a precise quote.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Get a Quote
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`} className="border rounded-xl px-6">
                <AccordionTrigger className="text-left font-medium text-gray-900">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Start Estimating Today</h2>
          <p className="text-lg mb-8 opacity-95">
            Your first estimate is free. No credit card required to get started.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 hover:bg-gray-100 rounded-2xl text-lg font-semibold transition-colors"
          >
            Get Your Free Estimate
          </Link>
        </div>
      </section>
    </div>
  )
}
