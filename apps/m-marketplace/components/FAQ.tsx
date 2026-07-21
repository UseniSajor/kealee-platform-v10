'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';

interface FAQCategory {
  title: string;
  faqs: { question: string; answer: string }[];
}

const categories: FAQCategory[] = [
  {
    title: 'Getting Started',
    faqs: [
      {
        question: 'How does Kealee work?',
        answer:
          'Kealee is a design-build platform that takes you from concept to keys. You start by submitting your project details — renovation, addition, or new build. Our system generates concept plans with floor plans, 3D renders, and cost estimates. From there, you can move into professional architecture, permitting, contractor bidding, and construction management — all on one platform.',
      },
      {
        question: 'Who is Kealee for?',
        answer:
          'Kealee serves homeowners planning renovations or new builds, property developers managing multiple projects, general contractors who need PM software and ops support, and architects and engineers looking for project referrals. Each user type has a dedicated portal with tools designed for their role.',
      },
      {
        question: 'What areas do you serve?',
        answer:
          'We currently support 3,000+ jurisdictions across the nation. Our roots are in the DC-Baltimore corridor, but our platform, architecture, estimation, and PM services are available nationwide. Contact us if your jurisdiction is not yet listed — we may be able to add it.',
      },
      {
        question: 'Do I need to use every service, or can I pick and choose?',
        answer:
          'You can use as much or as little as you need. Many clients start with just the concept service, then add architecture and permitting later. Others come in at the PM software level. Each service works independently, but they are designed to connect seamlessly when used together.',
      },
    ],
  },
  {
    title: 'Concept & Design Services',
    faqs: [
      {
        question: 'What do I get with the concept service?',
        answer:
          'You receive professionally generated floor plans, 3D renders, and preliminary cost estimates for your project. You get 5 rounds of revisions to refine the design, then pick from 3 final concept options. Once you approve a concept, you also get a designer review meeting to finalize any details.',
      },
      {
        question: 'What if I don\'t move forward after purchasing the concept service?',
        answer:
          'That is completely fine. After the concept phase, you own certified concept plans with CAD that can be given to any qualified designer or architect of your choosing. The concepts are yours to keep and use however you see fit. There is no obligation to continue with Kealee beyond the concept phase.',
      },
      {
        question: 'What happens if I do move forward to the architecture phase?',
        answer:
          'Your concept fee is fully credited toward whatever architecture package you choose. An architect is assigned within 48 hours of your concept approval and develops your approved concept into permit-ready construction documents. You never pay twice for the same work.',
      },
      {
        question: 'How long does the concept phase take?',
        answer:
          'Most concept packages are completed within 5-10 business days, depending on the complexity of the project and the number of revision rounds you use. Simple renovations are typically faster; large custom homes or additions may take the full timeframe.',
      },
    ],
  },
  {
    title: 'Architecture & Permits',
    faqs: [
      {
        question: 'What is included in the architecture packages?',
        answer:
          'Packages range from Schematic Design ($2,995) through Full Design ($5,995) to Premium Architecture ($9,995). All include an assigned architect, floor plans, elevations, and code compliance review. Higher tiers add construction documents, structural engineering coordination, MEP layout, and 3D BIM models. Your concept fee is credited toward any package.',
      },
      {
        question: 'How does the permit service work?',
        answer:
          'Once your architectural plans are complete, our permit team handles the entire submission process — application prep, jurisdiction research, plan review responses, corrections, and inspection coordination through final approval. Pricing ranges from $495 to $2,995 depending on project complexity.',
      },
      {
        question: 'Do you support jurisdictions outside of DC, Maryland, and Virginia?',
        answer:
          'Our permit service has deep expertise in the DC-Baltimore corridor and is expanding nationwide. Architecture, estimation, and PM services are available across the United States. Contact us to discuss your specific location.',
      },
    ],
  },
  {
    title: 'PM Software & Ops Services',
    faqs: [
      {
        question: 'What is the difference between PM Software and Ops Services?',
        answer:
          'PM Software (S1-S4 tiers) gives you project management tools — dashboards, scheduling, milestone tracking, document management, and communication tools. Ops Services (Packages A-D) provides an actual outsourced operations team — real people managing your projects, handling subcontractor coordination, site visits, and day-to-day operations.',
      },
      {
        question: 'How does Kealee save money compared to traditional project management?',
        answer:
          'Traditional PM consultants charge $150-300/hour. Our Ops Services packages provide dedicated support at a fraction of that cost. For example, Package B at $3,750/month includes 15-20 hours per week of dedicated PM support, plus access to all software tools. Most clients save $2,000-5,000 per month compared to hiring a traditional consultant.',
      },
      {
        question: 'Can I switch between software tiers or cancel anytime?',
        answer:
          'Yes. You can upgrade, downgrade, or cancel your subscription at any time. Changes take effect at the start of your next billing cycle. We offer pro-rated adjustments if you change plans within the first 14 days of a billing period.',
      },
    ],
  },
  {
    title: 'Payments & Escrow',
    faqs: [
      {
        question: 'How does escrow protection work?',
        answer:
          'All construction payments flow through our escrow system. Funds are held securely and only released when you approve a completed milestone. This protects homeowners from paying for unfinished work and protects contractors by guaranteeing payment for approved work. Every transaction is tracked and auditable.',
      },
      {
        question: 'What payment methods do you accept?',
        answer:
          'We accept all major credit cards, ACH bank transfers, and wire transfers. For construction payments through escrow, ACH and wire transfers are preferred due to lower processing fees on larger amounts. All payments are processed securely through Stripe.',
      },
      {
        question: 'Are there hidden fees?',
        answer:
          'No. All pricing is transparent and itemized before you commit — service fees, contractor costs, permit fees, and platform fees are all shown upfront. Escrow fees are clearly stated in your project agreement.',
      },
    ],
  },
  {
    title: 'Contractors & Construction',
    faqs: [
      {
        question: 'How are contractors vetted?',
        answer:
          'Every contractor in our network goes through a multi-step verification process including license verification, insurance confirmation, background checks, reference checks, and portfolio review. We continuously monitor performance through project ratings and milestone completion rates.',
      },
      {
        question: 'Can I choose my own contractor?',
        answer:
          'Yes. While our marketplace provides vetted contractor bids for your project, you are not required to use them. You can invite your own contractors to bid through the platform, or select from our network. The escrow and milestone tracking tools work regardless of which contractor you choose.',
      },
      {
        question: 'What happens if there is a dispute during construction?',
        answer:
          'Our platform includes a structured dispute resolution process. If you and your contractor disagree on a milestone, the escrow funds are held while the issue is reviewed. Our team can mediate disputes, and the platform provides a documented trail of all communications, approvals, and change orders to support resolution.',
      },
    ],
  },
  {
    title: 'Account & Support',
    faqs: [
      {
        question: 'What happens to my data if I cancel?',
        answer:
          'You retain full access to your data for 90 days after cancellation. During this period you can export all documents, reports, project files, and communication history. After 90 days, data is securely deleted from our servers per our privacy policy.',
      },
      {
        question: 'Do you integrate with other project management software?',
        answer:
          'Yes. We integrate with popular tools including Procore, Buildertrend, and QuickBooks. We also offer a REST API for custom integrations. Enterprise plans include dedicated integration support and custom connector development.',
      },
      {
        question: 'What kind of support do you provide?',
        answer:
          'All accounts get access to our knowledge base and help documentation. Software subscribers get email support with 24-hour response times. Ops Services clients get priority phone and email support with 4-hour response. Enterprise plans include a dedicated account manager and SLA guarantees.',
      },
      {
        question: 'Is onboarding and training included?',
        answer:
          'All plans include access to our knowledge base and video tutorials. PM Software tiers S2 and above include a guided onboarding session. Ops Services packages include full onboarding with your dedicated team. We also offer paid training packages for larger teams.',
      },
    ],
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<string | null>('0-0');
  const [activeCategory, setActiveCategory] = useState(0);

  const toggleFaq = (catIdx: number, faqIdx: number) => {
    const key = `${catIdx}-${faqIdx}`;
    setOpenIndex(openIndex === key ? null : key);
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to know about Kealee. Can&apos;t find what you&apos;re looking for?{' '}
            <Link href="/contact" className="text-blue-600 hover:text-blue-700 font-semibold">
              Contact us
            </Link>
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12 max-w-4xl mx-auto">
          {categories.map((cat, i) => (
            <button
              key={cat.title}
              onClick={() => setActiveCategory(i)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === i
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto space-y-4">
          {categories[activeCategory].faqs.map((faq, i) => {
            const key = `${activeCategory}-${i}`;
            const isOpen = openIndex === key;
            return (
              <div
                key={key}
                className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(activeCategory, i)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors duration-200"
                >
                  <h3 className="text-lg font-semibold text-gray-900 pr-8">
                    {faq.question}
                  </h3>
                  <ChevronDown
                    className={`text-gray-600 flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    size={24}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? 'max-h-[500px]' : 'max-h-0'
                  }`}
                >
                  <div className="px-6 pb-4 text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Still Have Questions */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Still have questions?</p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/contact"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              Contact Support
            </Link>
            <Link
              href="/owner/precon/new"
              className="inline-block px-6 py-3 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold rounded-lg transition-all duration-200"
            >
              Start Your Project
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
