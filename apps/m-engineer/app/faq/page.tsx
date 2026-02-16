"use client";

import Link from "next/link";
import { useState } from "react";

const faqs = [
  {
    question: "What types of engineering services does Kealee offer?",
    answer:
      "We offer four core engineering disciplines: Structural Engineering (foundation design, steel/concrete analysis, seismic retrofitting), MEP Engineering (mechanical, electrical, plumbing system design), Civil Engineering (site grading, stormwater, utility design), and Geotechnical Engineering (soil analysis, subsurface investigation, foundation recommendations). Each discipline is led by licensed Professional Engineers.",
  },
  {
    question: "How long does a typical engineering project take?",
    answer:
      "Turnaround times depend on the service tier and project complexity. Basic projects typically take 7-10 business days, Standard projects 5-7 business days, and Premium projects 3-5 business days. Geotechnical investigations may take 7-21 days depending on field work scheduling. We also offer expedited services for urgent projects at an additional fee.",
  },
  {
    question: "Are your engineers licensed and insured?",
    answer:
      "Yes. All of our engineers are licensed Professional Engineers (PE) in their respective disciplines. Our structural engineers hold SE licenses where required by state law. We carry professional liability (errors and omissions) insurance and can provide certificates of insurance upon request.",
  },
  {
    question: "Will my drawings be accepted by the building department?",
    answer:
      "Our PE-stamped drawings are designed to meet local building codes and permit requirements. We have a 98% first-time permit approval rate across all jurisdictions. If a plan checker requests revisions, we provide plan check responses at no additional cost within the included revision count for your tier.",
  },
  {
    question: "Do I need a geotechnical report before structural engineering can begin?",
    answer:
      "In most cases, yes. Building departments typically require a geotechnical investigation report before issuing permits for new construction. The geotechnical report provides soil bearing capacity, foundation recommendations, and seismic site classification that structural engineers need for their design. We can coordinate both services if you bundle them together.",
  },
  {
    question: "Can I bundle multiple engineering services together?",
    answer:
      "Absolutely. We offer bundle discounts when you combine services: 10% off for two disciplines, 15% off for three disciplines, and 20% off when you need all four. Bundling also ensures better coordination between disciplines, reducing conflicts and construction issues.",
  },
  {
    question: "What information do I need to provide to get started?",
    answer:
      "For most projects, we need architectural plans (floor plans, elevations, sections), the project address, and a description of the scope of work. For geotechnical services, we need the site address and proposed building footprint. For MEP services, the architectural plans and any equipment specifications are helpful. Our team will let you know if anything additional is needed after reviewing your submission.",
  },
  {
    question: "What is included in the revision process?",
    answer:
      "Each pricing tier includes a set number of revisions. Basic includes 1 revision, Standard includes 3, and Premium includes unlimited revisions. A revision covers changes to the engineering design based on your feedback or plan check comments. Significant scope changes (such as adding a story or changing the structural system) may require a change order.",
  },
  {
    question: "Do you provide construction phase support?",
    answer:
      "Construction phase support is included in our Premium tier and available as an add-on for Basic and Standard tiers. This includes responding to contractor RFIs (Requests for Information), reviewing shop drawings, performing site visits, and providing field observation during critical construction phases.",
  },
  {
    question: "How do I get a quote for my project?",
    answer:
      "You can request a free quote by clicking the 'Get a Quote' button on any page, or by emailing us at engineering@kealee.com with your project details. We review all submissions within 24 hours and provide a detailed scope of work with clear pricing. There is no obligation, and quotes are always free.",
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-zinc-200 rounded-xl bg-white overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-zinc-50 transition"
      >
        <span className="font-bold text-sm lg:text-base pr-4" style={{ color: "#1A2B4A" }}>
          {question}
        </span>
        <span
          className="text-xl font-bold flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full"
          style={{ color: "#2DD4BF", backgroundColor: isOpen ? "#f0fdfa" : "transparent" }}
        >
          {isOpen ? "\u2212" : "+"}
        </span>
      </button>
      {isOpen && (
        <div className="px-6 pb-5">
          <p className="text-sm text-zinc-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-black" style={{ color: "#1A2B4A" }}>
              Kealee Engineering
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/services" className="text-zinc-600 hover:text-zinc-900">Services</Link>
              <Link href="/pricing" className="text-zinc-600 hover:text-zinc-900">Pricing</Link>
              <Link href="/faq" className="font-semibold" style={{ color: "#1A2B4A" }}>FAQ</Link>
              <Link href="/blog" className="text-zinc-600 hover:text-zinc-900">Blog</Link>
              <Link
                href="/quote"
                className="px-4 py-2 text-white font-bold rounded-lg"
                style={{ backgroundColor: "#2DD4BF" }}
              >
                Get Quote
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <nav className="text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-900">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-900 font-medium">FAQ</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="py-16" style={{ backgroundColor: "#1A2B4A" }}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl lg:text-5xl font-black mb-6 text-white">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Everything you need to know about our engineering services,
            timelines, pricing, and permit process.
          </p>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="space-y-4">
            {faqs.map((faq) => (
              <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-4" style={{ color: "#1A2B4A" }}>
            Still Have Questions?
          </h2>
          <p className="text-zinc-600 mb-8">
            Our engineering team is here to help. Reach out and we will get back to
            you within one business day.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 border border-zinc-200 rounded-2xl">
              <div className="text-2xl mb-2">&#9993;</div>
              <h3 className="font-bold mb-1" style={{ color: "#1A2B4A" }}>Email Us</h3>
              <p className="text-sm text-zinc-500">engineering@kealee.com</p>
            </div>
            <div className="p-6 border border-zinc-200 rounded-2xl">
              <div className="text-2xl mb-2">&#9742;</div>
              <h3 className="font-bold mb-1" style={{ color: "#1A2B4A" }}>Call Us</h3>
              <p className="text-sm text-zinc-500">1-800-KEALEE</p>
            </div>
            <div className="p-6 border border-zinc-200 rounded-2xl">
              <div className="text-2xl mb-2">&#128172;</div>
              <h3 className="font-bold mb-1" style={{ color: "#1A2B4A" }}>Live Chat</h3>
              <p className="text-sm text-zinc-500">Mon-Fri, 8am-6pm PST</p>
            </div>
          </div>
          <Link
            href="/quote"
            className="inline-block px-8 py-4 text-white font-bold rounded-xl hover:opacity-90"
            style={{ backgroundColor: "#2DD4BF" }}
          >
            Get a Free Quote
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-lg font-bold mb-4">Kealee Engineering</div>
              <p className="text-sm text-zinc-400">
                Professional engineering services for the modern construction industry.
              </p>
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-400 uppercase mb-4">Services</div>
              <div className="space-y-2 text-sm">
                <Link href="/services/structural" className="block text-zinc-300 hover:text-white">Structural</Link>
                <Link href="/services/mep" className="block text-zinc-300 hover:text-white">MEP</Link>
                <Link href="/services/civil" className="block text-zinc-300 hover:text-white">Civil</Link>
                <Link href="/services/geotechnical" className="block text-zinc-300 hover:text-white">Geotechnical</Link>
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-400 uppercase mb-4">Resources</div>
              <div className="space-y-2 text-sm">
                <Link href="/pricing" className="block text-zinc-300 hover:text-white">Pricing</Link>
                <Link href="/faq" className="block text-zinc-300 hover:text-white">FAQ</Link>
                <Link href="/blog" className="block text-zinc-300 hover:text-white">Blog</Link>
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-400 uppercase mb-4">Contact</div>
              <div className="space-y-2 text-sm text-zinc-300">
                <div>engineering@kealee.com</div>
                <div>1-800-KEALEE</div>
              </div>
            </div>
          </div>
          <div className="border-t border-zinc-800 pt-8 text-center text-sm text-zinc-500">
            &copy; 2026 Kealee. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
