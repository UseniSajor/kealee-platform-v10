import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
const sectionImage = { src: 'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=800&q=80&auto=format&fit=crop', alt: 'Modern office workspace with technology' };

export const metadata: Metadata = {
  title: 'Project Management Software | Kealee',
  description: 'Project management tools for contractors and builders. Milestone tracking, payment requests, and client communication.',
}

export default function PMSoftwareServicePage() {
  const features = [
    { title: 'Milestone Tracking', description: 'Track project phases with customizable milestones and automatic client notifications.' },
    { title: 'Progress Documentation', description: 'Capture and organize site photos with date stamps and location tagging for client updates.' },
    { title: 'Payment Management', description: 'Submit milestone completion requests and track payment status in real-time.' },
    { title: 'Subcontractor Coordination', description: 'Centralized communication hub for your crews, subs, and project stakeholders.' },
    { title: 'Schedule Management', description: 'Gantt charts, critical path tracking, and automated delay notifications.' },
    { title: 'Document Control', description: 'Secure storage for contracts, drawings, RFIs, and submittals with version control.' },
  ]

  const modules = [
    { title: 'Contractor Dashboard', description: 'Your command center for managing active projects, tracking payments, and coordinating with clients.', features: ['Active projects', 'Payment status', 'Upcoming milestones', 'Client messages'] },
    { title: 'Project Execution', description: 'Tools to manage project phases from groundbreaking to final walkthrough.', features: ['Task management', 'Payment requests', 'RFI submission', 'Change order tracking'] },
    { title: 'Weekly Reporting', description: 'Automated weekly reports sent to clients with customizable templates.', features: ['Progress summary', 'Issues & risks', 'Next week lookahead', 'Photo documentation'] },
    { title: 'Mobile App', description: 'Full functionality on iOS and Android for on-site updates and communication.', features: ['Offline mode', 'Photo capture', 'Push notifications', 'Quick updates'] },
  ]

  const integrations = ['QuickBooks', 'Procore', 'Google Drive', 'Dropbox', 'DocuSign', 'Slack', 'Microsoft Teams', 'Zapier']

  const tiers = [
    { name: 'Essentials', price: '$99', period: '/mo', features: ['Up to 5 users', '3 active projects', 'Basic reporting', 'Email support'] },
    { name: 'Performance', price: '$199', period: '/mo', features: ['Up to 20 users', '10 active projects', 'Advanced analytics', 'Integrations', 'Priority support'], popular: true },
    { name: 'Scale', price: '$349', period: '/mo', features: ['Up to 50 users', 'Up to 20 projects', 'Custom workflows', 'API access', 'Dedicated support'] },
    { name: 'Enterprise', price: 'Custom', period: '', features: ['Unlimited users', 'Unlimited projects', 'SSO/SAML', 'Custom integrations', 'SLA guarantee', 'Account manager'] },
  ]

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/services" className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-8 text-sm">&larr; All Services</Link>

        <div className="relative text-center mb-16 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-16 overflow-hidden">
          <Image
            src={sectionImage.src}
            alt={sectionImage.alt}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
          <div className="relative">
            <span className="inline-block rounded-full bg-sky-100 px-4 py-1.5 text-sm font-bold text-sky-700 mb-4">FOR CONTRACTORS & BUILDERS</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Project Management Software</h1>
            <p className="mt-4 text-xl text-white/85 max-w-3xl mx-auto">
              Built for contractors. Manage your projects, coordinate with clients, and get paid faster with escrow-backed milestone payments.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600">Start Free Trial</Link>
              <Link href="/portals" className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-white/20">Go to Portal</Link>
            </div>
          </div>
        </div>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-10 text-gray-900">Core Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="font-bold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-10 text-gray-900">Platform Modules</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {modules.map((m) => (
              <div key={m.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{m.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{m.description}</p>
                <div className="flex flex-wrap gap-2">
                  {m.features.map((f) => (
                    <span key={f} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{f}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-900">Platform Pricing</h2>
          <p className="text-center text-gray-600 mb-10">Start your free 14-day trial today. No credit card required.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier) => (
              <div key={tier.name} className={`rounded-2xl border bg-white p-6 shadow-sm ${tier.popular ? 'border-sky-500 ring-1 ring-sky-500/20' : 'border-gray-200'}`}>
                {tier.popular && <span className="inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700 mb-3">MOST POPULAR</span>}
                <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                <div className="mt-2"><span className="text-3xl font-bold text-gray-900">{tier.price}</span><span className="text-gray-600">{tier.period}</span></div>
                <ul className="mt-4 space-y-2">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-sky-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/contact" className={`mt-6 block text-center py-2.5 rounded-lg font-semibold transition ${tier.popular ? 'bg-sky-500 text-white hover:bg-sky-600' : 'border border-gray-200 hover:bg-gray-50'}`}>{tier.name === 'Enterprise' ? 'Contact Sales' : 'Start Trial'}</Link>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-xl font-bold text-center mb-6 text-gray-900">Integrations</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {integrations.map((i) => (
              <span key={i} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium">{i}</span>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">Plus 100+ more via Zapier</p>
        </section>

        <section className="rounded-2xl bg-sky-500 p-8 text-white text-center">
          <h2 className="text-2xl font-bold">Ready to Streamline Your Projects?</h2>
          <p className="mt-2 opacity-95 max-w-xl mx-auto">Start your free 14-day trial today. No credit card required.</p>
          <Link href="/contact" className="mt-6 inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50">Start Free Trial</Link>
        </section>
      </div>
    </div>
  )
}
