'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'What is construction escrow?',
    answer:
      'Construction escrow is a financial arrangement where funds are held by a neutral third party until specific project milestones are completed and verified. This protects both contractors and project owners by ensuring payments are made only when work is satisfactorily completed.',
  },
  {
    question: 'Are funds FDIC insured?',
    answer:
      'Yes, all funds held in Finance Trust escrow accounts are FDIC insured up to $250,000 per depositor, per insured bank. We work with partner banks that provide full FDIC insurance coverage for maximum security.',
  },
  {
    question: 'How long does it take to release funds?',
    answer:
      'Once a milestone is approved by all required parties, funds are typically released within 24 hours via ACH transfer. Same-day wire transfers are also available for an additional fee for urgent payment needs.',
  },
  {
    question: 'What security measures are in place?',
    answer:
      'Finance Trust employs bank-level security including AES-256 encryption, multi-factor authentication, SOC 2 Type II certification, and 24/7 security monitoring. All data is stored in redundant, geographically distributed data centers.',
  },
  {
    question: 'Can I set up multiple escrow accounts?',
    answer:
      'Absolutely. You can create and manage multiple escrow accounts from a single dashboard. This is ideal for construction companies managing multiple projects simultaneously.',
  },
  {
    question: 'What happens if there is a dispute?',
    answer:
      'Our platform includes built-in dispute resolution tools. If parties cannot agree, funds remain secured in escrow until the dispute is resolved. We also offer mediation services for complex situations.',
  },
  {
    question: 'How do milestone approvals work?',
    answer:
      'Milestones can be configured to require single or multi-party approval. Contractors submit completion documentation, stakeholders review and approve, and once all required approvals are received, funds are automatically released.',
  },
  {
    question: 'What are the fees?',
    answer:
      'Finance Trust charges a small percentage of the transaction amount, with volume discounts available for larger projects. There are no setup fees, monthly minimums, or hidden charges. Contact our sales team for custom enterprise pricing.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 border border-emerald-200 rounded-full text-emerald-700 text-sm font-medium mb-6">
            <HelpCircle size={16} />
            Got Questions?
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Everything you need to know about our escrow services
          </p>
        </div>

        {/* FAQ List */}
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-slate-200/50 overflow-hidden transition-all duration-300 hover:shadow-lg"
            >
              <button
                className="w-full flex items-center justify-between p-6 text-left"
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
              >
                <span className="font-semibold text-slate-900 pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`text-slate-400 transition-transform duration-300 flex-shrink-0 ${
                    openIndex === index ? 'rotate-180 text-emerald-600' : ''
                  }`}
                  size={20}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-6 pb-6 text-slate-600 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <p className="text-slate-600 mb-4">
            Still have questions? We're here to help.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </section>
  );
}
