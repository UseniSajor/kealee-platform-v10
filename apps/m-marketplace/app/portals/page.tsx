import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
const heroImage = { src: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1920&q=80&auto=format&fit=crop', alt: 'Modern glass and steel building facade' };

export const metadata: Metadata = {
  title: 'Portal Access | Kealee',
  description: 'Access your Kealee portal — project management, architecture, permits, estimation, operations, and more.',
}

const portals = [
  {
    name: 'Project Owner Portal',
    description: 'Manage your construction project from start to finish. Track milestones, approve payments, and communicate with your team.',
    url: 'https://app.kealee.com',
    color: 'blue',
    audience: 'For homeowners & project owners',
  },
  {
    name: 'Architecture Portal',
    description: 'Review design concepts, approve drawings, and track your architectural project through permitting.',
    url: 'https://architect.kealee.com',
    color: 'indigo',
    audience: 'For design clients',
  },
  {
    name: 'Permits Portal',
    description: 'Track permit applications, schedule inspections, and manage compliance across jurisdictions.',
    url: 'https://permits.kealee.com',
    color: 'amber',
    audience: 'For contractors & owners',
  },
  {
    name: 'Estimation Portal',
    description: 'Access your estimates, assembly library, cost database, and takeoff tools.',
    url: 'https://estimation.kealee.com',
    color: 'blue',
    audience: 'For estimators & contractors',
  },
  {
    name: 'Ops Services Portal',
    description: 'Manage your operations package, submit service requests, view weekly reports, and track projects.',
    url: 'https://ops.kealee.com/portal',
    color: 'sky',
    audience: 'For GC clients',
  },
  {
    name: 'PM Dashboard',
    description: 'Full project management suite with scheduling, budgeting, RFIs, and team coordination.',
    url: 'https://pm.kealee.com',
    color: 'sky',
    audience: 'For contractors & builders',
  },
  {
    name: 'Finance Portal',
    description: 'Manage escrow accounts, track milestone payments, and view financial reports.',
    url: 'https://finance.kealee.com',
    color: 'emerald',
    audience: 'For all parties',
  },
  {
    name: 'Admin Dashboard',
    description: 'System administration, user management, and platform configuration.',
    url: 'https://admin.kealee.com',
    color: 'gray',
    audience: 'For Kealee admins',
  },
]

const colorMap: Record<string, { bg: string; border: string; text: string; button: string; buttonHover: string }> = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', button: 'bg-blue-600', buttonHover: 'hover:bg-blue-700' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', button: 'bg-indigo-600', buttonHover: 'hover:bg-indigo-700' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', button: 'bg-amber-500', buttonHover: 'hover:bg-amber-600' },
  sky: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-600', button: 'bg-sky-500', buttonHover: 'hover:bg-sky-600' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', button: 'bg-emerald-600', buttonHover: 'hover:bg-emerald-700' },
  gray: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', button: 'bg-gray-700', buttonHover: 'hover:bg-gray-800' },
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
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">Portal Access</h1>
              <p className="text-xl text-white/85 max-w-3xl mx-auto">
                Access your Kealee portal to manage projects, track permits, view estimates, and more. Choose your portal below to get started.
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
                      <p className="text-sm text-gray-600 mb-6 flex-grow">{portal.description}</p>
                      <a
                        href={portal.url}
                        className={`block text-center py-2.5 rounded-xl text-sm font-semibold text-white transition ${colors.button} ${colors.buttonHover}`}
                      >
                        Launch Portal
                      </a>
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
