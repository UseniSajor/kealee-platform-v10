'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'How does Kealee save money compared to traditional PM?',
      answer: 'Traditional project management consultants charge $150-300/hour. Our Package B at $4,500/month provides 15-20 hours per week, equivalent to $150-200/hour in traditional consulting - but you get dedicated support, AI tools, and platform access included. Most clients save $2,000-5,000 per month.'
    },
    {
      question: 'What is the AI permit review and how accurate is it?',
      answer: 'Our AI analyzes your permit applications against jurisdiction requirements, catching common errors before submission. It reviews documents in about 5 minutes and has an 85% correlation with final approval outcomes. This helps avoid costly resubmissions and delays.'
    },
    {
      question: 'Can I switch between packages or cancel anytime?',
      answer: 'Yes! You can upgrade, downgrade, or cancel your subscription at any time. Changes take effect at the start of your next billing cycle. We offer pro-rated refunds if you downgrade within the first 14 days.'
    },
    {
      question: 'Do you support jurisdictions outside DC-Baltimore?',
      answer: 'Currently, we support 3,000+ jurisdictions across the DC-Baltimore corridor. We\'re rapidly expanding to cover the entire Mid-Atlantic region. Contact us if your jurisdiction isn\'t listed - we may be able to add it.'
    },
    {
      question: 'What happens to my data if I cancel?',
      answer: 'You retain full access to your data for 90 days after cancellation. You can export all documents, reports, and project data during this period. After 90 days, data is securely deleted from our servers.'
    },
    {
      question: 'Do you integrate with other construction software?',
      answer: 'Yes! We integrate with popular tools like Procore, Buildertrend, and QuickBooks. We also offer a REST API for custom integrations. Enterprise plans include dedicated integration support.'
    },
    {
      question: 'Is training included?',
      answer: 'All plans include access to our knowledge base and video tutorials. Professional and Enterprise plans include onboarding sessions and ongoing training. We also offer paid training packages for teams.'
    },
    {
      question: 'What kind of support do you provide?',
      answer: 'Free plans get email support with 48-hour response. Professional plans get priority email/phone support with 4-hour response. Enterprise plans get dedicated account managers and SLA guarantees.'
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to know about Kealee. Can't find what you're looking for?{' '}
            <Link href="/contact" className="text-blue-600 hover:text-blue-700 font-semibold">
              Contact us
            </Link>
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="
                  w-full px-6 py-4
                  flex items-center justify-between
                  text-left
                  hover:bg-gray-50
                  transition-colors duration-200
                "
              >
                <h3 className="text-lg font-semibold text-gray-900 pr-8">
                  {faq.question}
                </h3>
                <ChevronDown
                  className={`
                    text-gray-600 flex-shrink-0
                    transition-transform duration-300
                    ${openIndex === i ? 'rotate-180' : ''}
                  `}
                  size={24}
                />
              </button>
              
              <div
                className={`
                  overflow-hidden
                  transition-all duration-300
                  ${openIndex === i ? 'max-h-96' : 'max-h-0'}
                `}
              >
                <div className="px-6 pb-4 text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Still Have Questions */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Still have questions?
          </p>
          
          <Link
            href="/contact"
            className="
              inline-block
              px-6 py-3
              bg-blue-600 hover:bg-blue-700
              text-white font-semibold
              rounded-lg
              shadow-md hover:shadow-lg
              transition-all duration-200
            "
          >
            Contact Support
          </Link>
        </div>
      </div>
    </section>
  );
}




