import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
const heroImage = { src: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1920&q=80&auto=format&fit=crop', alt: 'Modern glass and steel building facade' };

export const metadata: Metadata = {
  title: 'Architecture Services | Kealee',
  description: 'Professional architectural design services with CAD/BIM integration and permit-ready drawings.',
}

export default function ArchitectServicePage() {
  const services = [
    { title: 'Design Consultation', description: 'Work with licensed architects to develop your vision into buildable plans.' },
    { title: 'CAD/BIM Drawings', description: 'Professional drawings created in AutoCAD, Revit, and other industry-standard tools.' },
    { title: 'Permit Packages', description: 'Complete permit-ready drawing sets that meet local jurisdiction requirements.' },
    { title: '3D Visualization', description: 'Photorealistic renderings and virtual walkthroughs to visualize your project.' },
    { title: 'As-Built Documentation', description: 'Document existing conditions with precise measurements and drawings.' },
    { title: 'Design Revisions', description: 'Flexible revision process with quick turnaround times.' },
  ]

  const projectTypes = [
    'Kitchen Remodels', 'Bathroom Renovations', 'Additions & Extensions', 'Basement Finishing',
    'ADUs & Carriage Houses', 'Commercial Buildouts', 'New Construction', 'Historic Renovations',
  ]

  const packages = [
    { name: 'As-Built Only', price: 'From $499', description: 'Existing conditions documentation', features: ['Site visit & measurements', 'Floor plans', 'Elevations', 'CAD files'] },
    { name: 'Design + Permit', price: 'From $1,999', description: 'Complete permit-ready package', features: ['Concept design (2 options)', 'Design development', 'Permit drawings', 'Unlimited revisions', 'Permit submission support'], popular: true },
    { name: 'Full Service', price: 'From $4,999', description: 'Design through build', features: ['Everything in Design + Permit', '3D renderings', 'Construction Documents', 'CA site visits', 'Contractor coordination'] },
  ]

  const process = [
    { step: 1, title: 'Consultation', description: 'Discuss your project goals, budget, and timeline with an architect.' },
    { step: 2, title: 'Site Documentation', description: 'We visit the site to measure and document existing conditions.' },
    { step: 3, title: 'Concept Design', description: 'Receive initial design concepts based on your requirements.' },
    { step: 4, title: 'Design Development', description: 'Refine the chosen concept with detailed drawings and specifications.' },
    { step: 5, title: 'Permit Drawings', description: 'Prepare permit-ready drawings that meet code requirements.' },
    { step: 6, title: 'Build Support', description: 'Optional support during the build with RFIs and site visits.' },
  ]

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/services" className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-8 text-sm">&larr; All Services</Link>

        <div className="relative text-center mb-16 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-16 overflow-hidden">
          <Image
            src={heroImage.src}
            alt={heroImage.alt}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
          <div className="relative">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Architecture Services</h1>
            <p className="mt-4 text-xl text-white/85 max-w-3xl mx-auto">
              Professional architectural design services for residential and commercial projects. From concept to permit-ready drawings.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">Start Your Design</Link>
              <Link href="/portals" className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-white/20">Go to Portal</Link>
            </div>
          </div>
        </div>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-10 text-gray-900">What We Offer</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <div key={s.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="font-bold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{s.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-xl font-bold text-center mb-6 text-gray-900">Project Types</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {projectTypes.map((t) => (
              <span key={t} className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm">{t}</span>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-10 text-gray-900">Our Process</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {process.map((step) => (
              <div key={step.step} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">{step.step}</div>
                <div>
                  <h3 className="font-bold text-gray-900">{step.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-900">Service Packages</h2>
          <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">Choose the level of service that fits your project. All packages include licensed architect review.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.name} className={`rounded-2xl border bg-white p-6 shadow-sm ${pkg.popular ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-gray-200'}`}>
                {pkg.popular && <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700 mb-3">MOST POPULAR</span>}
                <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
                <div className="mt-1 text-2xl font-bold text-indigo-600">{pkg.price}</div>
                <p className="text-sm text-gray-500 mt-1">{pkg.description}</p>
                <ul className="mt-4 space-y-2">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/contact" className={`mt-6 block text-center py-2.5 rounded-lg font-semibold transition ${pkg.popular ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'border border-gray-200 hover:bg-gray-50'}`}>Get Started</Link>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-indigo-600 p-8 text-white text-center">
          <h2 className="text-2xl font-bold">Ready to Design Your Project?</h2>
          <p className="mt-2 opacity-95 max-w-xl mx-auto">Schedule a free consultation with one of our licensed architects.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50">Schedule Consultation</Link>
          </div>
        </section>
      </div>
    </div>
  )
}
