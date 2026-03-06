import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
const heroImage = { src: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1920&q=80&auto=format&fit=crop', alt: 'Modern glass and steel building facade' };

export const metadata: Metadata = {
  title: 'Portal Access | Kealee',
  description: 'Access your Kealee portal — architecture, engineering, permits & inspections, cost estimation, project management, operations services, and milestone payments. One platform for every construction project role.',
  openGraph: {
    title: 'Portal Access | Kealee',
    description: '8 purpose-built portals for every role in the construction lifecycle. Architecture, engineering, estimation, permits, PM, ops, finance, and project owner portals.',
    url: 'https://kealee.com/portals',
  },
}

const portals = [
  {
    name: 'Project Owner Portal',
    description: 'Manage your project from start to finish. Track milestones, approve payments, and communicate with your team.',
    href: '/owner',
    color: 'blue',
    audience: 'For homeowners & project owners',
    features: ['Milestone tracking', 'Payment management', 'Document sharing'],
  },
  {
    name: 'Architecture Portal',
    description: 'Manage design projects, upload plans, and seamlessly hand off to permitting.',
    href: '/architect',
    color: 'indigo',
    audience: 'For architects & designers',
    features: ['Project management', 'Plan uploads', 'Permit handoff'],
  },
  {
    name: 'Engineering Portal',
    description: 'Structural, MEP, civil, and geotechnical engineering services with PE-stamped drawings.',
    href: '/engineer',
    color: 'orange',
    audience: 'For engineers',
    features: ['Structural analysis', 'MEP design', 'PE-stamped drawings'],
  },
  {
    name: 'Permits & Inspections',
    description: 'Track permit applications, schedule inspections, and manage compliance across jurisdictions.',
    href: '/permits',
    color: 'amber',
    audience: 'For contractors & owners',
    features: ['AI compliance review', 'Inspection scheduling', 'Status tracking'],
  },
  {
    name: 'Estimation Portal',
    description: 'Access your estimates, assembly library, cost database, and AI-powered takeoff tools.',
    href: '/estimation',
    color: 'blue',
    audience: 'For estimators & contractors',
    features: ['Assembly-based estimates', 'AI takeoff', 'Cost database'],
  },
  {
    name: 'Ops Services Portal',
    description: 'Manage your operations package, submit service requests, view weekly reports, and track projects.',
    href: '/ops',
    color: 'sky',
    audience: 'For GC clients',
    features: ['Service requests', 'Weekly reports', 'Team coordination'],
  },
  {
    name: 'PM Dashboard',
    description: 'Full project management suite with scheduling, budgeting, RFIs, and team coordination.',
    href: '/pm',
    color: 'sky',
    audience: 'For contractors & builders',
    features: ['Scheduling', 'Budgeting', 'RFIs & submittals'],
  },
  {
    name: 'Milestone Payments',
    description: 'Track milestone-based payments, manage releases, and view financial reports.',
    href: '/finance',
    color: 'emerald',
    audience: 'For all parties',
    features: ['Milestone tracking', 'Payment releases', 'Financial reports'],
  },
]

const colorMap: Record<string, { bg: string; border: string; text: string; button: string; buttonHover: string; featureBg: string }> = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', button: 'bg-blue-600', buttonHover: 'hover:bg-blue-700', featureBg: 'bg-blue-100/60' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', button: 'bg-indigo-600', buttonHover: 'hover:bg-indigo-700', featureBg: 'bg-indigo-100/60' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', button: 'bg-orange-500', buttonHover: 'hover:bg-orange-600', featureBg: 'bg-orange-100/60' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', button: 'bg-amber-500', buttonHover: 'hover:bg-amber-600', featureBg: 'bg-amber-100/60' },
  sky: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-600', button: 'bg-sky-500', buttonHover: 'hover:bg-sky-600', featureBg: 'bg-sky-100/60' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', button: 'bg-emerald-600', buttonHover: 'hover:bg-emerald-700', featureBg: 'bg-emerald-100/60' },
}

export default function PortalsPage() {
  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen">
        <div className="w-full">
          {/* Hero */}
          <section className="relative py-16 lg:py-20 overflow-hidden">
            <Image
              src={heroImage.src}
              alt={heroImage.alt}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">Your Portals</h1>
              <p className="text-xl text-white/85 max-w-3xl mx-auto">
                Everything you need in one place. Access your portal to manage projects, track permits, view estimates, and more.
              </p>
            </div>
          </section>

          {/* Portal Grid */}
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {portals.map((portal) => {
                  const colors = colorMap[portal.color]
                  return (
                    <div key={portal.name} className={`rounded-2xl border ${colors.border} ${colors.bg} p-6 flex flex-col`}>
                      <span className={`text-xs font-semibold ${colors.text} mb-2`}>{portal.audience}</span>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{portal.name}</h3>
                      <p className="text-sm text-gray-600 mb-4 flex-grow">{portal.description}</p>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {portal.features.map((feature) => (
                          <span key={feature} className={`text-xs px-2 py-0.5 rounded-full ${colors.featureBg} ${colors.text} font-medium`}>
                            {feature}
                          </span>
                        ))}
                      </div>
                      <Link
                        href={portal.href}
                        className={`block text-center py-2.5 rounded-xl text-sm font-semibold text-white transition ${colors.button} ${colors.buttonHover}`}
                      >
                        Open Portal
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* Help */}
          <section className="py-16 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Help?</h2>
              <p className="text-gray-600 mb-8">
                Not sure which portal to use? Contact our team and we will point you in the right direction.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">Contact Support</Link>
                <a href="mailto:support@kealee.com" className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 hover:bg-gray-100 text-gray-900 rounded-xl text-sm font-semibold transition-colors">Email support@kealee.com</a>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
