import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { sectionImages } from '@kealee/ui'

export const metadata: Metadata = {
  title: 'Engineering Services | Kealee',
  description: 'Structural, MEP, and civil engineering services with PE-stamped drawings and compliance verification.',
}

export default function EngineerServicePage() {
  const disciplines = [
    { title: 'Structural Engineering', description: 'Load calculations, beam sizing, foundation design, and structural modifications.', services: ['Load-bearing wall removal', 'Beam design', 'Foundation analysis', 'Seismic evaluation'] },
    { title: 'Electrical Engineering', description: 'Electrical system design, panel sizing, and code-compliant layouts.', services: ['Panel upgrades', 'Load calculations', 'Lighting design', 'EV charging'] },
    { title: 'Mechanical Engineering', description: 'HVAC design, ductwork layout, and Manual J calculations.', services: ['HVAC sizing', 'Duct design', 'Ventilation', 'Energy modeling'] },
    { title: 'Plumbing Engineering', description: 'Water supply, drainage design, and fixture sizing calculations.', services: ['Pipe sizing', 'Drainage design', 'Water heater sizing', 'Gas piping'] },
    { title: 'Civil Engineering', description: 'Site grading, stormwater management, and utility connections.', services: ['Grading plans', 'Stormwater design', 'Utility design', 'Erosion control'] },
    { title: 'Fire Protection', description: 'Fire sprinkler design, egress analysis, and fire alarm systems.', services: ['Sprinkler design', 'Egress analysis', 'Fire alarm layout', 'Code review'] },
  ]

  const pricing = [
    { service: 'Structural Letter (Simple)', price: 'From $450', description: 'Load-bearing analysis, beam letter' },
    { service: 'Structural Plans', price: 'From $1,500', description: 'Full structural drawings package' },
    { service: 'MEP Design', price: 'From $2,000', description: 'Mechanical, electrical, plumbing' },
    { service: 'Civil/Site Plans', price: 'From $3,000', description: 'Grading, utilities, stormwater' },
    { service: 'Full Engineering Package', price: 'From $5,000', description: 'All disciplines as needed' },
  ]

  const turnaround = [
    { type: 'Structural Letter', time: '3-5 business days' },
    { type: 'Engineering Drawings', time: '1-2 weeks' },
    { type: 'Full Package', time: '2-4 weeks' },
    { type: 'Rush Service', time: '+50% fee' },
  ]

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/services" className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-8 text-sm">&larr; All Services</Link>

        <div className="relative text-center mb-16 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-16 overflow-hidden">
          <Image
            src={sectionImages.engineering.src}
            alt={sectionImages.engineering.alt}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
          <div className="relative">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Engineering Services</h1>
            <p className="mt-4 text-xl text-white/85 max-w-3xl mx-auto">
              Licensed professional engineers for structural, MEP, civil, and fire protection. PE-stamped drawings for permit approval.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600">Request Quote</Link>
              <Link href="/portals" className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-white/20">Go to Portal</Link>
            </div>
          </div>
        </div>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-10 text-gray-900">Engineering Disciplines</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {disciplines.map((d) => (
              <div key={d.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="font-bold text-gray-900">{d.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{d.description}</p>
                <div className="mt-4 flex flex-wrap gap-1">
                  {d.services.map((s) => (
                    <span key={s} className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded">{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-900">Pricing</h2>
          <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">Clear pricing based on project scope. All quotes include PE stamp.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pricing.map((item) => (
              <div key={item.service} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="text-lg font-bold text-gray-900">{item.service}</div>
                <div className="text-2xl font-bold text-orange-500 mt-1">{item.price}</div>
                <p className="text-sm text-gray-500 mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-xl font-bold text-center mb-6 text-gray-900">Turnaround Times</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {turnaround.map((item) => (
              <div key={item.type} className="text-center px-6 py-4 bg-white border border-gray-200 rounded-xl">
                <div className="font-bold text-gray-900">{item.type}</div>
                <div className="text-sm text-orange-600 mt-1">{item.time}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-orange-500 p-8 text-white text-center">
          <h2 className="text-2xl font-bold">Need Engineering Support?</h2>
          <p className="mt-2 opacity-95 max-w-xl mx-auto">Get a quote for your project. Most quotes provided within 24 hours.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-orange-700 shadow-sm transition hover:bg-orange-50">Request Quote</Link>
          </div>
        </section>
      </div>
    </div>
  )
}
