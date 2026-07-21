import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, DollarSign, Check, HelpCircle, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pre-Construction Fee Information | Kealee',
  description: 'Learn about pre-construction services and fees.',
};

export default function PreConFeeInfoPage() {
  const services = [
    {
      name: 'Feasibility Study',
      description: 'Assess project viability, identify constraints, and provide preliminary cost estimates.',
      price: 'From $2,500',
      includes: [
        'Site assessment review',
        'Zoning analysis',
        'Preliminary budget estimate',
        'Risk identification',
        'Feasibility report',
      ],
    },
    {
      name: 'Conceptual Estimate',
      description: 'High-level cost estimate based on project scope and comparable projects.',
      price: 'From $1,500',
      includes: [
        'SF cost analysis',
        'Comparable project research',
        'Cost range estimate',
        'Assumption documentation',
      ],
    },
    {
      name: 'Schematic Design Estimate',
      description: 'Detailed estimate based on schematic drawings and outline specifications.',
      price: 'From $3,500',
      includes: [
        'Quantity takeoffs',
        'System-level pricing',
        'Allowances identification',
        'Value engineering options',
        'Detailed estimate report',
      ],
    },
    {
      name: 'Design Development Estimate',
      description: 'Comprehensive estimate with detailed specifications and material selections.',
      price: 'From $5,500',
      includes: [
        'Complete quantity takeoffs',
        'Trade-specific pricing',
        'Subcontractor budgets',
        'Detailed contingency analysis',
        'Cash flow projection',
      ],
    },
    {
      name: 'Bid Package Preparation',
      description: 'Full bid package development for competitive contractor procurement.',
      price: 'From $7,500',
      includes: [
        'Scope of work development',
        'Bid instructions',
        'Qualification requirements',
        'Evaluation criteria',
        'Contract terms review',
      ],
    },
  ];

  const faqs = [
    {
      q: 'When should I start pre-construction services?',
      a: 'The earlier, the better. Engaging pre-construction services during feasibility or schematic design helps identify cost issues before they become expensive changes.',
    },
    {
      q: 'Are pre-construction fees applied to my project if I proceed?',
      a: 'Yes, if you engage a contractor through Kealee for the build phase, a portion of your pre-construction fees will be credited toward project costs.',
    },
    {
      q: 'How accurate are the estimates?',
      a: 'Accuracy depends on the design stage: Conceptual (±30%), Schematic (±20%), Design Development (±10%), and Construction Documents (±5%).',
    },
    {
      q: 'Can I get estimates for renovation projects?',
      a: 'Yes, our pre-construction services cover new builds, renovations, tenant improvements, and additions.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">

        {/* Back Link */}
        <Link
          href="/precon"
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-8"
        >
          <ArrowLeft size={16} />
          Back to Pre-Construction
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <DollarSign className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Pre-Construction Services & Fees
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Professional pre-construction services to help you plan, budget, and prepare for your project.
          </p>
        </div>

        {/* Services Grid */}
        <div className="space-y-6 mb-12">
          {services.map((service, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="p-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{service.name}</h3>
                    <p className="text-gray-600 mt-1">{service.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-600">{service.price}</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Includes:</p>
                  <div className="grid md:grid-cols-2 gap-2">
                    {service.includes.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="text-green-500 flex-shrink-0" size={16} />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Why Pre-Construction */}
        <div className="bg-indigo-600 rounded-2xl p-8 mb-12 text-white">
          <h2 className="text-2xl font-bold mb-4">Why Invest in Pre-Construction?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-4xl font-bold mb-1">5-10x</p>
              <p className="text-indigo-200">ROI on pre-construction planning</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-1">30%</p>
              <p className="text-indigo-200">Reduction in change orders</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-1">95%</p>
              <p className="text-indigo-200">Of projects stay on budget</p>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-2 flex items-start gap-3">
                  <HelpCircle className="text-indigo-600 flex-shrink-0 mt-0.5" size={20} />
                  {faq.q}
                </h3>
                <p className="text-gray-600 pl-8">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Ready to Get Started?
          </h2>
          <p className="text-gray-600 mb-6">
            Submit your project for a pre-construction assessment.
          </p>
          <Link
            href="/precon/new"
            className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition"
          >
            Start Pre-Construction Request
            <ArrowRight size={20} />
          </Link>
        </div>

      </div>
    </div>
  );
}
