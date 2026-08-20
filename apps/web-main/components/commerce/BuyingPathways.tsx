import Link from 'next/link'
import { ArrowRight, Building2, Check, HardHat, Home } from 'lucide-react'
import { ROLE_BUYING_PATHWAYS, formatPriceFromCents } from '@kealee/core-rules'

const displayPrice = (cents: number) => formatPriceFromCents(cents).replace('.00', '')
type PathwayStep = (typeof ROLE_BUYING_PATHWAYS)[keyof typeof ROLE_BUYING_PATHWAYS][number]

function stepPrice(step: PathwayStep): string {
  if ('priceLabel' in step) return step.priceLabel
  // A step with no label and no usable price must degrade to a scope prompt —
  // never to "$NaN" on a page customers buy from.
  if (!('priceCents' in step) || !Number.isFinite(step.priceCents)) return 'Scoped'
  if (step.priceCents === 0) return 'Free'
  const prefix = 'pricePrefix' in step ? step.pricePrefix : ''
  const suffix = 'priceSuffix' in step ? step.priceSuffix : ''
  return `${prefix}${displayPrice(step.priceCents)}${suffix}`
}

const PATHWAYS = [
  {
    id: 'homeowners',
    audience: 'Homeowners & project owners',
    headline: 'Understand the property, define the project, then build.',
    description: 'One-time services that reduce uncertainty before you commit to drawings, permits, or construction.',
    icon: Home,
    accent: '#E8793A',
    steps: ROLE_BUYING_PATHWAYS.homeowners,
    cta: 'Start a homeowner project',
    href: '/products/home-project-readiness-review',
    secondaryCta: 'Browse renovation services',
    secondaryHref: '/products#homeowner-services',
  },
  {
    id: 'contractors',
    audience: 'Contractors',
    headline: 'Win work through the marketplace. Add preconstruction per client.',
    description: 'Marketplace subscriptions support visibility and lead management. Client estimate and permit work is purchased separately.',
    icon: HardHat,
    accent: '#2ABFBF',
    steps: ROLE_BUYING_PATHWAYS.contractors,
    cta: 'Join the contractor marketplace',
    href: '/contractor/register',
    secondaryCta: 'View client project package',
    secondaryHref: '/products/contractor-estimate-permit-package',
  },
  {
    id: 'developers',
    audience: 'Developers',
    headline: 'Screen a site before deeper design and entitlement spend.',
    description: 'Property-level feasibility that can progress into professional review, permit coordination, and GC execution.',
    icon: Building2,
    accent: '#7C3AED',
    steps: ROLE_BUYING_PATHWAYS.developers,
    cta: 'Start developer feasibility',
    href: '/products/developer-feasibility-express',
    secondaryCta: 'Talk to development services',
    secondaryHref: '/contact',
  },
] as const

export function BuyingPathways({
  compact = false,
  heading = 'Choose the path that matches your role',
}: {
  compact?: boolean
  heading?: string
}) {
  return (
    <section className={compact ? '' : 'py-16 sm:py-20'}>
      <div className={compact ? '' : 'mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'}>
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">How Kealee is purchased</span>
          <h2 className="mt-3 font-display text-3xl font-bold text-slate-950 sm:text-4xl">{heading}</h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
            Homeowner services are one-time project purchases. Contractor marketplace access is a subscription.
            Developer feasibility and professional services are scoped by site.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {PATHWAYS.map(path => {
            const Icon = path.icon
            return (
              <article
                id={path.id}
                key={path.id}
                className="flex scroll-mt-28 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${path.accent}16`, color: path.accent }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: path.accent }}>
                    {path.audience}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl font-bold leading-snug text-slate-950">{path.headline}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{path.description}</p>

                <ol className="mt-6 flex-1 space-y-4 border-t border-slate-100 pt-5">
                  {path.steps.map(step => (
                    <li key={step.title} className="flex gap-3">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: path.accent }} />
                      <div>
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{step.label}</span>
                          <span className="text-sm font-bold text-slate-900">{step.title}</span>
                          <span className="text-xs font-bold" style={{ color: path.accent }}>{stepPrice(step)}</span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">{step.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="mt-6 space-y-2">
                  <Link
                    href={path.href}
                    className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: path.accent }}
                  >
                    {path.cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={path.secondaryHref}
                    className="flex w-full items-center justify-center gap-1 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
                  >
                    {path.secondaryCta} <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
        <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-relaxed text-slate-500">
          Preliminary feasibility and concept outputs are not for construction and remain subject to licensed professional review.
          Final scope, third-party fees, and jurisdiction charges are confirmed before purchase.
        </p>
      </div>
    </section>
  )
}
