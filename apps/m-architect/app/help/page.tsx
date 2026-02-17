import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Help & Support | Kealee Architecture',
  description: 'Get help with Kealee architecture services. Find answers to common questions, contact support, and access our knowledge base.',
};

const faqs = [
  {
    question: 'What architectural design services does Kealee offer?',
    answer:
      'Kealee provides full-scope architectural design services including schematic design, design development, construction documents, 3D modeling, and permit-ready drawings. Our licensed architects handle residential additions, kitchen and bath remodels, commercial buildouts, and new build projects.',
  },
  {
    question: 'What design packages are available and how do I choose one?',
    answer:
      'We offer tiered design packages to match different project scopes. Packages vary by square footage, number of revision rounds, and deliverable types. During your initial consultation, our team will recommend the best package based on your project requirements, timeline, and budget.',
  },
  {
    question: 'How long does the architectural design process take?',
    answer:
      'Typical timelines range from 2 to 8 weeks depending on project complexity and package selected. Schematic design usually takes 1-2 weeks, design development 1-3 weeks, and construction documents 2-4 weeks. Rush options are available for time-sensitive projects.',
  },
  {
    question: 'How do revisions work during the design process?',
    answer:
      'Each design package includes a set number of revision rounds at each phase. You will review deliverables through our platform and can leave comments directly on drawings. Our architects will address your feedback and submit updated designs within the agreed timeline. Additional revision rounds can be purchased if needed.',
  },
  {
    question: 'Can Kealee help with permit submissions?',
    answer:
      'Yes. Once your construction documents are complete and approved, we coordinate directly with our permits team to submit your drawings for plan review. You can track permit submission status, respond to review comments, and receive updates all within the platform.',
  },
  {
    question: 'What file formats are deliverables provided in?',
    answer:
      'Standard deliverables include PDF drawing sets and DWG/DXF CAD files. Depending on your package, you may also receive 3D model files (Revit, SketchUp), rendered visualizations, and specification documents. All files are accessible through your project dashboard.',
  },
];

const knowledgeBaseLinks = [
  {
    title: 'Getting Started Guide',
    description: 'Learn how to set up your first project and navigate the design portal.',
    href: '#',
  },
  {
    title: 'Design Phase Overview',
    description: 'Understand the SD, DD, and CD phases of architectural design.',
    href: '#',
  },
  {
    title: 'Reviewing & Approving Drawings',
    description: 'How to review deliverables, leave feedback, and approve designs.',
    href: '#',
  },
  {
    title: 'Permit Submission Process',
    description: 'Step-by-step guide to submitting your designs for permits.',
    href: '#',
  },
  {
    title: 'Managing Your Account',
    description: 'Update your profile, billing, and notification preferences.',
    href: '#',
  },
  {
    title: 'Working with 3D Models',
    description: 'How to view, interact with, and share 3D project models.',
    href: '#',
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ color: '#1A2B4A' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="py-16 px-4" style={{ backgroundColor: '#1A2B4A' }}>
        <div className="max-w-5xl mx-auto text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: '#2DD4BF' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Help & Support
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Find answers to common questions, explore our knowledge base, or reach out to our support team.
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* FAQ Section */}
        <section className="mb-16">
          <h2
            className="text-2xl font-bold mb-8"
            style={{ color: '#1A2B4A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-semibold mb-3" style={{ color: '#1A2B4A' }}>
                  {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Knowledge Base Section */}
        <section className="mb-16">
          <h2
            className="text-2xl font-bold mb-8"
            style={{ color: '#1A2B4A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Knowledge Base
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {knowledgeBaseLinks.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all group"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: '#2DD4BF20' }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#2DD4BF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
                  </svg>
                </div>
                <h3
                  className="font-semibold mb-2 group-hover:opacity-80 transition-opacity"
                  style={{ color: '#1A2B4A' }}
                >
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Contact Support Section */}
        <section className="mb-16">
          <h2
            className="text-2xl font-bold mb-8"
            style={{ color: '#1A2B4A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Contact Support
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Email Support */}
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: '#1A2B4A' }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#1A2B4A' }}>
                Email Support
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                Send us an email and we will get back to you within 24 hours on business days.
              </p>
              <a
                href="mailto:support@kealee.com"
                className="inline-flex items-center gap-2 font-semibold text-sm hover:opacity-80 transition-opacity"
                style={{ color: '#2DD4BF' }}
              >
                support@kealee.com
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </a>
            </div>

            {/* Phone Support */}
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: '#1A2B4A' }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#1A2B4A' }}>
                Phone Support
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                Call us Monday through Friday, 9:00 AM to 6:00 PM ET.
              </p>
              <a
                href="tel:+13015758777"
                className="inline-flex items-center gap-2 font-semibold text-sm hover:opacity-80 transition-opacity"
                style={{ color: '#2DD4BF' }}
              >
                (301) 575-8777
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* Still Need Help Banner */}
        <section
          className="rounded-2xl p-8 text-center"
          style={{ backgroundColor: '#1A2B4A' }}
        >
          <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Still need help?
          </h3>
          <p className="text-gray-300 mb-6 max-w-lg mx-auto">
            Our architecture support team is here to help you with any questions about your projects, designs, or platform features.
          </p>
          <a
            href="mailto:support@kealee.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#F97316', color: 'white' }}
          >
            Get in Touch
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </a>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-12">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Kealee. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
