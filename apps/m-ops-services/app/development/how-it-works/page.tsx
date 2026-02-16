import Link from 'next/link';

export const metadata = {
  title: 'How It Works | Kealee Development Services',
  description: 'Learn how Kealee manages construction operations remotely for your project.',
};

const steps = [
  {
    number: '01',
    title: 'Tell Us About Your Project',
    desc: 'Share your project details through our intake form or schedule a call. We learn about your scope, timeline, budget, and specific operational needs.',
    details: ['Project type and scope', 'Timeline and milestones', 'Budget parameters', 'Team structure and roles', 'Specific pain points'],
  },
  {
    number: '02',
    title: 'Get a Tailored Operations Plan',
    desc: 'Our team creates a customized operations plan selecting the right combination of services for your project. We identify risks and create mitigation strategies.',
    details: ['Service selection and pricing', 'Resource allocation plan', 'Communication protocols', 'Reporting schedule', 'Risk mitigation strategy'],
  },
  {
    number: '03',
    title: 'We Manage, You Build',
    desc: 'Our operations team works remotely to coordinate schedules, manage subcontractors, track budgets, and handle documentation while your field team focuses on construction.',
    details: ['Daily coordination calls', 'Real-time dashboard access', 'Automated progress tracking', 'Issue escalation protocols', 'Weekly status reports'],
  },
  {
    number: '04',
    title: 'Track Progress in Real-Time',
    desc: 'Access your project dashboard anytime to see schedules, budgets, documents, and team communications. Everything in one place, updated in real-time.',
    details: ['Live schedule tracking', 'Budget vs. actual reporting', 'Document management portal', 'Photo documentation', 'Issue/RFI tracking'],
  },
  {
    number: '05',
    title: 'Closeout and Handoff',
    desc: 'We manage the closeout process including punch lists, final inspections, warranty documentation, and certificate of occupancy — then hand off a complete project package.',
    details: ['Punch list management', 'Final inspection coordination', 'Warranty documentation', 'O&M manual collection', 'As-built drawings'],
  },
];

const techFeatures = [
  { title: 'PM Software Platform', desc: 'Our proprietary project management software gives you real-time visibility into every aspect of your project.' },
  { title: 'AI-Powered Insights', desc: 'Machine learning algorithms identify schedule risks, cost overruns, and quality issues before they become problems.' },
  { title: 'Mobile Field Access', desc: 'Field teams can submit daily reports, photos, and inspections from any device on the job site.' },
  { title: 'Automated Reporting', desc: 'Weekly progress reports, budget updates, and milestone notifications are generated and distributed automatically.' },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-100 py-3 px-4">
        <div className="max-w-5xl mx-auto flex items-center gap-2 text-sm text-gray-500">
          <Link href="/development" className="hover:text-gray-700">Development</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">How It Works</span>
        </div>
      </div>

      {/* Header */}
      <section className="py-16 px-4 text-center bg-gradient-to-b from-gray-50 to-white">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1A2B4A] mb-4">How It Works</h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          From first contact to project closeout, here is how Kealee manages your construction operations.
        </p>
      </section>

      {/* Steps */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-12">
          {steps.map((step, idx) => (
            <div key={step.number} className={`flex flex-col md:flex-row gap-8 ${idx % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
              <div className="md:w-1/3 flex justify-center">
                <div className="w-24 h-24 bg-gradient-to-br from-[#F97316] to-[#ea580c] text-white rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg">
                  {step.number}
                </div>
              </div>
              <div className="md:w-2/3">
                <h2 className="text-2xl font-bold text-[#1A2B4A] mb-3">{step.title}</h2>
                <p className="text-gray-600 mb-4">{step.desc}</p>
                <ul className="space-y-2">
                  {step.details.map((detail) => (
                    <li key={detail} className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="w-1.5 h-1.5 bg-[#F97316] rounded-full shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Technology */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1A2B4A] text-center mb-4">Powered by Technology</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Our operations management is backed by purpose-built construction technology.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {techFeatures.map((feature) => (
              <div key={feature.title} className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-[#1A2B4A] text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <h2 className="text-2xl font-bold text-[#1A2B4A] mb-4">Ready to Get Started?</h2>
        <p className="text-gray-600 mb-8">Tell us about your project and we will create a customized operations plan.</p>
        <Link href="/development/contact" className="px-8 py-3 bg-[#F97316] text-white rounded-lg font-semibold hover:bg-orange-600 transition">
          Contact Our Team
        </Link>
      </section>
    </div>
  );
}
