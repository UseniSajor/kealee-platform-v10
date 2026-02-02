import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Architecture Services | Kealee',
  description: 'Professional architectural design services with CAD/BIM integration and permit-ready drawings.',
};

export default function ArchitectPage() {
  const services = [
    {
      icon: '✏️',
      title: 'Design Consultation',
      description: 'Work with licensed architects to develop your vision into buildable plans.',
    },
    {
      icon: '📐',
      title: 'CAD/BIM Drawings',
      description: 'Professional drawings created in AutoCAD, Revit, and other industry-standard tools.',
    },
    {
      icon: '📋',
      title: 'Permit Packages',
      description: 'Complete permit-ready drawing sets that meet local jurisdiction requirements.',
    },
    {
      icon: '🏠',
      title: '3D Visualization',
      description: 'Photorealistic renderings and virtual walkthroughs to visualize your project.',
    },
    {
      icon: '📝',
      title: 'As-Built Documentation',
      description: 'Document existing conditions with precise measurements and drawings.',
    },
    {
      icon: '🔄',
      title: 'Design Revisions',
      description: 'Flexible revision process with quick turnaround times.',
    },
  ];

  const projectTypes = [
    { type: 'Kitchen Remodels', icon: '🍳' },
    { type: 'Bathroom Renovations', icon: '🚿' },
    { type: 'Additions & Extensions', icon: '🏠' },
    { type: 'Basement Finishing', icon: '🏗️' },
    { type: 'ADUs & Carriage Houses', icon: '🏘️' },
    { type: 'Commercial Buildouts', icon: '🏢' },
    { type: 'New Construction', icon: '🔨' },
    { type: 'Historic Renovations', icon: '🏛️' },
  ];

  const packages = [
    {
      name: 'As-Built Only',
      price: 'From $499',
      description: 'Existing conditions documentation',
      features: ['Site visit & measurements', 'Floor plans', 'Elevations', 'CAD files'],
    },
    {
      name: 'Design + Permit',
      price: 'From $1,999',
      description: 'Complete permit-ready package',
      features: ['Concept design (2 options)', 'Design development', 'Permit drawings', 'Unlimited revisions', 'Permit submission support'],
      popular: true,
    },
    {
      name: 'Full Service',
      price: 'From $4,999',
      description: 'Design through construction',
      features: ['Everything in Design + Permit', '3D renderings', 'Construction documents', 'CA site visits', 'Contractor coordination'],
    },
  ];

  const process = [
    {
      step: 1,
      title: 'Consultation',
      description: 'Discuss your project goals, budget, and timeline with an architect.',
    },
    {
      step: 2,
      title: 'Site Documentation',
      description: 'We visit the site to measure and document existing conditions.',
    },
    {
      step: 3,
      title: 'Concept Design',
      description: 'Receive initial design concepts based on your requirements.',
    },
    {
      step: 4,
      title: 'Design Development',
      description: 'Refine the chosen concept with detailed drawings and specifications.',
    },
    {
      step: 5,
      title: 'Permit Drawings',
      description: 'Prepare permit-ready drawings that meet code requirements.',
    },
    {
      step: 6,
      title: 'Construction Support',
      description: 'Optional support during construction with RFIs and site visits.',
    },
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
          Architecture Services
        </h1>
        <p className="mt-4 text-xl text-zinc-600 max-w-3xl mx-auto">
          Professional architectural design services for residential and commercial projects.
          From concept to permit-ready drawings.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
          >
            Start Your Design
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-6 py-3 text-sm font-bold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
          >
            View Portfolio
          </Link>
        </div>
      </div>

      {/* Services */}
      <section className="mb-16">
        <h2 className="text-2xl font-black text-center mb-10">What We Offer</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.title}
              className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
            >
              <span className="text-2xl">{service.icon}</span>
              <h3 className="mt-3 font-bold">{service.title}</h3>
              <p className="mt-2 text-sm text-zinc-600">{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Project Types */}
      <section className="mb-16">
        <h2 className="text-xl font-black text-center mb-6">Project Types</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {projectTypes.map((project) => (
            <span
              key={project.type}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-black/10 rounded-lg text-sm"
            >
              <span>{project.icon}</span>
              {project.type}
            </span>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="mb-16">
        <h2 className="text-2xl font-black text-center mb-10">Our Process</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {process.map((step) => (
            <div key={step.step} className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
                {step.step}
              </div>
              <div>
                <h3 className="font-bold">{step.title}</h3>
                <p className="text-sm text-zinc-600 mt-1">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Packages */}
      <section className="mb-16">
        <h2 className="text-2xl font-black text-center mb-4">Service Packages</h2>
        <p className="text-center text-zinc-600 mb-10 max-w-2xl mx-auto">
          Choose the level of service that fits your project. All packages include licensed architect review.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.name}
              className={`rounded-2xl border bg-white p-6 shadow-sm ${
                pkg.popular
                  ? 'border-indigo-500 ring-1 ring-indigo-500/20'
                  : 'border-black/10'
              }`}
            >
              {pkg.popular && (
                <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700 mb-3">
                  MOST POPULAR
                </span>
              )}
              <h3 className="text-xl font-black">{pkg.name}</h3>
              <div className="mt-1 text-2xl font-black text-indigo-600">{pkg.price}</div>
              <p className="text-sm text-zinc-500 mt-1">{pkg.description}</p>
              <ul className="mt-4 space-y-2">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-zinc-700">
                    <svg className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`mt-6 block text-center py-2.5 rounded-lg font-bold transition ${
                  pkg.popular
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'border border-black/10 hover:bg-zinc-50'
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Pre-Con Integration */}
      <section className="mb-16">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-cyan-50 p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 mb-3">
                INTEGRATED
              </span>
              <h2 className="text-xl font-black">
                Part of Pre-Construction Workflow
              </h2>
              <p className="mt-2 text-zinc-700 max-w-xl">
                Architecture services integrate seamlessly with our pre-con workflow.
                Design → SRP → Bidding → Escrow—all on one platform.
              </p>
            </div>
            <Link
              href="/precon"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 whitespace-nowrap"
            >
              Learn About Pre-Con →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-indigo-600 p-8 text-white text-center">
        <h2 className="text-2xl font-black">Ready to Design Your Project?</h2>
        <p className="mt-2 opacity-95 max-w-xl mx-auto">
          Schedule a free consultation with one of our licensed architects.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            href="/schedule"
            className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
          >
            Schedule Consultation
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl border border-white/30 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-white/10"
          >
            Start Now
          </Link>
        </div>
      </section>
    </main>
  );
}
