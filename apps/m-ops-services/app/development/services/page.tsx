import Link from 'next/link';

export const metadata = {
  title: 'All Services | Kealee Development Services',
  description: 'Browse all 11 construction operations services available through Kealee.',
};

const operationsServices = [
  { name: 'Site Assessment', price: '$350', category: 'Pre-Construction', desc: 'Comprehensive pre-construction site evaluations including soil conditions, access logistics, utility mapping, and environmental considerations.' },
  { name: 'Subcontractor Management', price: '$750', category: 'Workforce', desc: 'Vet, hire, and coordinate specialty contractors. Includes bid solicitation, contract review, and performance monitoring.' },
  { name: 'Quality Control', price: '$500', category: 'Quality', desc: 'Multi-point inspection protocols ensuring workmanship meets specifications. Includes deficiency tracking and correction verification.' },
  { name: 'Safety Management', price: '$450', category: 'Safety', desc: 'OSHA-compliant safety programs including site audits, toolbox talks, incident tracking, and safety training coordination.' },
  { name: 'Schedule Coordination', price: '$600', category: 'Planning', desc: 'Critical path scheduling, milestone tracking, look-ahead schedules, and trade coordination across all project phases.' },
  { name: 'Document Control', price: '$400', category: 'Admin', desc: 'Drawing management, RFI tracking, submittal workflows, and document distribution to all project stakeholders.' },
  { name: 'Budget Monitoring', price: '$550', category: 'Financial', desc: 'Real-time cost tracking against budget, variance reporting, change order impact analysis, and forecast updates.' },
  { name: 'Progress Reporting', price: '$350', category: 'Reporting', desc: 'Weekly and monthly progress reports with photos, milestones, schedule updates, and issue summaries for all stakeholders.' },
  { name: 'Change Order Management', price: '$500', category: 'Admin', desc: 'Track, evaluate, and process change orders. Includes cost impact analysis, schedule impact, and approval workflows.' },
  { name: 'Closeout Management', price: '$650', category: 'Post-Construction', desc: 'Punch list creation and tracking, final inspections, warranty documentation, O&M manual collection, and certificate of occupancy.' },
  { name: 'Commissioning', price: '$800', category: 'Post-Construction', desc: 'System verification and testing for MEP systems, building envelope, and life safety. Ensures all systems operate per design intent.' },
];

const estimationServices = [
  { name: 'Quick Estimate', price: '$199', desc: 'Ballpark cost estimate based on project type, size, and location. Delivered within 24 hours.' },
  { name: 'Detailed Estimate', price: '$499', desc: 'Line-item estimate with material, labor, and equipment breakdowns by CSI division.' },
  { name: 'Full Takeoff', price: '$999', desc: 'Complete quantity takeoff from construction documents with assembly-based pricing and alternates.' },
  { name: 'AI Scope Analysis', price: '$299', desc: 'AI-powered project scope analysis identifying potential cost risks and value engineering opportunities.' },
  { name: 'Budget Reconciliation', price: '$399', desc: 'Compare estimates against actual bids, identify variances, and recommend adjustments.' },
  { name: 'Value Engineering', price: '$599', desc: 'Systematic analysis of project scope to identify cost-saving alternatives without sacrificing quality.' },
  { name: 'Bid Package Preparation', price: '$799', desc: 'Prepare comprehensive bid packages with scope of work, specifications, and bid forms for trade solicitation.' },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-100 py-3 px-4">
        <div className="max-w-5xl mx-auto flex items-center gap-2 text-sm text-gray-500">
          <Link href="/development" className="hover:text-gray-700">Development</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">All Services</span>
        </div>
      </div>

      {/* Header */}
      <section className="py-12 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1A2B4A] mb-4">All Services</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Choose individual services or combine them into a package. All services are available remotely for projects in the DC-Baltimore corridor.
        </p>
      </section>

      {/* Operations Services */}
      <section className="py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-[#1A2B4A] mb-2">Operations Services (11)</h2>
          <p className="text-gray-500 mb-8">Core construction operations and management services.</p>
          <div className="space-y-4">
            {operationsServices.map((service) => (
              <div key={service.name} className="border border-gray-200 rounded-xl p-6 hover:shadow-sm transition flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-[#1A2B4A] text-lg">{service.name}</h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{service.category}</span>
                  </div>
                  <p className="text-sm text-gray-600">{service.desc}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-bold text-[#F97316] font-mono">{service.price}</div>
                  <div className="text-xs text-gray-400">per engagement</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Estimation Services */}
      <section className="py-8 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-[#1A2B4A] mb-2">Estimation Services (7)</h2>
          <p className="text-gray-500 mb-8">Professional cost estimation and bid preparation.</p>
          <div className="grid md:grid-cols-2 gap-4">
            {estimationServices.map((service) => (
              <div key={service.name} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-sm transition">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-[#1A2B4A]">{service.name}</h3>
                  <span className="text-lg font-bold text-[#F97316] font-mono">{service.price}</span>
                </div>
                <p className="text-sm text-gray-600">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <h2 className="text-2xl font-bold text-[#1A2B4A] mb-4">Need a Custom Package?</h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          We can bundle services together at a discount. Contact us to discuss your project needs.
        </p>
        <Link href="/development/contact" className="px-8 py-3 bg-[#F97316] text-white rounded-lg font-semibold hover:bg-orange-600 transition">
          Get a Custom Quote
        </Link>
      </section>
    </div>
  );
}
