'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Search, ArrowLeft, HelpCircle, FileText, Clock, DollarSign, Building } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  name: string;
  icon: React.ReactNode;
  faqs: FAQItem[];
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const categories: FAQCategory[] = [
    {
      name: 'General Permits',
      icon: <FileText className="text-blue-600" size={20} />,
      faqs: [
        {
          question: 'What is a building permit?',
          answer: 'A building permit is official approval from your local government to proceed with a construction or renovation project. It ensures your project meets safety standards, building codes, and zoning regulations. Most structural work, electrical, plumbing, and HVAC installations require permits.',
        },
        {
          question: 'When do I need a permit?',
          answer: 'Generally, you need a permit for: new construction, additions, structural changes, electrical work (beyond simple fixture replacement), plumbing modifications, HVAC installation, roofing replacement, window/door changes that affect structure, decks over certain heights, and commercial tenant improvements. Minor cosmetic work like painting typically does not require a permit.',
        },
        {
          question: 'What happens if I build without a permit?',
          answer: 'Building without a required permit can result in: fines and penalties, being required to remove or redo work, difficulty selling your property, insurance claim denials, liability issues, and failed inspections. It\'s always better to obtain proper permits before starting work.',
        },
        {
          question: 'How long is a permit valid?',
          answer: 'Most permits are valid for 6 months to 1 year from the date of issuance. If work is not started or inspections are not completed within this period, the permit may expire and require renewal or reapplication. Check with your specific jurisdiction for exact timeframes.',
        },
      ],
    },
    {
      name: 'Application Process',
      icon: <Clock className="text-blue-600" size={20} />,
      faqs: [
        {
          question: 'What documents do I need for a permit application?',
          answer: 'Required documents typically include: completed application form, site plan showing property boundaries, architectural drawings/blueprints, structural calculations (for larger projects), mechanical/electrical/plumbing plans, contractor license information, proof of property ownership, and project scope description. Requirements vary by jurisdiction and project type.',
        },
        {
          question: 'How long does permit approval take?',
          answer: 'Approval times vary by jurisdiction and project complexity. Simple permits (like water heater replacement) may be approved same-day. Residential renovations typically take 2-4 weeks. New construction or complex commercial projects can take 4-12 weeks or longer. Kealee\'s AI review can help reduce common delays.',
        },
        {
          question: 'What is plan review?',
          answer: 'Plan review is the process where jurisdiction staff examine your submitted documents to ensure compliance with building codes, zoning regulations, and safety requirements. Reviewers may request clarifications or revisions before approval. Kealee\'s AI catches many common issues before submission to reduce revision cycles.',
        },
        {
          question: 'Can I expedite my permit application?',
          answer: 'Many jurisdictions offer expedited review for an additional fee. Kealee\'s Premium and Enterprise permit tiers include priority processing where available. Contact our team to learn about expediting options for your specific jurisdiction.',
        },
      ],
    },
    {
      name: 'Fees & Costs',
      icon: <DollarSign className="text-blue-600" size={20} />,
      faqs: [
        {
          question: 'How much does a permit cost?',
          answer: 'Permit fees vary by jurisdiction, project type, and construction value. Common fee structures include: flat fees for simple permits ($50-$200), percentage of construction cost (1-3%), or tiered fees based on project scope. Kealee displays estimated fees before you submit your application.',
        },
        {
          question: 'What fees are included in Kealee\'s service?',
          answer: 'Kealee\'s service fees cover: AI-powered document review, application preparation, submission to the jurisdiction, status tracking, and communication support. Government filing fees are separate and passed through at cost with no markup.',
        },
        {
          question: 'Are permit fees refundable?',
          answer: 'Government permit fees are generally non-refundable once the application has been submitted, though policies vary by jurisdiction. If your permit is denied, you may need to pay again for a revised application. Kealee\'s service fees follow our refund policy outlined in our Terms of Service.',
        },
      ],
    },
    {
      name: 'Inspections',
      icon: <Building className="text-blue-600" size={20} />,
      faqs: [
        {
          question: 'What inspections are required?',
          answer: 'Required inspections depend on your project but commonly include: foundation inspection, framing inspection, electrical rough-in, plumbing rough-in, mechanical rough-in, insulation inspection, and final inspection. Your permit will list all required inspection points.',
        },
        {
          question: 'How do I schedule an inspection?',
          answer: 'Inspections can typically be scheduled online through the jurisdiction\'s portal, by phone, or through Kealee\'s platform if you used our services. Most jurisdictions require 24-48 hours notice. Ensure the work is complete and accessible before the scheduled inspection.',
        },
        {
          question: 'What happens if I fail an inspection?',
          answer: 'If an inspection reveals deficiencies, the inspector will document the issues. You\'ll need to correct the problems and schedule a re-inspection. Most jurisdictions allow re-inspections at no additional fee within a certain timeframe, but repeated failures may incur charges.',
        },
        {
          question: 'What is a Certificate of Occupancy?',
          answer: 'A Certificate of Occupancy (CO) is issued after all required inspections pass and confirms the building is safe for occupancy and meets all applicable codes. It\'s required before you can legally occupy a new building or use a renovated space for its intended purpose.',
        },
      ],
    },
  ];

  const filteredCategories = searchQuery
    ? categories.map(cat => ({
        ...cat,
        faqs: cat.faqs.filter(
          faq =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(cat => cat.faqs.length > 0)
    : categories;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">

      {/* Back Link */}
      <Link
        href="/public"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8"
      >
        <ArrowLeft size={16} />
        Back to Public Portal
      </Link>

      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <HelpCircle className="text-white" size={32} />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-xl text-gray-600">
          Find answers to common questions about permits and inspections
        </p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQs..."
            className="
              w-full pl-12 pr-4 py-4
              border-2 border-gray-200 rounded-xl
              focus:border-blue-500 focus:ring-2 focus:ring-blue-100
              transition-all duration-200
            "
          />
        </div>
      </div>

      {/* FAQ Categories */}
      <div className="space-y-8">
        {filteredCategories.map((category, catIndex) => (
          <div key={catIndex} className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                {category.icon}
                {category.name}
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {category.faqs.map((faq, faqIndex) => {
                const itemId = `${catIndex}-${faqIndex}`;
                const isOpen = openItems[itemId];

                return (
                  <div key={faqIndex} className="border-b border-gray-100 last:border-0">
                    <button
                      onClick={() => toggleItem(itemId)}
                      className="w-full px-6 py-4 text-left flex items-start justify-between gap-4 hover:bg-gray-50 transition"
                    >
                      <span className="font-medium text-gray-900">{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp className="text-gray-400 flex-shrink-0 mt-1" size={20} />
                      ) : (
                        <ChevronDown className="text-gray-400 flex-shrink-0 mt-1" size={20} />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-4">
                        <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredCategories.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <HelpCircle className="text-gray-400 mx-auto mb-4" size={48} />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No matching questions found</h3>
          <p className="text-gray-600">
            Try adjusting your search or browse all categories above.
          </p>
        </div>
      )}

      {/* Contact CTA */}
      <div className="mt-12 bg-blue-50 rounded-xl p-8 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Still have questions?</h3>
        <p className="text-gray-600 mb-4">
          Our team is here to help with your permit questions.
        </p>
        <a
          href="mailto:support@kealee.com"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
        >
          Contact Support
        </a>
      </div>

    </div>
  );
}
