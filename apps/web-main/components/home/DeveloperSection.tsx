import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'

const OS_MODULES = [
  { name: 'OS-Land',   desc: 'Parcel scoring, zoning, due diligence', color: '#38A169' },
  { name: 'OS-Feas',   desc: 'Pro forma modeling & scenario analysis', color: '#2ABFBF' },
  { name: 'OS-Dev',    desc: 'Capital stack, draws, investor reports',  color: '#E8793A' },
  { name: 'OS-PM',     desc: 'Full construction oversight',              color: '#1A2B4A' },
  { name: 'OS-Pay',    desc: 'Escrow & milestone payments',             color: '#38A169' },
  { name: 'OS-Ops',    desc: 'Warranty & post-construction',            color: '#2ABFBF' },
]

export function DeveloperSection() {
  return (
    <section className="py-20 bg-white">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          {/* Copy */}
          <div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#2ABFBF' }}>For Developers</span>
            <h2 className="mt-3 text-3xl font-bold font-display" style={{ color: '#1A2B4A' }}>
              7 Operating Systems.<br />One Development Platform.
            </h2>
            <p className="mt-4 text-gray-600">
              From identifying a parcel to delivering a stabilized asset, Kealee's integrated OS modules
              give developers data, AI insights, and automated workflows at every phase.
            </p>
            <Link href="/developers" className="mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white hover:opacity-90" style={{ backgroundColor: '#1A2B4A' }}>
              Developer Platform Overview <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* OS modules grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            {OS_MODULES.map(mod => (
              <div
                key={mod.name}
                className="rounded-xl border border-gray-200 p-4 transition-all hover:border-current hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                    style={{ backgroundColor: mod.color }}
                  >
                    OS
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#1A2B4A' }}>{mod.name}</p>
                    <p className="text-xs text-gray-500">{mod.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
