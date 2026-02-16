import Link from 'next/link';

export const metadata = {
  title: 'Our Experience | Kealee Development Services',
  description: 'Over 15 years of construction operations experience in the DC-Baltimore corridor.',
};

const caseStudies = [
  {
    title: 'Mixed-Use Development — Silver Spring, MD',
    type: 'Commercial',
    scope: '120,000 SF mixed-use with retail and 85 residential units',
    services: ['Subcontractor Management', 'Schedule Coordination', 'Quality Control', 'Budget Monitoring'],
    outcome: 'Delivered 2 weeks ahead of schedule, 3% under budget. Zero safety incidents over 14-month build.',
    value: '$28M',
  },
  {
    title: 'Historic Row Home Renovation — Capitol Hill, DC',
    type: 'Residential',
    scope: 'Full gut renovation of 1890s row home with historic preservation requirements',
    services: ['Document Control', 'Quality Control', 'Closeout Management'],
    outcome: 'Navigated HPRB requirements, completed all historic approvals on first submission. Owner moved in on target date.',
    value: '$1.2M',
  },
  {
    title: 'Government Office Build-Out — Bethesda, MD',
    type: 'Government',
    scope: '45,000 SF Class A office space with SCIF requirements',
    services: ['Safety Management', 'Schedule Coordination', 'Commissioning', 'Document Control'],
    outcome: 'Met all security clearance requirements. Achieved LEED Gold certification. Completed commissioning with zero deficiencies.',
    value: '$8.5M',
  },
  {
    title: 'Multi-Family Residential — Columbia, MD',
    type: 'Residential',
    scope: '200-unit garden-style apartment community with amenities',
    services: ['Site Assessment', 'Subcontractor Management', 'Budget Monitoring', 'Progress Reporting', 'Closeout Management'],
    outcome: 'Managed 22 subcontractors across 18-month schedule. Achieved 99% unit turnover on first punch walk.',
    value: '$42M',
  },
];

const testimonials = [
  {
    quote: 'Kealee\'s operations team handled everything we didn\'t have bandwidth for. Their schedule coordination alone saved us three weeks on a tight timeline.',
    name: 'Marcus Johnson',
    title: 'VP of Construction, Meridian Builders',
    project: 'Mixed-Use Development',
  },
  {
    quote: 'As an owner-developer, I needed someone who could manage the day-to-day without me being on-site. Kealee delivered exactly that — detailed reporting and proactive issue resolution.',
    name: 'Sarah Chen',
    title: 'Principal, Chen Development Group',
    project: 'Multi-Family Residential',
  },
  {
    quote: 'The quality control process they implemented caught issues early and kept our rework costs near zero. That\'s rare in construction.',
    name: 'Robert Williams',
    title: 'Owner, Williams Construction LLC',
    project: 'Government Office Build-Out',
  },
];

const certifications = [
  'OSHA 30-Hour Certified',
  'PMP (Project Management Professional)',
  'LEED AP Accredited',
  'CCM (Certified Construction Manager)',
  'CPE (Certified Professional Estimator)',
  'Licensed in MD, DC, VA',
];

export default function ExperiencePage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-100 py-3 px-4">
        <div className="max-w-5xl mx-auto flex items-center gap-2 text-sm text-gray-500">
          <Link href="/development" className="hover:text-gray-700">Development</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Our Experience</span>
        </div>
      </div>

      {/* Header */}
      <section className="py-16 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1A2B4A] mb-4">Our Experience</h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          Over 15 years managing construction operations across residential, commercial, and government projects in the DC-Baltimore corridor.
        </p>
      </section>

      {/* Project Types */}
      <section className="py-8 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { type: 'Residential', count: '200+', color: '#2DD4BF' },
            { type: 'Commercial', count: '150+', color: '#F97316' },
            { type: 'Mixed-Use', count: '75+', color: '#1A2B4A' },
            { type: 'Government', count: '50+', color: '#22C55E' },
          ].map((item) => (
            <div key={item.type} className="text-center p-6 rounded-xl border border-gray-200">
              <div className="text-3xl font-bold mb-1" style={{ color: item.color }}>{item.count}</div>
              <div className="text-sm text-gray-600">{item.type} Projects</div>
            </div>
          ))}
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-[#1A2B4A] mb-8">Featured Projects</h2>
          <div className="space-y-6">
            {caseStudies.map((study) => (
              <div key={study.title} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#1A2B4A]">{study.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{study.type}</span>
                      <span className="text-xs text-gray-500">{study.scope}</span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-[#F97316] font-mono shrink-0">{study.value}</div>
                </div>
                <div className="mb-3">
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Services Provided</div>
                  <div className="flex flex-wrap gap-2">
                    {study.services.map((s) => (
                      <span key={s} className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Outcome</div>
                  <p className="text-sm text-gray-700">{study.outcome}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-[#1A2B4A] text-center mb-10">What Our Clients Say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-gray-50 rounded-xl p-6">
                <p className="text-sm text-gray-700 italic mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <div className="font-semibold text-[#1A2B4A] text-sm">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.title}</div>
                  <div className="text-xs text-[#F97316] mt-1">{t.project}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#1A2B4A] mb-6">Certifications & Credentials</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {certifications.map((cert) => (
              <span key={cert} className="bg-white border border-gray-200 text-sm text-gray-700 px-4 py-2 rounded-lg">{cert}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <h2 className="text-2xl font-bold text-[#1A2B4A] mb-4">Let Us Manage Your Next Project</h2>
        <p className="text-gray-600 mb-8 max-w-xl mx-auto">Join hundreds of successful projects in the DC-Baltimore corridor.</p>
        <Link href="/development/contact" className="px-8 py-3 bg-[#F97316] text-white rounded-lg font-semibold hover:bg-orange-600 transition">
          Start a Conversation
        </Link>
      </section>
    </div>
  );
}
