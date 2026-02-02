import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Engineering Services | Kealee',
  description: 'Structural, MEP, and civil engineering services with stamped drawings and compliance verification.',
};

export default function EngineerPage() {
  const disciplines = [
    {
      icon: '🏗️',
      title: 'Structural Engineering',
      description: 'Load calculations, beam sizing, foundation design, and structural modifications.',
      services: ['Load-bearing wall removal', 'Beam design', 'Foundation analysis', 'Seismic evaluation'],
    },
    {
      icon: '⚡',
      title: 'Electrical Engineering',
      description: 'Electrical system design, panel sizing, and code-compliant layouts.',
      services: ['Panel upgrades', 'Load calculations', 'Lighting design', 'EV charging'],
    },
    {
      icon: '🔧',
      title: 'Mechanical Engineering',
      description: 'HVAC design, ductwork layout, and Manual J calculations.',
      services: ['HVAC sizing', 'Duct design', 'Ventilation', 'Energy modeling'],
    },
    {
      icon: '🚿',
      title: 'Plumbing Engineering',
      description: 'Water supply, drainage design, and fixture sizing calculations.',
      services: ['Pipe sizing', 'Drainage design', 'Water heater sizing', 'Gas piping'],
    },
    {
      icon: '🌍',
      title: 'Civil Engineering',
      description: 'Site grading, stormwater management, and utility connections.',
      services: ['Grading plans', 'Stormwater design', 'Utility design', 'Erosion control'],
    },
    {
      icon: '🔥',
      title: 'Fire Protection',
      description: 'Fire sprinkler design, egress analysis, and fire alarm systems.',
      services: ['Sprinkler design', 'Egress analysis', 'Fire alarm layout', 'Code review'],
    },
  ];

  const deliverables = [
    { item: 'PE-Stamped Drawings', included: true },
    { item: 'Calculations Package', included: true },
    { item: 'Code Compliance Letter', included: true },
    { item: 'Permit Support', included: true },
    { item: 'Contractor RFI Support', included: true },
    { item: 'Site Inspections', included: false, note: 'Available add-on' },
  ];

  const pricing = [
    {
      service: 'Structural Letter (Simple)',
      price: 'From $450',
      description: 'Load-bearing analysis, beam letter',
    },
    {
      service: 'Structural Plans',
      price: 'From $1,500',
      description: 'Full structural drawings package',
    },
    {
      service: 'MEP Design',
      price: 'From $2,000',
      description: 'Mechanical, electrical, plumbing',
    },
    {
      service: 'Civil/Site Plans',
      price: 'From $3,000',
      description: 'Grading, utilities, stormwater',
    },
    {
      service: 'Full Engineering Package',
      price: 'From $5,000',
      description: 'All disciplines as needed',
    },
  ];

  const turnaround = [
    { type: 'Structural Letter', time: '3-5 business days' },
    { type: 'Engineering Drawings', time: '1-2 weeks' },
    { type: 'Full Package', time: '2-4 weeks' },
    { type: 'Rush Service', time: '+50% fee' },
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[var(--primary)] hover:underline mb-8"
      >
        ← Back to Home
      </Link>

      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
          Engineering Services
        </h1>
        <p className="mt-4 text-xl text-zinc-600 max-w-3xl mx-auto">
          Licensed professional engineers for structural, MEP, civil, and fire protection.
          PE-stamped drawings for permit approval.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600"
          >
            Request Quote
          </Link>
          <Link
            href="/schedule"
            className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-6 py-3 text-sm font-bold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
          >
            Schedule Consultation
          </Link>
        </div>
      </div>

      {/* Disciplines */}
      <section className="mb-16">
        <h2 className="text-2xl font-black text-center mb-10">Engineering Disciplines</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {disciplines.map((discipline) => (
            <div
              key={discipline.title}
              className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
            >
              <span className="text-2xl">{discipline.icon}</span>
              <h3 className="mt-3 font-bold">{discipline.title}</h3>
              <p className="mt-2 text-sm text-zinc-600">{discipline.description}</p>
              <div className="mt-4 flex flex-wrap gap-1">
                {discipline.services.map((service) => (
                  <span
                    key={service}
                    className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What's Included */}
      <section className="mb-16">
        <div className="rounded-2xl bg-zinc-50 p-8">
          <h2 className="text-xl font-black text-center mb-6">What's Included</h2>
          <div className="max-w-md mx-auto">
            <div className="space-y-3">
              {deliverables.map((item) => (
                <div key={item.item} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    {item.included ? (
                      <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-zinc-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className={item.included ? 'text-zinc-900' : 'text-zinc-500'}>
                      {item.item}
                    </span>
                  </div>
                  {item.note && (
                    <span className="text-xs text-zinc-500">{item.note}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mb-16">
        <h2 className="text-2xl font-black text-center mb-4">Pricing</h2>
        <p className="text-center text-zinc-600 mb-10 max-w-2xl mx-auto">
          Transparent pricing based on project scope. All quotes include PE stamp.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pricing.map((item) => (
            <div
              key={item.service}
              className="rounded-xl border border-black/10 bg-white p-5 shadow-sm"
            >
              <div className="text-lg font-bold">{item.service}</div>
              <div className="text-2xl font-black text-orange-500 mt-1">{item.price}</div>
              <p className="text-sm text-zinc-500 mt-1">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Turnaround Times */}
      <section className="mb-16">
        <h2 className="text-xl font-black text-center mb-6">Turnaround Times</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {turnaround.map((item) => (
            <div
              key={item.type}
              className="text-center px-6 py-4 bg-white border border-black/10 rounded-xl"
            >
              <div className="font-bold">{item.type}</div>
              <div className="text-sm text-orange-600 mt-1">{item.time}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Integration */}
      <section className="mb-16">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-xl font-black">
                Seamless Integration with Architecture
              </h2>
              <p className="mt-2 text-zinc-700 max-w-xl">
                Our engineering services integrate directly with our architecture team for
                coordinated drawing sets and streamlined permit packages.
              </p>
            </div>
            <Link
              href="/architect"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 whitespace-nowrap"
            >
              Architecture Services →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-orange-500 p-8 text-white text-center">
        <h2 className="text-2xl font-black">Need Engineering Support?</h2>
        <p className="mt-2 opacity-95 max-w-xl mx-auto">
          Get a quote for your project. Most quotes provided within 24 hours.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-orange-700 shadow-sm transition hover:bg-orange-50"
          >
            Request Quote
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-xl border border-white/30 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-white/10"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </main>
  );
}
