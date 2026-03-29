import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Heading } from '@/components/ui/Heading'

export const metadata: Metadata = {
  title: 'Start Your Project — Kealee AI Concept Engine',
  description: 'Choose your project type. Our AI generates concept visuals, cost estimates, and a permit-ready package in days.',
}

const PATHS = [
  {
    key: 'exterior_concept',
    icon: '🏠',
    label: 'Exterior Design',
    sub: 'Curb appeal, facade, landscaping, hardscaping',
    accent: '#E8793A',
    href: '/concept-engine/exterior',
  },
  {
    key: 'garden_concept',
    icon: '🌿',
    label: 'Garden & Farming',
    sub: 'Raised beds, irrigation, backyard farming, greenhouse',
    accent: '#38A169',
    href: '/concept-engine/garden',
  },
  {
    key: 'whole_home_concept',
    icon: '🏡',
    label: 'Whole Home Renovation',
    sub: 'Floor plan redesign, systems, every room',
    accent: '#2ABFBF',
    href: '/concept-engine/whole-home',
  },
  {
    key: 'interior_reno_concept',
    icon: '🛁',
    label: 'Interior Reno & Addition',
    sub: 'Kitchen, bath, ADU, additions, full interior',
    accent: '#7C3AED',
    href: '/concept-engine/interior-reno',
  },
  {
    key: 'permit_path_only',
    icon: '📋',
    label: 'Permit Only',
    sub: 'Have drawings? We handle jurisdiction filing.',
    accent: '#1A2B4A',
    href: '/intake/permit_path_only',
  },
  {
    key: 'developer_concept',
    icon: '🏗️',
    label: 'Developer / Commercial',
    sub: 'Multifamily, mixed-use, new construction',
    accent: '#C8521A',
    href: '/intake/developer_concept',
  },
]

interface Props {
  searchParams: Promise<{ q?: string; type?: string; path?: string }>
}

export default async function ConceptGatePage({ searchParams }: Props) {
  const params = await searchParams
  const q           = params.q    ?? ''
  const type        = params.type ?? ''
  const suggestPath = params.path ?? ''   // from Claude classifier (low-confidence match)

  return (
    <>
      {/* Hero */}
      <section
        className="py-16 md:py-20"
        style={{ background: 'linear-gradient(135deg, #1A2B4A 0%, #0F1D34 60%, #1A3B3B 100%)' }}
      >
        <Container width="lg">
          <div className="mx-auto max-w-2xl text-center">
            <div
              className="mb-5 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest"
              style={{ background: 'rgba(200,82,26,.18)', color: '#E8793A' }}
            >
              Start Your Design
            </div>
            <Heading as="h1" size="xl" color="white" className="mb-5">
              {q ? `Results for "${q}"` : 'What are you building?'}
            </Heading>
            <p className="text-lg text-gray-300">
              Select a project path below. Our AI will guide you through the rest — design concepts, cost estimates, and permits.
            </p>
          </div>
        </Container>
      </section>

      {/* Path cards */}
      <section className="py-16 bg-white">
        <Container width="lg">
          {(type || suggestPath) && (
            <p className="mb-6 text-sm text-gray-400 text-center">
              {suggestPath
                ? <>Best match highlighted below — or choose a different path.</>
                : <>Showing results for: <strong className="text-gray-700">{type.replace(/_/g, ' ')}</strong></>
              }
            </p>
          )}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PATHS.map(path => {
              const isSuggested = suggestPath && path.key === suggestPath
              return (
                <Link
                  key={path.label}
                  href={path.href}
                  className="group flex flex-col rounded-2xl bg-white p-7 transition-all hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    border: isSuggested ? `2px solid ${path.accent}` : '1px solid #E5E7EB',
                    boxShadow: isSuggested ? `0 0 0 4px ${path.accent}18` : undefined,
                  }}
                >
                  {isSuggested && (
                    <span
                      className="mb-3 self-start rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                      style={{ background: path.accent }}
                    >
                      Best match
                    </span>
                  )}
                  <div
                    className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl text-2xl"
                    style={{ background: `${path.accent}18` }}
                  >
                    {path.icon}
                  </div>
                  <h3 className="text-base font-bold font-display" style={{ color: '#1A1C1B' }}>{path.label}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-400">{path.sub}</p>
                  <div
                    className="mt-5 flex items-center gap-1.5 text-sm font-semibold transition-all group-hover:gap-2.5"
                    style={{ color: path.accent }}
                  >
                    Start <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              )
            })}
          </div>

          <p className="mt-8 text-center text-xs text-gray-400">
            Not sure which path? <Link href="/contact" className="underline hover:text-gray-600">Talk to a human</Link>
          </p>
        </Container>
      </section>
    </>
  )
}
